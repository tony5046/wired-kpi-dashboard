// ──────────────────────────────────────────────────────────────────
// 모든 시안 페이지가 공유하는 가상 데이터.
// 디자인 iteration 속도를 위해 API 호출 없이 즉시 로드되는 mock 데이터.
//
// 실제 데이터 연동은 추후 와이어드민 + 준비 중인 별도 사이트 + GSD 시트에서.
// 그때 이 파일의 데이터 shape는 /api/preview-data 응답 shape와 호환되어야 함.
//
// 단위:
//   - 모든 매출 금액 = 백만원
//   - 주문건수 = 건
// ──────────────────────────────────────────────────────────────────

const MONTHS_LABEL = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

// ─── 트렌드 차트 (3년 월별) ───
export const MOCK_TREND = MONTHS_LABEL.map((m, i) => ({
  month: m,
  '2024': Math.round(1800 + Math.sin(i * 0.7) * 350 - i * 25),
  '2025': Math.round(1500 + Math.cos(i * 0.5 + 1) * 280 - i * 8),
  '2026': i < 5 ? Math.round(1100 + Math.cos(i * 0.6) * 250 + i * 110) : null,
}));

// ─── 목표 카드 ───
export const MOCK_TARGETS = {
  yearTarget: 20000,       // 200억
  quarterTarget: 5000,     // 50억
  monthTargetAvg: 1667,    // 약 16.7억
  ytdSales: 6186,          // 1~5월 누적 (백만원)
  qtdSales: 2192,          // Q2 (4~5월)
  yearProgress: 40.3,
  quarterProgress: 62.6,
  ytd2025: 6775,           // 2025 동기간 비교용
  ytd2024: 7400,           // 2024 동기간
};

// ─── 파트너 셀러 + 노션 URL ───
export const MOCK_PARTNER_NOTION = {
  '오인스':         'https://www.notion.so/wiredcompany/4b95b76922a7421db79bf1563290545c',
  '달빛언니':       'https://www.notion.so/wiredcompany/2544120083b080e889c5ea45a008896c',
  '선선부부하우스': 'https://www.notion.so/wiredcompany/2544120083b08086a1e9f533dd2dcc24',
  '김영은':         'https://www.notion.so/wiredcompany/2544120083b0804e97e9d355492a9f5a',
  '모노마켓':       'https://www.notion.so/wiredcompany/31e4120083b0801ea881f6a563c5973d',
  '풀킴':           'https://www.notion.so/wiredcompany/31f4120083b08053a12bee60e9473c46',
};

// 파트너 통계 — 월별 매출/마켓건수 + 릴스 조회수
export const MOCK_PARTNER_STATS = [
  {
    name: '오인스',
    ytdSales: 760, ytdLabel: '최근 2개월 누적',
    lastMonth: { sales: 383, marketCount: 12 },
    thisMonth: { sales: 377, marketCount: 11 },
    nextMonth: { sales: 420, marketCount: 13 },
    reels: { lastMonth: 82000, thisMonth: 95000 },
  },
  {
    name: '김영은',
    ytdSales: 291, ytdLabel: '최근 2개월 누적',
    lastMonth: { sales: 165, marketCount: 7 },
    thisMonth: { sales: 126, marketCount: 6 },
    nextMonth: { sales: 180, marketCount: 8 },
    reels: { lastMonth: 38000, thisMonth: 35000 },
  },
  {
    name: '달빛언니',
    ytdSales: 180, ytdLabel: '최근 2개월 누적',
    lastMonth: { sales: 126, marketCount: 5 },
    thisMonth: { sales: 54, marketCount: 4 },
    nextMonth: { sales: 90, marketCount: 5 },
    reels: { lastMonth: 65000, thisMonth: 78000 },
  },
  {
    name: '선선부부하우스',
    ytdSales: 143, ytdLabel: '최근 2개월 누적',
    lastMonth: { sales: 97, marketCount: 4 },
    thisMonth: { sales: 46, marketCount: 3 },
    nextMonth: { sales: 70, marketCount: 4 },
    reels: { lastMonth: 42000, thisMonth: 56000 },
  },
  {
    name: '모노마켓',
    ytdSales: 51, ytdLabel: '최근 2개월 누적',
    lastMonth: { sales: 50, marketCount: 3 },
    thisMonth: { sales: 1, marketCount: 1 },
    nextMonth: { sales: 35, marketCount: 3 },
    reels: { lastMonth: 28000, thisMonth: 41000 },
  },
  {
    name: '풀킴',
    ytdSales: 0, ytdLabel: '최근 2개월 누적',
    lastMonth: { sales: 0, marketCount: 0 },
    thisMonth: { sales: 0, marketCount: 0 },
    nextMonth: { sales: 20, marketCount: 2 },
    reels: { lastMonth: 22000, thisMonth: 31000 },
  },
];

