import { unstable_cache } from 'next/cache';
import { getKpiOverview, getYearlyComparison, getMonthlyForecastVsActual } from './google-sheets';
import {
  fetchAllOrders, aggregateOrders,
  fetchAllMarkets, aggregateMarkets, normalizeMarkets,
  combineSellerView, combineBrandView,
} from './wired-admin';
import { detectTrends, getPrevMonthsRange } from './trend';
import { resolveRange } from './period';

const DAY = 60 * 60 * 24;

/**
 * 기간 분류 — 과거 데이터는 거의 안 바뀌므로 캐시 길게.
 * 다만 취소/환불로 인한 변동 가능성을 위해 안전망 둠.
 *
 *   PAST_LOCKED (30일+ 이전 종료) — 30일 TTL (월 1회 자동 새로고침으로 늦은 환불 캡처)
 *   PAST_RECENT (1~30일 전 종료) — 7일 TTL (환불 기간 안)
 *   CURRENT/FUTURE                — 1일 TTL (매일 새 데이터)
 */
function classifyPeriod(endDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate + 'T23:59:59');
  const daysAgo = Math.floor((today - end) / (1000 * 60 * 60 * 24));
  if (daysAgo <= 0) return 'CURRENT';     // 오늘 포함하거나 미래
  if (daysAgo <= 30) return 'PAST_RECENT';
  return 'PAST_LOCKED';
}

function ttlFor(endDate) {
  const cls = classifyPeriod(endDate);
  if (cls === 'PAST_LOCKED') return 30 * DAY;
  if (cls === 'PAST_RECENT') return 7 * DAY;
  return DAY;
}

function tagsForOrders(startDate, endDate) {
  const cls = classifyPeriod(endDate);
  const base = ['dashboard', `orders-${startDate}-${endDate}`];
  // 현재 기간만 cron의 'orders-current' 태그로 매일 무효화. 과거는 안 건드림.
  if (cls === 'CURRENT')      base.push('orders', 'orders-current');
  else if (cls === 'PAST_RECENT')  base.push('orders-past-recent');
  else                              base.push('orders-past-locked');
  return base;
}

function tagsForMarkets(startDate, endDate, durationType) {
  const cls = classifyPeriod(endDate);
  const base = ['dashboard', `markets-${startDate}-${endDate}-${durationType}`];
  if (cls === 'CURRENT')      base.push('markets', 'markets-current');
  else if (cls === 'PAST_RECENT')  base.push('markets-past-recent');
  else                              base.push('markets-past-locked');
  return base;
}

// 구글시트 데이터 — 수동 입력 데이터라 매일 1회 충분
export const getCachedSheets = unstable_cache(
  async () => {
    const [kpi, yearly, forecastVsActual] = await Promise.all([
      getKpiOverview().catch(e => ({ _error: e.message })),
      getYearlyComparison().catch(e => ({ _error: e.message })),
      getMonthlyForecastVsActual().catch(e => ({ _error: e.message })),
    ]);
    return { kpi, yearly, forecastVsActual };
  },
  ['sheets-v2'],
  { tags: ['dashboard', 'sheets'], revalidate: DAY }
);

// 주문 집계 (기간별 캐시) — 과거 데이터는 길게 캐시 (환불 안전망 30일)
export function getCachedOrdersAgg(startDate, endDate) {
  return unstable_cache(
    async () => {
      const rows = await fetchAllOrders(startDate, endDate);
      const agg = aggregateOrders(rows);
      return { ...agg, totalRow: rows.length };
    },
    ['orders-agg-v8', startDate, endDate], // v8: PAY=totalWiredSalesAmount (와이어드 매출 기준)
    {
      tags: tagsForOrders(startDate, endDate),
      revalidate: ttlFor(endDate),
    }
  )();
}

// 마켓 집계 (기간별 캐시) — 과거 마켓은 사실상 고정값이라 길게 캐시
export function getCachedMarketsAgg(startDate, endDate, durationType = 'MARKET_DURATION') {
  return unstable_cache(
    async () => {
      const rows = await fetchAllMarkets(startDate, endDate, durationType);
      const agg = aggregateMarkets(rows);
      const list = normalizeMarkets(rows);
      return { ...agg, list, totalRow: rows.length };
    },
    ['markets-agg-v4', startDate, endDate, durationType], // v4: 분기별 TTL
    {
      tags: tagsForMarkets(startDate, endDate, durationType),
      revalidate: ttlFor(endDate),
    }
  )();
}

