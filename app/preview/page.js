'use client';
import Link from 'next/link';
import { useState, useEffect, useMemo, Fragment } from 'react';
import { useSession, signIn } from 'next-auth/react';
import ChatWidget from '../chat-widget';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts';

// ─────────────── 상수 ───────────────
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const YEAR_TARGET = 20000;       // 백만원 (200억)
const QUARTER_TARGET = 5000;     // 백만원 (50억)
const MONTH_TARGET_AVG = YEAR_TARGET / 12; // 약 1,667백만원

// 🤝 파트너 셀러 (노션 "🎁 와이어드 파트너" 페이지 기준)
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

// ─── TeamDashboard용 mock 데이터 (보존, 현재 화면에서는 사용 안 함) ───
// 추후 마케팅/CS/물류 담당자 데이터가 API로 들어오면 다시 활성화
const MOCK_TEAM_KEEP = {
  MARKETING_MGRS: ['이지은', '김민지', '오세영', '한지원'],
  CS_MGRS: ['박지원', '김선영', '최유진'],
  LOGISTICS_MGRS: ['최성훈', '이대성', '정민우'],
  ROLE_TABS: [
    { key: 'seller', label: '🤝 셀러', accent: '#2563eb' },
    { key: 'brand', label: '🏷️ 브랜드', accent: '#7c3aed' },
    { key: 'marketing', label: '📣 마케팅', accent: '#f59e0b' },
    { key: 'cs', label: '🎧 CS', accent: '#10b981' },
    { key: 'logistics', label: '📦 물류', accent: '#0891b2' },
  ],
};

// ─── 노션 콘텐츠 mock (Notion 드로어용, 실제 노션 연동 전까지 사용) ───
const CONTENT_IDEAS_POOL = [
  '엄마들의 후기 인터뷰 릴스', '신상품 언박싱 콘텐츠', '특가 카운트다운 스토리',
  '제품 디테일 클로즈업', '실사용 BGM 영상', '비교 콘텐츠 (vs 경쟁사)',
  '오픈 직전 티저', '리뷰어 협업 영상', '셀러 인사이트 카드뉴스',
  '리뷰 모아보기', '실시간 후기 모음', '브랜드 스토리',
];
const EVENTS_POOL = [
  '1+1 사은품 증정', '선착순 100명 추가 할인', '결제링크 오픈 24시간 한정',
  '인스타 팔로워 추가 5%', '리뷰 작성 시 적립금', '동시 구매 시 배송비 무료',
  '재구매 고객 추가 혜택', null,
];

// 마켓 ID로부터 결정적(deterministic) Notion mock 생성
function getNotionMock(marketId) {
  const seed = Math.abs(marketId || 0);
  const ideaCount = 3 + (seed % 3);
  const startIdx = (seed * 5) % CONTENT_IDEAS_POOL.length;
  const ideas = [];
  for (let k = 0; k < ideaCount; k++) {
    ideas.push(CONTENT_IDEAS_POOL[(startIdx + k) % CONTENT_IDEAS_POOL.length]);
  }
  return {
    event: EVENTS_POOL[seed % EVENTS_POOL.length],
    stock: 100 + (seed % 900),
    contentIdeas: ideas,
    notionPageUrl: `https://www.notion.so/wiredcompany/market-${seed}`,
    marketingMgr: MOCK_TEAM_KEEP.MARKETING_MGRS[seed % MOCK_TEAM_KEEP.MARKETING_MGRS.length],
    lowestPriceIssue: (seed % 13 === 0),
    materialsDelivered: (seed % 7 !== 0),
  };
}

// ─────────────── 유틸 ───────────────
function fmt(v) { return (v ?? 0).toLocaleString('ko-KR') + '백만원'; }
function pct(v) {
  if (v == null) return '-';
  const sign = v > 0 ? '+' : '';
  return sign + v.toFixed(1) + '%';
}

