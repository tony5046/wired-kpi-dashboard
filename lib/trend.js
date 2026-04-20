// 셀러별 부진/상승세 감지
// 비교 기준: 직전 3개월 평균 매출 vs 현재 선택 기간 매출

function pad(n) { return String(n).padStart(2, '0'); }

/**
 * 현재 range가 월간일 때, 직전 3개월 날짜 범위 리턴.
 * 예: 현재 2026-04 → 2026-01-01 ~ 2026-03-31
 * range가 주간/분기/연간이면 null (비교 불가).
 */
export function getPrevMonthsRange(range, filters) {
  if (!filters || filters.period !== 'month') return null;
  const year = parseInt(filters.year, 10);
  const month = parseInt(filters.month, 10);
  if (!year || !month) return null;

  // 직전 3개월 = month-3 ~ month-1
  const endDate = new Date(year, month - 1, 0); // current 월의 전월 마지막 일
  const startDate = new Date(year, month - 4, 1); // current 월의 3개월 전 시작일

  return {
    startDate: `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`,
    endDate: `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`,
    label: '직전 3개월',
    monthCount: 3,
  };
}

/**
 * 셀러별 매출 비교 → 부진/상승세 리스트
 * @param {Array} current 현재 기간 bySeller 배열 [{name, sales, count}]
 * @param {Array} baseline 비교 기준 기간 bySeller 배열
 * @param {number} baselineMonths 비교 기준이 몇 달치인지 (평균 계산용)
 */
export function detectTrends(current, baseline, baselineMonths = 3) {
  if (!current || !baseline) return [];

  const baseMap = new Map();
  for (const b of baseline) {
    baseMap.set(b.name, b.sales / baselineMonths); // 월평균
  }

  const trends = current.map(c => {
    const avg = baseMap.get(c.name) || 0;
    const diff = c.sales - avg;
    const pct = avg > 0 ? ((c.sales - avg) / avg) * 100 : (c.sales > 0 ? 100 : 0);
    return {
      name: c.name,
      current: c.sales,
      avg,
      diff,
      pct,
      isNew: avg === 0 && c.sales > 0,
      count: c.count,
    };
  });

  // 평균이 0이 아닌 셀러 중 |변화율|이 큰 순으로 정렬 (상승/부진 분리)
  const rising = trends
    .filter(t => !t.isNew && t.avg > 0 && t.current > 0 && t.pct >= 20)
    .sort((a, b) => b.pct - a.pct);
  const declining = trends
    .filter(t => !t.isNew && t.avg > 0 && t.pct <= -20)
    .sort((a, b) => a.pct - b.pct);
  const newcomers = trends
    .filter(t => t.isNew)
    .sort((a, b) => b.current - a.current);
  const dormant = baseline
    .filter(b => !current.find(c => c.name === b.name && c.sales > 0))
    .map(b => ({
      name: b.name,
      current: 0,
      avg: b.sales / baselineMonths,
      diff: -(b.sales / baselineMonths),
      pct: -100,
      isNew: false,
      count: 0,
    }))
    .filter(t => t.avg > 0)
    .sort((a, b) => b.avg - a.avg);

  return { rising, declining, newcomers, dormant };
}
