import { unstable_cache } from 'next/cache';
import { getKpiOverview, getYearlyComparison, getMonthlyForecastVsActual } from './google-sheets';
import {
  fetchAllOrders, aggregateOrders,
  fetchAllMarkets, aggregateMarkets,
  combineSellerView, combineBrandView,
} from './wired-admin';
import { detectTrends, getPrevMonthsRange } from './trend';
import { resolveRange } from './period';

const DAY = 60 * 60 * 24;

// 구글시트 데이터
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

// 주문 집계 (기간별 캐시)
export function getCachedOrdersAgg(startDate, endDate) {
  return unstable_cache(
    async () => {
      const rows = await fetchAllOrders(startDate, endDate);
      const agg = aggregateOrders(rows);
      return { ...agg, totalRow: rows.length };
    },
    ['orders-agg-v3', startDate, endDate],
    { tags: ['dashboard', 'orders', `orders-${startDate}-${endDate}`], revalidate: DAY }
  )();
}

// 마켓 집계 (기간별 캐시) — MARKET_DURATION 기준 (기간과 겹치는 모든 마켓)
export function getCachedMarketsAgg(startDate, endDate, durationType = 'MARKET_DURATION') {
  return unstable_cache(
    async () => {
      const rows = await fetchAllMarkets(startDate, endDate, durationType);
      const agg = aggregateMarkets(rows);
      return { ...agg, totalRow: rows.length };
    },
    ['markets-agg-v1', startDate, endDate, durationType],
    { tags: ['dashboard', 'markets', `markets-${startDate}-${endDate}-${durationType}`], revalidate: DAY }
  )();
}

/**
 * 통합 뷰: 주문(매출) + 마켓(예상매출) 결합
 */
export async function getCombinedView(startDate, endDate) {
  const [orders, markets] = await Promise.all([
    getCachedOrdersAgg(startDate, endDate).catch(e => ({ _error: e.message })),
    getCachedMarketsAgg(startDate, endDate).catch(e => ({ _error: e.message })),
  ]);
  if (orders?._error || markets?._error) {
    return { ordersError: orders?._error, marketsError: markets?._error, orders, markets };
  }
  return {
    orders,
    markets,
    sellers: combineSellerView(orders, markets),
    brands: combineBrandView(orders, markets),
    bySellerManager: orders.bySellerManager, // 담당자별 (orders만으로 충분)
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
