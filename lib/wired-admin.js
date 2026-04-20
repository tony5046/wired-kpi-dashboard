import ExcelJS from 'exceljs';

const API_BASE = 'https://api.wiredm.in/admin';

/**
 * 와이어드민에서 주문 데이터를 엑셀로 다운로드 후 파싱.
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<Array<Object>>} 파싱된 주문 배열
 */
export async function downloadOrders(startDate, endDate) {
  const token = process.env.WIRED_ADMIN_TOKEN;
  if (!token) throw new Error('WIRED_ADMIN_TOKEN is not set');

  const fields = [
    'code',
    'sellerName',
    'sellerManagerName',
    'productManagerName',
    'brandName',
    'marketName',
    'totalPaymentAmount',
    'totalWiredMarginAmount',
    'totalSellerMarginAmount',
  ].join(',');

  const url = `${API_BASE}/order/orders/excel-download?durationType=CREATED_AT&startDate=${startDate}&endDate=${endDate}&fields=${fields}`;

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      origin: 'https://admin.wiredm.in',
      referer: 'https://admin.wiredm.in/',
      accept: 'application/json, text/plain, */*',
    },
    // Next.js 서버에서 큰 응답 버퍼링 대비
    cache: 'no-store',
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Wired admin API ${res.status}: ${txt.slice(0, 200)}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  // 1행 헤더
  const headers = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col] = String(cell.value ?? '').trim();
  });

  // 2행~ 데이터
  const rows = [];
  const maxRow = ws.rowCount;
  for (let r = 2; r <= maxRow; r++) {
    const row = ws.getRow(r);
    const obj = {};
    let hasValue = false;
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      const key = headers[col];
      if (!key) return;
      let v = cell.value;
      if (v && typeof v === 'object' && 'text' in v) v = v.text;
      if (v !== null && v !== undefined && v !== '') hasValue = true;
      obj[key] = v;
    });
    if (hasValue) rows.push(obj);
  }
  return rows;
}

function parseNum(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  const n = Number(String(v).replace(/,/g, '').trim());
  return isNaN(n) ? 0 : n;
}

/**
 * 주문 배열을 분류별로 집계.
 */
export function aggregateOrders(orders) {
  const PAY = '총 결제금액(배송비 포함)';
  const MARGIN = '마진';
  const SELLER_MARGIN = '셀러마진';

  const total = orders.reduce(
    (acc, o) => ({
      sales: acc.sales + parseNum(o[PAY]),
      margin: acc.margin + parseNum(o[MARGIN]),
      sellerMargin: acc.sellerMargin + parseNum(o[SELLER_MARGIN]),
      count: acc.count + 1,
    }),
    { sales: 0, margin: 0, sellerMargin: 0, count: 0 }
  );

  const groupBy = (field) => {
    const map = new Map();
    for (const o of orders) {
      const key = (o[field] && String(o[field])) || '(미지정)';
      const cur = map.get(key) || { name: key, sales: 0, margin: 0, count: 0 };
      cur.sales += parseNum(o[PAY]);
      cur.margin += parseNum(o[MARGIN]);
      cur.count += 1;
      map.set(key, cur);
    }
    return [...map.values()]
      .filter(x => x.sales > 0 || x.count > 0)
      .sort((a, b) => b.sales - a.sales);
  };

  return {
    total,
    bySeller: groupBy('셀러명'),
    byBrand: groupBy('브랜드명'),
    byMarket: groupBy('마켓명'),
    bySellerManager: groupBy('셀러담당자'),
  };
}
