'use client';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
  ReferenceLine, Label,
} from 'recharts';

// ─────────────── 모의 데이터 ───────────────
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

// 3년치 월 매출 (백만원 단위)
const TREND = MONTHS.map((m, i) => ({
  month: m,
  '2024': 2067 + Math.round((Math.sin(i * 0.7) + 1) * 200) - i * 30,
  '2025': 1535 + Math.round((Math.sin(i * 0.5 + 1) + 1) * 250) - i * 10,
  '2026': i < 5 ? 1094 + Math.round((Math.cos(i * 0.6) + 1) * 250) + i * 50 : null,
  // 다음달 예상 (6월만)
  '2026 예상': i === 5 ? 1450 : null,
}));

// 누적 비교
const YTD_2026 = TREND.slice(0, 5).reduce((s, r) => s + (r['2026'] || 0), 0);
const YTD_2025 = TREND.slice(0, 5).reduce((s, r) => s + (r['2025'] || 0), 0);
const YTD_2024 = TREND.slice(0, 5).reduce((s, r) => s + (r['2024'] || 0), 0);
const YOY_PCT = ((YTD_2026 - YTD_2025) / YTD_2025) * 100;
const YOY_2024_PCT = ((YTD_2026 - YTD_2024) / YTD_2024) * 100;

// 담당자별 기여도
const MANAGERS = [
  { name: '김규민', sales: 3200, color: '#2563eb' },
  { name: '정석호', sales: 2400, color: '#7c3aed' },
  { name: '강규성', sales: 850,  color: '#0891b2' },
  { name: '최예린', sales: 420,  color: '#10b981' },
];
const MANAGER_TOTAL = MANAGERS.reduce((s, m) => s + m.sales, 0);

// 셀러 TOP 10
const SELLERS = [
  { name: '오인스',     sales: 1480, lastYear: 1320, manager: '김규민' },
  { name: '달빛',       sales: 980,  lastYear: 720,  manager: '정석호' },
  { name: '심플팩토리',  sales: 590,  lastYear: 650,  manager: '김규민' },
  { name: '김영은마켓',  sales: 410,  lastYear: 380,  manager: '정석호' },
  { name: '아임박선생',  sales: 320,  lastYear: 150,  manager: '강규성' },
  { name: '바이미룸',    sales: 280,  lastYear: 0,    manager: '김규민' },
  { name: '대랑맘',     sales: 220,  lastYear: 180,  manager: '강규성' },
  { name: '미니결',     sales: 190,  lastYear: 200,  manager: '정석호' },
  { name: '포유홈',     sales: 165,  lastYear: 140,  manager: '김규민' },
  { name: '김별샘',     sales: 150,  lastYear: 110,  manager: '강규성' },
];

const BRANDS = [
  { name: '동국제약',     sales: 720, lastYear: 600 },
  { name: '오로바일렌',   sales: 510, lastYear: 0 },
  { name: '퓨어레비',     sales: 490, lastYear: 350 },
  { name: '드시모네',     sales: 430, lastYear: 380 },
  { name: '허그베어',     sales: 320, lastYear: 240 },
  { name: '테코야',       sales: 260, lastYear: 280 },
  { name: '블랙홀 코팅큐', sales: 250, lastYear: 220 },
  { name: '디귿',         sales: 200, lastYear: 0 },
  { name: '트루티',       sales: 165, lastYear: 130 },
  { name: '트루쿡',       sales: 150, lastYear: 110 },
];

// ─────────────── 유틸 ───────────────
function fmt(v) { return v?.toLocaleString('ko-KR') + '백만원'; }
function pct(v) {
  if (v == null) return '-';
  const sign = v > 0 ? '+' : '';
  return sign + v.toFixed(1) + '%';
}

// ─────────────── 컴포넌트 ───────────────
function SectionTitle({ emoji, title, hint }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{emoji} {title}</h2>
      {hint && <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>{hint}</p>}
    </div>
  );
}

