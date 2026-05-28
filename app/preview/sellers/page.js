'use client';
import { useState, useMemo, Fragment } from 'react';
import { MOCK_SELLER_MGMT, MOCK_PARTNER_NOTION } from '../mock-data';

const MONTHS = MOCK_SELLER_MGMT.months;
const SELLERS = MOCK_SELLER_MGMT.sellers;
const PARTNERS = new Set(Object.keys(MOCK_PARTNER_NOTION));

const sum = (arr) => arr.reduce((a, v) => a + v, 0);

// ─────────────── 공통 스타일 ───────────────
const card = {
  padding: 20, background: '#fff',
  border: '1px solid #e5e7eb', borderRadius: 10,
};

function PageHeader() {
  const totalT = SELLERS.reduce((s, x) => s + sum(x.targets), 0);
  const totalA = SELLERS.reduce((s, x) => s + sum(x.actuals), 0);
  const rate = totalT > 0 ? (totalA / totalT) * 100 : 0;
  return (
    <>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, margin: 0, color: '#111' }}>셀러 관리</h1>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>
          셀러별 월별 목표 vs 실적 · 단위: 백만원 · <span style={{ color: '#6b7280' }}>mock 데이터</span>
        </p>
      </header>

      <div style={{
        display: 'flex', gap: 32, padding: '12px 16px', marginBottom: 16,
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
        fontSize: 13,
      }}>
        <Stat label="관리 셀러" value={`${SELLERS.length}곳`} />
        <Stat label="누적 목표" value={`${totalT}`} unit="백만원" />
        <Stat label="누적 실적" value={`${totalA}`} unit="백만원" />
        <Stat label="달성률" value={`${rate.toFixed(0)}%`} muted={rate < 70} />
        <Stat label="파트너 셀러" value={`${SELLERS.filter(s => PARTNERS.has(s.name)).length}곳`} />
      </div>
    </>
  );
}

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

