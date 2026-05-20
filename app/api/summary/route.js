import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getCombinedView } from '@/lib/cached';
import {
  monthToDateRange, weekToDateRange, yearToDateRange,
  getIsoWeek,
} from '@/lib/period';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function resolve(period) {
  const now = new Date();
  switch (period) {
    case 'thisWeek': {
      const { year, week } = getIsoWeek(now);
      return weekToDateRange(year, week);
    }
    case 'nextWeek': {
      const next = new Date(now);
      next.setDate(next.getDate() + 7);
      const { year, week } = getIsoWeek(next);
      return weekToDateRange(year, week);
    }
    case 'thisMonth':
      return monthToDateRange(now.getFullYear(), now.getMonth() + 1);
    case 'nextMonth': {
      const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return monthToDateRange(d.getFullYear(), d.getMonth() + 1);
    }
    case 'lastMonth': {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return monthToDateRange(d.getFullYear(), d.getMonth() + 1);
    }
    case 'thisYear':
      return yearToDateRange(now.getFullYear());
    case 'thisQuarter': {
      const q = Math.floor(now.getMonth() / 3) + 1;
      const startMonth = (q - 1) * 3 + 1;
      const endMonth = startMonth + 2;
      const start = new Date(now.getFullYear(), startMonth - 1, 1);
      const end = new Date(now.getFullYear(), endMonth, 0);
      const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return { startDate: fmt(start), endDate: fmt(end), label: `${now.getFullYear()}년 Q${q}` };
    }
    case 'sameMonthLastYear':
      return monthToDateRange(now.getFullYear() - 1, now.getMonth() + 1);
    default:
      return monthToDateRange(now.getFullYear(), now.getMonth() + 1);
  }
}

/**
 * GET /api/summary?period=thisWeek|thisMonth|lastMonth|thisYear|sameMonthLastYear
 * &full=true (include seller/brand lists, otherwise totals only)
 */
export async function GET(request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'thisMonth';
  const full = searchParams.get('full') === 'true';
  const range = resolve(period);

  try {
    const combined = await getCombinedView(range.startDate, range.endDate);

    const ordersTotal = combined.orders?.total || {};
    const marketsTotal = combined.markets?.total || {};

    const response = {
      period,
      range,
      // 예상 매출 (마켓 등록값 합)
      estimatedSales: marketsTotal.estimatedSales || 0,
      // 예상 + 실제 매출 (ENDED는 실제, 나머지는 예상)
      mixedSales: combined.mixedSales || 0,
      // (참고용 유지)
      totalSales: ordersTotal.sales || 0,
      actualSales: ordersTotal.salesReleased || 0,
      totalMargin: ordersTotal.margin || 0,
      uniqueCustomers: ordersTotal.uniqueCustomers || 0,
      marketsAll: marketsTotal.marketsAll || 0,
      marketsActive: marketsTotal.marketsActive || 0,
      marketsEnded: marketsTotal.marketsEnded || 0,
      ordersError: combined.ordersError,
      marketsError: combined.marketsError,
    };

    if (full) {
      response.sellers = combined.sellers || [];
      response.brands = combined.brands || [];
      response.bySellerManager = combined.bySellerManager || [];
      response.marketsList = combined.marketsList || [];
    }

    return NextResponse.json(response);
  } catch (e) {
    console.error('Summary fetch error:', e);
    return NextResponse.json(
      { error: 'Failed to fetch', message: e.message },
      { status: 500 }
    );
  }
}
