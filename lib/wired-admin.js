// 와이어드민 API 클라이언트
import ExcelJS from 'exceljs'; // 미사용 (orders는 JSON으로 가져옴)

// 신규 internal-api 사용 (개발팀 발급 장기 토큰 + /admin prefix 없음)
const API_BASE = process.env.WIRED_API_BASE || 'https://internal-api.wiredm.in';
// 와이어드민이 size>1000을 거부함 ("size must not be greater than 1000").
// 2026-05 이후 적용됨. 그 전엔 5000도 됐음.
const PAGE_SIZE = 1000;
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

// 동시 호출 제한 — 한 번에 너무 많이 던지면 와이어드민이 timeout/거부
const MAX_CONCURRENT = 8;

async function pMap(items, mapper, concurrency = MAX_CONCURRENT) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      results[idx] = await mapper(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

export async function fetchAllOrders(startDate, endDate) {
  const first = await fetchOrdersPage(startDate, endDate, 0, PAGE_SIZE);
  const totalPages = first?.pagination?.totalPage || 1;
  const rows = [...(first?.data || [])];

  if (totalPages > 1) {
    const offsets = Array.from({ length: totalPages - 1 }, (_, i) => (i + 1) * PAGE_SIZE);
    const rest = await pMap(offsets, (offset) =>
      fetchOrdersPage(startDate, endDate, offset, PAGE_SIZE)
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
 * 기간 내 마켓 전체 가져오기. internal-api 실제 durationType (swagger랑 다름):
 *   MARKET_START_AT   - 시작일 기준
 *   MARKET_END_AT     - 종료일 기준
 *   MARKET_DURATION   - 기간 겹침 (default — 진행 중인 모든 마켓)
 */
export async function fetchAllMarkets(startDate, endDate, durationType = 'MARKET_DURATION') {
  const first = await fetchMarketsPage(startDate, endDate, durationType, 0, MARKET_PAGE_SIZE);
  const totalPages = first?.pagination?.totalPage || 1;
  const rows = [...(first?.data || [])];

  if (totalPages > 1) {
    const offsets = Array.from({ length: totalPages - 1 }, (_, i) => (i + 1) * MARKET_PAGE_SIZE);
    const rest = await pMap(offsets, (offset) =>
      fetchMarketsPage(startDate, endDate, durationType, offset, MARKET_PAGE_SIZE)
    );
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
  // 매출 정의: totalWiredSalesAmount = 와이어드가 인식하는 매출 (회계 기준)
  //   = 고객 결제 - 셀러 마진(수수료)
  // 참고: totalPaymentAmount는 고객이 결제한 총액 (셀러 수수료 포함)
  const PAY = 'totalWiredSalesAmount';
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

  // groupBy: 주어진 주문 배열을 field 기준으로 집계
  const groupBy = (srcOrders, field) => {
    const map = new Map();
    for (const o of srcOrders) {
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
  const groupByMarketId = (srcOrders) => {
    const map = new Map();
    for (const o of srcOrders) {
      const mid = o.marketId;
      if (!mid) continue;
      const cur = map.get(mid) || {
        marketId: mid, marketName: o.marketName || '',
        sales: 0, margin: 0, ordererPhones: new Set(),
      };
      cur.sales += n(o[PAY]);
      cur.margin += n(o[MARGIN]);
      if (o[PHONE]) cur.ordererPhones.add(o[PHONE]);
      map.set(mid, cur);
    }
    return [...map.values()].map(x => ({
      marketId: x.marketId, marketName: x.marketName,
      sales: x.sales, margin: x.margin,
      uniqueCustomers: x.ordererPhones.size,
    }));
  };

  return {
    total,
    // 전체 주문 기준 (출고 대기 + 완료 모두 포함)
    bySeller: groupBy(orders, 'sellerName'),
    byBrand: groupBy(orders, 'brandName'),
    byMarket: groupBy(orders, 'marketName'),
    bySellerManager: groupBy(orders, 'sellerManagerName'),
    byProductManager: groupBy(orders, 'productManagerName'),
    byMarketId: groupByMarketId(orders),

    // 출고 완료된 주문만 (RELEASE_COMPLETE) — 확정 매출
    bySellerReleased: groupBy(released, 'sellerName'),
    byBrandReleased: groupBy(released, 'brandName'),
    byMarketReleased: groupBy(released, 'marketName'),
    bySellerManagerReleased: groupBy(released, 'sellerManagerName'),
    byProductManagerReleased: groupBy(released, 'productManagerName'),
    byMarketIdReleased: groupByMarketId(released),
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
/**
 * orders + markets 데이터 결합 — 셀러별 통합 view.
 * @param options.releasedOnly - true면 RELEASE_COMPLETE 주문만 (확정 매출). default false.
 */
export function combineSellerView(ordersAgg, marketsAgg, options = {}) {
  const { releasedOnly = false } = options;
  const sellerData = releasedOnly ? ordersAgg.bySellerReleased : ordersAgg.bySeller;
  const result = new Map();

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

  for (const o of (sellerData || [])) {
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

export function combineBrandView(ordersAgg, marketsAgg, options = {}) {
  const { releasedOnly = false } = options;
  const brandData = releasedOnly ? ordersAgg.byBrandReleased : ordersAgg.byBrand;
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
  for (const o of (brandData || [])) {
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
