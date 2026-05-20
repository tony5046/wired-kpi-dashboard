'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

// 샘플 데이터 (실제 수치 흉내)
const SAMPLE = {
  thisYear:      { label: '올해 누적',  range: '2026-01-01 ~ 2026-12-31', estimated: 8600, mixed: 6815, marketsAll: 479, marketsActive: 431 },
  thisMonth:     { label: '이번달',     range: '2026-05-01 ~ 2026-05-31', estimated: 1629, mixed: 744,  marketsAll: 102, marketsActive: 89 },
  nextMonth:     { label: '다음달',     range: '2026-06-01 ~ 2026-06-30', estimated: 1450, mixed: 0,    marketsAll: 78,  marketsActive: 78 },
  thisWeek:      { label: '이번주',     range: '2026-05-18 ~ 2026-05-24', estimated: 525,  mixed: 157,  marketsAll: 33,  marketsActive: 31 },
  nextWeek:      { label: '다음주',     range: '2026-05-25 ~ 2026-05-31', estimated: 380,  mixed: 0,    marketsAll: 22,  marketsActive: 22 },
  lastMonth:     { label: '저번달',     range: '2026-04-01 ~ 2026-04-30', estimated: 1196, mixed: 1250, marketsAll: 92,  marketsActive: 83 },
  sameMonthLY:   { label: '전년동월',   range: '2025-05-01 ~ 2025-05-31', estimated: 1332, mixed: 1679, marketsAll: 91,  marketsActive: 82 },
};

function won(n) {
  if (n === 0 || !n) return '0백만원';
  return n.toLocaleString('ko-KR') + '백만원';
}

