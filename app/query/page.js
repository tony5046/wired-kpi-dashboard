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

export default function QueryBuilder() {
  const { data: session, status } = useSession();

  const [metric, setMetric] = useState('sales');
  const [period, setPeriod] = useState('thisMonth');
  const [group, setGroup] = useState('seller');
  const [limit, setLimit] = useState(10);

  const [favorites, setFavorites] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const runQuery = useCallback(async (params) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.error) setError(data.message || data.error);
      else setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRun = () => {
    runQuery({ metric, period, group, limit });
  };

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
    runQuery(fav.params);
  };

  const handleRemoveFavorite = (id) => {
    saveFavorites(favorites.filter(f => f.id !== id));
  };

  if (status === 'loading') return <main style={{ padding: 40 }}>로딩 중...</main>;

  if (!session) {
    return (
      <main style={{ padding: 40, maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: 28 }}>로그인 필요</h1>
        <p style={{ color: '#666' }}>회원님 회사 계정으로 로그인해주세요.</p>
        <button onClick={() => signIn('google')} style={{
          padding: '12px 24px', fontSize: 16,
          background: '#4285F4', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
        }}>Google 계정으로 로그인</button>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 1280, margin: '0 auto', background: '#f9fafb', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>🔎 매출 조회기</h1>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>
            버튼 클릭으로 원하는 매출 데이터 즉시 조회
          </p>
        </div>
        <Link href="/" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}>
          ← 대시보드로
        </Link>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* 왼쪽: 쿼리 빌더 + 결과 */}
        <div>
          <section style={card}>
            <h2 style={{ fontSize: 14, color: '#6b7280', margin: '0 0 16px', fontWeight: 500 }}>질문 만들기</h2>

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
              <button onClick={handleRun} disabled={loading}
                style={{
                  padding: '10px 24px', fontSize: 14, fontWeight: 600,
                  background: '#2563eb', color: '#fff',
                  border: 'none', borderRadius: 8,
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}>
                {loading ? '조회 중...' : '▶ 실행'}
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
          </section>

          {error && (
            <div style={{ ...card, marginTop: 16, color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', fontSize: 14 }}>
              오류: {error}
            </div>
          )}

          {result && !loading && (
            <section style={{ ...card, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 15, margin: 0, fontWeight: 600 }}>
                  결과: {buildLabel(result.params)}
                </h2>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                  {result.range.startDate} ~ {result.range.endDate}
                </span>
              </div>

              {result.type === 'total' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  <div style={metricBox}><div style={metricLabel}>매출</div><div style={metricValue}>{won(result.total.sales)}</div></div>
                  <div style={metricBox}><div style={metricLabel}>공헌이익</div><div style={metricValue}>{won(result.total.margin)}</div></div>
                  <div style={metricBox}><div style={metricLabel}>공헌이익률</div><div style={metricValue}>{result.total.marginRate.toLocaleString('ko-KR', {maximumFractionDigits: 2})}%</div></div>
                  <div style={metricBox}><div style={metricLabel}>주문 건수</div><div style={metricValue}>{count(result.total.count)}</div></div>
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
            </section>
          )}
        </div>

        {/* 오른쪽: 즐겨찾기 */}
        <div>
          <section style={card}>
            <h2 style={{ fontSize: 14, color: '#6b7280', margin: '0 0 12px', fontWeight: 500 }}>
              ⭐ 즐겨찾기 ({favorites.length})
            </h2>
            {favorites.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>
                자주 쓰는 질문을 즐겨찾기에 추가해보세요
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
          </section>
        </div>
      </div>
    </main>
  );
}

const card = {
  padding: 20,
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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
const metricBox = {
  padding: 16, background: '#f9fafb', borderRadius: 8,
};
const metricLabel = { fontSize: 12, color: '#6b7280', marginBottom: 4 };
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
