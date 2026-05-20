'use client';
import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const METRICS = [
  { value: 'sales', label: '💰 매출' },
  { value: 'margin', label: '💵 공헌이익' },
  { value: 'count', label: '📦 주문 건수' },
];

const PERIODS = [
  { value: 'thisWeek', label: '이번주' },
  { value: 'lastWeek', label: '지난주' },
  { value: 'thisMonth', label: '이번달' },
  { value: 'lastMonth', label: '지난달' },
  { value: 'thisQuarter', label: '이번분기' },
  { value: 'lastQuarter', label: '지난분기' },
  { value: 'thisYear', label: '올해' },
  { value: 'lastYear', label: '작년' },
];

const GROUPS = [
  { value: 'total', label: '🌐 전체 합계' },
  { value: 'seller', label: '🏪 셀러별' },
  { value: 'brand', label: '🏷️ 브랜드별' },
  { value: 'market', label: '🛒 마켓별' },
  { value: 'manager', label: '👤 셀러담당자별' },
];

const LIMITS = [
  { value: 5, label: 'TOP 5' },
  { value: 10, label: 'TOP 10' },
  { value: 20, label: 'TOP 20' },
  { value: 'all', label: '전체' },
];

const FAVORITES_KEY = 'wired_query_favorites_v1';

// Default Quick Stats (자동 표시)
const QUICK_TOTAL_QUERIES = [
  { id: 'tw', label: '이번주', params: { metric: 'sales', period: 'thisWeek', group: 'total' } },
  { id: 'tm', label: '이번달', params: { metric: 'sales', period: 'thisMonth', group: 'total' } },
  { id: 'lm', label: '지난달', params: { metric: 'sales', period: 'lastMonth', group: 'total' } },
  { id: 'ty', label: '올해 누적', params: { metric: 'sales', period: 'thisYear', group: 'total' } },
];

const QUICK_TOP_QUERIES = [
  { id: 'tm_sel', label: '🏪 이번달 셀러 TOP 3', params: { metric: 'sales', period: 'thisMonth', group: 'seller', limit: 3 } },
  { id: 'tm_brd', label: '🏷️ 이번달 브랜드 TOP 3', params: { metric: 'sales', period: 'thisMonth', group: 'brand', limit: 3 } },
  { id: 'tm_mgr', label: '👤 이번달 담당자 TOP 3', params: { metric: 'sales', period: 'thisMonth', group: 'manager', limit: 3 } },
];

function won(n) {
  if (n === null || n === undefined || isNaN(Number(n))) return '-';
  return Number(n).toLocaleString('ko-KR') + '원';
}
function count(n) {
  if (n === null || n === undefined || isNaN(Number(n))) return '-';
  return Number(n).toLocaleString('ko-KR') + '건';
}

function buildLabel(params) {
  const m = METRICS.find(x => x.value === params.metric)?.label || params.metric;
  const p = PERIODS.find(x => x.value === params.period)?.label || params.period;
  const g = GROUPS.find(x => x.value === params.group)?.label || params.group;
  if (params.group === 'total') return `${p} ${m} 합계`;
  const lim = LIMITS.find(x => String(x.value) === String(params.limit))?.label || `TOP ${params.limit}`;
  return `${p} ${g} ${lim} (${m})`;
}

async function runQuery(params) {
  const res = await fetch('/api/query', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

function QuickTotalCard({ label, data, loading, error }) {
  return (
    <div style={quickTotalCard}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{label} 매출</div>
      {loading ? (
        <div style={{ fontSize: 14, color: '#9ca3af' }}>로딩...</div>
      ) : error ? (
        <div style={{ fontSize: 12, color: '#ef4444' }}>오류</div>
      ) : (
        <>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 4 }}>
            {won(data?.total?.sales)}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>
            마진 {won(data?.total?.margin)} · {count(data?.total?.count)}
          </div>
        </>
      )}
    </div>
  );
}

