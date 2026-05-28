'use client';
import { useState, useMemo, Fragment } from 'react';
import { MOCK_SELLER_MGMT, MOCK_PARTNER_NOTION } from '../mock-data';

const MONTHS = MOCK_SELLER_MGMT.months;
const ALL_SELLERS = MOCK_SELLER_MGMT.sellers;
const COMPLETED_MONTHS = new Set(MOCK_SELLER_MGMT.completedMonths);
const PARTNERS = new Set(Object.keys(MOCK_PARTNER_NOTION));

// 담당자 목록 (mock 데이터에서 추출)
const MANAGERS = [...new Set(ALL_SELLERS.map(s => s.manager))].sort();

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
function PageHeader({ sellers }) {
  const totalT = sellers.reduce((s, x) => s + sum(x.targets), 0);
  const totalA = sellers.reduce((s, x) => s + sum(x.actuals), 0);
  const rate = totalT > 0 ? (totalA / totalT) * 100 : 0;
  const partnerCount = sellers.filter(s => PARTNERS.has(s.name)).length;
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
        padding: 0, marginBottom: 16,
        background: '#fff', border: `1px solid ${C.divider}`, borderRadius: 12,
        overflow: 'hidden',
      }}>
        <Stat label="관리 셀러" value={`${sellers.length}`} unit="곳" />
        <Stat label="누적 목표" value={`${totalT.toLocaleString()}`} unit="백만원" />
        <Stat label="누적 실적" value={`${totalA.toLocaleString()}`} unit="백만원" accent />
        <Stat label="전체 달성률" value={`${rate.toFixed(1)}%`} accentColor={acc.color} bg={acc.bg} />
        <Stat label="🤝 파트너 셀러" value={`${partnerCount}`} unit="곳" />
      </div>
    </>
  );
}

