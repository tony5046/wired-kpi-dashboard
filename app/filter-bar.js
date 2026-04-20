'use client';
import { useMemo } from 'react';

const PERIODS = [
  { value: 'week', label: '주간' },
  { value: 'month', label: '월간' },
  { value: 'quarter', label: '분기' },
  { value: 'year', label: '연간' },
];

export function FilterBar({ filters, onChange }) {
  const now = new Date();
  const period = filters.period || 'month';
  const year = parseInt(filters.year, 10) || now.getFullYear();
  const month = parseInt(filters.month, 10) || (now.getMonth() + 1);
  const quarter = parseInt(filters.quarter, 10) || (Math.floor(now.getMonth() / 3) + 1);
  const week = parseInt(filters.week, 10) || isoWeekNow();

  const years = useMemo(() => {
    const out = [];
    for (let y = 2024; y <= now.getFullYear() + 1; y++) out.push(y);
    return out;
  }, [now]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const quarters = [1, 2, 3, 4];
  const weeks = useMemo(() => Array.from({ length: 53 }, (_, i) => i + 1), []);

  const update = (patch) => {
    const next = { ...filters, ...patch };
    // 필요 없는 필드 정리
    if (next.period === 'year') {
      delete next.month; delete next.week; delete next.quarter;
    } else if (next.period === 'month') {
      delete next.week; delete next.quarter;
    } else if (next.period === 'quarter') {
      delete next.month; delete next.week;
    } else if (next.period === 'week') {
      delete next.month; delete next.quarter;
    }
    onChange(next);
  };

  const btnStyle = (active) => ({
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    background: active ? '#2563eb' : '#fff',
    color: active ? '#fff' : '#374151',
    border: '1px solid ' + (active ? '#2563eb' : '#d1d5db'),
    borderRadius: 6,
    cursor: 'pointer',
  });

  const selStyle = {
    padding: '6px 10px',
    fontSize: 13,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    background: '#fff',
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap',
        padding: 12,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', gap: 4 }}>
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => update({ period: p.value })} style={btnStyle(period === p.value)}>
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ width: 1, height: 24, background: '#e5e7eb' }} />

      <select value={year} onChange={e => update({ year: e.target.value })} style={selStyle}>
        {years.map(y => <option key={y} value={y}>{y}년</option>)}
      </select>

      {period === 'month' && (
        <select value={month} onChange={e => update({ month: e.target.value })} style={selStyle}>
          {months.map(m => <option key={m} value={m}>{m}월</option>)}
        </select>
      )}

      {period === 'quarter' && (
        <select value={quarter} onChange={e => update({ quarter: e.target.value })} style={selStyle}>
          {quarters.map(q => <option key={q} value={q}>Q{q}</option>)}
        </select>
      )}

      {period === 'week' && (
        <select value={week} onChange={e => update({ week: e.target.value })} style={selStyle}>
          {weeks.map(w => <option key={w} value={w}>{w}주차</option>)}
        </select>
      )}
    </div>
  );
}

function isoWeekNow() {
  const d = new Date();
  const u = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = u.getUTCDay() || 7;
  u.setUTCDate(u.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(u.getUTCFullYear(), 0, 1));
  return Math.ceil(((u - yearStart) / 86400000 + 1) / 7);
}
