import { google } from 'googleapis';

let _client;

function getSheetsClient() {
  if (_client) return _client;
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
  if (!b64) throw new Error('GOOGLE_SERVICE_ACCOUNT_B64 is not set');
  const credentials = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  _client = google.sheets({ version: 'v4', auth });
  return _client;
}

export async function readRange(range) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.KPI_SHEET_ID;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: 'FORMATTED_VALUE',
  });
  return res.data.values || [];
}

function parseNum(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  return Number(String(v).replace(/,/g, '').replace(/원/g, '').trim()) || 0;
}

function parsePercent(v) {
  if (!v) return 0;
  return Number(String(v).replace(/%/g, '').trim()) || 0;
}

/**
 * 월별 대시보드 상단의 KPI 개요 (목표 수치, 달성, 달성률, 예상 달성)
 * 반환 예시:
 * {
 *   gongdonGuMae: { label, target, achieved, achievementRate, dateProgress, expectedAchieved, expectedRate },
 *   ad: { ... }
 * }
 */
export async function getKpiOverview() {
  const rows = await readRange("'월별 대시보드'!A1:J3");
  // rows[0] = 헤더, rows[1] = 공동구매 거래액, rows[2] = 광고 매출
  const parseRow = (row) => ({
    label: row?.[0] || '',
    target: parseNum(row?.[1]),
    achieved: parseNum(row?.[5]),
    achievementRate: parsePercent(row?.[6]),
    dateProgress: parsePercent(row?.[7]),
    expectedAchieved: parseNum(row?.[8]),
    expectedRate: parsePercent(row?.[9]),
  });
  return {
    gongdonGuMae: parseRow(rows[1]),
    ad: parseRow(rows[2]),
  };
}

/**
 * 월별 대시보드의 월별 예상 vs 실제 매출 (row 5~13)
 * 차트용: 예상거래액(R12), 실제거래액(R13) 월별
 */
export async function getMonthlyForecastVsActual() {
  const rows = await readRange("'월별 대시보드'!A5:N13");
  // R5(index 0): ['월', '', '2025-10', ..., '2026-6']
  // R12(index 7): ['', '예상 거래액 (취소마켓 반영x)', ...]
  // R13(index 8): ['', '실제 거래액', ...]
  if (rows.length < 9) return null;
  const header = rows[0] || [];
  const forecast = rows[7] || [];
  const actual = rows[8] || [];
  const months = header.slice(2).filter(Boolean);
  return {
    months,
    forecast: months.map((_, i) => parseNum(forecast[2 + i])),
    actual: months.map((_, i) => parseNum(actual[2 + i])),
  };
}

/**
 * 사업개발 탭의 연도별 거래액 비교 (2024/2025/2026 월별 + 전년비)
 */
export async function getYearlyComparison() {
  const rows = await readRange("'사업개발'!A3:R25");
  // rows[0] = 헤더 (월 이름)
  // 2024년: 공동거래액(rows[1]), 공헌이익(rows[2]), 광고매출(rows[3]), 광고이익(rows[4]), 거래액합계(rows[5]), 공헌이익합계(rows[6])
  // 2025년: 7~12
  // 2026년: 13~18
  // 전년비 거래액(20), 공헌이익(21)
  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  // 각 row에서 D~O (index 3~14)가 1월~12월 거래액 합계
  const extractMonthly = (rowIdx) => {
    const row = rows[rowIdx] || [];
    return months.map((_, i) => parseNum(row[3 + i]));
  };

  return {
    months,
    y2024Sales: extractMonthly(5),   // 2024 거래액 합계
    y2024Margin: extractMonthly(6),  // 2024 공헌이익 합계
    y2025Sales: extractMonthly(11),  // 2025 거래액 합계
    y2025Margin: extractMonthly(12), // 2025 공헌이익 합계
    y2026Sales: extractMonthly(17),  // 2026 거래액 합계
    y2026Margin: extractMonthly(18), // 2026 공헌이익 합계
    yoySales: (rows[20] || []).slice(3, 15).map(v => String(v || '0%')),
    yoyMargin: (rows[21] || []).slice(3, 15).map(v => String(v || '0%')),
  };
}
