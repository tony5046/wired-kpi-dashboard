'use client';
import Link from 'next/link';
import { useState, useMemo, Fragment } from 'react';
import ChatWidget from '../chat-widget';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts';

// ─────────────── 모의 데이터 ───────────────
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

const YEAR_TARGET = 20000;       // 백만원 (200억)
const QUARTER_TARGET = 5000;     // 백만원 (50억)
const MONTH_TARGET_AVG = YEAR_TARGET / 12; // 월 평균 약 1,667백만원

const TREND = MONTHS.map((m, i) => ({
  month: m,
  '2024': 2067 + Math.round((Math.sin(i * 0.7) + 1) * 200) - i * 30,
  '2025': 1535 + Math.round((Math.sin(i * 0.5 + 1) + 1) * 250) - i * 10,
  '2026': i < 5 ? 1094 + Math.round((Math.cos(i * 0.6) + 1) * 250) + i * 50 : null,
  '2026 예상': i === 5 ? 1450 : null,
}));

const YTD_2026 = TREND.slice(0, 5).reduce((s, r) => s + (r['2026'] || 0), 0);
const YTD_2025 = TREND.slice(0, 5).reduce((s, r) => s + (r['2025'] || 0), 0);
const YTD_2024 = TREND.slice(0, 5).reduce((s, r) => s + (r['2024'] || 0), 0);
const QTD_2026 = TREND.slice(3, 5).reduce((s, r) => s + (r['2026'] || 0), 0); // 4~5월 (Q2)
const YOY_PCT = ((YTD_2026 - YTD_2025) / YTD_2025) * 100;
const YOY_2024_PCT = ((YTD_2026 - YTD_2024) / YTD_2024) * 100;
const YEAR_ACH = (YTD_2026 / YEAR_TARGET) * 100;
const QUARTER_ACH = (QTD_2026 / QUARTER_TARGET) * 100;

// 셀러 담당자 / 상품 담당자 (sales=백만원, marketCount=건수, sellerCount=함께한 셀러 수)
const SELLER_MGRS = [
  { name: '김규민', sales: 3200, lastYear: 2900, marketCount: 124, sellerCount: 18 },
  { name: '정석호', sales: 2400, lastYear: 2600, marketCount: 95,  sellerCount: 14 },
  { name: '강규성', sales: 850,  lastYear: 700,  marketCount: 42,  sellerCount: 7 },
  { name: '최예린', sales: 420,  lastYear: 100,  marketCount: 18,  sellerCount: 3 },
];
const PRODUCT_MGRS = [
  { name: '정연수', sales: 2800, lastYear: 2500, marketCount: 95,  brandCount: 22 },
  { name: '김규민', sales: 1100, lastYear: 950,  marketCount: 38,  brandCount: 8 },
  { name: '박준호', sales: 1050, lastYear: 800,  marketCount: 35,  brandCount: 9 },
  { name: '이호영', sales: 720,  lastYear: 600,  marketCount: 28,  brandCount: 6 },
  { name: '김소리', sales: 580,  lastYear: 520,  marketCount: 22,  brandCount: 5 },
  { name: '정석호', sales: 420,  lastYear: 480,  marketCount: 16,  brandCount: 4 },
  { name: '신나리', sales: 200,  lastYear: 0,    marketCount: 8,   brandCount: 2 },
];

const SELLERS = [
  { name: '오인스', sales: 1480, lastYear: 1320 },
  { name: '달빛언니', sales: 980, lastYear: 720 },
  { name: '심플팩토리', sales: 590, lastYear: 650 },
  { name: '김영은', sales: 410, lastYear: 380 },
  { name: '아임박선생', sales: 320, lastYear: 150 },
  { name: '바이미룸', sales: 280, lastYear: 0 },
  { name: '선선부부하우스', sales: 250, lastYear: 0 },
  { name: '모노마켓', sales: 220, lastYear: 0 },
  { name: '풀킴', sales: 210, lastYear: 0 },
  { name: '미니결', sales: 190, lastYear: 200 },
];

const BRANDS = [
  { name: '동국제약', sales: 720, lastYear: 600 },
  { name: '오로바일렌', sales: 510, lastYear: 0 },
  { name: '퓨어레비', sales: 490, lastYear: 350 },
  { name: '드시모네', sales: 430, lastYear: 380 },
  { name: '허그베어', sales: 320, lastYear: 240 },
  { name: '테코야', sales: 260, lastYear: 280 },
  { name: '블랙홀 코팅큐', sales: 250, lastYear: 220 },
  { name: '디귿', sales: 200, lastYear: 0 },
  { name: '트루티', sales: 165, lastYear: 130 },
  { name: '트루쿡', sales: 150, lastYear: 110 },
];

// ─── 100건 마켓 모의 데이터 ───
const MGR_OF_SELLER = {
  '오인스': '김규민', '달빛언니': '정석호', '심플팩토리': '김규민', '김영은': '정석호',
  '아임박선생': '강규성', '바이미룸': '김규민', '모노마켓': '강규성', '미니결': '정석호',
  '포유홈': '김규민', '김별샘': '강규성', '나풀나풀': '정석호', '그집1303': '김규민',
  '깎언니': '강규성', '런던하이': '정석호', '히히스카이라운지': '김규민', '코앤텍': '최예린',
  '빅토리사': '최예린', '선선부부하우스': '강규성', '풀킴': '정석호', '앙젤리크': '김규민',
};
const SELLER_NAMES = Object.keys(MGR_OF_SELLER);

// 🤝 파트너 셀러 (노션 "🎁 와이어드 파트너" 페이지 기준)
// 와이어드민 셀러명 ↔ 노션 페이지 URL 매핑
const PARTNER_SELLERS = {
  '선선부부하우스': {
    notionTitle: '2905HOME_COMPANY',
    notionUrl: 'https://www.notion.so/wiredcompany/2544120083b08086a1e9f533dd2dcc24',
  },
  '김영은': {
    notionTitle: '조이풀영은 X 와이어드컴퍼니',
    notionUrl: 'https://www.notion.so/wiredcompany/2544120083b0804e97e9d355492a9f5a',
  },
  '달빛언니': {
    notionTitle: 'MOON.LIGHT COMPANY',
    notionUrl: 'https://www.notion.so/wiredcompany/2544120083b080e889c5ea45a008896c',
  },
  '오인스': {
    notionTitle: '오인스마켓',
    notionUrl: 'https://www.notion.so/wiredcompany/4b95b76922a7421db79bf1563290545c',
  },
  '모노마켓': {
    notionTitle: '모노마켓 X 와이어드컴퍼니',
    notionUrl: 'https://www.notion.so/wiredcompany/31e4120083b0801ea881f6a563c5973d',
  },
  '풀킴': {
    notionTitle: '풀킴님 워크스페이스',
    notionUrl: 'https://www.notion.so/wiredcompany/31f4120083b08053a12bee60e9473c46',
  },
};
const BRAND_NAMES = ['동국제약','오로바일렌','퓨어레비','드시모네','허그베어','테코야','블랙홀 코팅큐','디귿','트루티','트루쿡','씨밀렉스','신일','코닥','VDL','로라애슐리','메디힐','풀무원','나무엑스','경자국밥','콤비타'];

// 브랜드 메타 (담당자 + 거래형태)
const PRODUCT_MGR_NAMES = ['정연수', '김규민', '박준호', '이호영', '김소리'];
const BRAND_INFO = Object.fromEntries(
  BRAND_NAMES.map((b, i) => [b, {
    manager: PRODUCT_MGR_NAMES[i % PRODUCT_MGR_NAMES.length],
    vendorType: (i % 3 === 0) ? '본사' : '밴더사', // 약 1/3은 본사
  }])
);

// 5팀 담당자 풀 (모의)
const MARKETING_MGRS = ['이지은', '김민지', '오세영', '한지원'];
const CS_MGRS = ['박지원', '김선영', '최유진'];
const LOGISTICS_MGRS = ['최성훈', '이대성', '정민우'];

