// 기간 계산 유틸 — 서버/클라이언트 공용

function pad(n) { return String(n).padStart(2, '0'); }

function fmt(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * ISO Week number (1~53). 월요일 시작.
 */
export function getIsoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNum };
}

/**
 * 특정 연도의 특정 주차 → 월요일~일요일 범위
 */
export function weekToDateRange(year, week) {
  // ISO week: week 1은 해당 연도의 첫 목요일을 포함하는 주
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const monday = new Date(week1Monday);
  monday.setUTCDate(monday.getUTCDate() + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    startDate: fmt(monday),
    endDate: fmt(sunday),
    label: `${year}년 ${week}주차`,
  };
}

export function monthToDateRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    startDate: fmt(start),
    endDate: fmt(end),
    label: `${year}년 ${month}월`,
  };
}

export function yearToDateRange(year) {
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    label: `${year}년`,
  };
}

export function quarterToDateRange(year, quarter) {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = startMonth + 2;
  const start = new Date(year, startMonth - 1, 1);
  const end = new Date(year, endMonth, 0);
  return {
    startDate: fmt(start),
    endDate: fmt(end),
    label: `${year}년 Q${quarter}`,
  };
}

/**
 * URL query → 기간 스펙
 * Supported: period=week|month|quarter|year|custom
 *            year, month, week, quarter, startDate, endDate
 */
export function resolveRange(params, now = new Date()) {
  const p = params.period || 'month';
  const y = parseInt(params.year, 10) || now.getFullYear();

  if (p === 'custom') {
    return {
      startDate: params.startDate,
      endDate: params.endDate,
      label: `${params.startDate} ~ ${params.endDate}`,
    };
  }
  if (p === 'year') return yearToDateRange(y);
  if (p === 'quarter') {
    const q = parseInt(params.quarter, 10) || Math.floor(now.getMonth() / 3) + 1;
    return quarterToDateRange(y, q);
  }
  if (p === 'week') {
    const { year: currYear, week: currWeek } = getIsoWeek(now);
    const w = parseInt(params.week, 10) || currWeek;
    return weekToDateRange(parseInt(params.year, 10) || currYear, w);
  }
  // month (default)
  const m = parseInt(params.month, 10) || (now.getMonth() + 1);
  return monthToDateRange(y, m);
}
