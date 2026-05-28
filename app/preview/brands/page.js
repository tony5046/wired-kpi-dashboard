'use client';
import { useState, useMemo, Fragment } from 'react';
import { MOCK_BRAND_MGMT } from '../mock-data';

const MONTHS = MOCK_BRAND_MGMT.months;
const BRANDS_MOCK = MOCK_BRAND_MGMT.brands;

const sum = (arr) => arr.reduce((a, v) => a + v, 0);

// ─────────────── 스타일 ───────────────
const C = {
  indigo:      '#4f46e5',
  indigoSoft:  '#eef2ff',
  indigoMid:   '#c7d2fe',
  ink:         '#0f172a',
  muted:       '#475569',
  faint:       '#94a3b8',
  surface:     '#fff',
  surfaceMuted:'#f8fafc',
  divider:     '#cbd5e1',
  dividerSoft: '#e2e8f0',
  dividerBold: '#94a3b8',
};
const card = {
  background: C.surface,
  border: `1px solid ${C.divider}`,
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
  overflow: 'hidden',
};
const cardHeader = {
  padding: '14px 20px',
  background: C.surfaceMuted,
  borderBottom: `1px solid ${C.divider}`,
  display: 'flex', alignItems: 'center', gap: 8,
};
const cardBody = { padding: 20 };

const th = {
  padding: '14px 8px',
  borderBottom: `2px solid ${C.dividerBold}`,
  background: C.surfaceMuted,
  fontSize: 11,
  color: C.muted,
  fontWeight: 700,
  textAlign: 'center',
  whiteSpace: 'nowrap',
  letterSpacing: '0.04em',
};
const thLeft = { ...th, textAlign: 'left' };
const td = {
  padding: '12px 8px',
  fontSize: 13,
  color: C.ink,
  borderBottom: `1px solid ${C.dividerSoft}`,
};
const cellNum = {
  padding: '10px 8px',
  textAlign: 'center',
  fontSize: 13,
  color: C.ink,
  borderBottom: `1px solid ${C.dividerSoft}`,
};

// ─────────────── 컴포넌트 ───────────────
function CardHeader({ title, hint, action }) {
  return (
    <div style={cardHeader}>
      <div style={{ width: 4, height: 18, background: C.indigo, borderRadius: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{title}</div>
        {hint && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{hint}</div>}
      </div>
      {action}
    </div>
  );
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', fontSize: 12,
      fontWeight: active ? 700 : 500,
      background: active ? C.indigo : C.surface,
      color: active ? '#fff' : C.muted,
      border: '1px solid ' + (active ? C.indigo : C.divider),
      borderRadius: 6, cursor: 'pointer',
    }}>{children}</button>
  );
}

// 숫자 셀 — 색상 없음, 굵기로만 강조
function NumCell({ value, bold = false, muted = false, bg }) {
  return (
    <td style={{
      ...cellNum,
      fontWeight: bold ? 700 : 400,
      color: muted ? '#9ca3af' : value === 0 ? '#9ca3af' : '#1f2937',
      background: bg || 'transparent',
    }}>
      {value}
    </td>
  );
}

// 한 행에 (월별 + Total)
function MonthRow({ values, bold = false, muted = false, totalBg = '#f9fafb' }) {
  const total = sum(values);
  return (
    <>
      {values.map((v, j) => <NumCell key={j} value={v} bold={bold} muted={muted} />)}
      <NumCell value={total} bold={true} bg={totalBg} />
    </>
  );
}

