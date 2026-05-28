'use client';
import { useState, useEffect, useMemo, Fragment } from 'react';

// 유틸
function fmt(v) { return (v ?? 0).toLocaleString('ko-KR') + '백만원'; }

const card = {
  padding: 20, background: '#fff',
  border: '1px solid #e5e7eb', borderRadius: 14,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};
const th = { padding: '10px 8px', borderBottom: '2px solid #e5e7eb', fontSize: 11, color: '#6b7280', fontWeight: 600, textAlign: 'left' };
const td = { padding: '10px 8px', borderBottom: '1px solid #f3f4f6', fontSize: 13 };

function SectionTitle({ emoji, title, hint }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{emoji} {title}</h2>
      {hint && <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>{hint}</p>}
    </div>
  );
}

function SortBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 10px', fontSize: 12, fontWeight: active ? 700 : 500,
      background: active ? '#2563eb' : '#fff',
      color: active ? '#fff' : '#374151',
      border: '1px solid ' + (active ? '#2563eb' : '#d1d5db'),
      borderRadius: 5, cursor: 'pointer',
    }}>{children}</button>
  );
}

function FilterChip({ active, onClick, children, color = '#2563eb' }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 12px', fontSize: 12, fontWeight: active ? 700 : 500,
      background: active ? color : '#fff',
      color: active ? '#fff' : '#374151',
      border: '1px solid ' + (active ? color : '#d1d5db'),
      borderRadius: 16, cursor: 'pointer',
    }}>{children}</button>
  );
}