// ============================================================
//  디자인 A: 미니멀 테이블 (브랜드 관리와 동일 컨셉)
// ============================================================
function DesignA() {
  const th = { padding: '10px 8px', borderBottom: '1px solid #d1d5db', fontSize: 11, color: '#6b7280', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' };
  const thLeft = { ...th, textAlign: 'left' };
  const td = { padding: '8px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6' };
  const cellNum = { padding: '6px 8px', textAlign: 'center', fontSize: 13, borderBottom: '1px solid #f3f4f6' };

  const grandT = new Array(MONTHS.length).fill(0);
  const grandA = new Array(MONTHS.length).fill(0);
  for (const s of SELLERS) {
    for (let i = 0; i < MONTHS.length; i++) {
      grandT[i] += s.targets[i];
      grandA[i] += s.actuals[i];
    }
  }

  return (
    <div style={card}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thLeft}>셀러</th>
              <th style={thLeft}>담당자</th>
              <th style={th}>구분</th>
              {MONTHS.map(m => <th key={m} style={{ ...th, minWidth: 50 }}>{m}</th>)}
              <th style={{ ...th, background: '#f9fafb' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {SELLERS.map((s, i) => (
              <Fragment key={s.name}>
                <tr style={{ borderTop: i > 0 ? '1px solid #e5e7eb' : 'none' }}>
                  <td rowSpan={2} style={{ ...td, fontWeight: 600, verticalAlign: 'middle', color: '#111' }}>
                    {s.name}
                    {PARTNERS.has(s.name) && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: '#9ca3af' }}>· 파트너</span>
                    )}
                  </td>
                  <td rowSpan={2} style={{ ...td, fontSize: 12, color: '#6b7280', verticalAlign: 'middle' }}>{s.manager}</td>
                  <td style={{ ...cellNum, fontSize: 11, color: '#9ca3af' }}>목표</td>
                  {s.targets.map((v, j) => <td key={j} style={{ ...cellNum, color: '#9ca3af' }}>{v}</td>)}
                  <td style={{ ...cellNum, fontWeight: 700, color: '#9ca3af', background: '#f9fafb' }}>{sum(s.targets)}</td>
                </tr>
                <tr>
                  <td style={{ ...cellNum, fontSize: 11, color: '#6b7280', fontWeight: 600 }}>실적</td>
                  {s.actuals.map((v, j) => <td key={j} style={{ ...cellNum, fontWeight: 600, color: '#1f2937' }}>{v}</td>)}
                  <td style={{ ...cellNum, fontWeight: 700, background: '#f9fafb', color: '#111' }}>{sum(s.actuals)}</td>
                </tr>
              </Fragment>
            ))}
            <tr style={{ borderTop: '2px solid #d1d5db', background: '#f9fafb' }}>
              <td colSpan={2} rowSpan={2} style={{ ...td, fontWeight: 700, textAlign: 'center', verticalAlign: 'middle', color: '#111' }}>Total</td>
              <td style={{ ...cellNum, fontSize: 11, color: '#9ca3af' }}>목표</td>
              {grandT.map((v, j) => <td key={j} style={{ ...cellNum, color: '#9ca3af' }}>{v}</td>)}
              <td style={{ ...cellNum, fontWeight: 700, color: '#9ca3af', background: '#f3f4f6' }}>{sum(grandT)}</td>
            </tr>
            <tr style={{ background: '#f9fafb' }}>
              <td style={{ ...cellNum, fontSize: 11, color: '#6b7280', fontWeight: 600 }}>실적</td>
              {grandA.map((v, j) => <td key={j} style={{ ...cellNum, fontWeight: 700, color: '#111' }}>{v}</td>)}
              <td style={{ ...cellNum, fontWeight: 700, background: '#f3f4f6', color: '#111' }}>{sum(grandA)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
//  디자인 B: 카드 그리드 — 각 셀러를 개별 카드로
// ============================================================
function DesignB() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
      {SELLERS.map(s => {
        const totalT = sum(s.targets);
        const totalA = sum(s.actuals);
        const rate = totalT > 0 ? (totalA / totalT) * 100 : 0;
        const maxVal = Math.max(...s.targets, ...s.actuals);

        return (
          <div key={s.name} style={{
            padding: 16, background: '#fff',
            border: '1px solid #e5e7eb', borderRadius: 10,
          }}>
            {/* 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>
                  {s.name}
                  {PARTNERS.has(s.name) && (
                    <span style={{ marginLeft: 6, fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>· 파트너</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>담당 {s.manager}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>{rate.toFixed(0)}%</div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>달성률</div>
              </div>
            </div>

            {/* Total: 실적 / 목표 */}
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ fontWeight: 700, color: '#111' }}>{totalA}</span>
              <span style={{ color: '#9ca3af' }}> / {totalT} 백만원</span>
            </div>

            {/* 월별 막대 */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
              {MONTHS.map((m, i) => {
                const tHeight = (s.targets[i] / maxVal) * 100;
                const aHeight = (s.actuals[i] / maxVal) * 100;
                return (
                  <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 60, width: '100%', justifyContent: 'center' }}>
                      {/* 목표 (회색 외곽선) */}
                      <div style={{
                        width: 8, height: `${tHeight}%`,
                        background: 'transparent',
                        border: '1px solid #d1d5db',
                        borderRadius: 2,
                      }} />
                      {/* 실적 (검정 채움) */}
                      <div style={{
                        width: 8, height: `${aHeight}%`,
                        background: '#111',
                        borderRadius: 2,
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>{m}</div>
                  </div>
                );
              })}
            </div>

            {/* 범례 */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 10, color: '#9ca3af', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, border: '1px solid #d1d5db', borderRadius: 1 }} />목표
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, background: '#111', borderRadius: 1 }} />실적
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
//  디자인 C: 라인 그래프 행 — 한 줄에 미니 트렌드
// ============================================================
function DesignC() {
  return (
    <div style={card}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* 헤더 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '180px 80px 1fr 90px 90px 70px',
          gap: 16, padding: '10px 12px',
          fontSize: 11, color: '#6b7280', fontWeight: 600,
          borderBottom: '1px solid #d1d5db',
        }}>
          <div>셀러</div>
          <div>담당자</div>
          <div style={{ textAlign: 'center' }}>월별 추이 ({MONTHS[0]} ~ {MONTHS[MONTHS.length - 1]})</div>
          <div style={{ textAlign: 'right' }}>목표 Total</div>
          <div style={{ textAlign: 'right' }}>실적 Total</div>
          <div style={{ textAlign: 'right' }}>달성률</div>
        </div>

        {SELLERS.map((s, i) => {
          const totalT = sum(s.targets);
          const totalA = sum(s.actuals);
          const rate = totalT > 0 ? (totalA / totalT) * 100 : 0;
          const maxVal = Math.max(...s.targets, ...s.actuals);

          // SVG sparkline for actual line
          const w = 280, h = 36;
          const pts = (arr) => arr.map((v, j) => {
            const x = (j / (MONTHS.length - 1)) * w;
            const y = h - (v / maxVal) * (h - 4) - 2;
            return `${x},${y}`;
          }).join(' ');

          return (
            <div key={s.name} style={{
              display: 'grid',
              gridTemplateColumns: '180px 80px 1fr 90px 90px 70px',
              gap: 16, padding: '12px',
              alignItems: 'center',
              borderBottom: i < SELLERS.length - 1 ? '1px solid #f3f4f6' : 'none',
              fontSize: 13,
            }}>
              <div style={{ fontWeight: 600, color: '#111' }}>
                {s.name}
                {PARTNERS.has(s.name) && (
                  <span style={{ marginLeft: 6, fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>· 파트너</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{s.manager}</div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <svg width={w} height={h} style={{ overflow: 'visible' }}>
                  {/* 목표 선 (얇은 회색 점선) */}
                  <polyline
                    points={pts(s.targets)}
                    fill="none" stroke="#d1d5db" strokeWidth={1.5}
                    strokeDasharray="3,3"
                  />
                  {/* 실적 선 (진한 검정) */}
                  <polyline
                    points={pts(s.actuals)}
                    fill="none" stroke="#111" strokeWidth={2}
                  />
                  {/* 실적 점 */}
                  {s.actuals.map((v, j) => {
                    const x = (j / (MONTHS.length - 1)) * w;
                    const y = h - (v / maxVal) * (h - 4) - 2;
                    return <circle key={j} cx={x} cy={y} r={2.5} fill="#111" />;
                  })}
                </svg>
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, color: '#9ca3af' }}>{totalT}</div>
              <div style={{ textAlign: 'right', fontSize: 14, color: '#111', fontWeight: 700 }}>{totalA}</div>
              <div style={{
                textAlign: 'right', fontSize: 13, fontWeight: 700,
                color: rate >= 100 ? '#111' : rate >= 70 ? '#6b7280' : '#9ca3af',
              }}>{rate.toFixed(0)}%</div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: '#9ca3af', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="3,3" /></svg>
          목표
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#111" strokeWidth="2" /></svg>
          실적
        </div>
      </div>
    </div>
  );
}

// ─────────────── 메인 ───────────────
export default function SellersPage() {
  const [design, setDesign] = useState('A');

  return (
    <main style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      <PageHeader />

      {/* 디자인 선택 */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 16,
        padding: '8px 12px', background: '#f9fafb',
        border: '1px solid #e5e7eb', borderRadius: 10,
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: '#6b7280', marginRight: 8 }}>디자인 비교:</span>
        {[
          { k: 'A', label: 'A · 테이블 (브랜드 관리와 동일)' },
          { k: 'B', label: 'B · 카드 그리드 (막대)' },
          { k: 'C', label: 'C · 라인 추이 (sparkline)' },
        ].map(opt => (
          <button
            key={opt.k}
            onClick={() => setDesign(opt.k)}
            style={{
              padding: '6px 12px', fontSize: 12,
              fontWeight: design === opt.k ? 700 : 400,
              background: design === opt.k ? '#111' : '#fff',
              color: design === opt.k ? '#fff' : '#6b7280',
              border: '1px solid ' + (design === opt.k ? '#111' : '#d1d5db'),
              borderRadius: 6, cursor: 'pointer',
            }}
          >{opt.label}</button>
        ))}
      </div>

      {design === 'A' && <DesignA />}
      {design === 'B' && <DesignB />}
      {design === 'C' && <DesignC />}
    </main>
  );
}