// ─────────────── 메인 ───────────────
export default function BrandsPage() {
  const [managerMode, setManagerMode] = useState('discoverer');
  const [expandedMgr, setExpandedMgr] = useState(null);

  function switchMode(mode) {
    setManagerMode(mode);
    setExpandedMgr(null);
  }

  // 담당자별 집계
  const byManager = useMemo(() => {
    const map = new Map();
    for (const b of BRANDS_MOCK) {
      const key = b[managerMode];
      if (!key) continue;
      const cur = map.get(key) || {
        name: key,
        targets: new Array(MONTHS.length).fill(0),
        actuals: new Array(MONTHS.length).fill(0),
        brands: [],
        brandDetails: [],
      };
      for (let i = 0; i < MONTHS.length; i++) {
        cur.targets[i] += b.targets[i];
        cur.actuals[i] += b.actuals[i];
      }
      cur.brands.push(b.name);
      cur.brandDetails.push({ name: b.name, targets: b.targets, actuals: b.actuals });
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => sum(b.actuals) - sum(a.actuals));
  }, [managerMode]);

  // 전체 Total
  const grandTargets = new Array(MONTHS.length).fill(0);
  const grandActuals = new Array(MONTHS.length).fill(0);
  for (const b of BRANDS_MOCK) {
    for (let i = 0; i < MONTHS.length; i++) {
      grandTargets[i] += b.targets[i];
      grandActuals[i] += b.actuals[i];
    }
  }
  const totalT = sum(grandTargets);
  const totalA = sum(grandActuals);
  const rate = totalT > 0 ? (totalA / totalT) * 100 : 0;

  return (
    <main style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, margin: 0, color: '#111' }}>브랜드 관리</h1>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>
          브랜드별 월별 목표 vs 실적 · 단위: 백만원 · <span style={{ color: '#6b7280' }}>mock 데이터</span>
        </p>
      </header>

      {/* 한 줄 요약 */}
      <div style={{
        display: 'flex', gap: 32, padding: '14px 18px', marginBottom: 16,
        ...card,
        fontSize: 13,
      }}>
        <Stat label="관리 브랜드" value={`${BRANDS_MOCK.length}개`} />
        <Stat label="누적 목표" value={`${totalT}`} unit="백만원" />
        <Stat label="누적 실적" value={`${totalA}`} unit="백만원" />
        <Stat label="달성률" value={`${rate.toFixed(0)}%`} muted={rate < 70} />
      </div>

      {/* 테이블 1: 브랜드별 */}
      <div style={{ ...card, marginBottom: 16 }}>
        <CardHeader title="브랜드별 월별 목표 vs 실적" />

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={thLeft}>브랜드</th>
                <th style={thLeft}>발굴</th>
                <th style={thLeft}>관리</th>
                <th style={th}>구분</th>
                {MONTHS.map(m => <th key={m} style={{ ...th, minWidth: 50 }}>{m}</th>)}
                <th style={{ ...th, background: C.indigoSoft }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {BRANDS_MOCK.map((b, i) => (
                <Fragment key={b.name}>
                  <tr style={{ borderTop: i > 0 ? `1px solid ${C.dividerSoft}` : 'none' }}>
                    <td rowSpan={2} style={{ ...td, fontWeight: 600, verticalAlign: 'middle', color: '#111' }}>{b.name}</td>
                    <td rowSpan={2} style={{ ...td, fontSize: 12, color: '#6b7280', verticalAlign: 'middle' }}>{b.discoverer}</td>
                    <td rowSpan={2} style={{ ...td, fontSize: 12, color: '#6b7280', verticalAlign: 'middle' }}>{b.manager}</td>
                    <td style={{ ...cellNum, fontSize: 11, color: '#9ca3af' }}>목표</td>
                    <MonthRow values={b.targets} muted />
                  </tr>
                  <tr>
                    <td style={{ ...cellNum, fontSize: 11, color: '#6b7280', fontWeight: 600 }}>실적</td>
                    <MonthRow values={b.actuals} bold />
                  </tr>
                </Fragment>
              ))}

              {/* Total */}
              <tr style={{ borderTop: `2px solid ${C.indigo}`, background: C.indigoSoft }}>
                <td colSpan={3} rowSpan={2} style={{ ...td, fontWeight: 700, textAlign: 'center', color: C.indigo, verticalAlign: 'middle', background: C.indigoSoft }}>
                  Total
                </td>
                <td style={{ ...cellNum, fontSize: 11, color: C.muted, fontWeight: 600, background: C.indigoSoft }}>목표</td>
                <MonthRow values={grandTargets} muted totalBg={C.indigoMid} />
              </tr>
              <tr style={{ background: C.indigoSoft }}>
                <td style={{ ...cellNum, fontSize: 11, color: C.indigo, fontWeight: 700, background: C.indigoSoft }}>실적</td>
                <MonthRow values={grandActuals} bold totalBg={C.indigoMid} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 테이블 2: 담당자별 */}
      <div style={card}>
        <CardHeader
          title="담당자별 합계"
          hint="2개 이상 브랜드를 맡은 담당자는 행 클릭 시 펼침"
          action={
            <div style={{ display: 'flex', gap: 4 }}>
              <ToggleBtn active={managerMode === 'discoverer'} onClick={() => switchMode('discoverer')}>발굴 담당자</ToggleBtn>
              <ToggleBtn active={managerMode === 'manager'} onClick={() => switchMode('manager')}>관리 담당자</ToggleBtn>
            </div>
          }
        />

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ ...th, width: 24 }}></th>
                <th style={thLeft}>담당자</th>
                <th style={thLeft}>담당 브랜드</th>
                <th style={th}>구분</th>
                {MONTHS.map(m => <th key={m} style={{ ...th, minWidth: 50 }}>{m}</th>)}
                <th style={{ ...th, background: C.indigoSoft }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {byManager.map((mgr, i) => {
                const multi = mgr.brands.length >= 2;
                const open = expandedMgr === mgr.name;
                const onClick = multi ? () => setExpandedMgr(open ? null : mgr.name) : undefined;
                return (
                  <Fragment key={mgr.name}>
                    <tr
                      onClick={onClick}
                      style={{
                        borderTop: i > 0 ? `1px solid ${C.dividerSoft}` : 'none',
                        cursor: multi ? 'pointer' : 'default',
                      }}
                    >
                      <td rowSpan={2} style={{ ...td, textAlign: 'center', color: '#9ca3af', verticalAlign: 'middle' }}>
                        {multi ? (open ? '−' : '+') : ''}
                      </td>
                      <td rowSpan={2} style={{ ...td, fontWeight: 600, verticalAlign: 'middle', color: '#111' }}>{mgr.name}</td>
                      <td rowSpan={2} style={{ ...td, fontSize: 12, color: '#6b7280', verticalAlign: 'middle' }}>
                        {mgr.brands.join(', ')}
                        <span style={{ marginLeft: 6, color: '#9ca3af', fontSize: 11 }}>· {mgr.brands.length}개</span>
                      </td>
                      <td style={{ ...cellNum, fontSize: 11, color: '#9ca3af' }}>목표</td>
                      <MonthRow values={mgr.targets} muted />
                    </tr>
                    <tr
                      onClick={onClick}
                      style={{ cursor: multi ? 'pointer' : 'default' }}
                    >
                      <td style={{ ...cellNum, fontSize: 11, color: '#6b7280', fontWeight: 600 }}>실적</td>
                      <MonthRow values={mgr.actuals} bold />
                    </tr>

                    {open && mgr.brandDetails.map(bd => (
                      <Fragment key={`${mgr.name}-${bd.name}`}>
                        <tr style={{ background: '#fafafa' }}>
                          <td></td>
                          <td colSpan={2} rowSpan={2} style={{
                            ...td, fontSize: 12, color: '#6b7280', verticalAlign: 'middle',
                            paddingLeft: 24,
                          }}>
                            {bd.name}
                          </td>
                          <td style={{ ...cellNum, fontSize: 11, color: '#9ca3af', background: '#fafafa' }}>목표</td>
                          {bd.targets.map((v, j) => (
                            <td key={j} style={{ ...cellNum, color: '#9ca3af', background: '#fafafa' }}>{v}</td>
                          ))}
                          <td style={{ ...cellNum, background: '#f3f4f6', color: '#9ca3af', fontWeight: 600 }}>{sum(bd.targets)}</td>
                        </tr>
                        <tr style={{ background: '#fafafa' }}>
                          <td></td>
                          <td style={{ ...cellNum, fontSize: 11, color: '#6b7280', fontWeight: 600, background: '#fafafa' }}>실적</td>
                          {bd.actuals.map((v, j) => (
                            <td key={j} style={{ ...cellNum, fontWeight: 600, background: '#fafafa' }}>{v}</td>
                          ))}
                          <td style={{ ...cellNum, background: '#f3f4f6', fontWeight: 700 }}>{sum(bd.actuals)}</td>
                        </tr>
                      </Fragment>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

// 한 줄 요약 통계
function Stat({ label, value, unit, muted }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: muted ? '#9ca3af' : '#111' }}>
        {value}
        {unit && <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af', marginLeft: 2 }}>{unit}</span>}
      </div>
    </div>
  );
}
