'use client';
import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';

// ───── 유틸 ─────
function won(n) {
  if (n === null || n === undefined || isNaN(Number(n))) return '-';
  return Number(n).toLocaleString('ko-KR') + '원';
}
function count(n) {
  if (n === null || n === undefined || isNaN(Number(n))) return '-';
  return Number(n).toLocaleString('ko-KR') + '건';
}
function pct(n) {
  if (n === null || n === undefined || isNaN(Number(n))) return '-';
  return Number(n).toLocaleString('ko-KR', { maximumFractionDigits: 1 }) + '%';
}

function Spinner({ size = 16, color = '#2563eb' }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: `2px solid ${color}33`, borderTopColor: color,
      borderRadius: '50%', animation: 'wkd-spin 0.8s linear infinite',
      verticalAlign: 'middle',
    }} />
  );
}

function LoadingRow({ size = 16, text = '데이터 가져오는 중...' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: 13 }}>
      <Spinner size={size} />
      <span>{text}</span>
    </div>
  );
}

// ───── 기본 요약 카드 ─────
function PeriodSummaryCard({ title, data, loading, error, range, color = '#2563eb' }) {
  return (
    <div style={summaryCard}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12 }}>
        {range ? `${range.startDate} ~ ${range.endDate}` : ' '}
      </div>

      {loading ? (
        <LoadingRow text="로딩 중..." />
      ) : error ? (
        <div style={{ fontSize: 12, color: '#ef4444' }}>로드 실패: {error}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Row label="총 매출 (포함)" value={won(data?.totalSales)} hint="출고 대기 포함" color={color} bold />
          <Row label="총 매출 (미포함)" value={won(data?.actualSales)} hint="출고 완료만" />
          <Row label="누적 예상매출" value={won(data?.estimatedSales)} hint="마켓 등록값" />
          <Row label="공구 마켓 (총)" value={count(data?.marketsAll)} />
          <Row label="공구 마켓 (진행)" value={count(data?.marketsActive)} hint="취소 제외" />
        </div>
      )}
    </div>
  );
}

function SimpleSummaryCard({ title, data, loading, error, range }) {
  return (
    <div style={summaryCard}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12 }}>
        {range ? `${range.startDate} ~ ${range.endDate}` : ' '}
      </div>

      {loading ? (
        <LoadingRow text="로딩 중..." />
      ) : error ? (
        <div style={{ fontSize: 12, color: '#ef4444' }}>오류</div>
      ) : (
        <>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#2563eb', marginBottom: 6 }}>
            {won(data?.totalSales)}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            마진 {won(data?.totalMargin)}<br />
            예상매출 {won(data?.estimatedSales)}<br />
            마켓 {count(data?.marketsAll)} (진행 {count(data?.marketsActive)})
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, hint, bold, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: 12, color: '#6b7280' }}>
        {label}
        {hint && <span style={{ marginLeft: 4, fontSize: 10, color: '#9ca3af' }}>({hint})</span>}
      </span>
      <span style={{ fontSize: bold ? 16 : 14, fontWeight: bold ? 700 : 500, color: color || '#111' }}>
        {value}
      </span>
    </div>
  );
}