// 노션 콘텐츠 아이디어 풀 (모의)
const CONTENT_IDEAS_POOL = [
  '엄마들의 후기 인터뷰 릴스',
  '신상품 언박싱 콘텐츠',
  '특가 카운트다운 스토리',
  '제품 디테일 클로즈업',
  '실사용 BGM 영상',
  '비교 콘텐츠 (vs 경쟁사)',
  '오픈 직전 티저',
  '리뷰어 협업 영상',
  '셀러 인사이트 카드뉴스',
  '리뷰 모아보기',
  '실시간 후기 모음',
  '브랜드 스토리',
];

const EVENTS_POOL = [
  '1+1 사은품 증정',
  '선착순 100명 추가 할인',
  '결제링크 오픈 24시간 한정',
  '인스타 팔로워 추가 5%',
  '리뷰 작성 시 적립금',
  '동시 구매 시 배송비 무료',
  '재구매 고객 추가 혜택',
  null, // 이벤트 없음
];

// 판매 채널 / 담당 팀 (노션에서 가져오는 메타)
const CHANNELS_POOL = ['본사쇼핑몰', '카카오선물하기', '네이버스마트스토어', '본사쇼핑몰 + 카카오'];
const NOTION_TEAMS_POOL = ['와이어드컴퍼니', '선선부부', '달빛', '오인스컴퍼니', '에이치케이팀'];

function genMarkets() {
  const list = [];
  for (let i = 0; i < 100; i++) {
    const seller = SELLER_NAMES[i % SELLER_NAMES.length];
    const brand = BRAND_NAMES[(i * 3) % BRAND_NAMES.length];
    const seed1 = ((i * 9301 + 49297) % 233280) / 233280;
    const seed2 = ((i * 7919 + 91) % 233280) / 233280;
    const seed3 = ((i * 4567 + 31) % 233280) / 233280;
    const seed4 = ((i * 11003 + 7) % 233280) / 233280;
    const sales = Math.round(Math.pow(seed1, 2) * 250 + 3);
    const orderCount = Math.max(5, Math.round(sales * (3 + seed2 * 4)));
    const estimatedSales = Math.round(sales * (0.7 + seed2 * 0.7));
    const statuses = ['ENDED','ENDED','ENDED','ACTIVE','READY'];
    const status = statuses[i % statuses.length];
    const day = (i % 28) + 1;

    // CS율
    const csBase = (i % 11 === 0) ? 15 + seed3 * 10
                  : (i % 5 === 0) ? 5 + seed3 * 5
                  : seed3 * 4;
    const returnCount = Math.round((orderCount * csBase / 100) * 0.6);
    const cancelCount = Math.round((orderCount * csBase / 100) * 0.4);
    const csIssues = returnCount + cancelCount;
    const csRate = orderCount > 0 ? (csIssues / orderCount) * 100 : 0;

    // 물류 KPI (배송완료율 85~100%, 평균 배송일 1.5~4.5)
    const deliveryRate = status === 'ENDED' ? 85 + seed4 * 15 : null;
    const avgDeliveryDays = status === 'ENDED' ? 1.5 + seed4 * 3 : null;

    // 마케팅 KPI (콘텐츠 노출수 ~ 매출 × 1000~5000, 클릭률 1~6%)
    const exposure = status !== 'READY' ? Math.round(sales * 1000 * (1 + seed2 * 4)) : null;
    const clickRate = status !== 'READY' ? 1 + seed3 * 5 : null;

    // 노션 메타 (모의)
    const openH = 9 + Math.floor(seed3 * 8);  // 9~16시
    const closeDay = Math.min(day + 2, 31);
    const closeH = 18 + Math.floor(seed4 * 6); // 18~23시
    const paymentLinkOpenAt = `2026-05-${String(day).padStart(2,'0')} ${String(openH).padStart(2,'0')}:00`;
    const paymentLinkCloseAt = `2026-05-${String(closeDay).padStart(2,'0')} ${String(closeH).padStart(2,'0')}:59`;
    const event = EVENTS_POOL[i % EVENTS_POOL.length];
    const stock = 100 + Math.floor(seed1 * 900); // 100~1000
    const channel = CHANNELS_POOL[i % CHANNELS_POOL.length];
    const notionTeam = NOTION_TEAMS_POOL[i % NOTION_TEAMS_POOL.length];
    // 콘텐츠 아이디어 3~5개 픽
    const ideaCount = 3 + (i % 3);
    const contentIdeas = [];
    const startIdx = (i * 5) % CONTENT_IDEAS_POOL.length;
    for (let k = 0; k < ideaCount; k++) {
      contentIdeas.push(CONTENT_IDEAS_POOL[(startIdx + k) % CONTENT_IDEAS_POOL.length]);
    }
    const notionPageUrl = `https://www.notion.so/wiredcompany/market-${10000 + i}`;
    const lowestPriceIssue = (i % 13 === 0); // 가끔 최저가 이슈
    const materialsDelivered = (i % 7 !== 0); // 자료 전달 여부

    list.push({
      id: 10000 + i,
      name: `${brand}_${seller}_2026-05-${String(day).padStart(2,'0')}`,
      sellerName: seller,
      managerName: MGR_OF_SELLER[seller],
      // 5팀 담당자
      sellerMgr: MGR_OF_SELLER[seller],
      brandMgr: (BRAND_INFO[brand] || {}).manager || PRODUCT_MGR_NAMES[i % PRODUCT_MGR_NAMES.length],
      marketingMgr: MARKETING_MGRS[i % MARKETING_MGRS.length],
      csMgr: CS_MGRS[i % CS_MGRS.length],
      logisticsMgr: LOGISTICS_MGRS[i % LOGISTICS_MGRS.length],
      brandName: brand,
      sales,
      orderCount,
      estimatedSales,
      achievementRate: estimatedSales > 0 ? (sales / estimatedSales) * 100 : null,
      returnCount,
      cancelCount,
      csIssues,
      csRate,
      deliveryRate,
      avgDeliveryDays,
      exposure,
      clickRate,
      status,
      startedAt: `2026-05-${String(day).padStart(2,'0')}`,
      endedAt: `2026-05-${String(Math.min(day + 2, 31)).padStart(2,'0')}`,
      // 노션 메타
      paymentLinkOpenAt,
      paymentLinkCloseAt,
      event,
      stock,
      channel,
      notionTeam,
      contentIdeas,
      notionPageUrl,
      lowestPriceIssue,
      materialsDelivered,
    });
  }
  return list;
}
const MARKETS = genMarkets();
const MANAGER_LIST = ['김규민', '정석호', '강규성', '최예린'];

// ─────────────── 유틸 ───────────────
function fmt(v) { return v?.toLocaleString('ko-KR') + '백만원'; }
function pct(v) {
  if (v == null) return '-';
  const sign = v > 0 ? '+' : '';
  return sign + v.toFixed(1) + '%';
}

