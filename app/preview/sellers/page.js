'use client';
import { useState, useEffect, useMemo, Fragment } from 'react';
import { MOCK_SELLER_MGMT, MOCK_PARTNER_NOTION } from '../mock-data';

const TARGET_STORAGE_KEY = 'seller-targets-v1';

const MONTHS = MOCK_SELLER_MGMT.months;
const ALL_SELLERS = MOCK_SELLER_MGMT.sellers;
const COMPLETED_MONTHS = new Set(MOCK_SELLER_MGMT.completedMonths);
const PARTNERS = new Set(Object.keys(MOCK_PARTNER_NOTION));

// 담당자 목록 (mock 데이터에서 추출)
const MANAGERS = [...new Set(ALL_SELLERS.map(s => s.manager))].sort();

const sum = (arr) => arr.reduce((a, v) => a + v, 0);

// ─── 컬러 시스템 (구조감 강화) ───
const C = {
  // 액센트
  indigo:      '#4f46e5',
  indigoSoft:  '#eef2ff',
  indigoMid:   '#c7d2fe',
  indigoDark:  '#3730a3',

  // 상태
  emerald:     '#059669',
  emeraldSoft: '#d1fae5',
  amber:       '#d97706',
  amberSoft:   '#fef3c7',
  rose:        '#dc2626',

  // 텍스트
  ink:         '#0f172a',
  muted:       '#475569',
  faint:       '#94a3b8',

  // 표면 / 선
  pageBg:      '#f1f5f9',  // 페이지 배경 (slate-100)
  surface:     '#fff',
  surfaceMuted:'#f8fafc',  // 테이블 헤더 / 약한 배경
  zebra:       '#fcfdfe',  // 짝수 행 (아주 옅은)
  divider:     '#cbd5e1',  // 메인 구분선 (좀 진하게)
  dividerSoft: '#e2e8f0',  // 가벼운 구분선
  dividerBold: '#94a3b8',  // 강조 구분선

  // 그림자
  shadow:      '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
  shadowMd:    '0 4px 12px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04)',
};

