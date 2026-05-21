// 모의(가상) 매출 데이터 — 디자인 초안 작업용
// USE_MOCK_DATA=true 환경변수가 켜져있으면 /api/summary가 이걸로 응답함.

const M = 1_000_000; // 백만원

// 기간별 baseline (백만원 단위)
const BASE = {
  thisYear:         { estimated: 18000, mixed: 6800,  marketsAll: 480, marketsActive: 430 },
  thisQuarter:      { estimated: 4600,  mixed: 2400,  marketsAll: 130, marketsActive: 118 },
  thisMonth:        { estimated: 1629,  mixed: 744,   marketsAll: 102, marketsActive: 89 },
  nextMonth:        { estimated: 1450,  mixed: 0,     marketsAll: 78,  marketsActive: 78 },
  thisWeek:         { estimated: 525,   mixed: 157,   marketsAll: 33,  marketsActive: 31 },
  nextWeek:         { estimated: 380,   mixed: 0,     marketsAll: 22,  marketsActive: 22 },
  lastMonth:        { estimated: 1196,  mixed: 1250,  marketsAll: 92,  marketsActive: 83 },
  sameMonthLastYear:{ estimated: 1332,  mixed: 1679,  marketsAll: 91,  marketsActive: 82 },
};

const SAMPLE_SELLERS = [
  { name: '오인스',     manager: '김규민' },
  { name: '달빛',       manager: '정석호' },
  { name: '심플팩토리',  manager: '김규민' },
  { name: '아임박선생',  manager: '강규성' },
  { name: '김영은마켓',  manager: '정석호' },
  { name: '바이미룸',    manager: '김규민' },
  { name: '대랑맘',     manager: '강규성' },
  { name: '미니결',     manager: '정석호' },
  { name: '포유홈',     manager: '김규민' },
  { name: '김별샘',     manager: '강규성' },
  { name: '나풀나풀',    manager: '정석호' },
  { name: '그집1303',   manager: '김규민' },
  { name: '깎언니',     manager: '강규성' },
  { name: '런던하이',    manager: '정석호' },
  { name: '히히스카이라운지', manager: '김규민' },
];

const SAMPLE_BRANDS = [
  { name: '동국제약',     seller: '깎언니' },
  { name: '오로바일렌',   seller: '오인스' },
  { name: '퓨어레비',     seller: '달빛' },
  { name: '드시모네',     seller: '오인스' },
  { name: '허그베어',     seller: '김영은마켓' },
  { name: '테코야',       seller: '달빛' },
  { name: '블랙홀 코팅큐', seller: '달빛' },
  { name: '디귿',         seller: '바이미룸' },
  { name: '트루티',       seller: '나풀나풀' },
  { name: '트루쿡',       seller: '포유홈' },
  { name: '씨밀렉스',     seller: '심플팩토리' },
  { name: '신일',         seller: '오인스' },
];

function pseudoRand(seed, max) {
  // 결정적 가짜 난수 (같은 seed에서 같은 값)
  const x = Math.sin(seed) * 10000;
  return Math.floor((x - Math.floor(x)) * max);
}

function mockSellers(baseFactor) {
  return SAMPLE_SELLERS.map((s, i) => {
    const salesM = baseFactor * (0.15 - i * 0.008) * (0.7 + pseudoRand(i + 1, 60) / 100);
    const estimatedM = salesM * (1 + pseudoRand(i + 100, 50) / 100);
    return {
      name: s.name,
      manager: s.manager,
      brands: [],
      actualSales: Math.max(0, Math.round(salesM * M)),
      uniqueCustomers: Math.max(1, Math.round(salesM * 8)),
      estimatedSales: Math.max(0, Math.round(estimatedM * M)),
      marketCount: 1 + pseudoRand(i + 200, 8),
      margin: Math.round(salesM * M * 0.1),
      achievementRate: estimatedM > 0 ? (salesM / estimatedM) * 100 : null,
    };
  }).sort((a, b) => b.actualSales - a.actualSales);
}