export default function BrandsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // 필터/검색 상태
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('sales');
  const [managerFilter, setManagerFilter] = useState('all');
  const [hotOnly, setHotOnly] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch('/api/preview-data')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.message || d.error);
        else setData(d);
      })
      .catch(e => setError(e.message));
  }, []);

  // 브랜드 → 마켓 매칭
  const aggregated = useMemo(() => {
    if (!data?.brands) return [];
    return data.brands.map(b => {
      const myMarkets = (data.marketsList || []).filter(m => m.brandName === b.name);
      return {
        ...b,
        markets: myMarkets,
      };
    });
  }, [data]);

  // 담당자 목록 (브랜드 데이터에서 추출)
  const managerList = useMemo(() => {
    const set = new Set();
    aggregated.forEach(b => { if (b.manager) set.add(b.manager); });
    return [...set].sort();
  }, [aggregated]);

  // HOT 임계: 주문건수 상위 25%
  const hotThreshold = useMemo(() => {
    const sorted = aggregated.map(b => b.orderCount || 0).sort((a, b) => b - a);
    const cutoff = Math.max(1, Math.floor(sorted.length * 0.25));
    return sorted[cutoff - 1] || 0;
  }, [aggregated]);

  // 필터링
  const filtered = useMemo(() => {
    let arr = aggregated;
    if (managerFilter !== 'all') arr = arr.filter(b => b.manager === managerFilter);
    if (hotOnly) arr = arr.filter(b => (b.orderCount || 0) >= hotThreshold && hotThreshold > 0);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(b =>
        b.name.toLowerCase().includes(q) ||
        (b.manager || '').toLowerCase().includes(q) ||
        (b.sellers || []).some(s => s.toLowerCase().includes(q))
      );
    }
    return [...arr].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
  }, [aggregated, search, sortBy, managerFilter, hotOnly, hotThreshold]);

  // 통계
  const totalSales = aggregated.reduce((s, b) => s + (b.sales || 0), 0);
  const totalOrders = aggregated.reduce((s, b) => s + (b.orderCount || 0), 0);
  const totalMarkets = aggregated.reduce((s, b) => s + (b.marketCount || 0), 0);
  const hotCount = aggregated.filter(b => (b.orderCount || 0) >= hotThreshold && hotThreshold > 0).length;

  return (
    <main style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>🏷️ 브랜드 관리</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
          이번달 진행 브랜드 · 담당자 / 거래형태 / HOT 필터 · 브랜드 클릭 → 마켓 리스트 펼침
        </p>
      </header>

      {error && (
        <div style={{ ...card, background: '#fef2f2', border: '1px solid #fca5a5', marginBottom: 16 }}>
          <strong style={{ color: '#991b1b' }}>⚠️ {error}</strong>
        </div>
      )}

      {!data && !error && (
        <div style={{ ...card, textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>브랜드 데이터 불러오는 중...</div>
        </div>
      )}

      {data && (
        <>
          {/* 요약 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            <SummaryCard label="총 브랜드" value={`${aggregated.length}개`} accent="#2563eb" />
            <SummaryCard label="누적 매출" value={fmt(totalSales)} accent="#10b981" />
            <SummaryCard label="총 주문" value={`${totalOrders.toLocaleString('ko-KR')}건`} accent="#7c3aed" />
            <SummaryCard label="🔥 HOT 브랜드" value={`${hotCount}개`} accent="#f59e0b" />
          </div>

          {/* 필터 영역 */}
          <div style={{ ...card, marginBottom: 16 }}>
            <SectionTitle emoji="🔍" title="필터 / 검색" />

            {/* 검색 */}
            <input
              type="text"
              placeholder="브랜드명 / 담당자명 / 셀러명 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', fontSize: 14,
                border: '1px solid #d1d5db', borderRadius: 8, marginBottom: 12,
                boxSizing: 'border-box',
              }}
            />

            {/* 담당자 필터 */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 6 }}>상품 담당자</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <FilterChip active={managerFilter === 'all'} onClick={() => setManagerFilter('all')}>
                  전체 ({aggregated.length})
                </FilterChip>
                {managerList.map(m => {
                  const c = aggregated.filter(b => b.manager === m).length;
                  return (
                    <FilterChip key={m} active={managerFilter === m} onClick={() => setManagerFilter(m)}>
                      {m} ({c})
                    </FilterChip>
                  );
                })}
              </div>
            </div>

            {/* HOT 필터 + 정렬 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <FilterChip active={hotOnly} onClick={() => setHotOnly(!hotOnly)} color="#f59e0b">
                🔥 HOT만 보기 (주문 상위 25%)
              </FilterChip>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>정렬:</span>
                <SortBtn active={sortBy === 'sales'} onClick={() => setSortBy('sales')}>매출 ↓</SortBtn>
                <SortBtn active={sortBy === 'orderCount'} onClick={() => setSortBy('orderCount')}>주문 ↓</SortBtn>
                <SortBtn active={sortBy === 'marketCount'} onClick={() => setSortBy('marketCount')}>공구 ↓</SortBtn>
                <SortBtn active={sortBy === 'achievementRate'} onClick={() => setSortBy('achievementRate')}>달성률 ↓</SortBtn>
              </div>
            </div>

            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 10 }}>
              <strong style={{ color: '#374151' }}>{filtered.length}개</strong> 브랜드 표시
              {search && <> · 검색 "<strong>{search}</strong>"</>}
              {managerFilter !== 'all' && <> · 담당자 <strong style={{ color: '#2563eb' }}>{managerFilter}</strong></>}
              {hotOnly && <> · <strong style={{ color: '#f59e0b' }}>🔥 HOT</strong></>}
            </div>
          </div>

          {/* 브랜드 리스트 */}
          <div style={card}>
            <SectionTitle
              emoji="📋"
              title="브랜드 리스트"
              hint="행 클릭 → 해당 브랜드의 마켓 상세"
            />

            {/* 헤더 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '34px minmax(180px,1.6fr) 90px 80px 100px 80px 70px 100px 60px 28px',
              gap: 8, padding: '10px 12px',
              background: '#f9fafb', borderRadius: 6,
              fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 6,
            }}>
              <div>#</div>
              <div>브랜드 / 셀러</div>
              <div>담당자</div>
              <div style={{ textAlign: 'center' }}>HOT</div>
              <div style={{ textAlign: 'right' }}>매출</div>
              <div style={{ textAlign: 'right' }}>주문건수</div>
              <div style={{ textAlign: 'right' }}>공구건수</div>
              <div style={{ textAlign: 'right' }}>예상매출</div>
              <div style={{ textAlign: 'right' }}>달성률</div>
              <div></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filtered.map((b, i) => {
                const isHot = (b.orderCount || 0) >= hotThreshold && hotThreshold > 0;
                const isOpen = expanded === b.name;
                return (
                  <div key={b.name} style={{
                    border: '1px solid ' + (isOpen ? '#2563eb' : '#e5e7eb'),
                    borderRadius: 8, overflow: 'hidden',
                  }}>
                    <div
                      onClick={() => setExpanded(isOpen ? null : b.name)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '34px minmax(180px,1.6fr) 90px 80px 100px 80px 70px 100px 60px 28px',
                        gap: 8, padding: '12px', cursor: 'pointer',
                        background: isOpen ? '#eff6ff' : '#fff',
                        alignItems: 'center', fontSize: 13,
                      }}
                    >
                      <div style={{ color: '#9ca3af' }}>#{i + 1}</div>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{b.name}</div>
                        <div style={{ fontSize: 10, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {(b.sellers || []).slice(0, 3).join(', ')}
                          {(b.sellers || []).length > 3 && ` +${b.sellers.length - 3}`}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{b.manager || '-'}</div>
                      <div style={{ textAlign: 'center' }}>
                        {isHot && (
                          <span style={{
                            fontSize: 10, padding: '2px 7px', borderRadius: 10,
                            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                            color: '#fff', fontWeight: 700,
                          }}>🔥 HOT</span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 13 }}>{fmt(b.sales)}</div>
                      <div style={{ textAlign: 'right', fontSize: 12 }}>{(b.orderCount || 0).toLocaleString('ko-KR')}건</div>
                      <div style={{ textAlign: 'right', color: '#6b7280', fontSize: 12 }}>{b.marketCount}개</div>
                      <div style={{ textAlign: 'right', color: '#6b7280', fontSize: 12 }}>{fmt(b.estimatedSales)}</div>
                      <div style={{
                        textAlign: 'right', fontWeight: 600, fontSize: 12,
                        color: b.achievementRate >= 100 ? '#10b981' : b.achievementRate >= 80 ? '#f59e0b' : '#ef4444',
                      }}>{b.achievementRate != null ? `${b.achievementRate.toFixed(0)}%` : '-'}</div>
                      <div style={{ textAlign: 'right', color: '#9ca3af' }}>{isOpen ? '▲' : '▼'}</div>
                    </div>

                    {isOpen && (
                      <div style={{ padding: 16, background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', gap: 24, marginBottom: 14, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>함께 일한 셀러 ({(b.sellers || []).length}곳)</div>
                            <div style={{ fontSize: 13, marginTop: 4 }}>{(b.sellers || []).join(' · ')}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>상품 담당자</div>
                            <div style={{ fontSize: 13, marginTop: 4, fontWeight: 600 }}>{b.manager || '-'}</div>
                          </div>
                        </div>

                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                          진행 마켓 <strong>{b.markets.length}개</strong>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 6, overflow: 'hidden' }}>
                          <thead>
                            <tr style={{ background: '#f3f4f6' }}>
                              <th style={th}>셀러</th>
                              <th style={th}>담당자</th>
                              <th style={{ ...th, textAlign: 'center' }}>상태</th>
                              <th style={{ ...th, textAlign: 'right' }}>매출</th>
                              <th style={{ ...th, textAlign: 'right' }}>주문</th>
                              <th style={{ ...th, textAlign: 'right' }}>달성률</th>
                            </tr>
                          </thead>
                          <tbody>
                            {b.markets.sort((a, c) => (c.sales || 0) - (a.sales || 0)).map(m => {
                              const stColor = { ENDED: '#6b7280', ACTIVE: '#10b981', READY: '#3b82f6' }[m.status] || '#6b7280';
                              const stLabel = { ENDED: '종료', ACTIVE: '진행중', READY: '예정' }[m.status] || m.status;
                              const achColor = m.achievementRate >= 100 ? '#10b981' : m.achievementRate >= 80 ? '#f59e0b' : '#ef4444';
                              return (
                                <tr key={m.id}>
                                  <td style={{ ...td, fontWeight: 500 }}>{m.sellerName}</td>
                                  <td style={td}>{m.managerName}</td>
                                  <td style={{ ...td, textAlign: 'center' }}>
                                    <span style={{ color: stColor, fontWeight: 600, fontSize: 11 }}>{stLabel}</span>
                                  </td>
                                  <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{fmt(m.sales)}</td>
                                  <td style={{ ...td, textAlign: 'right' }}>{(m.orderCount || 0).toLocaleString('ko-KR')}건</td>
                                  <td style={{ ...td, textAlign: 'right', color: achColor, fontWeight: 600 }}>
                                    {m.achievementRate != null ? `${m.achievementRate.toFixed(0)}%` : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                조건에 맞는 브랜드 없음
              </div>
            )}
          </div>

          {/* 안내 */}
          <div style={{
            padding: 16, marginTop: 24, background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: 12, fontSize: 13, color: '#78350f', lineHeight: 1.6,
          }}>
            💡 <strong>추후 추가 가능한 기능:</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              <li>거래형태 (밴더사/본사) 필터 — 와이어드민 vendor API 추가 연동 필요</li>
              <li>브랜드별 카테고리 분포 / 단가대 분포</li>
              <li>전월/전년 동월 비교</li>
              <li>브랜드별 CS율, 배송완료율 (와이어드민 추가 데이터 필요)</li>
            </ul>
          </div>
        </>
      )}
    </main>
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
      <div style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>{value}</div>
    </div>
  );
}
