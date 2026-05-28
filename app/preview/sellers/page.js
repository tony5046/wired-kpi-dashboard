'use client';
import { useState, useMemo, Fragment } from 'react';
import { MOCK_SELLER_MGMT, MOCK_PARTNER_NOTION } from '../mock-data';

const MONTHS = MOCK_SELLER_MGMT.months;
const SELLERS = MOCK_SELLER_MGMT.sellers;
const PARTNERS = new Set(Object.keys(MOCK_PARTNER_NOTION));

const sum = (arr) => arr.reduce((a, v) => a + v, 0);

// ─── 컬러 시스템 (한 가지 액센트) ───
const C = {
  indigo:     '#4f46e5',
  indigoSoft:'#eef2ff',
  indigoMid: '#c7d2fe',
  emerald:    '#059669',
  emeraldSoft:'#ecfdf5',
  amber:      '#d97706',
  amberSoft:  '#fffbeb',
  rose:       '#dc2626',
  ink:        '#0f172a',
  muted:      '#64748b',
  faint:      '#94a3b8',
  divider:    '#e2e8f0',
  bg:         '#f8fafc',
};

// 달성률 색상 (4단계 아님 — 3단계)
function rateAccent(rate) {
  if (rate >= 100) return { color: C.emerald, bg: C.emeraldSoft, label: '달성' };
  if (rate >= 70)  return { color: C.indigo,  bg: C.indigoSoft,  label: '근접' };
  return                 { color: C.amber,   bg: C.amberSoft,   label: '미달' };
}

