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
    case 'thisMonth':
      return monthToDateRange(now.getFullYear(), now.getMonth() + 1);
    case 'lastMonth': {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return monthToDateRange(d.getFullYear(), d.getMonth() + 1);
    }
    case 'thisYear':
      return yearToDateRange(now.getFullYear());
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
      // 매출 (실제 - 출고완료된 것)
      actualSales: ordersTotal.salesReleased || 0,
      actualMargin: ordersTotal.marginReleased || 0,
      // 매출 (전체 - 출고대기 포함)
      totalSales: ordersTotal.sales || 0,
      totalMargin: ordersTotal.margin || 0,
      // 예상매출 (마켓 등록 시 입력값)
      estimatedSales: marketsTotal.estimatedSales || 0,
      // 주문건수 (중복 제거)
      uniqueCustomers: ordersTotal.uniqueCustomers || 0,
      releasedUniqueCustomers: ordersTotal.releasedUniqueCustomers || 0,
      // 마켓 건수
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
