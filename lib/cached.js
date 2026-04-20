import { unstable_cache } from 'next/cache';
import { getKpiOverview, getYearlyComparison } from './google-sheets';
import { downloadOrders, aggregateOrders } from './wired-admin';
import { detectTrends, getPrevMonthsRange } from './trend';
import { resolveRange } from './period';

const DAY = 60 * 60 * 24;

// 구글시트 데이터 (하루 1번 갱신)
export const getCachedSheets = unstable_cache(
  async () => {
    const [kpi, yearly] = await Promise.all([
      getKpiOverview().catch(e => ({ _error: e.message })),
      getYearlyComparison().catch(e => ({ _error: e.message })),
    ]);
    return { kpi, yearly };
  },
  ['sheets-v1'],
  { tags: ['dashboard', 'sheets'], revalidate: DAY }
);

// 주문 집계 결과 (기간별 캐시)
export function getCachedOrdersAgg(startDate, endDate) {
  return unstable_cache(
    async () => {
      const orders = await downloadOrders(startDate, endDate);
      return aggregateOrders(orders);
    },
    ['orders-agg-v1', startDate, endDate],
    { tags: ['dashboard', 'orders', `orders-${startDate}-${endDate}`], revalidate: DAY }
  )();
}

/**
 * 대시보드 데이터 전체 — 필터에 맞게 조합해서 반환.
 * 개별 fetch는 unstable_cache로 래핑되어 하루 동안 캐시됨.
 */
export async function getDashboardData(params) {
  const range = resolveRange(params);
  const prevRange = getPrevMonthsRange(range, params);

  const [sheets, periodAgg, prevAgg] = await Promise.all([
    getCachedSheets(),
    getCachedOrdersAgg(range.startDate, range.endDate).catch(e => ({ _error: e.message })),
    prevRange
      ? getCachedOrdersAgg(prevRange.startDate, prevRange.endDate).catch(e => ({ _error: e.message }))
      : Promise.resolve(null),
  ]);

  const period = periodAgg?._error ? null : periodAgg;
  const ordersError = periodAgg?._error || null;

  let trends = null;
  if (period && prevAgg && !prevAgg._error) {
    trends = detectTrends(period.bySeller, prevAgg.bySeller, prevRange.monthCount);
  }

  return {
    kpi: sheets.kpi?._error ? null : sheets.kpi,
    kpiError: sheets.kpi?._error || null,
    yearly: sheets.yearly?._error ? null : sheets.yearly,
    yearlyError: sheets.yearly?._error || null,
    period,
    ordersError,
    range,
    prevRange,
    trends,
    filters: params,
    generatedAt: new Date().toISOString(),
  };
}