// ─── 셀러 / 브랜드 메타 ───
const SELLER_TO_MGR = {
  '오인스': '김규민', '달빛언니': '정석호', '심플팩토리': '김규민', '김영은': '정석호',
  '아임박선생': '강규성', '바이미룸': '김규민', '모노마켓': '강규성', '미니결': '정석호',
  '포유홈': '김규민', '김별샘': '강규성', '나풀나풀': '정석호', '그집1303': '김규민',
  '깎언니': '강규성', '런던하이': '정석호', '히히스카이라운지': '김규민', '코앤텍': '최예린',
  '빅토리사': '최예린', '선선부부하우스': '강규성', '풀킴': '정석호', '앙젤리크': '김규민',
};

const BRAND_TO_MGR = {
  '멜리언스': '정석호', '오마뎅': '박준호', '씨밀렉스': '이민우', '금왕': '김규민', '올레아': '강규성',
  '동국제약': '정연수', '오로바일렌': '김규민', '퓨어레비': '박준호', '드시모네': '이호영',
  '허그베어': '김소리', '테코야': '정연수', '블랙홀 코팅큐': '김규민',
  '디귿': '박준호', '트루티': '이호영', '트루쿡': '김소리',
};

const PARTNER_NAMES_SET = new Set(['오인스', '달빛언니', '선선부부하우스', '김영은', '모노마켓', '풀킴']);
const SELLER_LIST = Object.keys(SELLER_TO_MGR);
const BRAND_LIST = Object.keys(BRAND_TO_MGR);
const CHANNELS = ['본사쇼핑몰', '카카오선물하기', '네이버스마트스토어', '와이어디 쇼핑몰'];

// ─── 5월 마켓 리스트 (60개 생성) ───
function genMarkets() {
  const markets = [];
  for (let i = 0; i < 60; i++) {
    const seller = SELLER_LIST[i % SELLER_LIST.length];
    const brand = BRAND_LIST[(i * 3) % BRAND_LIST.length];
    const s1 = ((i * 9301 + 49297) % 233280) / 233280;
    const s2 = ((i * 7919 + 91) % 233280) / 233280;
    const sales = Math.round(Math.pow(s1, 2) * 250 + 3);
    const orderCount = Math.max(5, Math.round(sales * (3 + s2 * 4)));
    const estimatedSales = Math.round(sales * (0.7 + s2 * 0.7));
    const statuses = ['ENDED','ENDED','ENDED','ACTIVE','READY'];
    const status = statuses[i % statuses.length];
    const day = (i % 28) + 1;
    markets.push({
      id: 10000 + i,
      name: `${brand}_${seller}_2026-05-${String(day).padStart(2,'0')}`,
      sellerName: seller,
      brandName: brand,
      managerName: SELLER_TO_MGR[seller] || '-',
      status,
      startedAt: `2026-05-${String(day).padStart(2,'0')}`,
      endedAt: `2026-05-${String(Math.min(day + 2, 31)).padStart(2,'0')}`,
      sales,                  // 백만원
      salesWon: sales * 1_000_000,
      orderCount,
      estimatedSales,
      achievementRate: estimatedSales > 0 ? (sales / estimatedSales) * 100 : null,
      salesChannel: CHANNELS[i % CHANNELS.length],
      csRate: null,           // 추후 API
      deliveryRate: null,
      exposure: null,
      isPartner: PARTNER_NAMES_SET.has(seller),
    });
  }
  return markets;
}
export const MOCK_MARKETS = genMarkets();

// ─── 셀러 집계 (이번달 = MOCK_MARKETS 기반) ───
export const MOCK_SELLERS = (() => {
  const map = new Map();
  for (const m of MOCK_MARKETS) {
    const cur = map.get(m.sellerName) || {
      name: m.sellerName,
      manager: m.managerName,
      sales: 0, estimatedSales: 0, marketCount: 0, orderCount: 0,
      isPartner: PARTNER_NAMES_SET.has(m.sellerName),
    };
    cur.sales += m.sales;
    cur.estimatedSales += m.estimatedSales;
    cur.marketCount += 1;
    cur.orderCount += m.orderCount;
    map.set(m.sellerName, cur);
  }
  return [...map.values()].map(s => ({
    ...s,
    achievementRate: s.estimatedSales > 0 ? (s.sales / s.estimatedSales) * 100 : null,
  })).sort((a, b) => b.sales - a.sales);
})();

