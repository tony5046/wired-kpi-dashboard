import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getKpiOverview, getYearlyComparison } from '@/lib/google-sheets';
import { downloadOrders, aggregateOrders } from '@/lib/wired-admin';
import { resolveRange } from '@/lib/period';
import { getPrevMonthsRange, detectTrends } from '@/lib/trend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());
  const range = resolveRange(params);
  const prevRange = getPrevMonthsRange(range, params);

  try {
    // 현재 기간 + 직전 3개월 + 시트 데이터 병렬 fetch
    const [kpi, yearly, orders, prevOrders] = await Promise.all([
      getKpiOverview().catch(e => ({ _error: e.message })),
      getYearlyComparison().catch(e => ({ _error: e.message })),
      downloadOrders(range.startDate, range.endDate).catch(e => ({ _error: e.message })),
      prevRange
        ? downloadOrders(prevRange.startDate, prevRange.endDate).catch(e => ({ _error: e.message }))
        : Promise.resolve(null),
    ]);

    let period = null;
    let ordersError = null;
    if (Array.isArray(orders)) {
      period = aggregateOrders(orders);
    } else if (orders?._error) {
      ordersError = orders._error;
    }

    let trends = null;
    if (period && prevRange && Array.isArray(prevOrders)) {
      const baseline = aggregateOrders(prevOrders);
      trends = detectTrends(period.bySeller, baseline.bySeller, prevRange.monthCount);
    }

    return NextResponse.json({
      kpi: kpi?._error ? null : kpi,
      kpiError: kpi?._error || null,
      yearly: yearly?._error ? null : yearly,
      yearlyError: yearly?._error || null,
      period,
      ordersError,
      range,
      trends,
      prevRange,
      filters: params,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Data fetch error:', e);
    return NextResponse.json(
      { error: 'Failed to fetch data', message: e.message },
      { status: 500 }
    );
  }
}
