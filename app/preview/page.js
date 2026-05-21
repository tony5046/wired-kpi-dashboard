'use client';
import Link from 'next/link';
import { useState } from 'react';
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
  { name: '달빛', sales: 980, lastYear: 720 },
  { name: '심플팩토리', sales: 590, lastYear: 650 },
  { name: '김영은마켓', sales: 410, lastYear: 380 },
  { name: '아임박선생', sales: 320, lastYear: 150 },
  { name: '바이미룸', sales: 280, lastYear: 0 },
  { name: '대랑맘', sales: 220, lastYear: 180 },
  { name: '미니결', sales: 190, lastYear: 200 },
  { name: '포유홈', sales: 165, lastYear: 140 },
  { name: '김별샘', sales: 150, lastYear: 110 },
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

// ─────────────── 메인 ───────────────
export default function Preview() {
  return (
    <main style={{ padding: 24, maxWidth: 1280, margin: '0 auto', background: '#f9fafb', minHeight: '100vh' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>🎨 새 디자인 초안 v2 (가상 데이터)</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
          ① 매출 추이 + 목표 달성률  ② 담당자 기여도 (셀러/상품 분리)  ③ TOP 리스트
        </p>
        <Link href="/query" style={{ fontSize: 13, color: '#2563eb', marginTop: 8, display: 'inline-block' }}>← 현재 페이지로</Link>
      </header>

      <div style={{ marginBottom: 24 }}>
        <TrendChart />
      </div>

      <div style={{ marginBottom: 24 }}>
        <ManagerContribution />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <RankList emoji="🏪" title="셀러 TOP 10" hint="올해 누적 · 전년 동기 대비" rows={SELLERS} />
        <RankList emoji="🏷️" title="브랜드 TOP 10" hint="올해 누적 · 전년 동기 대비" rows={BRANDS} />
      </div>

      <div style={{
        padding: 16, background: '#eff6ff', border: '1px solid #bfdbfe',
        borderRadius: 12, fontSize: 14, lineHeight: 1.6,
      }}>
        💡 <strong>추가 / 수정 부분 알려주세요:</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
          <li><strong>목표 달성률</strong> 차트 우측에 카드 2개 (연간 200억 / 분기 50억) — 위치 OK?</li>
          <li>차트에 가로 빨간 점선 = 월 평균 목표 — 너무 산만하면 뺄게요</li>
          <li><strong>담당자</strong>: 셀러 담당자와 상품 담당자 좌우로 분리. 부제목으로 "성과 평가용 아닌 매출 분포" 명시</li>
          <li>같은 사람이 양쪽에 있어도 따로 표시 (예: 김규민이 셀러담당 1위 + 상품담당 2위)</li>
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