// ─────────────── 담당자 필터 칩 ───────────────
function ManagerFilter({ managerFilter, setManagerFilter, partnerOnly, setPartnerOnly }) {
  const totalCount = ALL_SELLERS.length;
  const counts = MANAGERS.reduce((acc, m) => {
    acc[m] = ALL_SELLERS.filter(s => s.manager === m).length;
    return acc;
  }, {});
  const partnerCount = ALL_SELLERS.filter(s => PARTNERS.has(s.name)).length;

  return (
    <div style={{
      display: 'flex', gap: 10, marginBottom: 16, padding: '12px 14px',
      background: '#fff', border: `1px solid ${C.divider}`, borderRadius: 10,
      alignItems: 'center', flexWrap: 'wrap',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>담당자</span>
        <Chip active={managerFilter === 'all'} onClick={() => setManagerFilter('all')}>
          전체 ({totalCount})
        </Chip>
        {MANAGERS.map(m => (
          <Chip key={m} active={managerFilter === m} onClick={() => setManagerFilter(m)}>
            {m} ({counts[m]})
          </Chip>
        ))}
      </div>
      <div style={{ width: 1, height: 22, background: C.divider }} />
      <Chip active={partnerOnly} onClick={() => setPartnerOnly(!partnerOnly)} accent>
        🤝 파트너만 ({partnerCount})
      </Chip>
    </div>
  );
}

function Chip({ active, onClick, children, accent }) {
  const activeColor = accent ? C.indigo : C.ink;
  return (
    <button onClick={onClick} style={{
      padding: '5px 11px', fontSize: 12,
      fontWeight: active ? 700 : 500,
      background: active ? activeColor : '#fff',
      color: active ? '#fff' : C.muted,
      border: '1px solid ' + (active ? activeColor : C.divider),
      borderRadius: 14, cursor: 'pointer',
      transition: 'all 0.12s',
    }}>{children}</button>
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
//  디자인 A: 테이블 + 달성률 + 셀러 클릭 → 월별 마켓 펼침
// ============================================================
function DesignA({ sellers }) {
  const [expanded, setExpanded] = useState(null);

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
  for (const s of sellers) {
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
      <div style={{
        padding: '8px 12px', marginBottom: 10, background: C.indigoSoft,
        border: `1px solid ${C.indigoMid}`, borderRadius: 6,
        fontSize: 12, color: C.indigo, fontWeight: 500,
      }}>
        💡 셀러 행을 클릭하면 월별로 진행한/예정인 마켓 상세가 펼쳐져요 (실제매출 · 영업이익 · 예상매출)
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 24 }}></th>
              <th style={thLeft}>셀러</th>
              <th style={thLeft}>담당자</th>
              <th style={th}>구분</th>
              {MONTHS.map((m, i) => (
                <th key={m} style={{ ...th, minWidth: 54 }}>
                  {m}
                  {!COMPLETED_MONTHS.has(i) && (
                    <div style={{ fontSize: 9, color: C.faint, fontWeight: 500, marginTop: 2 }}>예정</div>
                  )}
                </th>
              ))}
              <th style={{ ...th, background: C.bg }}>Total</th>
              <th style={{ ...th, background: C.bg, minWidth: 90 }}>달성률</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((s, i) => {
              const tTotal = sum(s.targets);
              const aTotal = sum(s.actuals);
              const rate = tTotal > 0 ? (aTotal / tTotal) * 100 : 0;
              const acc = rateAccent(rate);
              const isOpen = expanded === s.name;

              return (
                <Fragment key={s.name}>
                  <tr
                    onClick={() => setExpanded(isOpen ? null : s.name)}
                    style={{
                      borderTop: i > 0 ? `1px solid ${C.divider}` : 'none',
                      cursor: 'pointer',
                      background: isOpen ? C.indigoSoft : 'transparent',
                    }}
                  >
                    <td rowSpan={2} style={{ ...td, textAlign: 'center', color: C.faint, verticalAlign: 'middle' }}>
                      {isOpen ? '−' : '+'}
                    </td>
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
                      <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(rate, 100)}%`, height: '100%',
                          background: acc.color, borderRadius: 2,
                        }} />
                      </div>
                    </td>
                  </tr>
                  <tr
                    onClick={() => setExpanded(isOpen ? null : s.name)}
                    style={{ cursor: 'pointer', background: isOpen ? C.indigoSoft : 'transparent' }}
                  >
                    <td style={{ ...cellNum, fontSize: 11, color: C.indigo, fontWeight: 700 }}>실적</td>
                    {s.actuals.map((v, j) => (
                      <td key={j} style={{ ...cellNum, fontWeight: 600, color: COMPLETED_MONTHS.has(j) ? C.ink : C.faint }}>
                        {COMPLETED_MONTHS.has(j) ? v : '-'}
                      </td>
                    ))}
                    <td style={{ ...cellNum, fontWeight: 700, background: C.bg, color: C.ink }}>{aTotal}</td>
                  </tr>

                  {/* 펼침: 월별 마켓 상세 */}
                  {isOpen && (
                    <tr>
                      <td colSpan={MONTHS.length + 5} style={{ padding: 0, background: '#fafbff', borderBottom: `1px solid ${C.divider}` }}>
                        <MarketDetail seller={s} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}

            {/* Total */}
            <tr style={{ borderTop: `2px solid ${C.indigo}`, background: C.indigoSoft }}>
              <td></td>
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
              <td></td>
              <td style={{ ...cellNum, fontSize: 11, color: C.indigo, fontWeight: 700, background: C.indigoSoft }}>실적</td>
              {grandA.map((v, j) => (
                <td key={j} style={{ ...cellNum, fontWeight: 700, color: COMPLETED_MONTHS.has(j) ? C.ink : C.faint, background: C.indigoSoft }}>
                  {COMPLETED_MONTHS.has(j) ? v : '-'}
                </td>
              ))}
              <td style={{ ...cellNum, fontWeight: 800, color: C.indigo, background: C.indigoMid, fontSize: 14 }}>{sum(grandA)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 셀러 펼친 영역: 월별 마켓 상세
function MarketDetail({ seller }) {
  return (
    <div style={{ padding: '14px 20px 20px' }}>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, fontWeight: 600 }}>
        📋 {seller.name} 마켓 진행 내역
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {MONTHS.map((monthLabel, mIdx) => {
          const markets = seller.marketsByMonth[mIdx] || [];
          const isCompleted = COMPLETED_MONTHS.has(mIdx);
          return (
            <div key={monthLabel} style={{
              padding: 12, background: '#fff',
              border: `1px solid ${C.divider}`, borderRadius: 8,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${C.divider}`,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{monthLabel}</span>
                <span style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 8, fontWeight: 600,
                  background: isCompleted ? C.emeraldSoft : C.amberSoft,
                  color: isCompleted ? C.emerald : C.amber,
                }}>
                  {isCompleted ? '✓ 완료' : '⏳ 예정'}
                </span>
              </div>

              {markets.length === 0 ? (
                <div style={{ fontSize: 11, color: C.faint, textAlign: 'center', padding: '8px 0' }}>
                  마켓 없음
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {markets.map((m, mi) => (
                    <div key={mi} style={{ paddingBottom: mi < markets.length - 1 ? 8 : 0, borderBottom: mi < markets.length - 1 ? `1px dashed ${C.divider}` : 'none' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 4 }}>
                        {m.name}
                      </div>
                      <div style={{ display: 'flex', gap: 0, fontSize: 11 }}>
                        <MarketMetric label="실제매출" value={isCompleted ? m.actualSales : null} accent={isCompleted} />
                        <MarketMetric label="영업이익" value={isCompleted ? m.profit : null} />
                        <MarketMetric label="예상매출" value={m.estimatedSales} muted />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MarketMetric({ label, value, accent, muted }) {
  return (
    <div style={{ flex: 1, paddingRight: 6 }}>
      <div style={{ fontSize: 9, color: C.faint, marginBottom: 2 }}>{label}</div>
      <div style={{
        fontSize: 13,
        fontWeight: accent ? 700 : 600,
        color: value == null ? C.faint : accent ? C.indigo : muted ? C.muted : C.ink,
      }}>
        {value == null ? '-' : value}
        <span style={{ fontSize: 9, fontWeight: 500, color: C.faint, marginLeft: 1 }}>M</span>
      </div>
    </div>
  );
}

// ============================================================
//  디자인 B: 카드 그리드 + 막대 + 달성률 강조
// ============================================================
function DesignB({ sellers }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
      {sellers.map(s => {
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
function DesignC({ sellers }) {
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

        {sellers.map((s, i) => {
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
              borderBottom: i < sellers.length - 1 ? `1px solid ${C.divider}` : 'none',
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
  const [managerFilter, setManagerFilter] = useState('all');
  const [partnerOnly, setPartnerOnly] = useState(false);

  // 필터 적용된 셀러 리스트
  const filteredSellers = useMemo(() => {
    let arr = ALL_SELLERS;
    if (managerFilter !== 'all') arr = arr.filter(s => s.manager === managerFilter);
    if (partnerOnly) arr = arr.filter(s => PARTNERS.has(s.name));
    return arr;
  }, [managerFilter, partnerOnly]);

  return (
    <main style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      <PageHeader sellers={filteredSellers} />

      {/* 담당자 필터 */}
      <ManagerFilter
        managerFilter={managerFilter}
        setManagerFilter={setManagerFilter}
        partnerOnly={partnerOnly}
        setPartnerOnly={setPartnerOnly}
      />

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
          { k: 'A', label: 'A · 테이블 + 마켓 펼침' },
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

      {filteredSellers.length === 0 ? (
        <div style={{
          padding: 60, textAlign: 'center', color: C.faint, fontSize: 13,
          background: '#fff', border: `1px solid ${C.divider}`, borderRadius: 12,
        }}>
          조건에 맞는 셀러 없음
        </div>
      ) : (
        <>
          {design === 'A' && <DesignA sellers={filteredSellers} />}
          {design === 'B' && <DesignB sellers={filteredSellers} />}
          {design === 'C' && <DesignC sellers={filteredSellers} />}
        </>
      )}
    </main>
  );
}
