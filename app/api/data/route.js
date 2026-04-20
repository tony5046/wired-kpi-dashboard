import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getKpiOverview, getYearlyComparison } from '@/lib/google-sheets';
import { downloadOrders, aggregateOrders } from '@/lib/wired-admin';
import { resolveRange } from '@/lib/period';

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

  try {
    const [kpi, yearly, orders] = await Promise.all([
      getKpiOverview().catch(e => ({ _error: e.message })),
      getYearlyComparison().catch(e => ({ _error: e.message })),
      downloadOrders(range.startDate, range.endDate).catch(e => ({ _error: e.message })),
    ]);

    let period = null;
    let ordersError = null;
    if (Array.isArray(orders)) {
      period = aggregateOrders(orders);
    } else if (orders?._error) {
      ordersError = orders._error;
    }

    return NextResponse.json({
      kpi: kpi?._error ? null : kpi,
      kpiError: kpi?._error || null,
      yearly: yearly?._error ? null : yearly,
      yearlyError: yearly?._error || null,
      period,
      ordersError,
      range,
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