function TrendChart() {
  return (
    <div style={card}>
      <SectionTitle emoji="📈" title="3년 월별 매출 추이" hint="2024 회색 / 2025 노랑 / 2026 파랑 · 다음달은 예상매출(점선)" />

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 16 }}>
        <div style={{ height: 360 }}>
          <ResponsiveContainer>
            <LineChart data={TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={11} tickFormatter={v => (v / 1000).toFixed(1) + 'B'} />
              <Tooltip formatter={v => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="2024" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="2025" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="2026" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="2026 예상" stroke="#7c3aed" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 우측: 누적 KPI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: 14, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', color: '#fff', borderRadius: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>올해 누적 (1~5월)</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{fmt(YTD_2026)}</div>
          </div>
          <div style={{ padding: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>vs 2025 동기간</div>
            <div style={{ fontSize: 12, color: '#374151' }}>{fmt(YTD_2025)}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: YOY_PCT >= 0 ? '#10b981' : '#ef4444', marginTop: 4 }}>
              {YOY_PCT >= 0 ? '▲' : '▼'} {pct(YOY_PCT)}
            </div>
          </div>
          <div style={{ padding: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>vs 2024 동기간</div>
            <div style={{ fontSize: 12, color: '#374151' }}>{fmt(YTD_2024)}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: YOY_2024_PCT >= 0 ? '#10b981' : '#ef4444', marginTop: 4 }}>
              {YOY_2024_PCT >= 0 ? '▲' : '▼'} {pct(YOY_2024_PCT)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManagerContribution() {
  let cum = 0;
  const rows = MANAGERS.map(m => {
    const share = (m.sales / MANAGER_TOTAL) * 100;
    cum += share;
    return { ...m, share, cum };
  });

  return (
    <div style={card}>
      <SectionTitle emoji="👤" title="담당자별 기여도" hint="올해 누적 매출 기준" />

      {/* 100% 누적 막대 */}
      <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
        {rows.map(r => (
          <div key={r.name} title={`${r.name} ${r.share.toFixed(1)}%`}
            style={{
              flex: r.share,
              background: r.color,
              color: '#fff', fontSize: 11, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            {r.share >= 8 ? `${r.share.toFixed(0)}%` : ''}
          </div>
        ))}
      </div>

      {/* 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(r => (
          <div key={r.name} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '8px 12px', background: '#f9fafb', borderRadius: 8,
          }}>
            <div style={{ width: 10, height: 10, background: r.color, borderRadius: 2 }} />
            <div style={{ flex: 1, fontWeight: 600 }}>{r.name}</div>
            <div style={{ fontSize: 13, color: '#374151' }}>{fmt(r.sales)}</div>
            <div style={{
              fontSize: 13, fontWeight: 700, minWidth: 60, textAlign: 'right',
              color: r.color,
            }}>{r.share.toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
              display: 'grid', gridTemplateColumns: '24px 1fr 100px 80px 70px',
              gap: 12, alignItems: 'center', padding: '6px 4px',
              borderBottom: i < rows.length - 1 ? '1px solid #f3f4f6' : 'none',
            }}>
              <div style={{ color: '#9ca3af', fontSize: 12 }}>#{i + 1}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{r.name}</div>
                {r.manager && <div style={{ fontSize: 11, color: '#9ca3af' }}>({r.manager})</div>}
              </div>
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
        <h1 style={{ fontSize: 24, margin: 0 }}>🎨 새 디자인 초안 (가상 데이터)</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
          ① 3년 매출 추이 ② 누적 기여도
        </p>
        <Link href="/query" style={{ fontSize: 13, color: '#2563eb', marginTop: 8, display: 'inline-block' }}>← 현재 페이지로</Link>
      </header>

      {/* 1. 매출 흐름 */}
      <div style={{ marginBottom: 24 }}>
        <TrendChart />
      </div>

      {/* 2. 기여도 */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 12px' }}>🎯 올해 누적 기여도</h2>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 16px' }}>
          올해 1~5월 누적 매출 기준 · 작년 동기간 대비 증감(▲/▼)도 표시
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <ManagerContribution />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <RankList
          emoji="🏪"
          title="셀러 TOP 10"
          hint="올해 누적 · 우측은 전년 동기 대비"
          rows={SELLERS}
        />
        <RankList
          emoji="🏷️"
          title="브랜드 TOP 10"
          hint="올해 누적 · 우측은 전년 동기 대비"
          rows={BRANDS}
        />
      </div>

      <div style={{
        padding: 16, background: '#eff6ff', border: '1px solid #bfdbfe',
        borderRadius: 12, fontSize: 14, lineHeight: 1.6,
      }}>
        💡 <strong>의견 주시면 다듬어드릴게요:</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
          <li>위 라인 차트가 잘 보이는지, 색깔 구분 OK?</li>
          <li>"올해 누적" 옆 vs 작년/2024 비교 카드 형태 적당한지</li>
          <li>담당자 기여도 — 누적 막대 + 리스트 OK인지</li>
          <li>셀러/브랜드 TOP — 그리드 막대 + 전년비 ▲▼ OK인지</li>
          <li>빠진 데이터 / 추가하고 싶은 거 있는지</li>
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