// ─────────────── 카드들 ───────────────
function TargetCard({ title, target, current, period, dateProgress }) {
  const ach = target > 0 ? (current / target) * 100 : 0;
  const remaining = target - current;
  const gap = ach - dateProgress;
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

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, opacity: 0.85, marginBottom: 2 }}>
          <span>💰 매출 달성률</span>
          <span style={{ fontWeight: 700 }}>{ach.toFixed(1)}%</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(ach, 100)}%`, height: '100%', background: '#fff', borderRadius: 4 }} />
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, opacity: 0.85, marginBottom: 2 }}>
          <span>📅 날짜 진행률</span>
          <span style={{ fontWeight: 700 }}>{dateProgress.toFixed(1)}%</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.18)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(dateProgress, 100)}%`, height: '100%', background: 'rgba(255,255,255,0.6)', borderRadius: 4 }} />
        </div>
      </div>

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

// ─────────────── 트렌드 차트 (실데이터) ───────────────
function TrendChart({ trend, monthTargetAvg, yearTarget, quarterTarget, ytdSales, qtdSales, yearProgress, quarterProgress }) {
  // YTD 비교용 — trend에서 동월까지 합계 (2024/2025/2026)
  const monthIdx = trend.findIndex(r => r['2026'] != null);
  const lastWithData = (() => {
    let last = -1;
    trend.forEach((r, i) => { if (r['2026'] != null) last = i; });
    return last;
  })();
  const upTo = lastWithData >= 0 ? lastWithData + 1 : 0;
  const ytd2025 = trend.slice(0, upTo).reduce((s, r) => s + (r['2025'] || 0), 0);
  const ytd2024 = trend.slice(0, upTo).reduce((s, r) => s + (r['2024'] || 0), 0);

  return (
    <div style={card}>
      <SectionTitle
        emoji="📈"
        title="3년 월별 매출 추이"
        hint="2024 회색 / 2025 노랑 / 2026 파랑 · 가로 점선 = 월 평균 목표 · 데이터는 사업개발 시트에서 자동 동기화"
      />
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 16 }}>
        <div style={{ height: 380 }}>
          <ResponsiveContainer>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={11} tickFormatter={v => (v / 1000).toFixed(1) + 'B'} />
              <Tooltip formatter={v => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine
                y={monthTargetAvg}
                stroke="#ef4444"
                strokeDasharray="6 3"
                label={{ value: `월 평균 목표 ${monthTargetAvg.toFixed(0)}백만원`, fill: '#ef4444', fontSize: 11, position: 'insideTopRight' }}
              />
              <Line type="monotone" dataKey="2024" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="2025" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="2026" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <TargetCard
            title="🎯 연간 목표"
            target={yearTarget}
            current={ytdSales}
            period="YTD"
            dateProgress={yearProgress}
          />
          <TargetCard
            title="🎯 분기 목표"
            target={quarterTarget}
            current={qtdSales}
            period="QTD"
            dateProgress={quarterProgress}
          />
          {ytd2025 > 0 && <CompareCard label="vs 2025 동기간" current={ytdSales} base={ytd2025} />}
          {ytd2024 > 0 && <CompareCard label="vs 2024 동기간" current={ytdSales} base={ytd2024} />}
        </div>
      </div>
    </div>
  );
}