// ─────────────── 페이지 헤더 + 통계 ───────────────
function PageHeader() {
  const totalT = SELLERS.reduce((s, x) => s + sum(x.targets), 0);
  const totalA = SELLERS.reduce((s, x) => s + sum(x.actuals), 0);
  const rate = totalT > 0 ? (totalA / totalT) * 100 : 0;
  const partnerCount = SELLERS.filter(s => PARTNERS.has(s.name)).length;
  const acc = rateAccent(rate);

  return (
    <>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, margin: 0, color: C.ink, letterSpacing: '-0.02em' }}>
          🤝 셀러 관리
        </h1>
        <p style={{ fontSize: 13, color: C.muted, margin: '6px 0 0' }}>
          셀러별 월별 목표 vs 실적 · 단위: 백만원
          <span style={{ marginLeft: 8, padding: '2px 8px', background: C.bg, border: `1px solid ${C.divider}`, borderRadius: 4, fontSize: 11, color: C.muted }}>mock 데이터</span>
        </p>
      </header>

      {/* 통계 스트립 — 인디고 강조 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0,
        padding: 0, marginBottom: 20,
        background: '#fff', border: `1px solid ${C.divider}`, borderRadius: 12,
        overflow: 'hidden',
      }}>
        <Stat label="관리 셀러" value={`${SELLERS.length}`} unit="곳" />
        <Stat label="누적 목표" value={`${totalT.toLocaleString()}`} unit="백만원" />
        <Stat label="누적 실적" value={`${totalA.toLocaleString()}`} unit="백만원" accent />
        <Stat label="전체 달성률" value={`${rate.toFixed(1)}%`} accentColor={acc.color} bg={acc.bg} />
        <Stat label="🤝 파트너 셀러" value={`${partnerCount}`} unit="곳" />
      </div>
    </>
  );
}

function Stat({ label, value, unit, accent, accentColor, bg }) {
  return (
    <div style={{
      padding: '14px 18px',
      borderRight: `1px solid ${C.divider}`,
      background: bg || '#fff',
    }}>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{
        fontSize: 20, fontWeight: 700,
        color: accentColor || (accent ? C.indigo : C.ink),
        letterSpacing: '-0.02em',
      }}>
        {value}
        {unit && <span style={{ fontSize: 11, fontWeight: 500, color: C.faint, marginLeft: 4 }}>{unit}</span>}
      </div>
    </div>
  );
}

function PartnerTag() {
  return (
    <span style={{
      marginLeft: 8, fontSize: 10, padding: '2px 7px',
      background: C.indigoSoft, color: C.indigo, fontWeight: 600,
      borderRadius: 10,
    }}>🤝 파트너</span>
  );
}

// ============================================================
//  디자인 A: 테이블 + 달성률 + 미니 바
// ============================================================
function DesignA() {
  const th = {
    padding: '12px 8px',
    borderBottom: `2px solid ${C.divider}`,
    fontSize: 11, color: C.muted, fontWeight: 600,
    textAlign: 'center', whiteSpace: 'nowrap',
  };
  const thLeft = { ...th, textAlign: 'left' };
  const td = { padding: '10px 8px', fontSize: 13, color: C.ink, borderBottom: `1px solid #f1f5f9` };
  const cellNum = {
    padding: '8px', textAlign: 'center',
    fontSize: 13, borderBottom: `1px solid #f1f5f9`,
  };

  const grandT = new Array(MONTHS.length).fill(0);
  const grandA = new Array(MONTHS.length).fill(0);
  for (const s of SELLERS) {
    for (let i = 0; i < MONTHS.length; i++) {
      grandT[i] += s.targets[i];
      grandA[i] += s.actuals[i];
    }
  }
  const grandRate = sum(grandT) > 0 ? (sum(grandA) / sum(grandT)) * 100 : 0;

  return (
    <div style={{
      padding: 20, background: '#fff',
      border: `1px solid ${C.divider}`, borderRadius: 12,
      boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thLeft}>셀러</th>
              <th style={thLeft}>담당자</th>
              <th style={th}>구분</th>
              {MONTHS.map(m => <th key={m} style={{ ...th, minWidth: 54 }}>{m}</th>)}
              <th style={{ ...th, background: C.bg }}>Total</th>
              <th style={{ ...th, background: C.bg, minWidth: 90 }}>달성률</th>
            </tr>
          </thead>
          <tbody>
            {SELLERS.map((s, i) => {
              const tTotal = sum(s.targets);
              const aTotal = sum(s.actuals);
              const rate = tTotal > 0 ? (aTotal / tTotal) * 100 : 0;
              const acc = rateAccent(rate);
              return (
                <Fragment key={s.name}>
                  <tr style={{ borderTop: i > 0 ? `1px solid ${C.divider}` : 'none' }}>
                    <td rowSpan={2} style={{ ...td, fontWeight: 600, fontSize: 14, verticalAlign: 'middle' }}>
                      {s.name}
                      {PARTNERS.has(s.name) && <PartnerTag />}
                    </td>
                    <td rowSpan={2} style={{ ...td, fontSize: 12, color: C.muted, verticalAlign: 'middle' }}>{s.manager}</td>
                    <td style={{ ...cellNum, fontSize: 11, color: C.faint, fontWeight: 500 }}>목표</td>
                    {s.targets.map((v, j) => <td key={j} style={{ ...cellNum, color: C.faint }}>{v}</td>)}
                    <td style={{ ...cellNum, fontWeight: 600, color: C.faint, background: C.bg }}>{tTotal}</td>
                    <td rowSpan={2} style={{ ...cellNum, verticalAlign: 'middle', background: C.bg }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 10px', borderRadius: 8,
                        background: acc.bg, color: acc.color,
                        fontWeight: 700, fontSize: 13,
                      }}>{rate.toFixed(0)}%</div>
                      {/* 미니 프로그레스 바 */}
                      <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(rate, 100)}%`, height: '100%',
                          background: acc.color, borderRadius: 2,
                        }} />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ ...cellNum, fontSize: 11, color: C.indigo, fontWeight: 700 }}>실적</td>
                    {s.actuals.map((v, j) => (
                      <td key={j} style={{ ...cellNum, fontWeight: 600, color: C.ink }}>{v}</td>
                    ))}
                    <td style={{ ...cellNum, fontWeight: 700, background: C.bg, color: C.ink }}>{aTotal}</td>
                  </tr>
                </Fragment>
              );
            })}

            {/* Total */}
            <tr style={{ borderTop: `2px solid ${C.indigo}`, background: C.indigoSoft }}>
              <td colSpan={2} rowSpan={2} style={{
                ...td, fontWeight: 700, fontSize: 14,
                textAlign: 'center', verticalAlign: 'middle', color: C.indigo,
                background: C.indigoSoft,
              }}>Total</td>
              <td style={{ ...cellNum, fontSize: 11, color: C.muted, fontWeight: 600, background: C.indigoSoft }}>목표</td>
              {grandT.map((v, j) => <td key={j} style={{ ...cellNum, color: C.muted, background: C.indigoSoft }}>{v}</td>)}
              <td style={{ ...cellNum, fontWeight: 700, color: C.muted, background: C.indigoMid }}>{sum(grandT)}</td>
              <td rowSpan={2} style={{ ...cellNum, verticalAlign: 'middle', background: C.indigoMid, fontWeight: 800, fontSize: 16, color: C.indigo }}>
                {grandRate.toFixed(0)}%
              </td>
            </tr>
            <tr style={{ background: C.indigoSoft }}>
              <td style={{ ...cellNum, fontSize: 11, color: C.indigo, fontWeight: 700, background: C.indigoSoft }}>실적</td>
              {grandA.map((v, j) => <td key={j} style={{ ...cellNum, fontWeight: 700, color: C.ink, background: C.indigoSoft }}>{v}</td>)}
              <td style={{ ...cellNum, fontWeight: 800, color: C.indigo, background: C.indigoMid, fontSize: 14 }}>{sum(grandA)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
//  디자인 B: 카드 그리드 + 막대 + 달성률 강조
// ============================================================
function DesignB() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
      {SELLERS.map(s => {
        const totalT = sum(s.targets);
        const totalA = sum(s.actuals);
        const rate = totalT > 0 ? (totalA / totalT) * 100 : 0;
        const acc = rateAccent(rate);
        const maxVal = Math.max(...s.targets, ...s.actuals);
        const lastMonth = s.actuals[s.actuals.length - 1];
        const prevMonth = s.actuals[s.actuals.length - 2];
        const delta = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;

        return (
          <div key={s.name} style={{
            padding: 20, background: '#fff',
            border: `1px solid ${C.divider}`, borderRadius: 12,
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          }}>
            {/* 상단: 이름 + 달성률 큰 박스 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, letterSpacing: '-0.01em' }}>
                  {s.name}
                  {PARTNERS.has(s.name) && <PartnerTag />}
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>담당 · {s.manager}</div>
              </div>
              <div style={{
                padding: '8px 14px', borderRadius: 10,
                background: acc.bg, textAlign: 'center', minWidth: 70,
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: acc.color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {rate.toFixed(0)}%
                </div>
                <div style={{ fontSize: 10, color: acc.color, marginTop: 2, fontWeight: 600 }}>{acc.label}</div>
              </div>
            </div>

            {/* 실적/목표 + 전월대비 */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
              padding: '10px 0', marginBottom: 14,
              borderTop: `1px solid ${C.divider}`,
              borderBottom: `1px solid ${C.divider}`,
            }}>
              <div>
                <div style={{ fontSize: 10, color: C.muted }}>누적 실적</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{totalA}<span style={{ fontSize: 10, color: C.faint, fontWeight: 500 }}> M</span></div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.muted }}>누적 목표</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.faint }}>{totalT}<span style={{ fontSize: 10, color: C.faint, fontWeight: 500 }}> M</span></div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.muted }}>최근월 전월비</div>
                <div style={{
                  fontSize: 15, fontWeight: 700,
                  color: delta >= 0 ? C.emerald : C.rose,
                }}>
                  {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* 월별 막대 (목표 outline + 실적 채움) */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90, marginBottom: 6 }}>
              {MONTHS.map((m, i) => {
                const tHeight = (s.targets[i] / maxVal) * 100;
                const aHeight = (s.actuals[i] / maxVal) * 100;
                const monthRate = s.targets[i] > 0 ? (s.actuals[i] / s.targets[i]) * 100 : 0;
                const monthAcc = rateAccent(monthRate);
                return (
                  <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 70, width: '100%', justifyContent: 'center' }}>
                      {/* 목표: 회색 외곽선 */}
                      <div style={{
                        width: 10, height: `${tHeight}%`,
                        background: '#fff',
                        border: `1.5px solid ${C.divider}`,
                        borderRadius: 3,
                      }} />
                      {/* 실적: 달성률 색상 */}
                      <div style={{
                        width: 10, height: `${aHeight}%`,
                        background: monthAcc.color,
                        borderRadius: 3,
                        transition: 'all 0.15s',
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: C.faint, fontWeight: 500 }}>{m}</div>
                  </div>
                );
              })}
            </div>

            {/* 범례 */}
            <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 10, color: C.faint, justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, border: `1.5px solid ${C.divider}`, borderRadius: 2 }} />
                목표
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  <div style={{ width: 8, height: 10, background: C.emerald, borderRadius: 1 }} />
                  <div style={{ width: 8, height: 10, background: C.indigo, borderRadius: 1 }} />
                  <div style={{ width: 8, height: 10, background: C.amber, borderRadius: 1 }} />
                </div>
                실적 (달성률 색)
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
//  디자인 C: 라인 추이 + 영역 그라데이션 + 끝점 강조
// ============================================================
function DesignC() {
  return (
    <div style={{
      padding: 20, background: '#fff',
      border: `1px solid ${C.divider}`, borderRadius: 12,
      boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '200px 90px 1fr 80px 80px 90px',
          gap: 16, padding: '12px',
          fontSize: 11, color: C.muted, fontWeight: 600,
          borderBottom: `2px solid ${C.divider}`,
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          <div>셀러</div>
          <div>담당자</div>
          <div style={{ textAlign: 'center' }}>월별 추이</div>
          <div style={{ textAlign: 'right' }}>목표</div>
          <div style={{ textAlign: 'right' }}>실적</div>
          <div style={{ textAlign: 'right' }}>달성률</div>
        </div>

        {SELLERS.map((s, i) => {
          const totalT = sum(s.targets);
          const totalA = sum(s.actuals);
          const rate = totalT > 0 ? (totalA / totalT) * 100 : 0;
          const acc = rateAccent(rate);
          const maxVal = Math.max(...s.targets, ...s.actuals);

          // Sparkline
          const w = 280, h = 50;
          const ptsActuals = s.actuals.map((v, j) => {
            const x = (j / (MONTHS.length - 1)) * w;
            const y = h - (v / maxVal) * (h - 6) - 3;
            return [x, y];
          });
          const ptsTargets = s.targets.map((v, j) => {
            const x = (j / (MONTHS.length - 1)) * w;
            const y = h - (v / maxVal) * (h - 6) - 3;
            return [x, y];
          });
          // 영역 path (실적 라인 아래)
          const areaPath = `M ${ptsActuals[0][0]},${h} ${ptsActuals.map(p => `L ${p[0]},${p[1]}`).join(' ')} L ${ptsActuals[ptsActuals.length-1][0]},${h} Z`;
          const gradId = `grad-${i}`;
          const lastPt = ptsActuals[ptsActuals.length - 1];

          return (
            <div key={s.name} style={{
              display: 'grid',
              gridTemplateColumns: '200px 90px 1fr 80px 80px 90px',
              gap: 16, padding: '16px 12px',
              alignItems: 'center',
              borderBottom: i < SELLERS.length - 1 ? `1px solid ${C.divider}` : 'none',
              fontSize: 13,
              transition: 'background 0.15s',
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = C.bg}
              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
            >
              <div>
                <div style={{ fontWeight: 700, color: C.ink, fontSize: 14 }}>
                  {s.name}
                  {PARTNERS.has(s.name) && <PartnerTag />}
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>{s.manager}</div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg width={w + 30} height={h + 16} style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={acc.color} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={acc.color} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* 영역 fill */}
                  <path d={areaPath} fill={`url(#${gradId})`} />
                  {/* 목표 선 (점선 회색) */}
                  <polyline
                    points={ptsTargets.map(p => p.join(',')).join(' ')}
                    fill="none" stroke={C.faint} strokeWidth={1.5}
                    strokeDasharray="3,3"
                  />
                  {/* 실적 선 (액센트 색) */}
                  <polyline
                    points={ptsActuals.map(p => p.join(',')).join(' ')}
                    fill="none" stroke={acc.color} strokeWidth={2.5}
                  />
                  {/* 끝점 강조 */}
                  <circle cx={lastPt[0]} cy={lastPt[1]} r={4} fill="#fff" stroke={acc.color} strokeWidth={2} />
                  {/* 끝점 옆 마지막 값 */}
                  <text x={lastPt[0] + 8} y={lastPt[1] + 4} fontSize="11" fontWeight="700" fill={acc.color}>
                    {s.actuals[s.actuals.length - 1]}
                  </text>
                </svg>
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, color: C.faint, fontWeight: 500 }}>{totalT}</div>
              <div style={{ textAlign: 'right', fontSize: 15, color: C.ink, fontWeight: 700 }}>{totalA}</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '5px 10px', borderRadius: 8,
                  background: acc.bg, color: acc.color,
                  fontWeight: 700, fontSize: 13,
                }}>{rate.toFixed(0)}%</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.divider}`, fontSize: 11, color: C.muted, justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke={C.faint} strokeWidth="1.5" strokeDasharray="3,3" /></svg>
          목표
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke={C.ink} strokeWidth="2.5" /></svg>
          실적 (달성률 색)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, background: C.emeraldSoft, border: `1px solid ${C.emerald}`, borderRadius: 2 }} />
            <span style={{ color: C.emerald, fontWeight: 600 }}>달성</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, background: C.indigoSoft, border: `1px solid ${C.indigo}`, borderRadius: 2 }} />
            <span style={{ color: C.indigo, fontWeight: 600 }}>근접</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, background: C.amberSoft, border: `1px solid ${C.amber}`, borderRadius: 2 }} />
            <span style={{ color: C.amber, fontWeight: 600 }}>미달</span>
          </div>
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
        padding: '10px 14px', background: '#fff',
        border: `1px solid ${C.divider}`, borderRadius: 10,
        alignItems: 'center',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
      }}>
        <span style={{ fontSize: 12, color: C.muted, marginRight: 8, fontWeight: 600 }}>디자인 비교:</span>
        {[
          { k: 'A', label: 'A · 테이블 + 달성률 바' },
          { k: 'B', label: 'B · 카드 + 막대' },
          { k: 'C', label: 'C · 라인 추이 (sparkline)' },
        ].map(opt => (
          <button
            key={opt.k}
            onClick={() => setDesign(opt.k)}
            style={{
              padding: '7px 14px', fontSize: 12,
              fontWeight: design === opt.k ? 700 : 500,
              background: design === opt.k ? C.indigo : '#fff',
              color: design === opt.k ? '#fff' : C.muted,
              border: '1px solid ' + (design === opt.k ? C.indigo : C.divider),
              borderRadius: 6, cursor: 'pointer',
              transition: 'all 0.15s',
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
