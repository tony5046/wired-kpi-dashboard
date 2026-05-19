import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getCachedOrdersAgg } from '@/lib/cached';
import { resolveRange, monthToDateRange, weekToDateRange, yearToDateRange, quarterToDateRange, getIsoWeek } from '@/lib/period';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function resolveQueryRange(period) {
  const now = new Date();
  switch (period) {
    case 'thisWeek': {
      const { year, week } = getIsoWeek(now);
      return weekToDateRange(year, week);
    }
    case 'lastWeek': {
      const last = new Date(now);
      last.setDate(last.getDate() - 7);
      const { year, week } = getIsoWeek(last);
      return weekToDateRange(year, week);
    }
    case 'thisMonth':
      return monthToDateRange(now.getFullYear(), now.getMonth() + 1);
    case 'lastMonth': {
      const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const m = now.getMonth() === 0 ? 12 : now.getMonth();
      return monthToDateRange(y, m);
    }
    case 'thisQuarter':
      return quarterToDateRange(now.getFullYear(), Math.floor(now.getMonth() / 3) + 1);
    case 'lastQuarter': {
      const q = Math.floor(now.getMonth() / 3) + 1;
      if (q === 1) return quarterToDateRange(now.getFullYear() - 1, 4);
      return quarterToDateRange(now.getFullYear(), q - 1);
    }
    case 'thisYear':
      return yearToDateRange(now.getFullYear());
    case 'lastYear':
      return yearToDateRange(now.getFullYear() - 1);
    default:
      return monthToDateRange(now.getFullYear(), now.getMonth() + 1);
  }
}

export async function POST(request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { metric = 'sales', period = 'thisMonth', group = 'seller', limit = 10 } = body;

  const range = resolveQueryRange(period);

  try {
    const agg = await getCachedOrdersAgg(range.startDate, range.endDate);

    // 그룹 선택
    const groupMap = {
      seller: agg.bySeller,
      brand: agg.byBrand,
      market: agg.byMarket,
      manager: agg.bySellerManager,
      total: null,
    };
    const rows = groupMap[group];

    // 메트릭 키 매핑
    const metricKey = metric === 'margin' ? 'margin' : metric === 'count' ? 'count' : 'sales';
    const metricLabel = metric === 'margin' ? '공헌이익' : metric === 'count' ? '건수' : '매출';

    let result;
    if (group === 'total') {
      result = {
        type: 'total',
        metricLabel,
        total: {
          sales: agg.total.sales,
          margin: agg.total.margin,
          count: agg.total.count,
          marginRate: agg.total.sales > 0 ? agg.total.margin / agg.total.sales * 100 : 0,
        },
      };
    } else {
      const sorted = [...rows].sort((a, b) => (b[metricKey] || 0) - (a[metricKey] || 0));
      const lim = limit === 'all' ? sorted.length : Math.min(parseInt(limit, 10) || 10, sorted.length);
      result = {
        type: 'list',
        metricLabel,
        metricKey,
        rows: sorted.slice(0, lim).map(r => ({
          name: r.name,
          sales: r.sales,
          margin: r.margin,
          count: r.count,
          marginRate: r.sales > 0 ? r.margin / r.sales * 100 : 0,
        })),
        totalRows: sorted.length,
        showing: lim,
      };
    }

    return NextResponse.json({
      ...result,
      range,
      params: { metric, period, group, limit },
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Query error:', e);
    return NextResponse.json(
      { error: 'Query failed', message: e.message },
      { status: 500 }
    );
  }
}