// 공통 카드 스타일
const cardStyle = {
  background: C.surface,
  border: `1px solid ${C.divider}`,
  borderRadius: 12,
  boxShadow: C.shadow,
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
          <span style={{ marginLeft: 8, padding: '2px 8px', background: C.surfaceMuted, border: `1px solid ${C.divider}`, borderRadius: 4, fontSize: 11, color: C.muted }}>mock 데이터</span>
        </p>
      </header>

      {/* 통계 스트립 — 인디고 강조 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0,
        marginBottom: 16, overflow: 'hidden',
        ...cardStyle,
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
      display: 'flex', gap: 10, marginBottom: 16, padding: '14px 16px',
      alignItems: 'center', flexWrap: 'wrap',
      ...cardStyle,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginRight: 4 }}>담당자</span>
        <Chip active={managerFilter === 'all'} onClick={() => setManagerFilter('all')}>
          전체 ({totalCount})
        </Chip>
        {MANAGERS.map(m => (
          <Chip key={m} active={managerFilter === m} onClick={() => setManagerFilter(m)}>
            {m} ({counts[m]})
          </Chip>
        ))}
      </div>
      <div style={{ width: 1, height: 24, background: C.divider }} />
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
      padding: '16px 20px',
      borderRight: `1px solid ${C.dividerSoft}`,
      background: bg || C.surface,
    }}>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600, letterSpacing: '0.02em' }}>{label}</div>
      <div style={{
        fontSize: 22, fontWeight: 700,
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

// ─── 매출 목표 인라인 편집 셀 ───
function EditableTargetCell({ value, original, onChange, muted }) {
  const isEdited = value !== original;
  const [local, setLocal] = useState(String(value));

  useEffect(() => { setLocal(String(value)); }, [value]);

  const commit = () => {
    const trimmed = local.trim();
    if (trimmed === '') {
      onChange(null); // 원래값으로 되돌리기
      return;
    }
    const num = parseInt(trimmed, 10);
    if (isNaN(num) || num < 0) {
      setLocal(String(value));
      return;
    }
    if (num !== value) onChange(num);
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') { setLocal(String(value)); e.currentTarget.blur(); }
      }}
      onFocus={(e) => e.target.select()}
      title="클릭해서 수정 (Enter 저장, Esc 취소, 빈칸 입력 시 원래값으로)"
      style={{
        width: '100%',
        background: isEdited ? '#fef3c7' : 'transparent',
        border: isEdited ? `1px solid ${C.amber}` : '1px solid transparent',
        borderRadius: 4,
        textAlign: 'center',
        fontSize: 13,
        padding: '4px 0',
        color: isEdited ? '#92400e' : (muted ? C.faint : C.ink),
        fontWeight: isEdited ? 700 : (muted ? 400 : 600),
        cursor: 'text',
        outline: 'none',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => { if (!isEdited) e.currentTarget.style.background = '#fffbeb'; }}
      onMouseLeave={(e) => { if (!isEdited) e.currentTarget.style.background = 'transparent'; }}
    />
  );
}

// ============================================================
//  디자인 A: 테이블 + 달성률 + 셀러 클릭 → 월별 마켓 펼침
// ============================================================
function DesignA({ sellers }) {
  const [expanded, setExpanded] = useState(null);
  const [overrides, setOverrides] = useState({});

  // localStorage에서 사용자 수정값 불러오기
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TARGET_STORAGE_KEY);
      if (stored) setOverrides(JSON.parse(stored));
    } catch {}
  }, []);

  function saveOverrides(next) {
    setOverrides(next);
    try { localStorage.setItem(TARGET_STORAGE_KEY, JSON.stringify(next)); } catch {}
  }

  function updateTarget(sellerName, monthIdx, value) {
    const key = `${sellerName}::${monthIdx}`;
    const next = { ...overrides };
    if (value == null) delete next[key];
    else next[key] = value;
    saveOverrides(next);
  }

  function resetAll() {
    if (window.confirm('수정한 매출 목표를 모두 초기 mock 데이터로 되돌릴까요?')) {
      saveOverrides({});
    }
  }

  // 효과적 목표값 (override 있으면 override, 없으면 원본)
  function effectiveTargets(s) {
    return s.targets.map((v, i) => {
      const k = `${s.name}::${i}`;
      return overrides[k] != null ? overrides[k] : v;
    });
  }

  const overrideCount = Object.keys(overrides).length;

  const th = {
    padding: '14px 8px',
    borderBottom: `2px solid ${C.dividerBold}`,
    background: C.surfaceMuted,
    fontSize: 11, color: C.muted, fontWeight: 700,
    textAlign: 'center', whiteSpace: 'nowrap',
    letterSpacing: '0.04em',
  };
  const thLeft = { ...th, textAlign: 'left' };
  const td = { padding: '12px 8px', fontSize: 13, color: C.ink, borderBottom: `1px solid ${C.dividerSoft}` };
  const cellNum = {
    padding: '10px 8px', textAlign: 'center',
    fontSize: 13, borderBottom: `1px solid ${C.dividerSoft}`,
  };

  // override 적용된 grand totals
  const grandT = new Array(MONTHS.length).fill(0);
  const grandA = new Array(MONTHS.length).fill(0);
  for (const s of sellers) {
    const effT = effectiveTargets(s);
    for (let i = 0; i < MONTHS.length; i++) {
      grandT[i] += effT[i];
      grandA[i] += s.actuals[i];
    }
  }
  const grandRate = sum(grandT) > 0 ? (sum(grandA) / sum(grandT)) * 100 : 0;

  return (
    <div style={{ ...cardStyle, overflow: 'hidden' }}>
      {/* 섹션 헤더 (테이블 위) */}
      <div style={{
        padding: '14px 20px',
        background: C.surfaceMuted,
        borderBottom: `1px solid ${C.divider}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 4, height: 18, background: C.indigo, borderRadius: 2 }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>셀러별 월별 매출·이익·공구건수</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: C.muted, alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, background: C.faint, borderRadius: 1, opacity: 0.5 }} />매출 목표
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, background: C.indigo, borderRadius: 1 }} />매출 실적
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, background: C.emerald, borderRadius: 1 }} />영업이익
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, background: C.muted, borderRadius: 1 }} />공구건수
          </span>
        </div>
      </div>

      {/* 편집 안내 + 초기화 버튼 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 20px', background: '#fffbeb',
        borderBottom: `1px solid ${C.dividerSoft}`,
        fontSize: 12, color: '#78350f',
      }}>
        <span>✏️ <strong>매출 목표 셀을 클릭</strong>해서 수기로 수정 가능 (Enter 저장 · Esc 취소 · 빈칸 입력 시 원래값)</span>
        <span style={{ color: '#92400e' }}>· 행 클릭 → 마켓 상세 펼침</span>
        <div style={{ flex: 1 }} />
        {overrideCount > 0 && (
          <button
            onClick={resetAll}
            style={{
              padding: '5px 12px', fontSize: 11, fontWeight: 700,
              background: '#fff', color: C.amber,
              border: `1px solid ${C.amber}`, borderRadius: 6, cursor: 'pointer',
            }}
          >✕ 수정 초기화 ({overrideCount}개)</button>
        )}
      </div>

      <div style={{ overflowX: 'auto', padding: '0 4px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 24 }}></th>
              <th style={thLeft}>셀러</th>
              <th style={thLeft}>담당자</th>
              <th style={{ ...th, textAlign: 'left', paddingLeft: 12 }}>지표</th>
              {MONTHS.map((m, i) => (
                <th key={m} style={{ ...th, minWidth: 54 }}>
                  {m}
                  {!COMPLETED_MONTHS.has(i) && (
                    <div style={{ fontSize: 9, color: C.faint, fontWeight: 500, marginTop: 2 }}>예정</div>
                  )}
                </th>
              ))}
              <th style={{ ...th, background: C.surfaceMuted }}>Total</th>
              <th style={{ ...th, background: C.surfaceMuted, minWidth: 90 }}>달성률</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((s, i) => {
              const effT = effectiveTargets(s);
              const tTotal = sum(effT);
              const aTotal = sum(s.actuals);
              const rate = tTotal > 0 ? (aTotal / tTotal) * 100 : 0;
              const acc = rateAccent(rate);
              const isOpen = expanded === s.name;

              // 월별 영업이익 + 공구건수 (marketsByMonth로부터 집계)
              const profits = s.marketsByMonth.map(ms =>
                ms.reduce((acc, m) => acc + (m.profit || 0), 0)
              );
              const marketCounts = s.marketsByMonth.map(ms => ms.length);
              const totalProfit = sum(profits);
              const totalMarkets = sum(marketCounts);

              const clickRow = () => setExpanded(isOpen ? null : s.name);
              const rowBg = isOpen ? C.indigoSoft : 'transparent';

              // 행 4개 공통 스타일
              const sharedRowStyle = {
                cursor: 'pointer',
                background: rowBg,
              };

              return (
                <Fragment key={s.name}>
                  {/* Row 1: 매출 목표 — 셀러 / 담당자 / 달성률 합쳐서 rowSpan=4 */}
                  <tr
                    onClick={clickRow}
                    style={{
                      borderTop: i > 0 ? `2px solid ${C.divider}` : 'none',
                      ...sharedRowStyle,
                    }}
                  >
                    <td rowSpan={4} style={{ ...td, textAlign: 'center', color: C.faint, verticalAlign: 'middle' }}>
                      {isOpen ? '−' : '+'}
                    </td>
                    <td rowSpan={4} style={{ ...td, fontWeight: 600, fontSize: 14, verticalAlign: 'middle' }}>
                      {s.name}
                      {PARTNERS.has(s.name) && <PartnerTag />}
                    </td>
                    <td rowSpan={4} style={{ ...td, fontSize: 12, color: C.muted, verticalAlign: 'middle' }}>{s.manager}</td>
                    <td
                      onClick={(e) => e.stopPropagation()}
                      style={{ ...cellNum, fontSize: 11, color: C.faint, fontWeight: 500, textAlign: 'left', paddingLeft: 8 }}
                    >
                      <span style={{ display: 'inline-block', width: 6, height: 6, background: C.faint, borderRadius: 1, marginRight: 6, verticalAlign: 'middle', opacity: 0.5 }} />
                      매출 목표
                      <span style={{ marginLeft: 4, fontSize: 9, color: C.amber, fontWeight: 600 }}>✏️</span>
                    </td>
                    {effT.map((v, j) => (
                      <td
                        key={j}
                        onClick={(e) => e.stopPropagation()}
                        style={{ ...cellNum, color: C.faint, padding: 4 }}
                      >
                        <EditableTargetCell
                          value={v}
                          original={s.targets[j]}
                          onChange={(newVal) => updateTarget(s.name, j, newVal)}
                          muted
                        />
                      </td>
                    ))}
                    <td style={{ ...cellNum, fontWeight: 600, color: C.faint, background: C.surfaceMuted }}>{tTotal}</td>
                    <td rowSpan={4} style={{ ...cellNum, verticalAlign: 'middle', background: C.surfaceMuted }}>
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

                  {/* Row 2: 매출 실적 */}
                  <tr onClick={clickRow} style={sharedRowStyle}>
                    <td style={{ ...cellNum, fontSize: 11, color: C.indigo, fontWeight: 700, textAlign: 'left', paddingLeft: 8 }}>
                      <span style={{ display: 'inline-block', width: 6, height: 6, background: C.indigo, borderRadius: 1, marginRight: 6, verticalAlign: 'middle' }} />
                      매출 실적
                    </td>
                    {s.actuals.map((v, j) => (
                      <td key={j} style={{ ...cellNum, fontWeight: 700, color: COMPLETED_MONTHS.has(j) ? C.ink : C.faint }}>
                        {COMPLETED_MONTHS.has(j) ? v : '-'}
                      </td>
                    ))}
                    <td style={{ ...cellNum, fontWeight: 700, background: C.surfaceMuted, color: C.ink }}>{aTotal}</td>
                  </tr>

                  {/* Row 3: 영업이익 */}
                  <tr onClick={clickRow} style={sharedRowStyle}>
                    <td style={{ ...cellNum, fontSize: 11, color: C.emerald, fontWeight: 700, textAlign: 'left', paddingLeft: 8 }}>
                      <span style={{ display: 'inline-block', width: 6, height: 6, background: C.emerald, borderRadius: 1, marginRight: 6, verticalAlign: 'middle' }} />
                      영업이익
                    </td>
                    {profits.map((v, j) => (
                      <td key={j} style={{ ...cellNum, color: COMPLETED_MONTHS.has(j) ? C.emerald : C.faint, fontWeight: 600 }}>
                        {COMPLETED_MONTHS.has(j) ? v : '-'}
                      </td>
                    ))}
                    <td style={{ ...cellNum, fontWeight: 700, background: C.surfaceMuted, color: C.emerald }}>{totalProfit}</td>
                  </tr>

                  {/* Row 4: 공구건수 */}
                  <tr onClick={clickRow} style={sharedRowStyle}>
                    <td style={{ ...cellNum, fontSize: 11, color: C.muted, fontWeight: 700, textAlign: 'left', paddingLeft: 8 }}>
                      <span style={{ display: 'inline-block', width: 6, height: 6, background: C.muted, borderRadius: 1, marginRight: 6, verticalAlign: 'middle' }} />
                      공구건수
                    </td>
                    {marketCounts.map((v, j) => {
                      const planned = !COMPLETED_MONTHS.has(j);
                      return (
                        <td key={j} style={{ ...cellNum, color: planned ? C.amber : C.muted, fontSize: 12, fontWeight: 500 }}>
                          {v > 0 ? (
                            <>
                              {v}<span style={{ fontSize: 10, marginLeft: 1 }}>건{planned ? '예정' : ''}</span>
                            </>
                          ) : '-'}
                        </td>
                      );
                    })}
                    <td style={{ ...cellNum, fontWeight: 700, background: C.surfaceMuted, color: C.muted, fontSize: 12 }}>
                      {totalMarkets}<span style={{ fontSize: 10 }}>건</span>
                    </td>
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
            {(() => {
              // Total 영업이익 + 공구건수 집계
              const grandProfits = MONTHS.map((_, j) =>
                sellers.reduce((acc, s) => acc + (s.marketsByMonth[j]?.reduce((p, m) => p + (m.profit || 0), 0) || 0), 0)
              );
              const grandMarkets = MONTHS.map((_, j) =>
                sellers.reduce((acc, s) => acc + (s.marketsByMonth[j]?.length || 0), 0)
              );
              return (
                <>
                  <tr style={{ borderTop: `3px solid ${C.indigo}`, background: C.indigoSoft }}>
                    <td></td>
                    <td colSpan={2} rowSpan={4} style={{
                      ...td, fontWeight: 700, fontSize: 14,
                      textAlign: 'center', verticalAlign: 'middle', color: C.indigo,
                      background: C.indigoSoft,
                    }}>Total</td>
                    <td style={{ ...cellNum, fontSize: 11, color: C.muted, fontWeight: 700, background: C.indigoSoft, textAlign: 'left', paddingLeft: 8 }}>매출 목표</td>
                    {grandT.map((v, j) => <td key={j} style={{ ...cellNum, color: C.muted, background: C.indigoSoft }}>{v}</td>)}
                    <td style={{ ...cellNum, fontWeight: 700, color: C.muted, background: C.indigoMid }}>{sum(grandT)}</td>
                    <td rowSpan={4} style={{ ...cellNum, verticalAlign: 'middle', background: C.indigoMid, fontWeight: 800, fontSize: 18, color: C.indigo }}>
                      {grandRate.toFixed(0)}%
                    </td>
                  </tr>
                  <tr style={{ background: C.indigoSoft }}>
                    <td></td>
                    <td style={{ ...cellNum, fontSize: 11, color: C.indigo, fontWeight: 700, background: C.indigoSoft, textAlign: 'left', paddingLeft: 8 }}>매출 실적</td>
                    {grandA.map((v, j) => (
                      <td key={j} style={{ ...cellNum, fontWeight: 700, color: COMPLETED_MONTHS.has(j) ? C.ink : C.faint, background: C.indigoSoft }}>
                        {COMPLETED_MONTHS.has(j) ? v : '-'}
                      </td>
                    ))}
                    <td style={{ ...cellNum, fontWeight: 800, color: C.indigo, background: C.indigoMid, fontSize: 14 }}>{sum(grandA)}</td>
                  </tr>
                  <tr style={{ background: C.indigoSoft }}>
                    <td></td>
                    <td style={{ ...cellNum, fontSize: 11, color: C.emerald, fontWeight: 700, background: C.indigoSoft, textAlign: 'left', paddingLeft: 8 }}>영업이익</td>
                    {grandProfits.map((v, j) => (
                      <td key={j} style={{ ...cellNum, fontWeight: 700, color: COMPLETED_MONTHS.has(j) ? C.emerald : C.faint, background: C.indigoSoft }}>
                        {COMPLETED_MONTHS.has(j) ? v : '-'}
                      </td>
                    ))}
                    <td style={{ ...cellNum, fontWeight: 800, color: C.emerald, background: C.indigoMid, fontSize: 14 }}>{sum(grandProfits)}</td>
                  </tr>
                  <tr style={{ background: C.indigoSoft }}>
                    <td></td>
                    <td style={{ ...cellNum, fontSize: 11, color: C.muted, fontWeight: 700, background: C.indigoSoft, textAlign: 'left', paddingLeft: 8 }}>공구건수</td>
                    {grandMarkets.map((v, j) => {
                      const planned = !COMPLETED_MONTHS.has(j);
                      return (
                        <td key={j} style={{ ...cellNum, fontWeight: 700, color: planned ? C.amber : C.muted, background: C.indigoSoft, fontSize: 12 }}>
                          {v}<span style={{ fontSize: 9, marginLeft: 1 }}>건{planned ? '예' : ''}</span>
                        </td>
                      );
                    })}
                    <td style={{ ...cellNum, fontWeight: 800, color: C.muted, background: C.indigoMid, fontSize: 13 }}>
                      {sum(grandMarkets)}<span style={{ fontSize: 10 }}>건</span>
                    </td>
                  </tr>
                </>
              );
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 셀러 펼친 영역: 월별 마켓 상세
function MarketDetail({ seller }) {
  return (
    <div style={{
      padding: '16px 20px 20px',
      background: C.surfaceMuted,
      borderTop: `1px solid ${C.divider}`,
    }}>
      <div style={{
        fontSize: 12, color: C.muted, marginBottom: 12, fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 3, height: 14, background: C.indigo, borderRadius: 2 }} />
        📋 {seller.name} 마켓 진행 내역
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {MONTHS.map((monthLabel, mIdx) => {
          const markets = seller.marketsByMonth[mIdx] || [];
          const isCompleted = COMPLETED_MONTHS.has(mIdx);
          return (
            <div key={monthLabel} style={{
              padding: 14, background: '#fff',
              border: `1px solid ${C.divider}`, borderRadius: 10,
              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
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
            ...cardStyle,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 18px', background: C.surfaceMuted,
              borderBottom: `1px solid ${C.dividerSoft}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 3, height: 14, background: C.indigo, borderRadius: 2 }} />
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: '0.04em' }}>SELLER · {s.manager}</div>
            </div>
            <div style={{ padding: 18 }}>
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
    <div style={{ ...cardStyle, overflow: 'hidden' }}>
      <div style={{
        padding: '14px 20px',
        background: C.surfaceMuted,
        borderBottom: `1px solid ${C.divider}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 4, height: 18, background: C.indigo, borderRadius: 2 }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>월별 추이 — 라인 비교</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
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
              onMouseEnter={(e) => e.currentTarget.style.background = C.surfaceMuted}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
      <div style={{ display: 'flex', gap: 20, padding: '14px 20px', borderTop: `1px solid ${C.divider}`, background: C.surfaceMuted, fontSize: 11, color: C.muted, justifyContent: 'center' }}>
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
        padding: '12px 16px',
        alignItems: 'center',
        ...cardStyle,
      }}>
        <span style={{ fontSize: 12, color: C.muted, marginRight: 8, fontWeight: 700, letterSpacing: '0.02em' }}>디자인 비교</span>
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
