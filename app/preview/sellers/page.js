'use client';
import { useState, useEffect, useMemo, Fragment } from 'react';

function fmt(v) { return (v ?? 0).toLocaleString('ko-KR') + '백만원'; }

const card = {
  padding: 20, background: '#fff',
  border: '1px solid #e5e7eb', borderRadius: 14,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};
const th = { padding: '10px 8px', borderBottom: '2px solid #e5e7eb', fontSize: 11, color: '#6b7280', fontWeight: 600, textAlign: 'left' };
const td = { padding: '10px 8px', borderBottom: '1px solid #f3f4f6', fontSize: 13 };

// 파트너 셀러 → 노션 URL 매핑 (preview-data에서 가져올 수도 있지만 정적이라 여기 두기)
const PARTNER_NOTION = {
  '오인스':         'https://www.notion.so/wiredcompany/4b95b76922a7421db79bf1563290545c',
  '달빛언니':       'https://www.notion.so/wiredcompany/2544120083b080e889c5ea45a008896c',
  '선선부부하우스': 'https://www.notion.so/wiredcompany/2544120083b08086a1e9f533dd2dcc24',
  '김영은':         'https://www.notion.so/wiredcompany/2544120083b0804e97e9d355492a9f5a',
  '모노마켓':       'https://www.notion.so/wiredcompany/31e4120083b0801ea881f6a563c5973d',
  '풀킴':           'https://www.notion.so/wiredcompany/31f4120083b08053a12bee60e9473c46',
};

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

function PartnerBadge() {
  return (
    <span style={{
      fontSize: 10, padding: '2px 6px', borderRadius: 8,
      background: 'linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)',
      color: '#78350f', fontWeight: 700,
      border: '1px solid #f59e0b',
    }}>🤝 파트너</span>
  );
}

