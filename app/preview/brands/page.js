'use client';
import { useState, useMemo, Fragment } from 'react';
import { MOCK_BRAND_MGMT } from '../mock-data';

// MOCK 데이터는 ../mock-data.js 의 MOCK_BRAND_MGMT 에서 가져옴.
// 단위: 모든 숫자는 백만원

const MONTHS = MOCK_BRAND_MGMT.months;
const BRANDS_MOCK = MOCK_BRAND_MGMT.brands;

// ─────────────── 유틸 ───────────────
const sum = (arr) => arr.reduce((a, v) => a + v, 0);

// 셀 색상 (실적 vs 목표)
function rateColor(actual, target) {
  if (target === 0) return { color: '#9ca3af', bg: 'transparent' };
  const rate = actual / target;
  if (rate >= 1.0)  return { color: '#065f46', bg: '#d1fae5' };
  if (rate >= 0.7)  return { color: '#92400e', bg: '#fef3c7' };
  if (rate >= 0.3)  return { color: '#9a3412', bg: '#fed7aa' };
  return { color: '#991b1b', bg: '#fee2e2' };
}

// ─────────────── 스타일 ───────────────
const card = {
  padding: 20, background: '#fff',
  border: '1px solid #e5e7eb', borderRadius: 14,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};
const th = {
  padding: '12px 8px',
  borderBottom: '2px solid #e5e7eb',
  fontSize: 11, color: '#6b7280', fontWeight: 600,
  textAlign: 'left', whiteSpace: 'nowrap',
};
const td = {
  padding: '8px',
  fontSize: 13,
  borderBottom: '1px solid #f3f4f6',
};
const cellBase = {
  padding: '8px 6px', textAlign: 'center',
  borderBottom: '1px solid #f3f4f6',
  fontSize: 13,
};

// ─────────────── 컴포넌트 ───────────────
function SectionTitle({ emoji, title, hint, action }) {
  return (
    <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{emoji} {title}</h2>
        {hint && <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>{hint}</p>}
      </div>
      {action}
    </div>
  );
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 14px', fontSize: 12, fontWeight: active ? 700 : 500,
      background: active ? '#2563eb' : '#fff',
      color: active ? '#fff' : '#374151',
      border: '1px solid ' + (active ? '#2563eb' : '#d1d5db'),
      borderRadius: 6, cursor: 'pointer',
    }}>{children}</button>
  );
}