function QuickTopList({ label, data, loading, error, onClickItem }) {
  return (
    <div style={quickTopCard}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{label}</div>
      {loading ? (
        <div style={{ fontSize: 13, color: '#9ca3af' }}>로딩...</div>
      ) : error ? (
        <div style={{ fontSize: 12, color: '#ef4444' }}>오류 발생</div>
      ) : (
        <div>
          {(data?.rows || []).map((r, i) => (
            <div key={r.name} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 0', borderBottom: i < (data.rows.length - 1) ? '1px solid #f3f4f6' : 'none',
            }}>
              <span style={{ fontSize: 13 }}>
                <span style={{ color: '#9ca3af', marginRight: 6 }}>#{i + 1}</span>
                <strong>{r.name}</strong>
              </span>
              <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{won(r.sales)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function btn(active) {
  return {
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    background: active ? '#2563eb' : '#fff',
    color: active ? '#fff' : '#374151',
    border: '1px solid ' + (active ? '#2563eb' : '#d1d5db'),
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.1s',
  };
}

function ButtonGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={btn(String(value) === String(o.value))}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function QueryPage() {
  const { data: session, status } = useSession();

  // Quick Stats 자동 로딩
  const [quickTotals, setQuickTotals] = useState({});
  const [quickTops, setQuickTops] = useState({});
  const [quickLoading, setQuickLoading] = useState(true);

  // 검색 UI 상태
  const [metric, setMetric] = useState('sales');
  const [period, setPeriod] = useState('thisMonth');
  const [group, setGroup] = useState('seller');
  const [limit, setLimit] = useState(10);

  const [favorites, setFavorites] = useState([]);
  const [result, setResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // 즐겨찾기 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
  }, []);

  const saveFavorites = useCallback((list) => {
    setFavorites(list);
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(list)); } catch {}
  }, []);

  // Quick Stats 로딩 — 페이지 진입 시 1회
  useEffect(() => {
    if (!session) return;
    setQuickLoading(true);

    const totals = {};
    const tops = {};

    Promise.all([
      ...QUICK_TOTAL_QUERIES.map(async (q) => {
        try {
          const data = await runQuery(q.params);
          if (data.error) totals[q.id] = { error: data.message || data.error };
          else totals[q.id] = data;
        } catch (e) {
          totals[q.id] = { error: e.message };
        }
      }),
      ...QUICK_TOP_QUERIES.map(async (q) => {
        try {
          const data = await runQuery(q.params);
          if (data.error) tops[q.id] = { error: data.message || data.error };
          else tops[q.id] = data;
        } catch (e) {
          tops[q.id] = { error: e.message };
        }
      }),
    ]).then(() => {
      setQuickTotals(totals);
      setQuickTops(tops);
      setQuickLoading(false);
    });
  }, [session]);

  const handleRun = async (params) => {
    setSearchLoading(true);
    setSearchError(null);
    try {
      const data = await runQuery(params);
      if (data.error) setSearchError(data.message || data.error);
      else setResult(data);
    } catch (e) {
      setSearchError(e.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSubmit = () => handleRun({ metric, period, group, limit });

  const handleAddFavorite = () => {
    const params = { metric, period, group, limit };
    const label = buildLabel(params);
    if (favorites.some(f => f.label === label)) {
      alert('이미 즐겨찾기에 있습니다');
      return;
    }
    saveFavorites([...favorites, { id: Date.now(), label, params }]);
  };

  const handleRunFavorite = (fav) => {
    setMetric(fav.params.metric);
    setPeriod(fav.params.period);
    setGroup(fav.params.group);
    setLimit(fav.params.limit);
    handleRun(fav.params);
  };

  const handleRemoveFavorite = (id) => {
    saveFavorites(favorites.filter(f => f.id !== id));
  };

  if (status === 'loading') return <main style={{ padding: 40 }}>로딩 중...</main>;

  if (!session) {
    return (
      <main style={{ padding: 40, maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: 28 }}>로그인 필요</h1>
        <p style={{ color: '#666' }}>회사 계정으로 로그인해주세요.</p>
        <button onClick={() => signIn('google')} style={{
          padding: '12px 24px', fontSize: 16, background: '#4285F4', color: '#fff',
          border: 'none', borderRadius: 8, cursor: 'pointer',
        }}>Google 계정으로 로그인</button>
      </main>
    );
  }

  // 에러 체크: 토큰 만료
  const tokenExpired = Object.values(quickTotals).some(d => d?.error && d.error.includes('EXPIRED'));

  return (
    <main style={{ padding: 24, maxWidth: 1280, margin: '0 auto', background: '#f9fafb', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>🔎 매출 조회기</h1>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>
            기본 요약 + 원하는 데이터 직접 검색
          </p>
        </div>
        <Link href="/" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}>
          ← 대시보드로
        </Link>
      </header>

      {tokenExpired && (
        <div style={{
          padding: '12px 16px', marginBottom: 16,
          background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8,
          fontSize: 13, color: '#92400e',
        }}>
          ⚠️ 와이어드민 토큰이 만료됐어요. 매출 데이터를 가져오지 못합니다. 새 토큰 발급 필요.
        </div>
      )}

      {/* ━━ 1. 기본 요약 (자동) ━━ */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={sectionTitle}>📌 매출 한눈에</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {QUICK_TOTAL_QUERIES.map(q => (
            <QuickTotalCard
              key={q.id}
              label={q.label}
              data={quickTotals[q.id]}
              loading={quickLoading}
              error={quickTotals[q.id]?.error}
            />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {QUICK_TOP_QUERIES.map(q => (
            <QuickTopList
              key={q.id}
              label={q.label}
              data={quickTops[q.id]}
              loading={quickLoading}
              error={quickTops[q.id]?.error}
            />
          ))}
        </div>
      </section>

      {/* ━━ 2. 검색 (수동) ━━ */}
      <section style={{ marginBottom: 16 }}>
        <h2 style={sectionTitle}>🔍 직접 검색</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          <div>
            <div style={card}>
              <div style={fieldRow}>
                <label style={fieldLabel}>📊 무엇을</label>
                <ButtonGroup options={METRICS} value={metric} onChange={setMetric} />
              </div>

              <div style={fieldRow}>
                <label style={fieldLabel}>📅 언제</label>
                <ButtonGroup options={PERIODS} value={period} onChange={setPeriod} />
              </div>

              <div style={fieldRow}>
                <label style={fieldLabel}>🔍 무엇 별로</label>
                <ButtonGroup options={GROUPS} value={group} onChange={setGroup} />
              </div>

              {group !== 'total' && (
                <div style={fieldRow}>
                  <label style={fieldLabel}>📈 정렬</label>
                  <ButtonGroup options={LIMITS} value={limit} onChange={setLimit} />
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={handleSearchSubmit} disabled={searchLoading}
                  style={{
                    padding: '10px 24px', fontSize: 14, fontWeight: 600,
                    background: '#2563eb', color: '#fff',
                    border: 'none', borderRadius: 8,
                    cursor: searchLoading ? 'wait' : 'pointer',
                    opacity: searchLoading ? 0.6 : 1,
                  }}>
                  {searchLoading ? '조회 중...' : '▶ 실행'}
                </button>
                <button onClick={handleAddFavorite}
                  style={{
                    padding: '10px 16px', fontSize: 14,
                    background: '#fff', color: '#374151',
                    border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer',
                  }}>
                  ⭐ 즐겨찾기 추가
                </button>
              </div>

              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12 }}>
                현재 질문: <strong style={{ color: '#374151' }}>{buildLabel({ metric, period, group, limit })}</strong>
              </p>
            </div>

            {searchError && (
              <div style={{ ...card, marginTop: 16, color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', fontSize: 14 }}>
                오류: {searchError}
              </div>
            )}

            {result && !searchLoading && (
              <div style={{ ...card, marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 15, margin: 0, fontWeight: 600 }}>
                    결과: {buildLabel(result.params)}
                  </h3>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>
                    {result.range.startDate} ~ {result.range.endDate}
                  </span>
                </div>

                {result.type === 'total' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    <div style={metricBox}><div style={metricLabelSt}>매출</div><div style={metricValue}>{won(result.total.sales)}</div></div>
                    <div style={metricBox}><div style={metricLabelSt}>공헌이익</div><div style={metricValue}>{won(result.total.margin)}</div></div>
                    <div style={metricBox}><div style={metricLabelSt}>공헌이익률</div><div style={metricValue}>{result.total.marginRate.toLocaleString('ko-KR', {maximumFractionDigits: 2})}%</div></div>
                    <div style={metricBox}><div style={metricLabelSt}>주문 건수</div><div style={metricValue}>{count(result.total.count)}</div></div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ ...th, textAlign: 'left', width: 50 }}>#</th>
                          <th style={{ ...th, textAlign: 'left' }}>이름</th>
                          <th style={th}>매출</th>
                          <th style={th}>공헌이익</th>
                          <th style={th}>이익률</th>
                          <th style={th}>건수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.map((r, i) => (
                          <tr key={r.name}>
                            <td style={{ ...td, textAlign: 'left', color: '#9ca3af' }}>{i + 1}</td>
                            <td style={{ ...td, textAlign: 'left', fontWeight: 500 }}>{r.name}</td>
                            <td style={{ ...td, fontWeight: result.metricKey === 'sales' ? 700 : 400, color: result.metricKey === 'sales' ? '#2563eb' : '#374151' }}>{won(r.sales)}</td>
                            <td style={{ ...td, fontWeight: result.metricKey === 'margin' ? 700 : 400, color: result.metricKey === 'margin' ? '#2563eb' : '#374151' }}>{won(r.margin)}</td>
                            <td style={td}>{r.marginRate.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%</td>
                            <td style={{ ...td, fontWeight: result.metricKey === 'count' ? 700 : 400, color: result.metricKey === 'count' ? '#2563eb' : '#374151' }}>{count(r.count)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12 }}>
                      {result.totalRows.toLocaleString('ko-KR')}개 중 상위 {result.showing}개 표시
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 즐겨찾기 */}
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 14, color: '#6b7280', margin: '0 0 12px', fontWeight: 500 }}>
                ⭐ 즐겨찾기 ({favorites.length})
              </h3>
              {favorites.length === 0 ? (
                <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>
                  자주 쓰는 질문을 즐겨찾기에 추가하세요
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {favorites.map(f => (
                    <div key={f.id} style={favItem}>
                      <button onClick={() => handleRunFavorite(f)} style={favBtn}>
                        {f.label}
                      </button>
                      <button onClick={() => handleRemoveFavorite(f.id)} style={favRemove}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const sectionTitle = { fontSize: 16, margin: '0 0 12px', fontWeight: 600, color: '#111' };
const card = {
  padding: 20,
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};
const quickTotalCard = {
  padding: 16,
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
};
const quickTopCard = {
  padding: 16,
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
};
const fieldRow = { marginBottom: 14 };
const fieldLabel = { fontSize: 13, color: '#6b7280', marginBottom: 6, display: 'block' };
const th = {
  padding: '10px 8px', borderBottom: '2px solid #e5e7eb',
  textAlign: 'right', fontSize: 12, color: '#6b7280', fontWeight: 500,
};
const td = {
  padding: '10px 8px', borderBottom: '1px solid #f3f4f6', textAlign: 'right',
};
const metricBox = { padding: 16, background: '#f9fafb', borderRadius: 8 };
const metricLabelSt = { fontSize: 12, color: '#6b7280', marginBottom: 4 };
const metricValue = { fontSize: 18, fontWeight: 700, color: '#111' };
const favItem = {
  display: 'flex', alignItems: 'stretch',
  border: '1px solid #e5e7eb', borderRadius: 8,
  overflow: 'hidden',
};
const favBtn = {
  flex: 1, textAlign: 'left', padding: '10px 12px',
  fontSize: 13, fontWeight: 500,
  background: '#fff', border: 'none', cursor: 'pointer',
};
const favRemove = {
  padding: '0 10px', fontSize: 14, color: '#9ca3af',
  background: '#f9fafb', border: 'none', borderLeft: '1px solid #e5e7eb',
  cursor: 'pointer',
};