export default function SellersPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('sales');
  const [managerFilter, setManagerFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all'); // 'all' | 'partner' | 'regular'
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

  const aggregated = useMemo(() => {
    if (!data?.sellers) return [];
    return data.sellers.map(s => {
      const myMarkets = (data.marketsList || []).filter(m => m.sellerName === s.name);
      const brands = [...new Set(myMarkets.map(m => m.brandName).filter(Boolean))];
      // 파트너 통계에서 월별 데이터 가져오기
      const partnerData = (data.partnerStats || []).find(p => p.name === s.name);
      return {
        ...s,
        markets: myMarkets,
        brands,
        lastMonth: partnerData?.lastMonth || null,
        thisMonth: partnerData?.thisMonth || null,
        nextMonth: partnerData?.nextMonth || null,
      };
    });
  }, [data]);

  // 담당자 목록
  const managerList = useMemo(() => {
    const set = new Set();
    aggregated.forEach(s => { if (s.manager) set.add(s.manager); });
    return [...set].sort();
  }, [aggregated]);

  const filtered = useMemo(() => {
    let arr = aggregated;
    if (managerFilter !== 'all') arr = arr.filter(s => s.manager === managerFilter);
    if (partnerFilter === 'partner') arr = arr.filter(s => s.isPartner);
    if (partnerFilter === 'regular') arr = arr.filter(s => !s.isPartner);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.manager || '').toLowerCase().includes(q) ||
        s.brands.some(b => b.toLowerCase().includes(q))
      );
    }
    return [...arr].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
  }, [aggregated, search, sortBy, managerFilter, partnerFilter]);

  // 통계
  const totalSales = aggregated.reduce((s, x) => s + (x.sales || 0), 0);
  const totalOrders = aggregated.reduce((s, x) => s + (x.orderCount || 0), 0);
  const partnerCount = aggregated.filter(s => s.isPartner).length;
  const partnerSales = aggregated.filter(s => s.isPartner).reduce((s, x) => s + (x.sales || 0), 0);
  const partnerShare = totalSales > 0 ? (partnerSales / totalSales) * 100 : 0;

  return (
    <main style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>🤝 셀러 관리</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
          이번달 진행 셀러 · 파트너 / 담당자 필터 · 셀러 클릭 → 마켓 / 브랜드 / 노션 페이지
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
          <div style={{ fontSize: 14, color: '#6b7280' }}>셀러 데이터 불러오는 중...</div>
        </div>
      )}

      {data && (
        <>
          {/* 요약 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            <SummaryCard label="총 셀러" value={`${aggregated.length}곳`} accent="#2563eb" />
            <SummaryCard label="누적 매출" value={fmt(totalSales)} accent="#10b981" />
            <SummaryCard label="🤝 파트너 셀러" value={`${partnerCount}곳`} accent="#f59e0b" />
            <SummaryCard label="파트너 매출 비중" value={`${partnerShare.toFixed(1)}%`} accent="#7c3aed" />
          </div>

          {/* 필터 영역 */}
          <div style={{ ...card, marginBottom: 16 }}>
            <SectionTitle emoji="🔍" title="필터 / 검색" />

            <input
              type="text"
              placeholder="셀러명 / 담당자명 / 브랜드명 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', fontSize: 14,
                border: '1px solid #d1d5db', borderRadius: 8, marginBottom: 12,
                boxSizing: 'border-box',
              }}
            />

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 6 }}>파트너 구분</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <FilterChip active={partnerFilter === 'all'} onClick={() => setPartnerFilter('all')}>
                  전체 ({aggregated.length})
                </FilterChip>
                <FilterChip active={partnerFilter === 'partner'} onClick={() => setPartnerFilter('partner')} color="#f59e0b">
                  🤝 파트너만 ({partnerCount})
                </FilterChip>
                <FilterChip active={partnerFilter === 'regular'} onClick={() => setPartnerFilter('regular')}>
                  일반 셀러만 ({aggregated.length - partnerCount})
                </FilterChip>
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 6 }}>셀러 담당자</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <FilterChip active={managerFilter === 'all'} onClick={() => setManagerFilter('all')}>
                  전체
                </FilterChip>
                {managerList.map(m => {
                  const c = aggregated.filter(s => s.manager === m).length;
                  return (
                    <FilterChip key={m} active={managerFilter === m} onClick={() => setManagerFilter(m)}>
                      {m} ({c})
                    </FilterChip>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                <strong style={{ color: '#374151' }}>{filtered.length}개</strong> 셀러 표시
                {search && <> · 검색 "<strong>{search}</strong>"</>}
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>정렬:</span>
                <SortBtn active={sortBy === 'sales'} onClick={() => setSortBy('sales')}>매출 ↓</SortBtn>
                <SortBtn active={sortBy === 'orderCount'} onClick={() => setSortBy('orderCount')}>주문 ↓</SortBtn>
                <SortBtn active={sortBy === 'marketCount'} onClick={() => setSortBy('marketCount')}>마켓 ↓</SortBtn>
                <SortBtn active={sortBy === 'achievementRate'} onClick={() => setSortBy('achievementRate')}>달성률 ↓</SortBtn>
              </div>
            </div>
          </div>

          {/* 셀러 리스트 */}
          <div style={card}>
            <SectionTitle
              emoji="📋"
              title="셀러 리스트"
              hint="행 클릭 → 해당 셀러의 마켓 / 브랜드 / 월별 추이"
            />

            <div style={{
              display: 'grid',
              gridTemplateColumns: '34px minmax(180px,1.6fr) 90px 70px 100px 80px 80px 60px 28px',
              gap: 8, padding: '10px 12px',
              background: '#f9fafb', borderRadius: 6,
              fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 6,
            }}>
              <div>#</div>
              <div>셀러 / 브랜드</div>
              <div>담당자</div>
              <div style={{ textAlign: 'center' }}>구분</div>
              <div style={{ textAlign: 'right' }}>매출</div>
              <div style={{ textAlign: 'right' }}>주문</div>
              <div style={{ textAlign: 'right' }}>마켓</div>
              <div style={{ textAlign: 'right' }}>달성률</div>
              <div></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filtered.map((s, i) => {
                const isOpen = expanded === s.name;
                const notionUrl = PARTNER_NOTION[s.name];
                return (
                  <div key={s.name} style={{
                    border: '1px solid ' + (isOpen ? '#2563eb' : s.isPartner ? '#fcd34d' : '#e5e7eb'),
                    borderRadius: 8, overflow: 'hidden',
                    background: s.isPartner ? '#fffbeb' : '#fff',
                  }}>
                    <div
                      onClick={() => setExpanded(isOpen ? null : s.name)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '34px minmax(180px,1.6fr) 90px 70px 100px 80px 80px 60px 28px',
                        gap: 8, padding: '12px', cursor: 'pointer',
                        background: isOpen ? '#eff6ff' : 'transparent',
                        alignItems: 'center', fontSize: 13,
                      }}
                    >
                      <div style={{ color: '#9ca3af' }}>#{i + 1}</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontWeight: 600 }}>{s.name}</span>
                          {s.isPartner && <PartnerBadge />}
                        </div>
                        <div style={{ fontSize: 10, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.brands.slice(0, 3).join(', ')}{s.brands.length > 3 && ` +${s.brands.length - 3}`}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{s.manager || '-'}</div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                          background: s.isPartner ? '#fef3c7' : '#f3f4f6',
                          color: s.isPartner ? '#92400e' : '#6b7280',
                        }}>{s.isPartner ? '파트너' : '일반'}</span>
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 13 }}>{fmt(s.sales)}</div>
                      <div style={{ textAlign: 'right', fontSize: 12 }}>{(s.orderCount || 0).toLocaleString('ko-KR')}건</div>
                      <div style={{ textAlign: 'right', color: '#6b7280', fontSize: 12 }}>{s.marketCount}개</div>
                      <div style={{
                        textAlign: 'right', fontWeight: 600, fontSize: 12,
                        color: s.achievementRate >= 100 ? '#10b981' : s.achievementRate >= 80 ? '#f59e0b' : '#ef4444',
                      }}>{s.achievementRate != null ? `${s.achievementRate.toFixed(0)}%` : '-'}</div>
                      <div style={{ textAlign: 'right', color: '#9ca3af' }}>{isOpen ? '▲' : '▼'}</div>
                    </div>

                    {isOpen && (
                      <div style={{ padding: 16, background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                        {/* 파트너 셀러: 노션 링크 + 월별 추이 */}
                        {s.isPartner && (
                          <div style={{
                            padding: 14, marginBottom: 14, background: '#faf9f6',
                            border: '1px solid #e7e3da', borderRadius: 8,
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#37352f' }}>
                                🤝 파트너 셀러 — 월별 매출 추이
                              </div>
                              {notionUrl && (
                                <a href={notionUrl} target="_blank" rel="noopener noreferrer" style={{
                                  fontSize: 12, color: '#a47148', fontWeight: 600,
                                  textDecoration: 'none', padding: '5px 10px',
                                  background: '#fff', border: '1px solid #e7e3da', borderRadius: 6,
                                }}>노션 워크스페이스 ↗</a>
                              )}
                            </div>
                            {s.lastMonth && s.thisMonth && (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                <MonthCell label="저번달" value={`${s.lastMonth.sales}M`} sub={`${s.lastMonth.marketCount}건`} />
                                <MonthCell label="이번달" value={`${s.thisMonth.sales}M`} sub={`${s.thisMonth.marketCount}건`} highlight />
                                <MonthCell label="다음달(예상)" value={`${s.nextMonth.sales}M`} sub={`${s.nextMonth.marketCount}건`} dashed />
                              </div>
                            )}
                          </div>
                        )}

                        {/* 브랜드 목록 */}
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>
                            함께 일한 브랜드 ({s.brands.length}곳)
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {s.brands.map(b => (
                              <span key={b} style={{
                                fontSize: 11, padding: '3px 8px', borderRadius: 12,
                                background: '#fff', border: '1px solid #e5e7eb',
                              }}>{b}</span>
                            ))}
                          </div>
                        </div>

                        {/* 마켓 테이블 */}
                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                          진행 마켓 <strong>{s.markets.length}개</strong>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 6, overflow: 'hidden' }}>
                          <thead>
                            <tr style={{ background: '#f3f4f6' }}>
                              <th style={th}>브랜드</th>
                              <th style={{ ...th, textAlign: 'center' }}>상태</th>
                              <th style={{ ...th, textAlign: 'left' }}>기간</th>
                              <th style={{ ...th, textAlign: 'right' }}>매출</th>
                              <th style={{ ...th, textAlign: 'right' }}>주문</th>
                              <th style={{ ...th, textAlign: 'right' }}>달성률</th>
                            </tr>
                          </thead>
                          <tbody>
                            {s.markets.sort((a, c) => (c.sales || 0) - (a.sales || 0)).map(m => {
                              const stColor = { ENDED: '#6b7280', ACTIVE: '#10b981', READY: '#3b82f6' }[m.status] || '#6b7280';
                              const stLabel = { ENDED: '종료', ACTIVE: '진행중', READY: '예정' }[m.status] || m.status;
                              const achColor = m.achievementRate >= 100 ? '#10b981' : m.achievementRate >= 80 ? '#f59e0b' : '#ef4444';
                              return (
                                <tr key={m.id}>
                                  <td style={{ ...td, fontWeight: 500 }}>{m.brandName || '-'}</td>
                                  <td style={{ ...td, textAlign: 'center' }}>
                                    <span style={{ color: stColor, fontWeight: 600, fontSize: 11 }}>{stLabel}</span>
                                  </td>
                                  <td style={{ ...td, fontSize: 11, color: '#6b7280' }}>{m.startedAt?.slice(0, 10)} ~ {m.endedAt?.slice(0, 10)}</td>
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
                조건에 맞는 셀러 없음
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
              <li>셀러 인스타그램 / 팔로워 수 / 평균 릴스 조회수 (인플루언서 API 연동)</li>
              <li>셀러 등록일 / 첫 마켓 / 누적 거래 횟수</li>
              <li>셀러별 5팀 담당자 정보 (마케팅/CS/물류 담당자)</li>
              <li>셀러별 CS율 / 환불율 / 배송완료율</li>
              <li>셀러와 함께 진행할 다음 마켓 일정 (노션 자동 매칭)</li>
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

function MonthCell({ label, value, sub, highlight, dashed }) {
  return (
    <div style={{
      padding: 10, textAlign: 'center',
      background: highlight ? '#fff' : 'transparent',
      border: '1px solid ' + (highlight ? '#fcd34d' : '#e7e3da'),
      borderStyle: dashed ? 'dashed' : 'solid',
      borderRadius: 6,
    }}>
      <div style={{ fontSize: 11, color: dashed ? '#a47148' : '#6b6b6b' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: dashed ? '#a47148' : '#37352f', marginTop: 2 }}>{value}</div>
      <div style={{ fontSize: 10, color: '#9ca3af' }}>{sub}</div>
    </div>
  );
}