function SummaryCard({ label, value, accent }) {
  return (
    <div style={{
      padding: 16, background: '#fff',
      border: '1px solid #e5e7eb', borderRadius: 12,
      borderLeft: `4px solid ${accent}`,
    }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>{value}</div>
    </div>
  );
}

// 한 행 = 목표 또는 실적
function MonthRow({ values, isActual, targets, totalBg = '#eff6ff' }) {
  const total = sum(values);
  return (
    <>
      {values.map((v, j) => {
        if (isActual) {
          const { color, bg } = rateColor(v, targets[j]);
          return (
            <td key={j} style={{ ...cellBase, color, background: bg, fontWeight: 700 }}>{v}</td>
          );
        }
        return (
          <td key={j} style={{ ...cellBase, color: '#6b7280' }}>{v}</td>
        );
      })}
      <td style={{ ...cellBase, fontWeight: 700, background: isActual ? '#dbeafe' : totalBg, color: isActual ? '#37352f' : '#374151' }}>
        {total}
      </td>
    </>
  );
}

// ─────────────── 메인 ───────────────
export default function BrandsPage() {
  const [managerMode, setManagerMode] = useState('discoverer'); // 'discoverer' | 'manager'
  const [expandedMgr, setExpandedMgr] = useState(null); // 펼친 담당자 이름

  // 담당자 모드 바뀌면 펼침 초기화
  function switchMode(mode) {
    setManagerMode(mode);
    setExpandedMgr(null);
  }

  // 담당자별 집계 — brandDetails로 각 브랜드별 세부 추적
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
        brandDetails: [],   // [{ name, targets, actuals }]
      };
      for (let i = 0; i < MONTHS.length; i++) {
        cur.targets[i] += b.targets[i];
        cur.actuals[i] += b.actuals[i];
      }
      cur.brands.push(b.name);
      cur.brandDetails.push({
        name: b.name,
        targets: b.targets,
        actuals: b.actuals,
      });
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => sum(b.actuals) - sum(a.actuals));
  }, [managerMode]);

  // Total 행 (브랜드별 테이블)
  const grandTargets = new Array(MONTHS.length).fill(0);
  const grandActuals = new Array(MONTHS.length).fill(0);
  for (const b of BRANDS_MOCK) {
    for (let i = 0; i < MONTHS.length; i++) {
      grandTargets[i] += b.targets[i];
      grandActuals[i] += b.actuals[i];
    }
  }

  // 요약
  const totalTargetAll = sum(grandTargets);
  const totalActualAll = sum(grandActuals);
  const overallRate = totalTargetAll > 0 ? (totalActualAll / totalTargetAll) * 100 : 0;

  return (
    <main style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>🏷️ 브랜드 관리</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
          브랜드별 월별 <strong>목표</strong> vs <strong>실적</strong> · 발굴/관리 담당자별 집계 ·
          <span style={{ marginLeft: 6, padding: '2px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: 4, fontWeight: 600, fontSize: 11 }}>현재 mock 데이터</span>
        </p>
      </header>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <SummaryCard label="관리 브랜드" value={`${BRANDS_MOCK.length}개`} accent="#2563eb" />
        <SummaryCard label="누적 목표 (6개월)" value={`${totalTargetAll}백만원`} accent="#6b7280" />
        <SummaryCard label="누적 실적 (6개월)" value={`${totalActualAll}백만원`} accent="#10b981" />
        <SummaryCard
          label="전체 달성률"
          value={`${overallRate.toFixed(1)}%`}
          accent={overallRate >= 100 ? '#10b981' : overallRate >= 70 ? '#f59e0b' : '#ef4444'}
        />
      </div>

      {/* 테이블 1: 브랜드별 */}
      <div style={{ ...card, marginBottom: 20 }}>
        <SectionTitle
          emoji="📊"
          title="브랜드별 월별 목표 vs 실적"
          hint="실적 셀 색상: 🟢 100%+ 달성 · 🟡 70%~ · 🟠 30%~ · 🔴 30% 미만"
        />

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={th}>브랜드</th>
                <th style={th}>발굴 담당자</th>
                <th style={th}>관리 담당자</th>
                <th style={{ ...th, textAlign: 'center' }}>구분</th>
                {MONTHS.map(m => (
                  <th key={m} style={{ ...th, textAlign: 'center', minWidth: 56 }}>{m}</th>
                ))}
                <th style={{ ...th, textAlign: 'center', background: '#eff6ff' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {BRANDS_MOCK.map((b, i) => (
                <Fragment key={b.name}>
                  <tr style={{ borderTop: i > 0 ? '2px solid #e5e7eb' : 'none' }}>
                    <td rowSpan={2} style={{ ...td, fontWeight: 600, verticalAlign: 'middle' }}>{b.name}</td>
                    <td rowSpan={2} style={{ ...td, fontSize: 12, color: '#6b7280', verticalAlign: 'middle' }}>{b.discoverer}</td>
                    <td rowSpan={2} style={{ ...td, fontSize: 12, color: '#6b7280', verticalAlign: 'middle' }}>{b.manager}</td>
                    <td style={{ ...cellBase, fontSize: 11, color: '#6b7280', fontWeight: 600 }}>목표</td>
                    <MonthRow values={b.targets} isActual={false} targets={b.targets} />
                  </tr>
                  <tr>
                    <td style={{ ...cellBase, fontSize: 11, color: '#374151', fontWeight: 700 }}>실적</td>
                    <MonthRow values={b.actuals} isActual={true} targets={b.targets} />
                  </tr>
                </Fragment>
              ))}

              {/* Total 행 */}
              <tr style={{ borderTop: '3px solid #2563eb', background: '#f9fafb' }}>
                <td colSpan={3} rowSpan={2} style={{ ...td, fontWeight: 700, fontSize: 14, color: '#2563eb', textAlign: 'center', verticalAlign: 'middle' }}>
                  Total
                </td>
                <td style={{ ...cellBase, fontSize: 11, color: '#6b7280', fontWeight: 700 }}>목표</td>
                <MonthRow values={grandTargets} isActual={false} targets={grandTargets} totalBg="#bfdbfe" />
              </tr>
              <tr style={{ background: '#f9fafb' }}>
                <td style={{ ...cellBase, fontSize: 11, color: '#374151', fontWeight: 700 }}>실적</td>
                <MonthRow values={grandActuals} isActual={true} targets={grandTargets} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 테이블 2: 담당자별 */}
      <div style={{ ...card, marginBottom: 20 }}>
        <SectionTitle
          emoji="👤"
          title="담당자별 월별 합계"
          hint="각 담당자가 맡은 브랜드들의 목표 / 실적 합산"
          action={
            <div style={{ display: 'flex', gap: 6 }}>
              <ToggleBtn active={managerMode === 'discoverer'} onClick={() => switchMode('discoverer')}>
                🔍 발굴 담당자
              </ToggleBtn>
              <ToggleBtn active={managerMode === 'manager'} onClick={() => switchMode('manager')}>
                📋 관리 담당자
              </ToggleBtn>
            </div>
          }
        />

        <div style={{
          padding: '8px 12px', marginBottom: 8, background: '#fffbeb',
          border: '1px solid #fde68a', borderRadius: 6,
          fontSize: 12, color: '#78350f',
        }}>
          💡 <strong>2개 이상 브랜드</strong>를 맡은 담당자는 행 클릭 시 브랜드별 내역이 펼쳐져요
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ ...th, width: 28 }}></th>
                <th style={th}>{managerMode === 'discoverer' ? '발굴' : '관리'} 담당자</th>
                <th style={th}>담당 브랜드</th>
                <th style={{ ...th, textAlign: 'center' }}>구분</th>
                {MONTHS.map(m => (
                  <th key={m} style={{ ...th, textAlign: 'center', minWidth: 56 }}>{m}</th>
                ))}
                <th style={{ ...th, textAlign: 'center', background: '#eff6ff' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {byManager.map((mgr, i) => {
                const hasMultiple = mgr.brands.length >= 2;
                const isExpanded = expandedMgr === mgr.name;
                const onClick = hasMultiple
                  ? () => setExpandedMgr(isExpanded ? null : mgr.name)
                  : undefined;
                return (
                  <Fragment key={mgr.name}>
                    {/* 담당자 요약 행 (목표) */}
                    <tr
                      onClick={onClick}
                      style={{
                        borderTop: i > 0 ? '2px solid #e5e7eb' : 'none',
                        cursor: hasMultiple ? 'pointer' : 'default',
                        background: isExpanded ? '#eff6ff' : 'transparent',
                      }}
                    >
                      <td rowSpan={2} style={{ ...td, textAlign: 'center', color: '#9ca3af', verticalAlign: 'middle' }}>
                        {hasMultiple ? (isExpanded ? '▼' : '▶') : ''}
                      </td>
                      <td rowSpan={2} style={{ ...td, fontWeight: 600, verticalAlign: 'middle' }}>{mgr.name}</td>
                      <td rowSpan={2} style={{ ...td, fontSize: 11, color: '#6b7280', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span>{mgr.brands.join(', ')}</span>
                          {hasMultiple && (
                            <span style={{
                              fontSize: 10, padding: '2px 6px', borderRadius: 8,
                              background: '#dbeafe', color: '#1e40af', fontWeight: 700,
                            }}>+{mgr.brands.length - 1}</span>
                          )}
                        </div>
                        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{mgr.brands.length}개 브랜드</div>
                      </td>
                      <td style={{ ...cellBase, fontSize: 11, color: '#6b7280', fontWeight: 700, background: '#f9fafb' }}>합계 (목표)</td>
                      <MonthRow values={mgr.targets} isActual={false} targets={mgr.targets} />
                    </tr>
                    <tr
                      onClick={onClick}
                      style={{
                        cursor: hasMultiple ? 'pointer' : 'default',
                        background: isExpanded ? '#eff6ff' : 'transparent',
                      }}
                    >
                      <td style={{ ...cellBase, fontSize: 11, color: '#374151', fontWeight: 700, background: '#f9fafb' }}>합계 (실적)</td>
                      <MonthRow values={mgr.actuals} isActual={true} targets={mgr.targets} />
                    </tr>

                    {/* 펼쳐진 브랜드별 행 */}
                    {isExpanded && mgr.brandDetails.map((bd, bi) => (
                      <Fragment key={`${mgr.name}-${bd.name}`}>
                        <tr style={{ background: '#fafbfc', borderTop: bi === 0 ? '1px dashed #93c5fd' : '1px solid #f3f4f6' }}>
                          <td></td>
                          <td colSpan={2} rowSpan={2} style={{
                            ...td, fontSize: 12, color: '#374151', verticalAlign: 'middle',
                            paddingLeft: 24,
                          }}>
                            <span style={{ color: '#9ca3af', marginRight: 6 }}>└</span>
                            <span style={{ fontWeight: 600 }}>{bd.name}</span>
                          </td>
                          <td style={{ ...cellBase, fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>목표</td>
                          <MonthRow values={bd.targets} isActual={false} targets={bd.targets} />
                        </tr>
                        <tr style={{ background: '#fafbfc' }}>
                          <td></td>
                          <td style={{ ...cellBase, fontSize: 10, color: '#6b7280', fontWeight: 600 }}>실적</td>
                          <MonthRow values={bd.actuals} isActual={true} targets={bd.targets} />
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

      {/* 안내문 */}
      <div style={{
        padding: 16, background: '#fffbeb', border: '1px solid #fde68a',
        borderRadius: 12, fontSize: 13, color: '#78350f', lineHeight: 1.6,
      }}>
        ℹ️ <strong>현재 mock 데이터 — 향후 실데이터 연동 계획:</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
          <li>🏷️ <strong>브랜드 목록 + 발굴/관리 담당자</strong> → 와이어드민 + 준비 중인 별도 사이트에서 자동 동기화</li>
          <li>🎯 <strong>월별 목표</strong> → 사업개발팀 <strong>분기별</strong> 설정 (입력 UI 추후 추가)</li>
          <li>💰 <strong>월별 실적</strong> → 와이어드민 API (totalWiredSalesAmount, 백만원 단위)</li>
          <li>📅 <strong>분기 단위 보기</strong> → 분기로 진행될 가능성이 높아 분기 토글 추후 추가 예정</li>
        </ul>
      </div>
    </main>
  );
}