/**
 * 통합 뷰: 주문(매출) + 마켓(예상매출) 결합
 * @param options.releasedOnly - true면 출고완료(RELEASE_COMPLETE) 주문만 사용. default false.
 */
export async function getCombinedView(startDate, endDate, options = {}) {
  const { releasedOnly = false } = options;
  const [orders, markets] = await Promise.all([
    getCachedOrdersAgg(startDate, endDate).catch(e => ({ _error: e.message })),
    getCachedMarketsAgg(startDate, endDate).catch(e => ({ _error: e.message })),
  ]);
  if (orders?._error || markets?._error) {
    return { ordersError: orders?._error, marketsError: markets?._error, orders, markets };
  }

  // marketId 매칭 — releasedOnly에 따라 다른 집계 사용
  const byMarketIdSource = releasedOnly ? (orders.byMarketIdReleased || []) : (orders.byMarketId || []);
  const ordersByMarketId = new Map(byMarketIdSource.map(o => [o.marketId, o]));
  const marketsList = (markets.list || []).map(m => {
    const o = ordersByMarketId.get(m.id);
    const actualSales = o?.sales || m.actualSales || 0;
    return {
      ...m,
      actualSales,
      uniqueCustomers: o?.uniqueCustomers || 0,
      orderCount: o?.uniqueCustomers || 0,
      margin: o?.margin || 0,
      achievementRate: m.estimatedSales > 0 ? (actualSales / m.estimatedSales) * 100 : null,
    };
  }).sort((a, b) => (b.actualSales || 0) - (a.actualSales || 0));

  // 혼합 매출 = ENDED 마켓은 실제, 나머지(READY/ACTIVE)는 예상. CANCELED 제외.
  let mixedSales = 0;
  for (const m of marketsList) {
    if (m.status === 'CANCELED') continue;
    if (m.status === 'ENDED') {
      mixedSales += m.actualSales || 0;
    } else {
      mixedSales += m.estimatedSales || 0;
    }
  }

  return {
    orders,
    markets,
    marketsList,
    mixedSales,
    sellers: combineSellerView(orders, markets, { releasedOnly }),
    brands: combineBrandView(orders, markets, { releasedOnly }),
    bySellerManager: releasedOnly ? orders.bySellerManagerReleased : orders.bySellerManager,
    releasedOnly, // 어떤 모드인지 표시
  };
}

/**
 * 대시보드 메인 데이터 — 기존 호환용 (현재 /api/data가 사용)
 */
export async function getDashboardData(params) {
  const range = resolveRange(params);
  const prevRange = getPrevMonthsRange(range, params);

  const [sheets, periodAgg, prevAgg, marketAgg] = await Promise.all([
    getCachedSheets(),
    getCachedOrdersAgg(range.startDate, range.endDate).catch(e => ({ _error: e.message })),
    prevRange
      ? getCachedOrdersAgg(prevRange.startDate, prevRange.endDate).catch(e => ({ _error: e.message }))
      : Promise.resolve(null),
    getCachedMarketsAgg(range.startDate, range.endDate).catch(e => ({ _error: e.message })),
  ]);

  const period = periodAgg?._error ? null : periodAgg;
  const ordersError = periodAgg?._error || null;
  const markets = marketAgg?._error ? null : marketAgg;
  const marketsError = marketAgg?._error || null;

  let trends = null;
  if (period && prevAgg && !prevAgg._error) {
    trends = detectTrends(period.bySeller, prevAgg.bySeller, prevRange.monthCount);
  }

  return {
    kpi: sheets.kpi?._error ? null : sheets.kpi,
    kpiError: sheets.kpi?._error || null,
    yearly: sheets.yearly?._error ? null : sheets.yearly,
    yearlyError: sheets.yearly?._error || null,
    forecastVsActual: sheets.forecastVsActual?._error ? null : sheets.forecastVsActual,
    period,
    ordersError,
    markets,
    marketsError,
    range,
    prevRange,
    trends,
    filters: params,
    generatedAt: new Date().toISOString(),
  };
}