// ─── 브랜드 집계 ───
export const MOCK_BRANDS = (() => {
  const map = new Map();
  for (const m of MOCK_MARKETS) {
    if (!m.brandName) continue;
    const cur = map.get(m.brandName) || {
      name: m.brandName,
      manager: BRAND_TO_MGR[m.brandName] || '-',
      sellers: new Set(),
      sales: 0, estimatedSales: 0, marketCount: 0, orderCount: 0,
    };
    cur.sales += m.sales;
    cur.estimatedSales += m.estimatedSales;
    cur.marketCount += 1;
    cur.orderCount += m.orderCount;
    if (m.sellerName) cur.sellers.add(m.sellerName);
    map.set(m.brandName, cur);
  }
  return [...map.values()].map(b => ({
    ...b,
    sellers: [...b.sellers],
    achievementRate: b.estimatedSales > 0 ? (b.sales / b.estimatedSales) * 100 : null,
  })).sort((a, b) => b.sales - a.sales);
})();

// ─── 브랜드 관리 페이지: 월별 목표 vs 실적 ───
// 다중 브랜드 케이스 시연용 데이터:
//   • 홍만의 발굴: 멜리언스 + 셀라보드 + 더모비 (3개)
//   • 정석호 관리: 멜리언스 + 셀라보드 (2개)
//   • 박준호 관리: 오마뎅 + 더모비 (2개)
//   • 김규민 발굴: 씨밀렉스 + 디카페인 (2개), 관리: 금왕 (1개)
//   • 강규성 관리: 올레아 + 디카페인 (2개), 발굴: 금왕 (1개)
export const MOCK_BRAND_MGMT = {
  months: ['5월', '6월', '7월', '8월', '9월', '10월'],
  brands: [
    { name: '멜리언스', discoverer: '홍만의', manager: '정석호', targets: [10,10,10,10,10,10], actuals: [ 1, 2, 3, 4, 5, 6] },
    { name: '오마뎅',   discoverer: '홍소의', manager: '박준호', targets: [20,20,20,20,20,20], actuals: [ 7, 8, 9, 0,10,11] },
    { name: '씨밀렉스', discoverer: '김규민', manager: '이민우', targets: [10,10,10,10,10,10], actuals: [11, 4,21,10, 5, 1] },
    { name: '금왕',     discoverer: '강규성', manager: '김규민', targets: [20,20,20,20,20,20], actuals: [10,20,30, 4, 5, 6] },
    { name: '올레아',   discoverer: '박준호', manager: '강규성', targets: [10,10,10,10,10,10], actuals: [11,12,13,14,15,16] },
    // ↓ 다중 브랜드 케이스 시연용 추가
    { name: '셀라보드', discoverer: '홍만의', manager: '정석호', targets: [15,15,15,15,15,15], actuals: [ 3, 5, 8,12,15,18] },
    { name: '더모비',   discoverer: '홍만의', manager: '박준호', targets: [10,10,10,10,10,10], actuals: [ 2, 4, 7, 9,11,13] },
    { name: '디카페인', discoverer: '김규민', manager: '강규성', targets: [15,15,15,15,15,15], actuals: [ 5, 8,12,15,18,20] },
  ],
};

// ─── 통합 데이터 (preview-data API 응답과 동일 shape) ───
// 페이지에서 MOCK_PREVIEW_DATA 하나만 import해서 쓰면 됨
export const MOCK_PREVIEW_DATA = {
  generatedAt: '2026-05-28T00:00:00.000Z',
  now: { year: 2026, month: 5, quarter: 2, daysIntoYear: 148 },

  trend: MOCK_TREND,
  monthTargetAvg: MOCK_TARGETS.monthTargetAvg,
  yearTarget: MOCK_TARGETS.yearTarget,
  quarterTarget: MOCK_TARGETS.quarterTarget,
  ytdSales: MOCK_TARGETS.ytdSales,
  qtdSales: MOCK_TARGETS.qtdSales,
  yearProgress: MOCK_TARGETS.yearProgress,
  quarterProgress: MOCK_TARGETS.quarterProgress,

  salesMetric: 'mock',
  ytdSource: 'mock data',

  marketsList: MOCK_MARKETS,
  sellers: MOCK_SELLERS,
  brands: MOCK_BRANDS,
  partnerStats: MOCK_PARTNER_STATS,

  errors: {},
  debug: { mockMode: true },
};