// ─────────────── 옵션 A: 히어로 + 컴팩트 ───────────────
function OptionA() {
  const t = SAMPLE.thisMonth;
  const pct = t.estimated > 0 ? (t.mixed / t.estimated) * 100 : 0;
  return (
    <>
      {/* Hero */}
      <div style={{
        padding: 28, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
        color: '#fff', borderRadius: 16, marginBottom: 16, boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>📅 {t.label}</h3>
          <span style={{ fontSize: 13, opacity: 0.85 }}>{t.range}</span>
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>예상 매출</div>
            <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{won(t.estimated)}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>예상매출 + 실제매출</div>
            <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{won(t.mixed)}</div>
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, opacity: 0.9 }}>
            <span>진행률 (실제/예상)</span>
            <span>{pct.toFixed(1)}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: '#fff', borderRadius: 4 }} />
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 13, opacity: 0.9 }}>
          🛒 공구마켓 {t.marketsAll}건 (진행 {t.marketsActive}건)
        </div>
      </div>

      {/* Compact table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
          다른 기간 한눈에
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={th2}>기간</th>
              <th style={{ ...th2, textAlign: 'right' }}>예상 매출</th>
              <th style={{ ...th2, textAlign: 'right' }}>예상+실제</th>
              <th style={{ ...th2, textAlign: 'right' }}>마켓 (총/진행)</th>
              <th style={th2}>날짜</th>
            </tr>
          </thead>
          <tbody>
            {['thisYear', 'thisWeek', 'nextWeek', 'nextMonth', 'lastMonth', 'sameMonthLY'].map(k => {
              const d = SAMPLE[k];
              return (
                <tr key={k}>
                  <td style={{ ...td2, fontWeight: 500 }}>{d.label}</td>
                  <td style={{ ...td2, textAlign: 'right' }}>{won(d.estimated)}</td>
                  <td style={{ ...td2, textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>{won(d.mixed)}</td>
                  <td style={{ ...td2, textAlign: 'right' }}>{d.marketsAll}건 / {d.marketsActive}건</td>
                  <td style={{ ...td2, fontSize: 11, color: '#9ca3af' }}>{d.range}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─────────────── 옵션 B: 타임라인 ───────────────
function OptionB() {
  const tl = [
    { ...SAMPLE.lastMonth, color: '#94a3b8' },
    { ...SAMPLE.thisWeek, color: '#6366f1' },
    { ...SAMPLE.thisMonth, color: '#2563eb', highlight: true },
    { ...SAMPLE.nextWeek, color: '#a78bfa' },
    { ...SAMPLE.nextMonth, color: '#c084fc' },
  ];
  return (
    <>
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        {tl.map((d, i) => (
          <div key={i} style={{
            flex: d.highlight ? 1.5 : 1,
            padding: 16,
            background: d.highlight ? `linear-gradient(135deg, ${d.color} 0%, #7c3aed 100%)` : '#fff',
            color: d.highlight ? '#fff' : '#111',
            border: `1px solid ${d.highlight ? d.color : '#e5e7eb'}`,
            borderRadius: 12,
            position: 'relative',
          }}>
            {d.highlight && <div style={{ position: 'absolute', top: -8, left: 12, background: '#fff', color: d.color, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, border: `1px solid ${d.color}` }}>NOW</div>}
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{d.label}</div>
            <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 10 }}>{d.range}</div>
            <div style={{ fontSize: d.highlight ? 22 : 16, fontWeight: 700, marginBottom: 4 }}>{won(d.mixed)}</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>예상 {won(d.estimated)}</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>🛒 {d.marketsAll}건</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
        {['thisYear', 'sameMonthLY'].map(k => {
          const d = SAMPLE[k];
          return (
            <div key={k} style={{ padding: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>참고</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{d.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#2563eb' }}>{won(d.mixed)}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>예상 {won(d.estimated)} · 🛒 {d.marketsAll}건</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─────────────── 옵션 C: 막대 차트 ───────────────
function OptionC() {
  const data = [
    { name: '전년동월', 예상: SAMPLE.sameMonthLY.estimated, 실제예상: SAMPLE.sameMonthLY.mixed },
    { name: '저번달',   예상: SAMPLE.lastMonth.estimated,   실제예상: SAMPLE.lastMonth.mixed },
    { name: '이번주',   예상: SAMPLE.thisWeek.estimated,    실제예상: SAMPLE.thisWeek.mixed },
    { name: '이번달',   예상: SAMPLE.thisMonth.estimated,   실제예상: SAMPLE.thisMonth.mixed },
    { name: '다음주',   예상: SAMPLE.nextWeek.estimated,    실제예상: SAMPLE.nextWeek.mixed },
    { name: '다음달',   예상: SAMPLE.nextMonth.estimated,   실제예상: SAMPLE.nextMonth.mixed },
    { name: '올해누적', 예상: SAMPLE.thisYear.estimated,    실제예상: SAMPLE.thisYear.mixed },
  ];
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>기간별 매출 비교</h3>
      <div style={{ width: '100%', height: 360 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={v => v.toLocaleString() + 'M'} />
            <Tooltip formatter={v => v.toLocaleString() + '백만원'} />
            <Bar dataKey="예상" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            <Bar dataKey="실제예상" fill="#2563eb" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.name === '이번달' ? '#ef4444' : '#2563eb'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>🟡 예상 매출 (마켓 등록값) · 🔵 예상+실제 매출 · 🔴 현재 기간 강조</p>
    </div>
  );
}

// ─────────────── 옵션 D: 탭 형식 ───────────────
function OptionD() {
  const tabs = ['이번달', '다음달', '이번주', '다음주', '저번달', '전년동월', '올해누적'];
  const keys = ['thisMonth', 'nextMonth', 'thisWeek', 'nextWeek', 'lastMonth', 'sameMonthLY', 'thisYear'];
  const [idx, setIdx] = useState(0);
  const d = SAMPLE[keys[idx]];
  const pct = d.estimated > 0 ? (d.mixed / d.estimated) * 100 : 0;
  return (
    <>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setIdx(i)} style={{
            padding: '10px 18px', fontSize: 14, fontWeight: idx === i ? 700 : 500,
            background: idx === i ? '#2563eb' : '#fff',
            color: idx === i ? '#fff' : '#374151',
            border: '1px solid ' + (idx === i ? '#2563eb' : '#d1d5db'),
            borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            {i === 0 && '⭐ '}{t}
          </button>
        ))}
      </div>

      <div style={{
        padding: 32, background: '#fff',
        border: '1px solid #e5e7eb', borderRadius: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 24 }}>📅 {d.label}</h2>
          <span style={{ fontSize: 13, color: '#9ca3af' }}>{d.range}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>💰 예상 매출</div>
            <div style={{ fontSize: 38, fontWeight: 800, color: '#111' }}>{won(d.estimated)}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>마켓 등록값 합</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>💵 예상매출 + 실제매출</div>
            <div style={{ fontSize: 38, fontWeight: 800, color: '#2563eb' }}>{won(d.mixed)}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>달성률 {pct.toFixed(1)}%</div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ height: 12, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb, #7c3aed)', borderRadius: 6 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, padding: '16px 0', borderTop: '1px solid #f3f4f6' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>🛒 공구마켓 총</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{d.marketsAll}건</div>
          </div>
          <div style={{ flex: 1, borderLeft: '1px solid #f3f4f6', paddingLeft: 16 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>🟢 진행중</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{d.marketsActive}건</div>
          </div>
          <div style={{ flex: 1, borderLeft: '1px solid #f3f4f6', paddingLeft: 16 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>❌ 취소</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>{d.marketsAll - d.marketsActive}건</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Preview() {
  return (
    <main style={{ padding: 24, maxWidth: 1280, margin: '0 auto', background: '#f9fafb', minHeight: '100vh' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>🎨 디자인 옵션 미리보기</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
          샘플 데이터로 그린 4가지 시안. 어느 게 가장 보기 편한지 골라주세요.
        </p>
        <Link href="/query" style={{ fontSize: 13, color: '#2563eb', marginTop: 8, display: 'inline-block' }}>← 현재 페이지로</Link>
      </header>

      <div style={{ marginBottom: 48 }}>
        <h2 style={sectionH}>옵션 A · 히어로 + 컴팩트 표</h2>
        <p style={subText}>가장 중요한 "이번달"이 크고 눈에 띄게, 나머지는 표로 한눈에 비교.</p>
        <OptionA />
      </div>

      <div style={{ marginBottom: 48 }}>
        <h2 style={sectionH}>옵션 B · 타임라인 (시간순)</h2>
        <p style={subText}>저번달 → 이번주 → 이번달(강조) → 다음주 → 다음달 흐름. 올해/전년은 따로.</p>
        <OptionB />
      </div>

      <div style={{ marginBottom: 48 }}>
        <h2 style={sectionH}>옵션 C · 막대 차트</h2>
        <p style={subText}>모든 기간을 막대로 한 번에 비교. 시각적으로 즉시 파악.</p>
        <OptionC />
      </div>

      <div style={{ marginBottom: 48 }}>
        <h2 style={sectionH}>옵션 D · 탭 형식</h2>
        <p style={subText}>탭 클릭으로 한 기간씩 시원하게. 큰 숫자 + 진행률 바.</p>
        <OptionD />
      </div>

      <div style={{
        padding: 20, background: '#eff6ff', border: '1px solid #bfdbfe',
        borderRadius: 12, fontSize: 14,
      }}>
        💡 마음에 드는 거 알려주시면 그걸로 매출 조회기 메인을 바꿔드릴게요.
        섞어도 OK (예: "A + C의 차트 추가").
      </div>
    </main>
  );
}

const sectionH = { fontSize: 18, fontWeight: 700, margin: '0 0 4px' };
const subText = { fontSize: 13, color: '#6b7280', margin: '0 0 16px' };
const th2 = { padding: '10px 16px', fontSize: 12, color: '#6b7280', fontWeight: 500, textAlign: 'left', borderBottom: '1px solid #e5e7eb' };
const td2 = { padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #f3f4f6' };
