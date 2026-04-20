'use client';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

function formatTick(n) {
  if (n >= 1_0000_0000) return (n / 1_0000_0000).toFixed(1) + '억';
  if (n >= 10000) return (n / 10000).toFixed(0) + '만';
  return n.toLocaleString('ko-KR');
}

function formatTooltip(n) {
  if (n === null || n === undefined) return '-';
  return Number(n).toLocaleString('ko-KR') + '원';
}

/** 연도별 월별 매출 비교 bar chart */
export function YearlyChart({ yearly }) {
  if (!yearly) return null;
  const { months, y2024Sales, y2025Sales, y2026Sales } = yearly;
  const data = months.map((m, i) => ({
    month: m,
    '2024': y2024Sales[i] || 0,
    '2025': y2025Sales[i] || 0,
    '2026': y2026Sales[i] || 0,
  }));
  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" fontSize={12} />
          <YAxis tickFormatter={formatTick} fontSize={12} />
          <Tooltip
            formatter={formatTooltip}
            contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Bar dataKey="2024" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="2025" fill="#93c5fd" radius={[4, 4, 0, 0]} />
          <Bar dataKey="2026" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** 셀러 TOP 10 가로 바 차트 */
export function SellerRankChart({ rows, title }) {
  if (!rows || rows.length === 0) return null;
  const data = rows.slice(0, 10).map(r => ({
    name: r.name.length > 12 ? r.name.slice(0, 12) + '…' : r.name,
    매출: r.sales,
  }));
  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" tickFormatter={formatTick} fontSize={11} />
          <YAxis type="category" dataKey="name" fontSize={12} width={90} />
          <Tooltip
            formatter={formatTooltip}
            contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Bar dataKey="매출" fill="#7c3aed" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** 월별 예상매출 vs 실제매출 비교 */
export function ForecastActualChart({ data }) {
  if (!data || !data.months) return null;
  const rows = data.months.map((m, i) => ({
    month: m,
    '예상': data.forecast[i] || 0,
    '실제': data.actual[i] || null,
  }));
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" fontSize={11} />
          <YAxis tickFormatter={formatTick} fontSize={11} />
          <Tooltip formatter={formatTooltip} contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e5e7eb' }} />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Bar dataKey="예상" fill="#fbbf24" radius={[4, 4, 0, 0]} />
          <Bar dataKey="실제" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** 2026 월별 실제 매출 line chart (전년 동기 대비) */
export function TrendChart({ yearly }) {
  if (!yearly) return null;
  const { months, y2025Sales, y2026Sales } = yearly;
  const data = months.map((m, i) => ({
    month: m,
    '2025': y2025Sales[i] || 0,
    '2026': y2026Sales[i] || null,
  }));
  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" fontSize={12} />
          <YAxis tickFormatter={formatTick} fontSize={12} />
          <Tooltip
            formatter={formatTooltip}
            contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Line type="monotone" dataKey="2025" stroke="#9ca3af" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="2026" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