// ─────────────── 목표 카드 (날짜 진행률 vs 매출 달성률) ───────────────
function TargetCard({ title, target, current, period, dateProgress }) {
  const ach = (current / target) * 100;
  const remaining = target - current;
  const gap = ach - dateProgress; // +면 페이스 양호, -면 뒤처짐
  const onPace = gap >= 0;

  return (
    <div style={{
      padding: 14, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
      color: '#fff', borderRadius: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div style={{ fontSize: 12, opacity: 0.85 }}>{title}</div>
        <div style={{ fontSize: 11, opacity: 0.75 }}>{period}</div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>{fmt(current)}</div>
      <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 10 }}>목표 {fmt(target)}</div>

      {/* 매출 달성률 바 */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, opacity: 0.85, marginBottom: 2 }}>
          <span>💰 매출 달성률</span>
          <span style={{ fontWeight: 700 }}>{ach.toFixed(1)}%</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(ach, 100)}%`, height: '100%', background: '#fff', borderRadius: 4 }} />
        </div>
      </div>

      {/* 날짜 진행률 바 */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, opacity: 0.85, marginBottom: 2 }}>
          <span>📅 날짜 진행률</span>
          <span style={{ fontWeight: 700 }}>{dateProgress.toFixed(1)}%</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.18)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(dateProgress, 100)}%`, height: '100%', background: 'rgba(255,255,255,0.6)', borderRadius: 4 }} />
        </div>
      </div>

      {/* 페이스 배지 */}
      <div style={{
        padding: '6px 10px', borderRadius: 8,
        background: onPace ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
        border: '1px solid ' + (onPace ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'),
        fontSize: 11, fontWeight: 700, textAlign: 'center', marginBottom: 6,
      }}>
        {onPace ? '✅' : '⚠️'} 페이스 {onPace ? '양호' : '뒤처짐'} ({gap >= 0 ? '+' : ''}{gap.toFixed(1)}%p)
      </div>

      <div style={{ fontSize: 11, opacity: 0.85, textAlign: 'right' }}>
        남은 {fmt(Math.max(0, remaining))}
      </div>
    </div>
  );
}

function CompareCard({ label, current, base }) {
  if (!base) return null;
  const delta = ((current - base) / base) * 100;
  const up = delta >= 0;
  return (
    <div style={{ padding: 12, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10 }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>{fmt(base)}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: up ? '#10b981' : '#ef4444' }}>
        {up ? '▲' : '▼'} {pct(delta)}
      </div>
    </div>
  );
}

function SectionTitle({ emoji, title, hint }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{emoji} {title}</h2>
      {hint && <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>{hint}</p>}
    </div>
  );
}

// ─────────────── 트렌드 차트 ───────────────
function TrendChart() {
  return (
    <div style={card}>
      <SectionTitle
        emoji="📈"
        title="3년 월별 매출 추이"
        hint="2024 회색 / 2025 노랑 / 2026 파랑 · 다음달은 예상매출(점선) · 가로 점선 = 월 평균 목표"
      />
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 16 }}>
        <div style={{ height: 380 }}>
          <ResponsiveContainer>
            <LineChart data={TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={11} tickFormatter={v => (v / 1000).toFixed(1) + 'B'} />
              <Tooltip formatter={v => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine
                y={MONTH_TARGET_AVG}
                stroke="#ef4444"
                strokeDasharray="6 3"
                label={{ value: `월 평균 목표 ${MONTH_TARGET_AVG.toFixed(0)}백만원`, fill: '#ef4444', fontSize: 11, position: 'insideTopRight' }}
              />
              <Line type="monotone" dataKey="2024" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="2025" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="2026" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="2026 예상" stroke="#7c3aed" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 우측 사이드바 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <TargetCard
            title="🎯 연간 목표"
            target={YEAR_TARGET}
            current={YTD_2026}
            period="1~5월"
            dateProgress={38.4}  /* 2026-05-20 기준 (140일/365) */
          />
          <TargetCard
            title="🎯 분기 목표"
            target={QUARTER_TARGET}
            current={QTD_2026}
            period="Q2 4~5월"
            dateProgress={54.9}  /* Q2 시작부터 5/20까지 50일/91 */
          />
          <CompareCard label="vs 2025 동기간" current={YTD_2026} base={YTD_2025} />
          <CompareCard label="vs 2024 동기간" current={YTD_2026} base={YTD_2024} />
        </div>
      </div>
    </div>
  );
}