// ─────────────── 🤝 파트너 셀러 섹션 (실데이터) ───────────────
function PartnerSellersSection({ partnerStats }) {
  // 누적매출 큰 순으로 정렬
  const sorted = [...partnerStats].sort((a, b) => b.ytdSales - a.ytdSales);

  return (
    <div style={card}>
      <SectionTitle
        emoji="🤝"
        title="와이어드 파트너 셀러"
        hint="2026년 누적매출 + 월별(저번달/이번달/다음달) 매출·마켓 건수 · 카드 클릭 → 해당 파트너 노션 페이지"
      />
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14,
      }}>
        {sorted.map((p, i) => {
          const partner = PARTNER_SELLERS[p.name];
          if (!partner) return null;
          const isTop = i === 0;

          const monthDelta = p.lastMonth.sales > 0
            ? ((p.thisMonth.sales - p.lastMonth.sales) / p.lastMonth.sales) * 100 : 0;

          return (
            <a
              key={p.name}
              href={partner.notionUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', textDecoration: 'none', color: 'inherit',
                padding: 16,
                background: isTop ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' : '#faf9f6',
                border: '1px solid ' + (isTop ? '#fcd34d' : '#e7e3da'),
                borderRadius: 12, transition: 'transform 0.1s, box-shadow 0.1s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isTop && <span style={{ fontSize: 16 }}>🥇</span>}
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#37352f' }}>{p.name}</span>
                </div>
                <span style={{ fontSize: 11, color: '#a47148', fontWeight: 600 }}>노션 ↗</span>
              </div>
              <div style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 12 }}>
                {partner.notionTitle}
              </div>

              {/* 누적매출 */}
              <div style={{
                padding: '10px 12px', marginBottom: 12,
                background: '#fff', borderRadius: 8,
                border: '1px solid ' + (isTop ? '#fcd34d' : '#e7e3da'),
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontSize: 11, color: '#6b6b6b', fontWeight: 600 }}>
                    💰 {p.ytdLabel || '2026년 누적매출'}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#37352f' }}>
                    {(p.ytdSales || 0).toLocaleString('ko-KR')}
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#6b6b6b', marginLeft: 2 }}>백만원</span>
                  </div>
                </div>
              </div>

              {/* 매출 월별 */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#6b6b6b', fontWeight: 600, marginBottom: 4 }}>
                  💵 매출
                  {p.lastMonth.sales > 0 && (
                    <span style={{
                      marginLeft: 6, fontSize: 10, fontWeight: 700,
                      color: monthDelta >= 0 ? '#10b981' : '#ef4444',
                    }}>
                      {monthDelta >= 0 ? '▲' : '▼'} {Math.abs(monthDelta).toFixed(0)}% (전월대비)
                    </span>
                  )}
                </div>
                <MonthRow
                  lastLabel="저번달"   lastValue={`${p.lastMonth.sales.toLocaleString('ko-KR')}M`}
                  thisLabel="이번달"   thisValue={`${p.thisMonth.sales.toLocaleString('ko-KR')}M`}
                  nextLabel="다음달(예상)" nextValue={`${p.nextMonth.sales.toLocaleString('ko-KR')}M`}
                  highlight="this"
                />
              </div>

              {/* 마켓 건수 */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#6b6b6b', fontWeight: 600, marginBottom: 4 }}>
                  🛒 마켓
                </div>
                <MonthRow
                  lastLabel="저번달"   lastValue={`${p.lastMonth.marketCount}건`}
                  thisLabel="이번달"   thisValue={`${p.thisMonth.marketCount}건`}
                  nextLabel="다음달"   nextValue={`${p.nextMonth.marketCount}건`}
                  highlight="this"
                />
              </div>

              {/* 컨텐츠 반응 — API 미연동 placeholder */}
              <div>
                <div style={{ fontSize: 11, color: '#6b6b6b', fontWeight: 600, marginBottom: 4 }}>
                  🎬 컨텐츠 반응 (릴스 평균 조회수)
                  <span style={{
                    marginLeft: 6, fontSize: 10, padding: '1px 6px', borderRadius: 6,
                    background: '#f3f4f6', color: '#6b7280',
                  }}>API 연동 예정</span>
                </div>
                <div style={{
                  padding: '8px 12px', background: '#f9fafb', border: '1px dashed #d1d5db',
                  borderRadius: 6, fontSize: 11, color: '#9ca3af', textAlign: 'center',
                }}>
                  인플루언서 릴스 API 연동 시 자동 채워짐
                </div>
              </div>
            </a>
          );
        })}
      </div>

      <div style={{
        marginTop: 14, padding: 10, background: '#fffbeb', borderRadius: 8,
        fontSize: 11, color: '#78350f',
      }}>
        ℹ️ <strong>담당자 표시는 보류</strong> — 셀러별 담당자가 여러 명이라 추후 명세 후 추가 예정
      </div>
    </div>
  );
}

