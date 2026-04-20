// 와이어드민 API 클라이언트
// JSON 페이징 엔드포인트 사용 (excel-download는 10k 한도 있어서 못 씀)

const API_BASE = 'https://api.wiredm.in/admin';
const PAGE_SIZE = 5000;

async function fetchPage(startDate, endDate, offset = 0, size = PAGE_SIZE) {
  const token = process.env.WIRED_ADMIN_TOKEN;
  if (!token) throw new Error('WIRED_ADMIN_TOKEN is not set');
  const url = `${API_BASE}/order/orders?durationType=CREATED_AT&startDate=${startDate}&endDate=${endDate}&offset=${offset}&size=${size}`;
  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      origin: 'https://admin.wiredm.in',
      referer: 'https://admin.wiredm.in/',
      accept: 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Wired admin API ${res.status}: ${txt.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * 기간 내 모든 주문을 페이징으로 전부 가져오기.
 * 1페이지 먼저 받고, 남은 페이지는 병렬.
 */
export async function fetchAllOrders(startDate, endDate) {
  const first = await fetchPage(startDate, endDate, 0, PAGE_SIZE);
  const totalPages = first?.pagination?.totalPage || 1;
  const totalRow = first?.pagination?.totalRow || 0;
  const rows = [...(first?.data || [])];

  if (totalPages > 1) {
    const restPromises = [];
    for (let p = 2; p <= totalPages; p++) {
      const offset = (p - 1) * PAGE_SIZE;
      restPromises.push(fetchPage(startDate, endDate, offset, PAGE_SIZE));
    }
    const rest = await Promise.all(restPromises);
    for (const r of rest) {
      if (r?.data) rows.push(...r.data);
    }
  }

  return { rows, totalRow };
}

function n(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  const x = Number(String(v).replace(/,/g, '').trim());
  return isNaN(x) ? 0 : x;
}

/**
 * 주문 배열을 분류별로 집계. 필드명은 API의 camelCase 사용.
 * 매출 = totalPaymentAmount (배송비 포함 총 결제금액)
 * 공헌이익 = totalWiredMarginAmount
 */
export function aggregateOrders(orders) {
  const PAY = 'totalPaymentAmount';
  const MARGIN = 'totalWiredMarginAmount';
  const SELLER_MARGIN = 'totalSellerMarginAmount';

  const total = orders.reduce(
    (acc, o) => ({
      sales: acc.sales + n(o[PAY]),
      margin: acc.margin + n(o[MARGIN]),
      sellerMargin: acc.sellerMargin + n(o[SELLER_MARGIN]),
      count: acc.count + 1,
    }),
    { sales: 0, margin: 0, sellerMargin: 0, count: 0 }
  );

  const groupBy = (field) => {
    const map = new Map();
    for (const o of orders) {
      const key = (o[field] && String(o[field])) || '(미지정)';
      const cur = map.get(key) || { name: key, sales: 0, margin: 0, count: 0 };
      cur.sales += n(o[PAY]);
      cur.margin += n(o[MARGIN]);
      cur.count += 1;
      map.set(key, cur);
    }
    return [...map.values()]
      .filter((x) => x.sales > 0 || x.count > 0)
      .sort((a, b) => b.sales - a.sales);
  };

  return {
    total,
    bySeller: groupBy('sellerName'),
    byBrand: groupBy('brandName'),
    byMarket: groupBy('marketName'),
    bySellerManager: groupBy('sellerManagerName'),
  };
}
