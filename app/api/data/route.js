import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getKpiOverview, getYearlyComparison } from '@/lib/google-sheets';
import { downloadOrders, aggregateOrders } from '@/lib/wired-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 최대 60초

function pad(n) {
  return String(n).padStart(2, '0');
}

function getMonthRange(now) {
  const yyyy = now.getFullYear();
  const mm = now.getMonth() + 1;
  const lastDay = new Date(yyyy, mm, 0).getDate();
  return {
    startDate: `${yyyy}-${pad(mm)}-01`,
    endDate: `${yyyy}-${pad(mm)}-${pad(lastDay)}`,
  };
}

export async function GET(request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const { startDate, endDate } = getMonthRange(now);

  try {
    // 병렬 fetch (Google Sheets + 와이어드민)
    const [kpi, yearly, orders] = await Promise.all([
      getKpiOverview().catch(e => ({ _error: e.message })),
      getYearlyComparison().catch(e => ({ _error: e.message })),
      downloadOrders(startDate, endDate).catch(e => ({ _error: e.message })),
    ]);

    // 주문 데이터 집계
    let currentMonth = null;
    let ordersError = null;
    if (Array.isArray(orders)) {
      currentMonth = aggregateOrders(orders);
    } else if (orders && orders._error) {
      ordersError = orders._error;
    }

    return NextResponse.json({
      kpi: kpi?._error ? null : kpi,
      kpiError: kpi?._error || null,
      yearly: yearly?._error ? null : yearly,
      yearlyError: yearly?._error || null,
      currentMonth,
      ordersError,
      period: { startDate, endDate },
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