// ───── 셀러/브랜드 리스트 (검색 + 필터) ─────
function ListCard({ title, emoji, rows, loading, columns, sortOptions, range }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(sortOptions[0].value);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    const arr = q
      ? rows.filter(r => {
          const hay = [
            r.name || '',
            r.manager || '',
            r.managerName || '',
            r.sellerName || '',
            r.brandName || '',
            ...(r.brands || []),
            ...(r.sellers || []),
          ].join(' ').toLowerCase();
          return hay.includes(q);
        })
      : rows;

    return [...arr].sort((a, b) => {
      const av = a[sortBy] || 0;
      const bv = b[sortBy] || 0;
      return bv - av;
    });
  }, [rows, search, sortBy]);

  return (
    <section style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 16, margin: 0, fontWeight: 600 }}>
            {emoji} {title} <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400 }}>({filtered.length}개)</span>
          </h2>
          {range && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{range.startDate} ~ {range.endDate}</div>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔎 이름/담당자 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '8px 12px', fontSize: 13, flex: 1, minWidth: 200,
            border: '1px solid #d1d5db', borderRadius: 6,
          }}
        />
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>정렬:</span>
          {sortOptions.map(o => (
            <button key={o.value} onClick={() => setSortBy(o.value)} style={sortBtn(sortBy === o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingRow text="목록 가져오는 중..." />
      ) : filtered.length === 0 ? (
        <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: 20 }}>
          {search ? '검색 결과 없음' : '데이터 없음'}
        </p>
      ) : (
        <div style={{ overflowX: 'auto', maxHeight: 600, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1 }}>
              <tr>
                <th style={{ ...th, textAlign: 'left', width: 40 }}>#</th>
                {columns.map(c => (
                  <th key={c.key} style={{ ...th, textAlign: c.align || 'right' }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.name}>
                  <td style={{ ...td, textAlign: 'left', color: '#9ca3af' }}>{i + 1}</td>
                  {columns.map(c => (
                    <td key={c.key} style={{ ...td, textAlign: c.align || 'right' }}>
                      {c.render ? c.render(r) : (r[c.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ManagerList({ rows, loading, range }) {
  return (
    <section style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, margin: 0, fontWeight: 600 }}>👤 이번달 담당자별 매출</h2>
        {range && <div style={{ fontSize: 11, color: '#9ca3af' }}>{range.startDate} ~ {range.endDate}</div>}
      </div>
      {loading ? (
        <LoadingRow text="목록 가져오는 중..." />
      ) : !rows || rows.length === 0 ? (
        <p style={{ fontSize: 13, color: '#9ca3af' }}>데이터 없음</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ ...th, textAlign: 'left', width: 40 }}>#</th>
              <th style={{ ...th, textAlign: 'left' }}>담당자</th>
              <th style={th}>매출</th>
              <th style={th}>마진</th>
              <th style={th}>고객(중복제거)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name}>
                <td style={{ ...td, textAlign: 'left', color: '#9ca3af' }}>{i + 1}</td>
                <td style={{ ...td, textAlign: 'left', fontWeight: 500 }}>{r.name}</td>
                <td style={td}>{won(r.sales)}</td>
                <td style={td}>{won(r.margin)}</td>
                <td style={td}>{count(r.uniqueCustomers)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

// ───── 메인 페이지 ─────
const PERIODS = [
  { key: 'thisWeek', title: '📅 이번주', isFull: false },
  { key: 'thisMonth', title: '📅 이번달', isFull: true }, // 셀러/브랜드 리스트도 가져옴
  { key: 'lastMonth', title: '📅 지난달', isFull: false },
  { key: 'thisYear', title: '📅 올해 누적', isFull: false },
  { key: 'sameMonthLastYear', title: '📅 전년 동월', isFull: false },
];

export default function QueryPage() {
  const { data: session, status } = useSession();
  const [summaries, setSummaries] = useState({});

  useEffect(() => {
    if (!session) return;

    PERIODS.forEach(p => {
      const qs = p.isFull ? `?period=${p.key}&full=true` : `?period=${p.key}`;
      fetch('/api/summary' + qs)
        .then(r => r.json())
        .then(d => setSummaries(prev => ({ ...prev, [p.key]: d })))
        .catch(e => setSummaries(prev => ({ ...prev, [p.key]: { error: e.message } })));
    });
  }, [session]);

  if (status === 'loading') return <main style={{ padding: 40 }}>로딩 중...</main>;
  if (!session) {
    return (
      <main style={{ padding: 40, maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: 28 }}>로그인 필요</h1>
        <button onClick={() => signIn('google')} style={{
          padding: '12px 24px', fontSize: 16, background: '#4285F4', color: '#fff',
          border: 'none', borderRadius: 8, cursor: 'pointer',
        }}>Google 계정으로 로그인</button>
      </main>
    );
  }

  const tokenExpired = Object.values(summaries).some(d => d?.ordersError?.includes('EXPIRED') || d?.marketsError?.includes('EXPIRED') || d?.message?.includes('EXPIRED'));

  const thisMonth = summaries.thisMonth;

  return (
    <main style={{ padding: 24, maxWidth: 1400, margin: '0 auto', background: '#f9fafb', minHeight: '100vh' }}>
      <style>{`@keyframes wkd-spin { to { transform: rotate(360deg); } }`}</style>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>🔎 매출 조회기</h1>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>기본 요약 + 셀러/브랜드 검색</p>
        </div>
        <Link href="/" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}>← 대시보드로</Link>
      </header>

      {tokenExpired && (
        <div style={{
          padding: '12px 16px', marginBottom: 16,
          background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8,
          fontSize: 13, color: '#92400e',
        }}>
          ⚠️ 와이어드민 토큰이 만료됐어요. 새 토큰 발급 필요.
        </div>
      )}

      <div style={{
        padding: '10px 14px', marginBottom: 16,
        background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
        fontSize: 12, color: '#1e40af', display: 'flex', flexWrap: 'wrap', gap: 16,
      }}>
        <span><strong>📊 매출:</strong> 와이어드민 주문 결제금액 합 (배송비 포함)</span>
        <span><strong>📅 기간 기준:</strong> 발송일</span>
        <span><strong>💡 예상매출:</strong> 마켓 등록 시 입력값 (단위: 백만원 × {(1_000_000).toLocaleString()})</span>
        <span><strong>🔄 갱신:</strong> 매일 새벽 3시 + 페이지 진입</span>
      </div>

      {/* ─── 기본 요약 ─── */}
      <h2 style={sectionH}>📌 매출 한눈에</h2>

      {/* 1행: 이번주 + 이번달 (상세) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <PeriodSummaryCard
          title="이번주"
          data={summaries.thisWeek}
          loading={!summaries.thisWeek}
          error={summaries.thisWeek?.error || summaries.thisWeek?.ordersError}
          range={summaries.thisWeek?.range}
        />
        <PeriodSummaryCard
          title="이번달"
          data={summaries.thisMonth}
          loading={!summaries.thisMonth}
          error={summaries.thisMonth?.error || summaries.thisMonth?.ordersError}
          range={summaries.thisMonth?.range}
          color="#7c3aed"
        />
      </div>

      {/* 2행: 지난달, 올해, 전년동월 (간단) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <SimpleSummaryCard
          title="📅 지난달"
          data={summaries.lastMonth}
          loading={!summaries.lastMonth}
          error={summaries.lastMonth?.error}
          range={summaries.lastMonth?.range}
        />
        <SimpleSummaryCard
          title="📅 올해 누적"
          data={summaries.thisYear}
          loading={!summaries.thisYear}
          error={summaries.thisYear?.error}
          range={summaries.thisYear?.range}
        />
        <PeriodSummaryCard
          title="📅 전년 동월"
          data={summaries.sameMonthLastYear}
          loading={!summaries.sameMonthLastYear}
          error={summaries.sameMonthLastYear?.error}
          range={summaries.sameMonthLastYear?.range}
          color="#6b7280"
        />
      </div>

      {/* ─── 마켓 리스트 ─── */}
      <h2 style={sectionH}>🛒 이번달 마켓</h2>
      <ListCard
        title="마켓 전체"
        emoji=""
        loading={!thisMonth || !thisMonth.marketsList}
        rows={thisMonth?.marketsList}
        range={thisMonth?.range}
        sortOptions={[
          { value: 'actualSales', label: '매출' },
          { value: 'orderCount', label: '주문건수' },
          { value: 'estimatedSales', label: '예상매출' },
          { value: 'achievementRate', label: '달성률' },
        ]}
        columns={[
          { key: 'name', label: '마켓명', align: 'left' },
          { key: 'sellerName', label: '셀러', align: 'left' },
          { key: 'brandName', label: '브랜드', align: 'left' },
          { key: 'managerName', label: '담당자', align: 'left' },
          { key: 'status', label: '상태', align: 'left', render: r => {
            const map = { READY: '예정', ACTIVE: '진행중', ENDED: '종료', CANCELED: '취소' };
            const colorMap = { READY: '#3b82f6', ACTIVE: '#10b981', ENDED: '#6b7280', CANCELED: '#ef4444' };
            return <span style={{ color: colorMap[r.status] || '#6b7280', fontSize: 12, fontWeight: 500 }}>{map[r.status] || r.status}</span>;
          }},
          { key: 'actualSales', label: '매출', render: r => won(r.actualSales) },
          { key: 'orderCount', label: '주문건수\n(중복제거)', render: r => count(r.orderCount) },
          { key: 'estimatedSales', label: '예상매출', render: r => won(r.estimatedSales) },
          { key: 'achievementRate', label: '달성률', render: r => {
            const v = r.achievementRate;
            if (v === null || v === undefined) return '-';
            const color = v >= 100 ? '#10b981' : v >= 80 ? '#f59e0b' : '#ef4444';
            return <span style={{ color, fontWeight: 600 }}>{pct(v)}</span>;
          }},
        ]}
      />

      <div style={{ height: 16 }} />

      {/* ─── 셀러 리스트 ─── */}
      <h2 style={sectionH}>🏪 이번달 셀러</h2>
      <ListCard
        title="셀러 전체"
        emoji=""
        loading={!thisMonth || !thisMonth.sellers}
        rows={thisMonth?.sellers}
        range={thisMonth?.range}
        sortOptions={[
          { value: 'actualSales', label: '매출' },
          { value: 'uniqueCustomers', label: '주문건수' },
          { value: 'estimatedSales', label: '예상매출' },
          { value: 'achievementRate', label: '달성률' },
        ]}
        columns={[
          { key: 'name', label: '셀러명', align: 'left' },
          { key: 'manager', label: '담당자', align: 'left' },
          { key: 'actualSales', label: '매출', render: r => won(r.actualSales) },
          { key: 'uniqueCustomers', label: '주문건수\n(중복제거)', render: r => count(r.uniqueCustomers) },
          { key: 'estimatedSales', label: '예상매출', render: r => won(r.estimatedSales) },
          { key: 'achievementRate', label: '달성률', render: r => {
            const v = r.achievementRate;
            if (v === null || v === undefined) return '-';
            const color = v >= 100 ? '#10b981' : v >= 80 ? '#f59e0b' : '#ef4444';
            return <span style={{ color, fontWeight: 600 }}>{pct(v)}</span>;
          }},
        ]}
      />

      <div style={{ height: 16 }} />

      {/* ─── 브랜드 리스트 ─── */}
      <h2 style={sectionH}>🏷️ 이번달 브랜드</h2>
      <ListCard
        title="브랜드 전체"
        emoji=""
        loading={!thisMonth || !thisMonth.brands}
        rows={thisMonth?.brands}
        range={thisMonth?.range}
        sortOptions={[
          { value: 'actualSales', label: '매출' },
          { value: 'uniqueCustomers', label: '주문건수' },
          { value: 'estimatedSales', label: '예상매출' },
          { value: 'achievementRate', label: '달성률' },
        ]}
        columns={[
          { key: 'name', label: '브랜드명', align: 'left' },
          { key: 'sellers', label: '셀러', align: 'left', render: r => (r.sellers || []).slice(0, 3).join(', ') + ((r.sellers?.length || 0) > 3 ? '...' : '') },
          { key: 'actualSales', label: '매출', render: r => won(r.actualSales) },
          { key: 'uniqueCustomers', label: '주문건수\n(중복제거)', render: r => count(r.uniqueCustomers) },
          { key: 'estimatedSales', label: '예상매출', render: r => won(r.estimatedSales) },
          { key: 'achievementRate', label: '달성률', render: r => {
            const v = r.achievementRate;
            if (v === null || v === undefined) return '-';
            const color = v >= 100 ? '#10b981' : v >= 80 ? '#f59e0b' : '#ef4444';
            return <span style={{ color, fontWeight: 600 }}>{pct(v)}</span>;
          }},
        ]}
      />

      <div style={{ height: 16 }} />

      {/* ─── 담당자 ─── */}
      <ManagerList
        rows={thisMonth?.bySellerManager}
        loading={!thisMonth || !thisMonth.bySellerManager}
        range={thisMonth?.range}
      />
    </main>
  );
}

// ───── styles ─────
const sectionH = { fontSize: 18, margin: '8px 0 12px', fontWeight: 700, color: '#111' };
const card = {
  padding: 20, background: '#fff',
  border: '1px solid #e5e7eb', borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};
const summaryCard = {
  padding: 16, background: '#fff',
  border: '1px solid #e5e7eb', borderRadius: 10,
};
const th = {
  padding: '10px 8px', borderBottom: '2px solid #e5e7eb',
  fontSize: 12, color: '#6b7280', fontWeight: 500, whiteSpace: 'pre-line',
};
const td = {
  padding: '8px 8px', borderBottom: '1px solid #f3f4f6', fontSize: 13,
};
function sortBtn(active) {
  return {
    padding: '6px 10px', fontSize: 12,
    background: active ? '#2563eb' : '#fff',
    color: active ? '#fff' : '#374151',
    border: '1px solid ' + (active ? '#2563eb' : '#d1d5db'),
    borderRadius: 5, cursor: 'pointer',
  };
}