function MonthRow({ lastLabel, lastValue, thisLabel, thisValue, nextLabel, nextValue, highlight }) {
  const cells = [
    { label: lastLabel, value: lastValue, key: 'last' },
    { label: thisLabel, value: thisValue, key: 'this' },
  ];
  if (nextLabel) cells.push({ label: nextLabel, value: nextValue, key: 'next' });

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${cells.length}, 1fr)`, gap: 6,
    }}>
      {cells.map(c => {
        const isHi = highlight === c.key;
        const isNext = c.key === 'next';
        return (
          <div key={c.key} style={{
            padding: '6px 8px',
            background: isHi ? '#fff' : 'transparent',
            border: '1px solid ' + (isHi ? '#fcd34d' : '#e7e3da'),
            borderStyle: isNext ? 'dashed' : 'solid',
            borderRadius: 6, textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: isNext ? '#a47148' : '#6b6b6b' }}>{c.label}</div>
            <div style={{
              fontSize: 13, fontWeight: isHi ? 700 : 600,
              color: isNext ? '#a47148' : '#37352f',
            }}>{c.value}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────── 노션 드로어 (mock - 실제 노션 API 연동 전까지) ───────────────
function PartnerBadge() {
  return (
    <span style={{
      fontSize: 10, padding: '2px 6px', borderRadius: 8,
      background: 'linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)',
      color: '#78350f', fontWeight: 700,
      border: '1px solid #f59e0b',
    }} title="와이어드 파트너 셀러">🤝 파트너</span>
  );
}

function NotionDrawer({ m }) {
  const NotionBorder = '#e7e3da';
  const NotionAccent = '#a47148';
  const partner = PARTNER_SELLERS[m.sellerName];
  const notionMock = getNotionMock(m.id);
  const targetUrl = partner ? partner.notionUrl : notionMock.notionPageUrl;

  return (
    <div style={{
      padding: 18, background: '#faf9f6',
      borderTop: `1px dashed ${NotionBorder}`,
    }}>
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
              📋 노션 기획 정보
              {partner && <PartnerBadge />}
              <span style={{
                fontSize: 9, padding: '1px 5px', borderRadius: 4,
                background: '#fee2e2', color: '#991b1b',
              }}>mock</span>
            </div>
            <div style={{ fontSize: 11, color: '#6b6b6b' }}>
              {partner ? partner.notionTitle : '마켓 캘린더'} · 실제 노션 연동 전까지 가상 데이터
            </div>
          </div>
        </div>
        <a href={targetUrl} target="_blank" rel="noopener noreferrer"
          style={{
            fontSize: 12, color: NotionAccent, fontWeight: 600,
            textDecoration: 'none', padding: '6px 12px',
            background: '#fff', border: `1px solid ${NotionBorder}`, borderRadius: 6,
          }}
        >{partner ? '파트너 워크스페이스 ↗' : '노션에서 전체 보기 ↗'}</a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        <NotionFact label="🗓️ 진행 기간" value={`${m.startedAt} ~ ${m.endedAt}`} />
        <NotionFact label="🛍️ 판매 채널" value={m.salesChannel || '-'} />
        <NotionFact label="📦 재고 (mock)" value={`${notionMock.stock.toLocaleString('ko-KR')}개`} />
      </div>

      <div style={{
        padding: 12, marginBottom: 14, background: '#fff',
        border: `1px solid ${NotionBorder}`, borderRadius: 8,
      }}>
        <div style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 6 }}>🎁 이벤트 (mock)</div>
        <div style={{ fontSize: 13, color: '#37352f', fontWeight: 500 }}>
          {notionMock.event || <span style={{ color: '#9ca3af' }}>이벤트 없음</span>}
        </div>
      </div>

      <div style={{
        padding: 14, marginBottom: 14, background: '#fff',
        border: `1px solid ${NotionBorder}`, borderRadius: 8,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#37352f' }}>📸 마케팅 콘텐츠 아이디어 (mock)</div>
          <span style={{ fontSize: 11, color: '#6b6b6b' }}>
            작성자: <strong style={{ color: '#37352f' }}>{notionMock.marketingMgr}</strong>
          </span>
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#37352f', lineHeight: 1.8 }}>
          {notionMock.contentIdeas.map((idea, idx) => <li key={idx}>{idea}</li>)}
        </ul>
      </div>
    </div>
  );
}

function NotionFact({ label, value }) {
  return (
    <div style={{
      padding: 10, background: '#fff',
      border: '1px solid #e7e3da', borderRadius: 8,
    }}>
      <div style={{ fontSize: 10, color: '#6b6b6b', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#37352f' }}>{value}</div>
    </div>
  );
}

// ─────────────── 마켓 현황 (실데이터) ───────────────
function MarketsSection({ markets }) {
  // 셀러 담당자 리스트 (실데이터에서 추출)
  const managerList = useMemo(() => {
    const set = new Set();
    markets.forEach(m => { if (m.managerName) set.add(m.managerName); });
    return [...set].sort();
  }, [markets]);

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('sales');
  const [showCount, setShowCount] = useState(50);
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    let arr = markets;
    if (tab !== 'all') arr = arr.filter(m => m.managerName === tab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(m =>
        (m.sellerName || '').toLowerCase().includes(q) ||
        (m.brandName || '').toLowerCase().includes(q)
      );
    }
    return [...arr].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
  }, [tab, search, sortBy, markets]);

  const visible = filtered.slice(0, showCount);
  const hasMore = filtered.length > showCount;

  function switchTab(t) { setTab(t); setShowCount(50); }
  function onSearchChange(v) { setSearch(v); setShowCount(50); }

  return (
    <div style={card}>
      <SectionTitle emoji="🛒" title="이번달 마켓 현황" hint="셀러 담당자별 탭 · 검색 · 정렬 · 행 클릭 → 노션 기획 정보 펼침" />

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        <TabBtn active={tab === 'all'} onClick={() => switchTab('all')}>
          전체 ({markets.length})
        </TabBtn>
        {managerList.map(m => {
          const c = markets.filter(x => x.managerName === m).length;
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
          <SortBtn active={sortBy === 'orderCount'} onClick={() => setSortBy('orderCount')}>주문 ↓</SortBtn>
          <SortBtn active={sortBy === 'estimatedSales'} onClick={() => setSortBy('estimatedSales')}>예상매출 ↓</SortBtn>
          <SortBtn active={sortBy === 'achievementRate'} onClick={() => setSortBy('achievementRate')}>달성률 ↓</SortBtn>
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
        총 <strong style={{ color: '#374151' }}>{filtered.length}개</strong> 중 <strong style={{ color: '#374151' }}>{visible.length}개</strong> 표시
        {tab !== 'all' && <> · 담당자 <strong style={{ color: '#2563eb' }}>{tab}</strong></>}
        {search && <> · 검색 "<strong>{search}</strong>"</>}
      </div>

      <div style={{
        padding: '8px 12px', marginBottom: 8, background: '#fffbeb',
        border: '1px solid #fde68a', borderRadius: 6,
        fontSize: 12, color: '#78350f',
      }}>
        💡 마켓 행을 클릭하면 노션 기획 정보가 펼쳐져요 (CS율/배송 데이터는 와이어드민 API 추가 연동 필요)
      </div>

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
              <th style={{ ...th2, textAlign: 'right' }}>예상매출</th>
              <th style={{ ...th2, textAlign: 'right' }}>달성률</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((m, i) => {
              const stColor = { ENDED: '#6b7280', ACTIVE: '#10b981', READY: '#3b82f6', CANCELED: '#ef4444' }[m.status] || '#6b7280';
              const stLabel = { ENDED: '종료', ACTIVE: '진행중', READY: '예정', CANCELED: '취소' }[m.status] || m.status;
              const achColor = m.achievementRate == null ? '#9ca3af' : m.achievementRate >= 100 ? '#10b981' : m.achievementRate >= 80 ? '#f59e0b' : '#ef4444';
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
                    <td style={td2}>{m.brandName || '-'}</td>
                    <td style={td2}>{m.managerName || '-'}</td>
                    <td style={{ ...td2 }}><span style={{ color: stColor, fontWeight: 600, fontSize: 11 }}>{stLabel}</span></td>
                    <td style={{ ...td2, textAlign: 'right', fontWeight: 600 }}>{fmt(m.sales)}</td>
                    <td style={{ ...td2, textAlign: 'right' }}>{(m.orderCount || 0).toLocaleString('ko-KR')}건</td>
                    <td style={{ ...td2, textAlign: 'right', color: '#6b7280' }}>{fmt(m.estimatedSales)}</td>
                    <td style={{ ...td2, textAlign: 'right', color: achColor, fontWeight: 600 }}>
                      {m.achievementRate != null ? `${m.achievementRate.toFixed(0)}%` : '-'}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={10} style={{ padding: 0, background: '#faf9f6', borderBottom: '1px solid #e5e7eb' }}>
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

// ─────────────── 브랜드별 현황 (실데이터) ───────────────
function BrandsSection({ markets, brands }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('sales');
  const [expanded, setExpanded] = useState(null);

  // 브랜드 통합 뷰 (combined API의 brands는 이미 집계됨, 마켓 리스트는 별도 매칭)
  const aggregated = useMemo(() => {
    return brands.map(b => {
      const myMarkets = markets.filter(m => m.brandName === b.name);
      return {
        ...b,
        markets: myMarkets,
      };
    });
  }, [brands, markets]);

  // HOT 임계: 총 주문건수 상위 25%
  const hotThreshold = useMemo(() => {
    const sorted = [...aggregated].map(b => b.orderCount || 0).sort((a, b) => b - a);
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
          <SortBtn active={sortBy === 'orderCount'} onClick={() => setSortBy('orderCount')}>주문 ↓</SortBtn>
          <SortBtn active={sortBy === 'marketCount'} onClick={() => setSortBy('marketCount')}>공구건수 ↓</SortBtn>
          <SortBtn active={sortBy === 'achievementRate'} onClick={() => setSortBy('achievementRate')}>달성률 ↓</SortBtn>
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
        총 <strong style={{ color: '#374151' }}>{filtered.length}개 브랜드</strong>
        {search && <> · 검색 "<strong>{search}</strong>"</>}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '34px minmax(150px,1.5fr) 70px 90px 80px 60px 90px 60px 28px',
        gap: 8, padding: '8px 12px',
        background: '#f9fafb', borderRadius: 6,
        fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 6,
      }}>
        <div>#</div>
        <div>브랜드 / 셀러수</div>
        <div>담당자</div>
        <div style={{ textAlign: 'right' }}>매출</div>
        <div style={{ textAlign: 'right' }}>주문건수</div>
        <div style={{ textAlign: 'right' }}>공구건수</div>
        <div style={{ textAlign: 'right' }}>예상매출</div>
        <div style={{ textAlign: 'right' }}>달성률</div>
        <div></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.map((b, i) => {
          const isHot = (b.orderCount || 0) >= hotThreshold && hotThreshold > 0;
          const isOpen = expanded === b.name;
          return (
            <div key={b.name} style={{
              border: '1px solid ' + (isOpen ? '#2563eb' : '#e5e7eb'),
              borderRadius: 8, overflow: 'hidden',
            }}>
              <div
                onClick={() => setExpanded(isOpen ? null : b.name)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '34px minmax(150px,1.5fr) 70px 90px 80px 60px 90px 60px 28px',
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
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>({(b.sellers || []).length})</span>
                </div>
                <div style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{b.manager || '-'}</div>
                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 12 }}>{fmt(b.sales)}</div>
                <div style={{ textAlign: 'right', fontSize: 12 }}>{(b.orderCount || 0).toLocaleString('ko-KR')}건</div>
                <div style={{ textAlign: 'right', color: '#6b7280', fontSize: 12 }}>{b.marketCount}개</div>
                <div style={{ textAlign: 'right', color: '#6b7280', fontSize: 12 }}>{fmt(b.estimatedSales)}</div>
                <div style={{
                  textAlign: 'right', fontWeight: 600, fontSize: 12,
                  color: b.achievementRate >= 100 ? '#10b981' : b.achievementRate >= 80 ? '#f59e0b' : '#ef4444',
                }}>{b.achievementRate != null ? `${b.achievementRate.toFixed(0)}%` : '-'}</div>
                <div style={{ textAlign: 'right', color: '#9ca3af' }}>{isOpen ? '▲' : '▼'}</div>
              </div>

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
                        .sort((a, c) => (c.sales || 0) - (a.sales || 0))
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
                              <td style={{ ...td3, textAlign: 'right' }}>{(m.orderCount || 0).toLocaleString('ko-KR')}건</td>
                              <td style={{ ...td3, textAlign: 'right', color: achColor, fontWeight: 600 }}>
                                {m.achievementRate != null ? `${m.achievementRate.toFixed(0)}%` : '-'}
                              </td>
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

// ─────────────── 베스트 마켓 TOP 3 (실데이터, 매출 기준만) ───────────────
function BestMarkets({ markets }) {
  const top3 = useMemo(() => {
    return [...markets]
      .filter(m => m.status === 'ENDED' && (m.sales || 0) > 0)
      .sort((a, b) => (b.sales || 0) - (a.sales || 0))
      .slice(0, 3);
  }, [markets]);

  if (top3.length === 0) return null;

  return (
    <div style={card}>
      <SectionTitle
        emoji="🏆"
        title="이번달 종료 마켓 TOP 3 (매출 기준)"
        hint="추후 CS율/배송완료율 데이터 연동 시 종합 점수로 변경 예정"
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {top3.map((m, i) => {
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
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {m.brandName || '(브랜드 미지정)'} × {m.sellerName}
                    {PARTNER_SELLERS[m.sellerName] && (
                      <span style={{ marginLeft: 8 }}><PartnerBadge /></span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{m.startedAt} ~ {m.endedAt} · 담당 {m.managerName || '-'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, flexWrap: 'wrap' }}>
                <div>💰 매출 <strong>{fmt(m.sales)}</strong></div>
                <div>📦 주문 <strong>{(m.orderCount || 0).toLocaleString('ko-KR')}건</strong></div>
                <div>📊 달성률 <strong style={{
                  color: m.achievementRate >= 100 ? '#10b981' : m.achievementRate >= 80 ? '#f59e0b' : '#ef4444',
                }}>{m.achievementRate != null ? `${m.achievementRate.toFixed(0)}%` : '-'}</strong></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────── 로딩/에러 ───────────────
function LoadingPanel() {
  return (
    <div style={{ ...card, textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
      <div style={{ fontSize: 14, color: '#6b7280' }}>실데이터 불러오는 중...</div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>와이어드민 + 구글시트 동시 호출 (보통 5~15초)</div>
    </div>
  );
}

function ErrorPanel({ message }) {
  return (
    <div style={{ ...card, background: '#fef2f2', border: '1px solid #fca5a5' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#991b1b', marginBottom: 6 }}>⚠️ 데이터 불러오기 실패</div>
      <div style={{ fontSize: 12, color: '#7f1d1d', fontFamily: 'monospace', wordBreak: 'break-all' }}>{message}</div>
    </div>
  );
}

// ─────────────── 로그인 화면 ───────────────
function LoginScreen() {
  return (
    <main style={{ padding: 40, maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h1 style={{ fontSize: 24, margin: 0, marginBottom: 8 }}>로그인이 필요해요</h1>
      <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px' }}>
        @wired.company 구글 계정으로 로그인하면<br />
        실시간 매출 대시보드를 볼 수 있어요
      </p>
      <button
        onClick={() => signIn('google')}
        style={{
          padding: '14px 28px', fontSize: 15, fontWeight: 600,
          background: '#4285F4', color: '#fff',
          border: 'none', borderRadius: 10, cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(66,133,244,0.3)',
        }}
      >
        🔑 Google 계정으로 로그인
      </button>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 24 }}>
        와이어드 직원 전용 (@wired.company 도메인만 허용)
      </div>
    </main>
  );
}

// ─────────────── 메인 ───────────────
export default function Preview() {
  const { data: session, status } = useSession();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session) return; // 로그인 안 했으면 데이터 fetch 안 함
    fetch('/api/preview-data')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.message || d.error);
        else setData(d);
      })
      .catch(e => setError(e.message));
  }, [session]);

  // 세션 로딩 중
  if (status === 'loading') {
    return (
      <main style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
        세션 확인 중...
      </main>
    );
  }

  // 로그인 안 된 상태
  if (!session) return <LoginScreen />;

  return (
    <main style={{ padding: 24, maxWidth: 1280, margin: '0 auto', background: '#f9fafb', minHeight: '100vh' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>📊 와이어드 매출 대시보드 v5 — 실데이터</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
          와이어드민 API + 구글시트(사업개발) 실시간 데이터 · 어제까지 집계 · 매일 새벽 3시 자동 새로고침
        </p>
        <Link href="/query" style={{ fontSize: 13, color: '#2563eb', marginTop: 8, display: 'inline-block' }}>← 기존 페이지로</Link>
      </header>

      {error && <ErrorPanel message={error} />}
      {!data && !error && <LoadingPanel />}

      {data && (
        <>
          <div style={{ marginBottom: 24 }}>
            <TrendChart
              trend={data.trend}
              monthTargetAvg={data.monthTargetAvg}
              yearTarget={data.yearTarget}
              quarterTarget={data.quarterTarget}
              ytdSales={data.ytdSales}
              qtdSales={data.qtdSales}
              yearProgress={data.yearProgress}
              quarterProgress={data.quarterProgress}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <PartnerSellersSection partnerStats={data.partnerStats} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <BestMarkets markets={data.marketsList} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <MarketsSection markets={data.marketsList} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <BrandsSection markets={data.marketsList} brands={data.brands} />
          </div>

          {/* 에러 디버깅 (혹시 일부만 실패한 경우) */}
          {data.errors && Object.values(data.errors).some(Boolean) && (
            <div style={{
              padding: 14, background: '#fef2f2', border: '1px solid #fca5a5',
              borderRadius: 8, fontSize: 12, color: '#7f1d1d', marginBottom: 24,
            }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>⚠️ 데이터 가져오기 실패 상세</div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6 }}>
                {Object.entries(data.errors).filter(([_, v]) => v).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: 4, wordBreak: 'break-all' }}>
                    <strong style={{ color: '#991b1b' }}>{k}:</strong> {String(v).slice(0, 300)}
                  </div>
                ))}
              </div>
              {data.debug && (
                <div style={{ marginTop: 10, padding: 8, background: '#fff', borderRadius: 4, fontSize: 11, color: '#374151' }}>
                  <strong>디버그 카운트:</strong>{' '}
                  마켓 {data.debug.thisMonthMarkets}개 ·
                  셀러 {data.debug.thisMonthSellers}명 ·
                  주문 {data.debug.thisMonthTotalOrders}건 ·
                  YTD 매출 {(data.debug.thisYearTotalSales || 0).toLocaleString('ko-KR')}원
                </div>
              )}
            </div>
          )}

          <div style={{
            padding: 16, background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: 12, fontSize: 13, lineHeight: 1.6,
          }}>
            💡 <strong>이번 버전 (v5 실데이터):</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              <li>✅ 월별 매출 추이 — 구글시트 '사업개발' 탭에서 자동</li>
              <li>✅ 연/분기 목표 달성률 — 와이어드민 주문 API 실시간 합계</li>
              <li>✅ 파트너 셀러 카드 6명 — 실제 매출/마켓건수 (저번달/이번달/다음달 예상)</li>
              <li>✅ 이번달 마켓 현황 — 와이어드민 마켓 API</li>
              <li>✅ 브랜드별 현황 — 마켓 기반 자동 집계</li>
              <li>⏸️ 팀 합작 대시보드 — 코드 보존, 화면에서 잠시 빼둠 (마케팅/CS/물류 담당자 API 연동 후 복원)</li>
              <li>⏸️ CS율 / 배송완료율 / 릴스 조회수 — 와이어드민 API 추가 연동 필요 (현재 N/A)</li>
              <li>⏸️ 노션 기획 정보 (마켓 펼침) — 아직 mock, 노션 자동 매칭 작업 필요</li>
            </ul>
          </div>
        </>
      )}

      <ChatWidget />
    </main>
  );
}

const card = {
  padding: 20, background: '#fff',
  border: '1px solid #e5e7eb', borderRadius: 14,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};
