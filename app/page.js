'use client';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

// 모든 금액은 쉼표 구분, "원" 단위 고정
function won(n) {
  if (n === null || n === undefined || n === '' || isNaN(Number(n))) return '-';
  return Number(n).toLocaleString('ko-KR') + '원';
}

function count(n) {
  if (n === null || n === undefined || isNaN(Number(n))) return '-';
  return Number(n).toLocaleString('ko-KR') + '건';
}

function KpiCard({ title, target, achieved, rate, dateProgress, expectedRate, color }) {
  const rateNum = Number(rate) || 0;
  const dpNum = Number(dateProgress) || 0;
  const expected = Number(expectedRate) || 0;
  const onPace = rateNum >= dpNum;

  return (
    <div
      style={{
        padding: 24,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || '#111', marginBottom: 4 }}>
        {won(achieved)}
      </div>
      <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>
        목표 {won(target)}
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
          <span style={{ color: '#374151' }}>달성률</span>
          <span style={{ fontWeight: 600, color: onPace ? '#10b981' : '#ef4444' }}>
            {rateNum.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%
          </span>
        </div>
        <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(rateNum, 100)}%`,
              height: '100%',
              background: onPace ? '#10b981' : '#ef4444',
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
        <span>날짜 진행률 {dpNum.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%</span>
        <span>예상 달성 {expected.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%</span>
      </div>
    </div>
  );
}

function MonthSummaryCard({ current, period }) {
  if (!current) return null;
  const { total } = current;
  const marginRate = total.sales > 0 ? (total.margin / total.sales) * 100 : 0;
  return (
    <div
      style={{
        padding: 24,
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        borderRadius: 12,
        color: '#fff',
      }}
    >
      <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>
        이번달 매출 ({period.startDate} ~ {period.endDate})
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
        {won(total.sales)}
      </div>
      <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
        <div>
          <div style={{ opacity: 0.7 }}>공헌이익</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{won(total.margin)}</div>
        </div>
        <div>
          <div style={{ opacity: 0.7 }}>공헌이익률</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {marginRate.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%
          </div>
        </div>
        <div>
          <div style={{ opacity: 0.7 }}>주문 건수</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{count(total.count)}</div>
        </div>
      </div>
    </div>
  );
}

function RankingTable({ title, rows, emoji, limit = 10 }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div
      style={{
        padding: 20,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
      }}
    >
      <h3 style={{ fontSize: 15, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
        {emoji} {title}
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            <th style={{ ...th, textAlign: 'left', width: 40 }}>순위</th>
            <th style={{ ...th, textAlign: 'left' }}>이름</th>
            <th style={th}>매출</th>
            <th style={th}>건수</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, limit).map((r, i) => (
            <tr key={r.name}>
              <td style={{ ...td, textAlign: 'left', color: '#9ca3af' }}>#{i + 1}</td>
              <td style={{ ...td, textAlign: 'left', fontWeight: 500 }}>{r.name}</td>
              <td style={td}>{won(r.sales)}</td>
              <td style={td}>{count(r.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function YearlyTable({ yearly }) {
  if (!yearly) return null;
  const { months, y2024Sales, y2025Sales, y2026Sales, yoySales } = yearly;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            <th style={{ ...th, textAlign: 'left' }}>월</th>
            {months.map(m => <th key={m} style={th}>{m}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...td, textAlign: 'left', fontWeight: 600 }}>2024</td>
            {y2024Sales.map((v, i) => <td key={i} style={td}>{won(v)}</td>)}
          </tr>
          <tr>
            <td style={{ ...td, textAlign: 'left', fontWeight: 600 }}>2025</td>
            {y2025Sales.map((v, i) => <td key={i} style={td}>{won(v)}</td>)}
          </tr>
          <tr>
            <td style={{ ...td, textAlign: 'left', fontWeight: 600 }}>2026</td>
            {y2026Sales.map((v, i) => <td key={i} style={td}>{v ? won(v) : '-'}</td>)}
          </tr>
          <tr>
            <td style={{ ...td, textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>전년비</td>
            {yoySales.map((v, i) => {
              const num = parseFloat(String(v).replace('%', ''));
              const isPositive = num > 0;
              const isZero = !num;
              return (
                <td
                  key={i}
                  style={{
                    ...td,
                    color: isZero ? '#9ca3af' : isPositive ? '#10b981' : '#ef4444',
                    fontWeight: 600,
                  }}
                >
                  {v}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const th = {
  padding: '10px 8px',
  borderBottom: '2px solid #e5e7eb',
  textAlign: 'right',
  fontSize: 12,
  color: '#6b7280',
  fontWeight: 500,
};
const td = {
  padding: '10px 8px',
  borderBottom: '1px solid #f3f4f6',
  textAlign: 'right',
};

export default function Home() {
  const { data: session, status } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    setError(null);
    fetch('/api/data')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.message || d.error);
        else setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [session]);

  if (status === 'loading') {
    return <main style={{ padding: 40 }}>로딩 중...</main>;
  }

  if (!session) {
    return (
      <main style={{ padding: 40, maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>와이어드 KPI 대시보드</h1>
        <p style={{ color: '#666', marginBottom: 32, lineHeight: 1.5 }}>
          와이어드 직원 전용 매출 현황판입니다.
          <br />Google 계정으로 로그인해주세요.
        </p>
        <button
          onClick={() => signIn('google')}
          style={{
            padding: '12px 24px', fontSize: 16,
            background: '#4285F4', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500,
          }}
        >
          Google 계정으로 로그인
        </button>
        <p style={{ color: '#999', fontSize: 13, marginTop: 24 }}>
          @wired.company 이메일만 접근 가능
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: 32, maxWidth: 1280, margin: '0 auto', background: '#f9fafb', minHeight: '100vh' }}>
      <header
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>🏠 와이어드 KPI 대시보드</h1>
          {data?.generatedAt && (
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>
              업데이트: {new Date(data.generatedAt).toLocaleString('ko-KR')}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#666', fontSize: 14 }}>
            {session.user.name} ({session.user.email})
          </span>
          <button
            onClick={() => signOut()}
            style={{
              padding: '6px 14px', fontSize: 13,
              background: '#fff', border: '1px solid #d1d5db',
              borderRadius: 6, cursor: 'pointer',
            }}
          >
            로그아웃
          </button>
        </div>
      </header>

      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          데이터 불러오는 중... (이번달 주문 전체 집계 중, 10초 정도 걸릴 수 있어요)
        </div>
      )}

      {error && (
        <div style={{
          padding: 16, background: '#fef2f2',
          border: '1px solid #fecaca', borderRadius: 8,
          color: '#991b1b', fontSize: 14,
        }}>
          데이터 로딩 오류: {error}
        </div>
      )}

      {data && (
        <>
          {/* 이번달 요약 + 연간 KPI */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
            {data.currentMonth ? (
              <MonthSummaryCard current={data.currentMonth} period={data.period} />
            ) : (
              <div style={{ padding: 24, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, color: '#ef4444' }}>
                이번달 매출 로딩 실패: {data.ordersError || '알 수 없음'}
              </div>
            )}
            {data.kpi?.gongdonGuMae && (
              <KpiCard
                title="공동구매 거래액 (연간)"
                target={data.kpi.gongdonGuMae.target}
                achieved={data.kpi.gongdonGuMae.achieved}
                rate={data.kpi.gongdonGuMae.achievementRate}
                dateProgress={data.kpi.gongdonGuMae.dateProgress}
                expectedRate={data.kpi.gongdonGuMae.expectedRate}
                color="#2563eb"
              />
            )}
            {data.kpi?.ad && (
              <KpiCard
                title="광고 매출 (연간)"
                target={data.kpi.ad.target}
                achieved={data.kpi.ad.achieved}
                rate={data.kpi.ad.achievementRate}
                dateProgress={data.kpi.ad.dateProgress}
                expectedRate={data.kpi.ad.expectedRate}
                color="#9333ea"
              />
            )}
          </section>

          {/* TOP 랭킹 4종 */}
          {data.currentMonth && (
            <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <RankingTable title="셀러담당자별 매출" rows={data.currentMonth.bySellerManager} emoji="👤" />
              <RankingTable title="셀러 TOP 10" rows={data.currentMonth.bySeller} emoji="🏪" />
              <RankingTable title="브랜드 TOP 10" rows={data.currentMonth.byBrand} emoji="🏷️" />
              <RankingTable title="마켓 TOP 10" rows={data.currentMonth.byMarket} emoji="🛒" />
            </section>
          )}

          {/* 연도별 비교 */}
          <section
            style={{
              padding: 20, background: '#fff',
              border: '1px solid #e5e7eb', borderRadius: 12,
            }}
          >
            <h2 style={{ fontSize: 16, margin: '0 0 16px' }}>📊 연도별 매출 비교</h2>
            {data.yearly ? (
              <YearlyTable yearly={data.yearly} />
            ) : (
              <p style={{ fontSize: 13, color: '#ef4444' }}>
                연도별 데이터 로딩 실패: {data.yearlyError}
              </p>
            )}
          </section>

          <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 24, textAlign: 'center' }}>
            🚧 다음 업데이트: 주/월/년 필터, 기간별 차트, 매일 새벽 3시 자동 갱신
          </p>
        </>
      )}
    </main>
  );
}
