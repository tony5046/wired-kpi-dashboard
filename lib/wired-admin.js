// 와이어드민 API 클라이언트
import ExcelJS from 'exceljs'; // 미사용 (orders는 JSON으로 가져옴)

// 신규 internal-api 사용 (개발팀 발급 장기 토큰 + /admin prefix 없음)
const API_BASE = process.env.WIRED_API_BASE || 'https://internal-api.wiredm.in';
const PAGE_SIZE = 5000;
const MARKET_PAGE_SIZE = 100;

function headers() {
  const token = process.env.WIRED_ADMIN_TOKEN;
  if (!token) throw new Error('WIRED_ADMIN_TOKEN is not set');
  return {
    authorization: `Bearer ${token}`,
    accept: 'application/json',
  };
}

// ───────────── Orders (주문) ─────────────

async function fetchOrdersPage(startDate, endDate, offset = 0, size = PAGE_SIZE) {
  const url = `${API_BASE}/order/orders?durationType=CREATED_AT&startDate=${startDate}&endDate=${endDate}&offset=${offset}&size=${size}`;
  const res = await fetch(url, { headers: headers(), cache: 'no-store' });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Orders API ${res.status}: ${txt.slice(0, 200)}`);
  }
  return res.json();
}

export async function fetchAllOrders(startDate, endDate) {
  const first = await fetchOrdersPage(startDate, endDate, 0, PAGE_SIZE);
  const totalPages = first?.pagination?.totalPage || 1;
  const rows = [...(first?.data || [])];

  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        fetchOrdersPage(startDate, endDate, (i + 1) * PAGE_SIZE, PAGE_SIZE)
      )
    );
    for (const r of rest) if (r?.data) rows.push(...r.data);
  }
  return rows;
}

// ───────────── Markets (마켓) ─────────────

async function fetchMarketsPage(startDate, endDate, durationType, offset = 0, size = MARKET_PAGE_SIZE) {
  const params = new URLSearchParams({
    sortBy: 'startedAt-DESC',
    durationType, // MARKET_START_AT | MARKET_END_AT | MARKET_DURATION
    startDate,
    endDate,
    offset: String(offset),
    size: String(size),
  });
  const url = `${API_BASE}/product/markets?${params}`;
  const res = await fetch(url, { headers: headers(), cache: 'no-store' });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Markets API ${res.status}: ${txt.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * 기간 내 마켓 전체 가져오기. internal-api durationType:
 *   CREATED_AT          - 마켓 등록일
 *   MARKET_STARTED_AT   - 시작일 기준 (default for our use)
 *   MARKET_ENDED_AT     - 종료일 기준
 */
export async function fetchAllMarkets(startDate, endDate, durationType = 'MARKET_STARTED_AT') {
  const first = await fetchMarketsPage(startDate, endDate, durationType, 0, MARKET_PAGE_SIZE);
  const totalPages = first?.pagination?.totalPage || 1;
  const rows = [...(first?.data || [])];

  if (totalPages > 1) {
    const promises = [];
    for (let p = 2; p <= totalPages; p++) {
      promises.push(fetchMarketsPage(startDate, endDate, durationType, (p - 1) * MARKET_PAGE_SIZE, MARKET_PAGE_SIZE));
    }
    const rest = await Promise.all(promises);
    for (const r of rest) if (r?.data) rows.push(...r.data);
  }
  return rows;
}

// ───────────── Aggregation ─────────────

function n(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  const x = Number(String(v).replace(/,/g, '').trim());
  return isNaN(x) ? 0 : x;
}

/**
 * 주문 배열을 분류별로 집계.
 * 매출 = totalPaymentAmount, 마진 = totalWiredMarginAmount
 * 주문건수 = unique ordererPhoneNumber (고객 연락처 중복 제거)
 */
export function aggregateOrders(orders) {
  const PAY = 'totalPaymentAmount';
  const MARGIN = 'totalWiredMarginAmount';
  const PHONE = 'ordererPhoneNumber';

  const total = orders.reduce(
    (acc, o) => ({
      sales: acc.sales + n(o[PAY]),
      margin: acc.margin + n(o[MARGIN]),
      raw: acc.raw + 1,
    }),
    { sales: 0, margin: 0, raw: 0 }
  );
  // unique 고객 수 (총합용)
  total.uniqueCustomers = new Set(orders.map(o => o[PHONE]).filter(Boolean)).size;

  // 실제 출고 완료된 매출만 (status=RELEASE_COMPLETE)
  const released = orders.filter(o => o.status === 'RELEASE_COMPLETE');
  total.salesReleased = released.reduce((a, o) => a + n(o[PAY]), 0);
  total.marginReleased = released.reduce((a, o) => a + n(o[MARGIN]), 0);
  total.releasedCount = released.length;
  total.releasedUniqueCustomers = new Set(released.map(o => o[PHONE]).filter(Boolean)).size;

  const groupBy = (field) => {
    const map = new Map();
    for (const o of orders) {
      const key = (o[field] && String(o[field])) || '(미지정)';
      const cur = map.get(key) || {
        name: key,
        sales: 0,
        margin: 0,
        ordererPhones: new Set(),
        marketIds: new Set(),
      };
      cur.sales += n(o[PAY]);
      cur.margin += n(o[MARGIN]);
      if (o[PHONE]) cur.ordererPhones.add(o[PHONE]);
      if (o.marketId) cur.marketIds.add(o.marketId);
      map.set(key, cur);
    }
    // Set → 카운트로 변환 (직렬화 가능하도록)
    return [...map.values()]
      .map(x => ({
        name: x.name,
        sales: x.sales,
        margin: x.margin,
        uniqueCustomers: x.ordererPhones.size,
        marketCount: x.marketIds.size,
      }))
      .filter(x => x.sales > 0 || x.uniqueCustomers > 0)
      .sort((a, b) => b.sales - a.sales);
  };

  // marketId 기준 그룹핑 (마켓 API와 매칭용)
  const byMarketIdMap = new Map();
  for (const o of orders) {
    const mid = o.marketId;
    if (!mid) continue;
    const cur = byMarketIdMap.get(mid) || {
      marketId: mid,
      marketName: o.marketName || '',
      sales: 0,
      margin: 0,
      ordererPhones: new Set(),
    };
    cur.sales += n(o[PAY]);
    cur.margin += n(o[MARGIN]);
    if (o[PHONE]) cur.ordererPhones.add(o[PHONE]);
    byMarketIdMap.set(mid, cur);
  }
  const byMarketId = [...byMarketIdMap.values()].map(x => ({
    marketId: x.marketId,
    marketName: x.marketName,
    sales: x.sales,
    margin: x.margin,
    uniqueCustomers: x.ordererPhones.size,
  }));

  return {
    total,
    bySeller: groupBy('sellerName'),
    byBrand: groupBy('brandName'),
    byMarket: groupBy('marketName'),
    bySellerManager: groupBy('sellerManagerName'),
    byProductManager: groupBy('productManagerName'), // 신규: 상품 담당자
    byMarketId,
  };
}

/**
 * 마켓을 화면용 행 형식으로 정규화. estimated는 백만원 단위 × 1,000,000.
 */
export function normalizeMarkets(markets, unitMultiplier = 1_000_000) {
  return markets.map(m => {
    const products = m.products || [];
    const brandName = products[0]?.brand?.name || '';
    return {
      id: m.id,
      name: m.name,
      sellerName: m.seller?.name || '',
      managerName: m.seller?.manager?.name || '',
      brandName,
      estimatedSales: n(m.estimatedSalesAmount) * unitMultiplier,
      actualSales: n(m.actualSalesAmount),
      status: m.status,
      startedAt: m.startedAt,
      endedAt: m.endedAt,
      salesChannel: m.salesChannel,
    };
  });
}

/**
 * 마켓 배열을 셀러/브랜드별로 집계 + 예상매출 합.
 * estimatedSalesAmount: 마켓 등록 시 입력하는 예상매출 (단위: 백만원 가설, 검증 필요)
 */
export function aggregateMarkets(markets, unitMultiplier = 1_000_000) {
  // 진행 중 + 종료된 마켓만 (CANCELED 제외)
  const valid = markets.filter(m => m.status !== 'CANCELED');

  const totalEstimated = valid.reduce((a, m) => a + n(m.estimatedSalesAmount), 0) * unitMultiplier;
  const totalActual = valid.reduce((a, m) => a + n(m.actualSalesAmount), 0); // 원 단위로 가정
  const marketsAll = markets.length;
  const marketsActive = valid.length; // CANCELED 제외 = 진행 또는 종료
  const marketsEnded = markets.filter(m => m.status === 'ENDED').length;

  const groupBySeller = () => {
    const map = new Map();
    for (const m of valid) {
      const sellerName = m.seller?.name || '(미지정)';
      const managerName = m.seller?.manager?.name || '';
      const products = m.products || [];
      const brandName = products[0]?.brand?.name || '';

      const cur = map.get(sellerName) || {
        name: sellerName,
        manager: managerName,
        brands: new Set(),
        estimatedSales: 0,
        actualSales: 0,
        marketCount: 0,
      };
      cur.estimatedSales += n(m.estimatedSalesAmount) * unitMultiplier;
      cur.actualSales += n(m.actualSalesAmount);
      cur.marketCount += 1;
      if (brandName) cur.brands.add(brandName);
      if (managerName && !cur.manager) cur.manager = managerName;
      map.set(sellerName, cur);
    }
    return [...map.values()].map(x => ({
      ...x,
      brands: [...x.brands],
    }));
  };

  const groupByBrand = () => {
    const map = new Map();
    for (const m of valid) {
      const products = m.products || [];
      const brandName = products[0]?.brand?.name || '(미지정)';
      const sellerName = m.seller?.name || '';
      const managerName = m.seller?.manager?.name || '';

      const cur = map.get(brandName) || {
        name: brandName,
        sellers: new Set(),
        manager: '',
        estimatedSales: 0,
        actualSales: 0,
        marketCount: 0,
      };
      cur.estimatedSales += n(m.estimatedSalesAmount) * unitMultiplier;
      cur.actualSales += n(m.actualSalesAmount);
      cur.marketCount += 1;
      if (sellerName) cur.sellers.add(sellerName);
      if (managerName && !cur.manager) cur.manager = managerName;
      map.set(brandName, cur);
    }
    return [...map.values()].map(x => ({
      ...x,
      sellers: [...x.sellers],
    }));
  };

  return {
    total: {
      estimatedSales: totalEstimated,
      actualSales: totalActual,
      marketsAll,
      marketsActive,
      marketsEnded,
      unitMultiplier,
    },
    bySeller: groupBySeller(),
    byBrand: groupByBrand(),
  };
}

/**
 * orders + markets 데이터 결합 — 셀러별 통합 view.
 * 매출은 orders에서, 예상매출은 markets에서.
 */
export function combineSellerView(ordersAgg, marketsAgg) {
  const result = new Map();

  // 마켓 데이터에서 시작 (예상매출, 담당자, 브랜드, 마켓건수)
  for (const m of marketsAgg.bySeller) {
    result.set(m.name, {
      name: m.name,
      manager: m.manager || '',
      brands: m.brands || [],
      estimatedSales: m.estimatedSales,
      marketCount: m.marketCount,
      actualSales: 0,
      uniqueCustomers: 0,
      margin: 0,
    });
  }

  // 주문 데이터에서 실제 매출 / 마진 / 고객수 합치기
  for (const o of ordersAgg.bySeller) {
    const cur = result.get(o.name) || {
      name: o.name,
      manager: '',
      brands: [],
      estimatedSales: 0,
      marketCount: o.marketCount || 0,
      actualSales: 0,
      uniqueCustomers: 0,
      margin: 0,
    };
    cur.actualSales = o.sales;
    cur.margin = o.margin;
    cur.uniqueCustomers = o.uniqueCustomers;
    if (!cur.marketCount) cur.marketCount = o.marketCount || 0;
    result.set(o.name, cur);
  }

  return [...result.values()].map(r => ({
    ...r,
    achievementRate: r.estimatedSales > 0 ? (r.actualSales / r.estimatedSales) * 100 : null,
  })).sort((a, b) => b.actualSales - a.actualSales);
}

export function combineBrandView(ordersAgg, marketsAgg) {
  const result = new Map();
  for (const m of marketsAgg.byBrand) {
    result.set(m.name, {
      name: m.name,
      sellers: m.sellers || [],
      manager: m.manager || '',
      estimatedSales: m.estimatedSales,
      marketCount: m.marketCount,
      actualSales: 0,
      uniqueCustomers: 0,
      margin: 0,
    });
  }
  for (const o of ordersAgg.byBrand) {
    const cur = result.get(o.name) || {
      name: o.name,
      sellers: [],
      manager: '',
      estimatedSales: 0,
      marketCount: o.marketCount || 0,
      actualSales: 0,
      uniqueCustomers: 0,
      margin: 0,
    };
    cur.actualSales = o.sales;
    cur.margin = o.margin;
    cur.uniqueCustomers = o.uniqueCustomers;
    if (!cur.marketCount) cur.marketCount = o.marketCount || 0;
    result.set(o.name, cur);
  }

  return [...result.values()].map(r => ({
    ...r,
    achievementRate: r.estimatedSales > 0 ? (r.actualSales / r.estimatedSales) * 100 : null,
  })).sort((a, b) => b.actualSales - a.actualSales);
}
