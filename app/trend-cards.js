'use client';

function won(n) {
  if (n === null || n === undefined || n === '' || isNaN(Number(n))) return '-';
  return Number(n).toLocaleString('ko-KR') + '원';
}

function TrendRow({ item, color, showAvg = true }) {
  const pctDisplay = Math.abs(item.pct).toLocaleString('ko-KR', { maximumFractionDigits: 1 }) + '%';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderBottom: '1px solid #f3f4f6',
      }}
    >
      <div style={{ fontWeight: 500, fontSize: 14, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.name}
      </div>
      <div style={{ textAlign: 'right', fontSize: 12, color: '#6b7280', minWidth: 140 }}>
        {showAvg ? (
          <>
            평균 <strong style={{ color: '#374151' }}>{won(item.avg)}</strong> →{' '}
            <strong style={{ color: '#374151' }}>{won(item.current)}</strong>
          </>
        ) : (
          <strong style={{ color: '#374151' }}>{won(item.current)}</strong>
        )}
      </div>
      <div
        style={{
          marginLeft: 12,
          padding: '2px 10px',
          background: color + '20',
          color,
          fontSize: 12,
          fontWeight: 700,
          borderRadius: 12,
          minWidth: 60,
          textAlign: 'center',
        }}
      >
        {item.pct > 0 ? '+' : item.pct < 0 ? '-' : ''}{pctDisplay}
      </div>
    </div>
  );
}

export function TrendSection({ trends }) {
  if (!trends) return null;
  const { rising, declining, newcomers, dormant } = trends;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
      <TrendCard
        title="📈 상승세 셀러"
        subtitle="직전 3개월 평균 대비 이번 기간 상승"
        items={rising}
        color="#10b981"
        empty="뚜렷한 상승세 셀러 없음"
      />
      <TrendCard
        title="📉 부진 셀러"
        subtitle="직전 3개월 평균 대비 이번 기간 하락"
        items={declining}
        color="#ef4444"
        empty="뚜렷한 부진 셀러 없음"
      />
      <TrendCard
        title="🆕 신규 매출 셀러"
        subtitle="직전 3개월 매출 없음 → 이번 기간 등장"
        items={newcomers}
        color="#3b82f6"
        showAvg={false}
        empty="신규 셀러 없음"
      />
      <TrendCard
        title="💤 이번 기간 매출 없는 셀러"
        subtitle="평소엔 매출이 있었는데 이번엔 0원"
        items={dormant}
        color="#f59e0b"
        empty="모든 셀러 활동 중"
      />
    </div>
  );
}

function TrendCard({ title, subtitle, items, color, showAvg = true, empty, limit = 8 }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
        <h3 style={{ fontSize: 15, margin: 0 }}>{title}</h3>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>{subtitle}</p>
      </div>
      <div>
        {items.length === 0 ? (
          <p style={{ padding: 20, fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>{empty}</p>
        ) : (
          items.slice(0, limit).map((it) => (
            <TrendRow key={it.name} item={it} color={color} showAvg={showAvg} />
          ))
        )}
      </div>
    </div>
  );
}