function mockBrands(baseFactor) {
  return SAMPLE_BRANDS.map((b, i) => {
    const salesM = baseFactor * (0.13 - i * 0.009) * (0.7 + pseudoRand(i + 50, 60) / 100);
    const estimatedM = salesM * (1 + pseudoRand(i + 150, 60) / 100);
    return {
      name: b.name,
      sellers: [b.seller],
      manager: '',
      actualSales: Math.max(0, Math.round(salesM * M)),
      uniqueCustomers: Math.max(1, Math.round(salesM * 8)),
      estimatedSales: Math.max(0, Math.round(estimatedM * M)),
      marketCount: 1 + pseudoRand(i + 250, 6),
      margin: Math.round(salesM * M * 0.1),
      achievementRate: estimatedM > 0 ? (salesM / estimatedM) * 100 : null,
    };
  }).sort((a, b) => b.actualSales - a.actualSales);
}

function mockMarketsList(baseFactor) {
  const statuses = ['ENDED', 'ACTIVE', 'READY', 'READY', 'ENDED'];
  return Array.from({ length: 15 }, (_, i) => {
    const seller = SAMPLE_SELLERS[i % SAMPLE_SELLERS.length];
    const brand = SAMPLE_BRANDS[i % SAMPLE_BRANDS.length];
    const status = statuses[i % statuses.length];
    const estM = baseFactor * (0.05 + pseudoRand(i + 300, 40) / 100);
    const actM = status === 'ENDED' ? estM * (0.6 + pseudoRand(i + 400, 60) / 100) : 0;
    return {
      id: 10000 + i,
      name: `${brand.name}_${seller.name}`,
      sellerName: seller.name,
      managerName: seller.manager,
      brandName: brand.name,
      estimatedSales: Math.round(estM * M),
      actualSales: Math.round(actM * M),
      status,
      startedAt: '2026-05-' + String(1 + (i % 28)).padStart(2, '0') + 'T00:00:00.000Z',
      endedAt: '2026-05-' + String(2 + (i % 28)).padStart(2, '0') + 'T23:59:59.999Z',
      salesChannel: '셀러쇼핑몰',
      uniqueCustomers: Math.max(1, Math.round(actM * 8)),
      orderCount: Math.max(1, Math.round(actM * 8)),
      margin: Math.round(actM * M * 0.1),
      achievementRate: estM > 0 ? (actM / estM) * 100 : null,
    };
  }).sort((a, b) => b.actualSales - a.actualSales);
}

function mockManagers() {
  const managers = ['김규민', '정석호', '강규성', '최예린'];
  return managers.map((name, i) => ({
    name,
    sales: (300 - i * 60) * M,
    margin: (30 - i * 6) * M,
    uniqueCustomers: 500 - i * 100,
    count: 500 - i * 100,
    marketCount: 12 - i * 2,
  }));
}

export function mockSummary(period, range, full = false) {
  const b = BASE[period] || BASE.thisMonth;
  const baseFactor = b.mixed > 0 ? b.mixed : b.estimated * 0.5;

  const response = {
    period,
    range,
    estimatedSales: b.estimated * M,
    mixedSales: b.mixed * M,
    totalSales: Math.round(b.mixed * M * 1.05),
    actualSales: Math.round(b.mixed * M * 0.6),
    totalMargin: Math.round(b.mixed * M * 0.1),
    uniqueCustomers: b.marketsAll * 50,
    releasedUniqueCustomers: b.marketsActive * 30,
    marketsAll: b.marketsAll,
    marketsActive: b.marketsActive,
    marketsEnded: Math.round(b.marketsAll * 0.4),
    _mock: true,
  };

  if (full) {
    response.sellers = mockSellers(baseFactor);
    response.brands = mockBrands(baseFactor);
    response.marketsList = mockMarketsList(baseFactor);
    response.bySellerManager = mockManagers();
  }

  return response;
}