// ─────────────── 담당자 기여도 (셀러+상품 나란히) ───────────────
function ManagerColumn({ title, hint, rows, accent, partnerLabel }) {
  // partnerLabel: '셀러' | '브랜드' (옆에 함께한 거래 대상 수 표시용)
  const total = rows.reduce((s, r) => s + r.sales, 0);
  const sorted = [...rows].sort((a, b) => b.sales - a.sales);
  return (
    <div style={{ ...card, flex: 1 }}>
      <SectionTitle emoji="" title={title} hint={hint} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((r, i) => {
          const share = (r.sales / total) * 100;
          const isTop = (i === 0);
          const yoy = r.lastYear > 0 ? ((r.sales - r.lastYear) / r.lastYear) * 100 : null;
          const isNew = r.lastYear === 0;
          const partnerCount = r.sellerCount ?? r.brandCount ?? 0;
          const avgPerMarket = r.marketCount > 0 ? r.sales / r.marketCount : 0;
          return (
            <div key={r.name} style={{ paddingBottom: 10, borderBottom: i < sorted.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              {/* 상단: 이름 + YoY + 비중 + 매출 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: isTop ? 700 : 500 }}>{r.name}</span>
                  {isNew ? (
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: '#dbeafe', color: '#1d4ed8' }}>🆕</span>
                  ) : yoy != null ? (
                    <span style={{ fontSize: 10, color: yoy >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      {yoy >= 0 ? '▲' : '▼'} {Math.abs(yoy).toFixed(0)}%
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>
                  <span style={{ fontWeight: 700, color: accent }}>{share.toFixed(1)}%</span>
                  {' · '}<span style={{ fontWeight: 600, color: '#374151' }}>{fmt(r.sales)}</span>
                </div>
              </div>

              {/* 막대 */}
              <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{
                  width: `${(r.sales / sorted[0].sales) * 100}%`,
                  height: '100%',
                  background: isTop ? accent : `${accent}aa`,
                  borderRadius: 3,
                }} />
              </div>

              {/* 활성 지표 */}
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#6b7280' }}>
                <span>🛒 마켓 <strong style={{ color: '#374151' }}>{r.marketCount}건</strong></span>
                <span>{partnerLabel === '셀러' ? '🏪' : '🏷️'} {partnerLabel} <strong style={{ color: '#374151' }}>{partnerCount}곳</strong></span>
                <span>📊 평균 <strong style={{ color: '#374151' }}>{avgPerMarket.toFixed(0)}백만/건</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ManagerContribution() {
  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>👥 담당자별 기여도</h2>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
          셀러 담당자와 상품 담당자 각각의 누적 매출 기여 (성과 평가용 아닌 매출 분포 시각화)
        </p>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <ManagerColumn
          title="🤝 셀러 담당자"
          hint="셀러 발굴/관리 · 매출 + 활성 마켓 + 함께한 셀러 수"
          rows={SELLER_MGRS}
          accent="#2563eb"
          partnerLabel="셀러"
        />
        <ManagerColumn
          title="📦 상품 담당자"
          hint="상품 소싱/매칭 · 매출 + 활성 마켓 + 함께한 브랜드 수"
          rows={PRODUCT_MGRS}
          accent="#7c3aed"
          partnerLabel="브랜드"
        />
      </div>
    </div>
  );
}

// ─────────────── TOP 리스트 ───────────────
function RankList({ title, emoji, hint, rows }) {
  const total = rows.reduce((s, r) => s + r.sales, 0);
  return (
    <div style={card}>
      <SectionTitle emoji={emoji} title={title} hint={hint} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map((r, i) => {
          const share = (r.sales / total) * 100;
          const yoy = r.lastYear > 0 ? ((r.sales - r.lastYear) / r.lastYear) * 100 : null;
          const isNew = r.lastYear === 0;
          return (
            <div key={r.name} style={{
              display: 'grid', gridTemplateColumns: '24px 1fr 90px 80px 70px',
              gap: 12, alignItems: 'center', padding: '6px 4px',
              borderBottom: i < rows.length - 1 ? '1px solid #f3f4f6' : 'none',
            }}>
              <div style={{ color: '#9ca3af', fontSize: 12 }}>#{i + 1}</div>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{r.name}</div>
              <div style={{ position: 'relative', height: 8, background: '#f3f4f6', borderRadius: 4 }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: '100%',
                  width: `${(r.sales / rows[0].sales) * 100}%`,
                  background: i === 0 ? '#2563eb' : i < 3 ? '#3b82f6' : '#93c5fd',
                  borderRadius: 4,
                }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, textAlign: 'right' }}>{fmt(r.sales)}</div>
              <div style={{
                fontSize: 11, fontWeight: 700, textAlign: 'right',
                color: isNew ? '#3b82f6' : yoy >= 0 ? '#10b981' : '#ef4444',
              }}>
                {isNew ? '🆕 NEW' : (yoy >= 0 ? '▲' : '▼') + ' ' + Math.abs(yoy).toFixed(0) + '%'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────── 🤝 파트너셀러 배지 ───────────────
function PartnerBadge() {
  return (
    <span style={{
      fontSize: 10, padding: '2px 6px', borderRadius: 8,
      background: 'linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)',
      color: '#78350f', fontWeight: 700,
      border: '1px solid #f59e0b',
    }} title="와이어드 파트너 셀러 (노션 등록됨)">🤝 파트너</span>
  );
}

// ─────────────── 🤝 파트너 셀러 섹션 ───────────────
function PartnerSellersSection() {
  const partnerNames = Object.keys(PARTNER_SELLERS);

  // 마켓 데이터로부터 파트너별 누적 매출/주문 집계
  const stats = useMemo(() => {
    const map = new Map();
    for (const m of MARKETS) {
      if (!PARTNER_SELLERS[m.sellerName]) continue;
      const cur = map.get(m.sellerName) || {
        name: m.sellerName,
        sales: 0, orderCount: 0, marketCount: 0, csIssues: 0,
        managerName: m.managerName,
      };
      cur.sales += m.sales;
      cur.orderCount += m.orderCount;
      cur.csIssues += m.csIssues;
      cur.marketCount += 1;
      map.set(m.sellerName, cur);
    }
    // PARTNER_SELLERS 순서대로 정렬, 매출 큰 순
    const arr = partnerNames.map(name => map.get(name) || {
      name, sales: 0, orderCount: 0, marketCount: 0, csIssues: 0, managerName: MGR_OF_SELLER[name] || '-',
    });
    return arr.sort((a, b) => b.sales - a.sales);
  }, []);

  return (
    <div style={card}>
      <SectionTitle
        emoji="🤝"
        title="와이어드 파트너 셀러"
        hint="노션 '🎁 와이어드 파트너' 페이지에 등록된 6명 · 카드 클릭 → 해당 파트너 노션 페이지로 이동"
      />
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
      }}>
        {stats.map((p, i) => {
          const partner = PARTNER_SELLERS[p.name];
          const csRate = p.orderCount > 0 ? (p.csIssues / p.orderCount) * 100 : 0;
          const csColor = csRate < 3 ? '#10b981' : csRate < 7 ? '#f59e0b' : '#ef4444';
          return (
            <a
              key={p.name}
              href={partner.notionUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', textDecoration: 'none', color: 'inherit',
                padding: 14, background: i === 0 ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' : '#faf9f6',
                border: '1px solid ' + (i === 0 ? '#fcd34d' : '#e7e3da'),
                borderRadius: 10, transition: 'transform 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {i === 0 && <span style={{ fontSize: 14 }}>🥇</span>}
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#37352f' }}>{p.name}</span>
                </div>
                <span style={{ fontSize: 10, color: '#a47148', fontWeight: 600 }}>노션 ↗</span>
              </div>
              <div style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 10 }}>
                {partner.notionTitle}
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
                paddingTop: 10, borderTop: '1px solid #e7e3da', fontSize: 11,
              }}>
                <div>
                  <div style={{ color: '#6b6b6b' }}>💰 매출</div>
                  <div style={{ fontWeight: 700, color: '#37352f', fontSize: 13 }}>{fmt(p.sales)}</div>
                </div>
                <div>
                  <div style={{ color: '#6b6b6b' }}>🛒 마켓</div>
                  <div style={{ fontWeight: 700, color: '#37352f', fontSize: 13 }}>{p.marketCount}건</div>
                </div>
                <div>
                  <div style={{ color: '#6b6b6b' }}>📦 주문</div>
                  <div style={{ fontWeight: 600, color: '#37352f' }}>{p.orderCount.toLocaleString('ko-KR')}건</div>
                </div>
                <div>
                  <div style={{ color: '#6b6b6b' }}>🎧 CS율</div>
                  <div style={{ fontWeight: 700, color: csColor }}>{csRate.toFixed(1)}%</div>
                </div>
              </div>
              <div style={{
                marginTop: 10, paddingTop: 8, borderTop: '1px solid #e7e3da',
                fontSize: 11, color: '#6b6b6b',
              }}>
                담당 <strong style={{ color: '#37352f' }}>{p.managerName}</strong>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────── 노션 상세 드로어 (마켓 펼침 영역) ───────────────
function NotionDrawer({ m }) {
  // 노션 톤 (살짝 크림색 + 어두운 갈색 텍스트)
  const NotionBg = '#faf9f6';
  const NotionBorder = '#e7e3da';
  const NotionAccent = '#a47148';

  // 파트너셀러인지 확인 — 파트너면 실제 노션 페이지 URL 사용
  const partner = PARTNER_SELLERS[m.sellerName];
  const targetUrl = partner ? partner.notionUrl : m.notionPageUrl;
  const targetLabel = partner ? `${partner.notionTitle} 페이지` : '마켓 캘린더';

  return (
    <div style={{
      padding: 18,
      background: NotionBg,
      borderTop: `1px dashed ${NotionBorder}`,
    }}>
      {/* 노션 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${NotionBorder}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-flex', width: 26, height: 26, borderRadius: 6,
            background: '#fff', border: `1px solid ${NotionBorder}`,
            alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#37352f',
          }}>N</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#37352f', display: 'flex', alignItems: 'center', gap: 6 }}>
              📋 노션에서 가져온 마켓 기획 정보
              {partner && <PartnerBadge />}
            </div>
            <div style={{ fontSize: 11, color: '#6b6b6b' }}>
              {partner ? partner.notionTitle : m.notionTeam} · {targetLabel}
            </div>
          </div>
        </div>
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12, color: NotionAccent, fontWeight: 600,
            textDecoration: 'none', padding: '6px 12px',
            background: '#fff', border: `1px solid ${NotionBorder}`, borderRadius: 6,
          }}
        >{partner ? '파트너 워크스페이스 ↗' : '노션에서 전체 보기 ↗'}</a>
      </div>

      {/* 핵심 정보 그리드 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14,
      }}>
        <NotionFact label="🗓️ 진행 기간" value={`${m.startedAt} ~ ${m.endedAt}`} />
        <NotionFact label="📍 담당 팀" value={m.notionTeam} />
        <NotionFact label="🛍️ 판매 채널" value={m.channel} />
        <NotionFact
          label="📦 재고"
          value={`${m.stock.toLocaleString('ko-KR')}개`}
          tone={m.stock < 200 ? 'warn' : 'ok'}
        />
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14,
      }}>
        <NotionFact label="🔗 결제링크 오픈" value={m.paymentLinkOpenAt} />
        <NotionFact label="🔒 결제링크 마감" value={m.paymentLinkCloseAt} />
      </div>

      {/* 이벤트 */}
      <div style={{
        padding: 12, marginBottom: 14, background: '#fff',
        border: `1px solid ${NotionBorder}`, borderRadius: 8,
      }}>
        <div style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 6 }}>🎁 이벤트</div>
        <div style={{ fontSize: 13, color: '#37352f', fontWeight: 500 }}>
          {m.event ? m.event : <span style={{ color: '#9ca3af' }}>이벤트 없음</span>}
        </div>
      </div>

      {/* 콘텐츠 아이디어 */}
      <div style={{
        padding: 14, marginBottom: 14, background: '#fff',
        border: `1px solid ${NotionBorder}`, borderRadius: 8,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#37352f' }}>
            📸 마케팅 콘텐츠 아이디어
          </div>
          <span style={{ fontSize: 11, color: '#6b6b6b' }}>
            작성자: <strong style={{ color: '#37352f' }}>{m.marketingMgr}</strong>
          </span>
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#37352f', lineHeight: 1.8 }}>
          {m.contentIdeas.map((idea, idx) => (
            <li key={idx}>{idea}</li>
          ))}
        </ul>
      </div>

      {/* 이슈 배지 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {m.lowestPriceIssue && (
          <span style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 12, fontWeight: 600,
            background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5',
          }}>⚠️ 최저가 이슈</span>
        )}
        {!m.materialsDelivered && (
          <span style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 12, fontWeight: 600,
            background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d',
          }}>📂 자료 미전달</span>
        )}
        {m.materialsDelivered && !m.lowestPriceIssue && (
          <span style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 12, fontWeight: 600,
            background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7',
          }}>✅ 자료 전달 완료 · 가격 이슈 없음</span>
        )}
      </div>
    </div>
  );
}

function NotionFact({ label, value, tone }) {
  const toneColor = tone === 'warn' ? '#92400e' : tone === 'ok' ? '#065f46' : '#37352f';
  return (
    <div style={{
      padding: 10, background: '#fff',
      border: '1px solid #e7e3da', borderRadius: 8,
    }}>
      <div style={{ fontSize: 10, color: '#6b6b6b', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: toneColor }}>{value}</div>
    </div>
  );
}

// ─────────────── 마켓 현황 (탭 + 검색 + 정렬 + 페이징) ───────────────
function MarketsSection() {
  const [tab, setTab] = useState('all'); // 'all' | manager name
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('sales'); // 'sales' | 'orderCount'
  const [showCount, setShowCount] = useState(50);
  const [expandedId, setExpandedId] = useState(null); // 펼친 마켓 id

  const filtered = useMemo(() => {
    let arr = MARKETS;
    if (tab !== 'all') arr = arr.filter(m => m.managerName === tab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(m =>
        (m.sellerName || '').toLowerCase().includes(q) ||
        (m.brandName || '').toLowerCase().includes(q)
      );
    }
    return [...arr].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
  }, [tab, search, sortBy]);

  const visible = filtered.slice(0, showCount);
  const hasMore = filtered.length > showCount;

  // 탭 변경/검색 변경 시 페이징 초기화
  function switchTab(t) { setTab(t); setShowCount(50); }
  function onSearchChange(v) { setSearch(v); setShowCount(50); }

  return (
    <div style={card}>
      <SectionTitle emoji="🛒" title="이번달 마켓 현황" hint="셀러 담당자별 탭 · 검색 · 정렬 · 50개씩 페이징 · 행 클릭 → 노션 기획 정보 펼침" />

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        <TabBtn active={tab === 'all'} onClick={() => switchTab('all')}>
          전체 ({MARKETS.length})
        </TabBtn>
        {MANAGER_LIST.map(m => {
          const c = MARKETS.filter(x => x.managerName === m).length;
          return (
            <TabBtn key={m} active={tab === m} onClick={() => switchTab(m)}>
              {m} ({c})
            </TabBtn>
          );
        })}
      </div>

      {/* 검색 + 정렬 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔎 셀러명 / 브랜드명 검색"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          style={{
            padding: '8px 12px', fontSize: 13, flex: 1, minWidth: 220,
            border: '1px solid #d1d5db', borderRadius: 6,
          }}
        />
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>정렬:</span>
          <SortBtn active={sortBy === 'sales'} onClick={() => setSortBy('sales')}>매출 ↓</SortBtn>
          <SortBtn active={sortBy === 'orderCount'} onClick={() => setSortBy('orderCount')}>주문건수 ↓</SortBtn>
          <SortBtn active={sortBy === 'estimatedSales'} onClick={() => setSortBy('estimatedSales')}>예상매출 ↓</SortBtn>
          <SortBtn active={sortBy === 'achievementRate'} onClick={() => setSortBy('achievementRate')}>달성률 ↓</SortBtn>
          <SortBtn active={sortBy === 'csRate'} onClick={() => setSortBy('csRate')}>CS율 ↓</SortBtn>
        </div>
      </div>

      {/* 결과 정보 */}
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
        총 <strong style={{ color: '#374151' }}>{filtered.length}개</strong> 중 <strong style={{ color: '#374151' }}>{visible.length}개</strong> 표시
        {tab !== 'all' && <> · 담당자 <strong style={{ color: '#2563eb' }}>{tab}</strong></>}
        {search && <> · 검색 "<strong>{search}</strong>"</>}
      </div>

      {/* 안내 */}
      <div style={{
        padding: '8px 12px', marginBottom: 8, background: '#fffbeb',
        border: '1px solid #fde68a', borderRadius: 6,
        fontSize: 12, color: '#78350f',
      }}>
        💡 마켓 행을 클릭하면 <strong>노션에서 가져온 컨텐츠 기획·이벤트·재고 정보</strong>가 펼쳐져요
      </div>

      {/* 테이블 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ ...th2, width: 28 }}></th>
              <th style={{ ...th2, width: 40 }}>#</th>
              <th style={{ ...th2, textAlign: 'left' }}>셀러</th>
              <th style={{ ...th2, textAlign: 'left' }}>브랜드</th>
              <th style={{ ...th2, textAlign: 'left' }}>담당자</th>
              <th style={{ ...th2 }}>상태</th>
              <th style={{ ...th2, textAlign: 'right' }}>매출</th>
              <th style={{ ...th2, textAlign: 'right' }}>주문건수</th>
              <th style={{ ...th2, textAlign: 'right' }} title="반품 + 취소 건수 / 주문건수">CS율</th>
              <th style={{ ...th2, textAlign: 'right' }}>예상매출</th>
              <th style={{ ...th2, textAlign: 'right' }}>달성률</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((m, i) => {
              const stColor = { ENDED: '#6b7280', ACTIVE: '#10b981', READY: '#3b82f6', CANCELED: '#ef4444' }[m.status] || '#6b7280';
              const stLabel = { ENDED: '종료', ACTIVE: '진행중', READY: '예정', CANCELED: '취소' }[m.status] || m.status;
              const achColor = m.achievementRate == null ? '#9ca3af' : m.achievementRate >= 100 ? '#10b981' : m.achievementRate >= 80 ? '#f59e0b' : '#ef4444';
              // CS율: 낮을수록 좋음
              const csColor = m.csRate < 3 ? '#10b981' : m.csRate < 7 ? '#f59e0b' : '#ef4444';
              const isOpen = expandedId === m.id;
              return (
                <Fragment key={m.id}>
                  <tr
                    onClick={() => setExpandedId(isOpen ? null : m.id)}
                    style={{
                      cursor: 'pointer',
                      background: isOpen ? '#eff6ff' : 'transparent',
                    }}
                  >
                    <td style={{ ...td2, color: '#9ca3af', textAlign: 'center' }}>{isOpen ? '▲' : '▶'}</td>
                    <td style={{ ...td2, color: '#9ca3af' }}>{i + 1}</td>
                    <td style={{ ...td2, fontWeight: 500 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {m.sellerName}
                        {PARTNER_SELLERS[m.sellerName] && <PartnerBadge />}
                      </span>
                    </td>
                    <td style={td2}>{m.brandName}</td>
                    <td style={td2}>{m.managerName}</td>
                    <td style={{ ...td2 }}><span style={{ color: stColor, fontWeight: 600, fontSize: 11 }}>{stLabel}</span></td>
                    <td style={{ ...td2, textAlign: 'right', fontWeight: 600 }}>{fmt(m.sales)}</td>
                    <td style={{ ...td2, textAlign: 'right' }}>{m.orderCount.toLocaleString('ko-KR')}건</td>
                    <td style={{ ...td2, textAlign: 'right' }} title={`반품 ${m.returnCount}건 + 취소 ${m.cancelCount}건`}>
                      <span style={{ color: csColor, fontWeight: 600 }}>{m.csRate.toFixed(1)}%</span>
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>{m.csIssues}건</div>
                    </td>
                    <td style={{ ...td2, textAlign: 'right', color: '#6b7280' }}>{fmt(m.estimatedSales)}</td>
                    <td style={{ ...td2, textAlign: 'right', color: achColor, fontWeight: 600 }}>{m.achievementRate?.toFixed(0)}%</td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={11} style={{ padding: 0, background: '#faf9f6', borderBottom: '1px solid #e5e7eb' }}>
                        <NotionDrawer m={m} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {visible.length === 0 && (
        <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
          조건에 맞는 마켓 없음
        </div>
      )}

      {/* 더보기 */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={() => setShowCount(c => c + 50)}
            style={{
              padding: '10px 28px', fontSize: 13, fontWeight: 600,
              background: '#fff', color: '#2563eb',
              border: '1px solid #2563eb', borderRadius: 8, cursor: 'pointer',
            }}
          >
            ▼ 50개 더보기 (남은 {filtered.length - showCount}개)
          </button>
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 14px', fontSize: 13, fontWeight: active ? 700 : 500,
      background: active ? '#2563eb' : '#fff',
      color: active ? '#fff' : '#374151',
      border: '1px solid ' + (active ? '#2563eb' : '#d1d5db'),
      borderRadius: 8, cursor: 'pointer',
    }}>{children}</button>
  );
}

function SortBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 10px', fontSize: 12, fontWeight: active ? 700 : 500,
      background: active ? '#2563eb' : '#fff',
      color: active ? '#fff' : '#374151',
      border: '1px solid ' + (active ? '#2563eb' : '#d1d5db'),
      borderRadius: 5, cursor: 'pointer',
    }}>{children}</button>
  );
}

const th2 = { padding: '10px 8px', borderBottom: '2px solid #e5e7eb', textAlign: 'right', fontSize: 11, color: '#6b7280', fontWeight: 500 };
const td2 = { padding: '8px', borderBottom: '1px solid #f3f4f6', fontSize: 12 };

// ─────────────── 브랜드별 현황 (그룹 + 펼침 + HOT 배지) ───────────────
function BrandsSection() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('sales'); // 'sales' | 'orderCount' | 'marketCount'
  const [expanded, setExpanded] = useState(null); // brand name

  // 브랜드별 집계
  const aggregated = useMemo(() => {
    const map = new Map();
    for (const m of MARKETS) {
      const key = m.brandName;
      if (!key) continue;
      const info = BRAND_INFO[key] || {};
      const cur = map.get(key) || {
        name: key,
        manager: info.manager || '',
        vendorType: info.vendorType || '',
        sales: 0,
        orderCount: 0,
        marketCount: 0,
        estimatedSales: 0,
        csIssues: 0,
        markets: [],
        sellers: new Set(),
      };
      cur.sales += m.sales;
      cur.orderCount += m.orderCount;
      cur.estimatedSales += m.estimatedSales;
      cur.csIssues += m.csIssues;
      cur.marketCount += 1;
      cur.markets.push(m);
      cur.sellers.add(m.sellerName);
      map.set(key, cur);
    }
    return [...map.values()].map(x => ({
      ...x,
      sellers: [...x.sellers],
      achievementRate: x.estimatedSales > 0 ? (x.sales / x.estimatedSales) * 100 : 0,
      csRate: x.orderCount > 0 ? (x.csIssues / x.orderCount) * 100 : 0,
    }));
  }, []);

  // HOT 임계: 총 주문건수 상위 25%
  const hotThreshold = useMemo(() => {
    const sorted = [...aggregated].map(b => b.orderCount).sort((a, b) => b - a);
    const cutoff = Math.max(1, Math.floor(sorted.length * 0.25));
    return sorted[cutoff - 1] || 0;
  }, [aggregated]);

  const filtered = useMemo(() => {
    let arr = aggregated;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(b =>
        b.name.toLowerCase().includes(q) ||
        (b.manager || '').toLowerCase().includes(q)
      );
    }
    return [...arr].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
  }, [aggregated, search, sortBy]);

  return (
    <div style={card}>
      <SectionTitle
        emoji="🏷️"
        title="브랜드별 현황"
        hint="브랜드 클릭 → 마켓 리스트 펼침 · 🔥 HOT = 주문건수 상위 25%"
      />

      {/* 검색 + 정렬 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔎 브랜드명 / 담당자 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '8px 12px', fontSize: 13, flex: 1, minWidth: 220,
            border: '1px solid #d1d5db', borderRadius: 6,
          }}
        />
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>정렬:</span>
          <SortBtn active={sortBy === 'sales'} onClick={() => setSortBy('sales')}>매출 ↓</SortBtn>
          <SortBtn active={sortBy === 'orderCount'} onClick={() => setSortBy('orderCount')}>주문건수 ↓</SortBtn>
          <SortBtn active={sortBy === 'marketCount'} onClick={() => setSortBy('marketCount')}>공구건수 ↓</SortBtn>
          <SortBtn active={sortBy === 'estimatedSales'} onClick={() => setSortBy('estimatedSales')}>예상매출 ↓</SortBtn>
          <SortBtn active={sortBy === 'achievementRate'} onClick={() => setSortBy('achievementRate')}>달성률 ↓</SortBtn>
          <SortBtn active={sortBy === 'csRate'} onClick={() => setSortBy('csRate')}>CS율 ↓</SortBtn>
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
        총 <strong style={{ color: '#374151' }}>{filtered.length}개 브랜드</strong>
        {search && <> · 검색 "<strong>{search}</strong>"</>}
      </div>

      {/* 브랜드 헤더 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '34px minmax(130px,1.2fr) 60px 70px 90px 75px 60px 90px 60px 60px 28px',
        gap: 8, padding: '8px 12px',
        background: '#f9fafb', borderRadius: 6,
        fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 6,
      }}>
        <div>#</div>
        <div>브랜드 / 셀러수</div>
        <div style={{ textAlign: 'center' }}>거래형태</div>
        <div>담당자</div>
        <div style={{ textAlign: 'right' }}>매출</div>
        <div style={{ textAlign: 'right' }}>주문건수</div>
        <div style={{ textAlign: 'right' }}>공구건수</div>
        <div style={{ textAlign: 'right' }}>예상매출</div>
        <div style={{ textAlign: 'right' }}>달성률</div>
        <div style={{ textAlign: 'right' }} title="반품+취소 / 주문">CS율</div>
        <div></div>
      </div>

      {/* 브랜드 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.map((b, i) => {
          const isHot = b.orderCount >= hotThreshold;
          const isOpen = expanded === b.name;
          const isVendor = b.vendorType === '밴더사';
          return (
            <div key={b.name} style={{
              border: '1px solid ' + (isOpen ? '#2563eb' : '#e5e7eb'),
              borderRadius: 8, overflow: 'hidden',
              transition: 'all 0.15s',
            }}>
              {/* 브랜드 행 */}
              <div
                onClick={() => setExpanded(isOpen ? null : b.name)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '34px minmax(130px,1.2fr) 60px 70px 90px 75px 60px 90px 60px 60px 28px',
                  gap: 8, padding: '12px 12px', cursor: 'pointer',
                  background: isOpen ? '#eff6ff' : '#fff',
                  alignItems: 'center', fontSize: 13,
                }}
              >
                <div style={{ color: '#9ca3af' }}>#{i + 1}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600 }}>{b.name}</span>
                  {isHot && (
                    <span style={{
                      fontSize: 10, padding: '2px 7px', borderRadius: 10,
                      background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                      color: '#fff', fontWeight: 700,
                    }}>🔥 HOT</span>
                  )}
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>({b.sellers.length})</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 10, fontWeight: 600,
                    background: isVendor ? '#fef3c7' : '#dbeafe',
                    color: isVendor ? '#92400e' : '#1e40af',
                    border: '1px solid ' + (isVendor ? '#fcd34d' : '#93c5fd'),
                  }}>{b.vendorType}</span>
                </div>
                <div style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{b.manager || '-'}</div>
                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 12 }}>{fmt(b.sales)}</div>
                <div style={{ textAlign: 'right', fontSize: 12 }}>{b.orderCount.toLocaleString('ko-KR')}건</div>
                <div style={{ textAlign: 'right', color: '#6b7280', fontSize: 12 }}>{b.marketCount}개</div>
                <div style={{ textAlign: 'right', color: '#6b7280', fontSize: 12 }}>{fmt(b.estimatedSales)}</div>
                <div style={{
                  textAlign: 'right', fontWeight: 600, fontSize: 12,
                  color: b.achievementRate >= 100 ? '#10b981' : b.achievementRate >= 80 ? '#f59e0b' : '#ef4444',
                }}>{b.achievementRate.toFixed(0)}%</div>
                <div style={{
                  textAlign: 'right', fontSize: 12, fontWeight: 600,
                  color: b.csRate < 3 ? '#10b981' : b.csRate < 7 ? '#f59e0b' : '#ef4444',
                }} title={`CS이슈 ${b.csIssues}건`}>{b.csRate.toFixed(1)}%</div>
                <div style={{ textAlign: 'right', color: '#9ca3af' }}>{isOpen ? '▲' : '▼'}</div>
              </div>

              {/* 펼쳐진 마켓 리스트 */}
              {isOpen && (
                <div style={{ padding: 12, background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                    <strong>{b.name}</strong>의 마켓 {b.markets.length}개
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, background: '#fff', borderRadius: 6, overflow: 'hidden' }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6' }}>
                        <th style={th3}>셀러</th>
                        <th style={th3}>담당자</th>
                        <th style={{ ...th3, textAlign: 'center' }}>상태</th>
                        <th style={{ ...th3, textAlign: 'right' }}>매출</th>
                        <th style={{ ...th3, textAlign: 'right' }}>주문건수</th>
                        <th style={{ ...th3, textAlign: 'right' }}>달성률</th>
                      </tr>
                    </thead>
                    <tbody>
                      {b.markets
                        .sort((a, c) => c.sales - a.sales)
                        .map(m => {
                          const stColor = { ENDED: '#6b7280', ACTIVE: '#10b981', READY: '#3b82f6' }[m.status] || '#6b7280';
                          const stLabel = { ENDED: '종료', ACTIVE: '진행중', READY: '예정' }[m.status] || m.status;
                          const achColor = m.achievementRate >= 100 ? '#10b981' : m.achievementRate >= 80 ? '#f59e0b' : '#ef4444';
                          return (
                            <tr key={m.id}>
                              <td style={td3}>{m.sellerName}</td>
                              <td style={td3}>{m.managerName}</td>
                              <td style={{ ...td3, textAlign: 'center' }}>
                                <span style={{ color: stColor, fontWeight: 600 }}>{stLabel}</span>
                              </td>
                              <td style={{ ...td3, textAlign: 'right', fontWeight: 600 }}>{fmt(m.sales)}</td>
                              <td style={{ ...td3, textAlign: 'right' }}>{m.orderCount.toLocaleString('ko-KR')}건</td>
                              <td style={{ ...td3, textAlign: 'right', color: achColor, fontWeight: 600 }}>{m.achievementRate?.toFixed(0)}%</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const th3 = { padding: '8px 10px', fontSize: 11, color: '#6b7280', fontWeight: 500, textAlign: 'left', borderBottom: '1px solid #e5e7eb' };
const td3 = { padding: '8px 10px', fontSize: 12, borderBottom: '1px solid #f3f4f6' };

// ─────────────── 팀 합작 대시보드 ───────────────

const ROLE_TABS = [
  { key: 'seller', label: '🤝 셀러', accent: '#2563eb', mgrField: 'sellerMgr', kpiLabel: '매출', desc: '셀러 발굴/관리' },
  { key: 'brand', label: '🏷️ 브랜드', accent: '#7c3aed', mgrField: 'brandMgr', kpiLabel: '매출', desc: '브랜드 소싱/매칭' },
  { key: 'marketing', label: '📣 마케팅', accent: '#f59e0b', mgrField: 'marketingMgr', kpiLabel: '노출수 / 클릭률', desc: '콘텐츠 기획/방향성' },
  { key: 'cs', label: '🎧 CS', accent: '#10b981', mgrField: 'csMgr', kpiLabel: 'CS율 (낮을수록 ✅)', desc: '고객 응대/만족도' },
  { key: 'logistics', label: '📦 물류', accent: '#0891b2', mgrField: 'logisticsMgr', kpiLabel: '배송완료율 / 평균 배송일', desc: '배송/재고/입출고' },
];

function TeamDashboard() {
  const [roleKey, setRoleKey] = useState('seller');
  const role = ROLE_TABS.find(r => r.key === roleKey);

  // 역할별 집계
  const agg = useMemo(() => {
    const map = new Map();
    for (const m of MARKETS) {
      const mgr = m[role.mgrField];
      if (!mgr) continue;
      const cur = map.get(mgr) || {
        name: mgr,
        marketCount: 0,
        sales: 0,
        orderCount: 0,
        csIssues: 0,
        exposureSum: 0, exposureN: 0,
        clickRateSum: 0, clickRateN: 0,
        deliveryRateSum: 0, deliveryRateN: 0,
        avgDeliveryDaysSum: 0, avgDeliveryDaysN: 0,
      };
      cur.marketCount += 1;
      cur.sales += m.sales;
      cur.orderCount += m.orderCount;
      cur.csIssues += m.csIssues;
      if (m.exposure != null) { cur.exposureSum += m.exposure; cur.exposureN++; }
      if (m.clickRate != null) { cur.clickRateSum += m.clickRate; cur.clickRateN++; }
      if (m.deliveryRate != null) { cur.deliveryRateSum += m.deliveryRate; cur.deliveryRateN++; }
      if (m.avgDeliveryDays != null) { cur.avgDeliveryDaysSum += m.avgDeliveryDays; cur.avgDeliveryDaysN++; }
      map.set(mgr, cur);
    }
    return [...map.values()].map(x => ({
      ...x,
      csRate: x.orderCount > 0 ? (x.csIssues / x.orderCount) * 100 : 0,
      exposureAvg: x.exposureN > 0 ? x.exposureSum / x.exposureN : 0,
      clickRateAvg: x.clickRateN > 0 ? x.clickRateSum / x.clickRateN : 0,
      deliveryRateAvg: x.deliveryRateN > 0 ? x.deliveryRateSum / x.deliveryRateN : 0,
      avgDeliveryDaysAvg: x.avgDeliveryDaysN > 0 ? x.avgDeliveryDaysSum / x.avgDeliveryDaysN : 0,
    }));
  }, [roleKey]);

  // 역할별 정렬 키
  const sortKey = ({
    seller: 'sales', brand: 'sales',
    marketing: 'exposureAvg',
    cs: 'csRate', // CS는 낮을수록 좋음 (ascending)
    logistics: 'deliveryRateAvg',
  })[roleKey];
  const csAsc = roleKey === 'cs'; // CS만 오름차순
  const sorted = [...agg].sort((a, b) => csAsc ? (a[sortKey] - b[sortKey]) : (b[sortKey] - a[sortKey]));

  return (
    <div style={card}>
      <SectionTitle
        emoji="👥"
        title="팀 합작 대시보드"
        hint="각 마켓은 5팀의 합작 · 역할별로 자기 KPI 기준 정렬"
      />

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {ROLE_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setRoleKey(t.key)}
            style={{
              padding: '10px 16px', fontSize: 13, fontWeight: roleKey === t.key ? 700 : 500,
              background: roleKey === t.key ? t.accent : '#fff',
              color: roleKey === t.key ? '#fff' : '#374151',
              border: '1px solid ' + (roleKey === t.key ? t.accent : '#d1d5db'),
              borderRadius: 8, cursor: 'pointer',
            }}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
        <strong style={{ color: '#374151' }}>{role.desc}</strong> · 주요 지표: <strong>{role.kpiLabel}</strong>
      </div>

      {/* 담당자별 KPI 카드 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((p, i) => {
          const isTop = i === 0;
          return (
            <div key={p.name} style={{
              padding: 14,
              background: isTop ? `${role.accent}10` : '#f9fafb',
              border: '1px solid ' + (isTop ? role.accent : '#e5e7eb'),
              borderRadius: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isTop && <span style={{ fontSize: 14 }}>🥇</span>}
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>마켓 {p.marketCount}건</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#374151', flexWrap: 'wrap' }}>
                {roleKey === 'seller' || roleKey === 'brand' ? (
                  <>
                    <div>💰 매출 <strong style={{ color: role.accent }}>{fmt(p.sales)}</strong></div>
                    <div>📦 주문 {p.orderCount.toLocaleString('ko-KR')}건</div>
                  </>
                ) : roleKey === 'marketing' ? (
                  <>
                    <div>👁️ 평균 노출 <strong style={{ color: role.accent }}>{Math.round(p.exposureAvg).toLocaleString('ko-KR')}회</strong></div>
                    <div>🖱️ 평균 CTR <strong>{p.clickRateAvg.toFixed(2)}%</strong></div>
                    <div>📦 주문 {p.orderCount.toLocaleString('ko-KR')}건</div>
                  </>
                ) : roleKey === 'cs' ? (
                  <>
                    <div>🎧 CS율 <strong style={{ color: p.csRate < 3 ? '#10b981' : p.csRate < 7 ? '#f59e0b' : '#ef4444' }}>{p.csRate.toFixed(2)}%</strong></div>
                    <div>💢 이슈 {p.csIssues}건 / 주문 {p.orderCount.toLocaleString('ko-KR')}</div>
                  </>
                ) : (
                  <>
                    <div>📦 배송완료율 <strong style={{ color: p.deliveryRateAvg >= 95 ? '#10b981' : p.deliveryRateAvg >= 90 ? '#f59e0b' : '#ef4444' }}>{p.deliveryRateAvg.toFixed(1)}%</strong></div>
                    <div>⏱️ 평균 배송 <strong>{p.avgDeliveryDaysAvg.toFixed(1)}일</strong></div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────── 베스트 팀워크 ───────────────
function BestTeamwork() {
  // 매출 큰 + CS율 낮은 + 배송 좋은 마켓 = 종합 점수
  const scored = MARKETS
    .filter(m => m.status === 'ENDED' && m.deliveryRate != null) // 종료된 마켓만
    .map(m => {
      const salesScore = m.sales / 250 * 50; // 0~50
      const csScore = Math.max(0, 30 - m.csRate * 4); // CS 낮을수록 30점 만점
      const deliveryScore = ((m.deliveryRate - 80) / 20) * 20; // 80~100% → 0~20점
      return { ...m, _score: salesScore + csScore + deliveryScore };
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, 3);

  return (
    <div style={card}>
      <SectionTitle
        emoji="🏆"
        title="이번달 베스트 팀워크 TOP 3"
        hint="매출 + CS율 + 배송완료율 종합 점수 — 5팀 모두 잘한 마켓"
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {scored.map((m, i) => {
          const medals = ['🥇', '🥈', '🥉'];
          return (
            <div key={m.id} style={{
              padding: 16,
              background: i === 0
                ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                : '#f9fafb',
              border: '1px solid ' + (i === 0 ? '#fcd34d' : '#e5e7eb'),
              borderRadius: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>{medals[i]}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{m.brandName} × {m.sellerName}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{m.startedAt} ~ {m.endedAt}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <div>💰 매출 <strong>{fmt(m.sales)}</strong></div>
                <div>🎧 CS율 <strong style={{ color: '#10b981' }}>{m.csRate.toFixed(1)}%</strong></div>
                <div>📦 배송완료 <strong style={{ color: '#10b981' }}>{m.deliveryRate.toFixed(0)}%</strong></div>
                <div>⏱️ 평균 {m.avgDeliveryDays.toFixed(1)}일</div>
              </div>

              <div style={{ fontSize: 12, color: '#374151', borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
                👏 함께 만든 팀:
                <span style={{ marginLeft: 8 }}>
                  <Chip text={`🤝 ${m.sellerMgr}`} />
                  <Chip text={`🏷️ ${m.brandMgr}`} />
                  <Chip text={`📣 ${m.marketingMgr}`} />
                  <Chip text={`🎧 ${m.csMgr}`} />
                  <Chip text={`📦 ${m.logisticsMgr}`} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Chip({ text }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, padding: '3px 8px',
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
      marginRight: 4, marginBottom: 4, fontWeight: 500,
    }}>{text}</span>
  );
}

// ─────────────── 메인 ───────────────
export default function Preview() {
  return (
    <main style={{ padding: 24, maxWidth: 1280, margin: '0 auto', background: '#f9fafb', minHeight: '100vh' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>🎨 새 디자인 초안 v4 — 파트너셀러 + 노션 연동 (가상 데이터)</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
          ✨ NEW: 🤝 파트너 셀러 6명 카드 (노션 워크스페이스 바로가기) + 마켓 행 클릭으로 노션 기획 정보 펼침
        </p>
        <Link href="/query" style={{ fontSize: 13, color: '#2563eb', marginTop: 8, display: 'inline-block' }}>← 현재 페이지로</Link>
      </header>

      <div style={{ marginBottom: 24 }}>
        <TrendChart />
      </div>

      {/* 팀 합작 대시보드 */}
      <div style={{ marginBottom: 16 }}>
        <TeamDashboard />
      </div>
      <div style={{ marginBottom: 24 }}>
        <BestTeamwork />
      </div>

      {/* 파트너 셀러 */}
      <div style={{ marginBottom: 24 }}>
        <PartnerSellersSection />
      </div>

      {/* 마켓 현황 */}
      <div style={{ marginBottom: 24 }}>
        <MarketsSection />
      </div>

      {/* 브랜드별 현황 */}
      <div style={{ marginBottom: 24 }}>
        <BrandsSection />
      </div>

      {/* 채팅 위젯 (플로팅) */}
      <ChatWidget />

      <div style={{
        padding: 16, background: '#eff6ff', border: '1px solid #bfdbfe',
        borderRadius: 12, fontSize: 14, lineHeight: 1.6,
      }}>
        💡 <strong>이번 시안에서 새로 추가된 부분 (노션 연동 + 파트너셀러):</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
          <li>🤝 <strong>파트너 셀러 카드 (6명)</strong> — 선선부부하우스 · 김영은 · 달빛언니 · 오인스 · 모노마켓 · 풀킴</li>
          <li>카드 클릭 시 해당 파트너의 노션 워크스페이스로 바로 이동 (URL 매핑 완료)</li>
          <li>마켓 표에서 파트너 셀러 옆에 <strong>🤝 파트너</strong> 배지 표시</li>
          <li>마켓 행 클릭 → 펼침 영역에서 파트너인 경우 "<strong>파트너 워크스페이스 ↗</strong>" 버튼 노출 (일반 마켓이면 "마켓 캘린더"로)</li>
          <li>대랑맘은 mock 데이터에서 제외 (노션 아카이브 처리됨)</li>
          <li>아직 mock 데이터 기반이라 매출/CS 수치는 가상. 실제 와이어드민 API와 연결하면 실시간 데이터로 채워져요</li>
        </ul>
      </div>
    </main>
  );
}

const card = {
  padding: 20, background: '#fff',
  border: '1px solid #e5e7eb', borderRadius: 14,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};
