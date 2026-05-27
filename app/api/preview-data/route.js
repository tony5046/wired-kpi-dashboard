// 새 시안 페이지(/preview)용 통합 데이터 엔드포인트
// 한 번의 요청으로 차트/카드/마켓/브랜드/파트너 데이터 전부 반환
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getYearlyComparison } from '@/lib/google-sheets';
import { getCombinedView, getCachedSheets } from '@/lib/cached';
import {
  monthToDateRange, yearToDateRange, quarterToDateRange,
} from '@/lib/period';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// 파트너 셀러 목록 (와이어드민 셀러명 기준)
const PARTNER_SELLER_NAMES = [
  '오인스', '달빛언니', '선선부부하우스', '김영은', '모노마켓', '풀킴',
];

// 단위 변환: 원 → 백만원
const toMillion = (won) => Math.round((won || 0) / 1_000_000);

// 셀러 객체에서 매출/마켓건수 추출 (combineSellerView 결과 또는 marketsAgg.bySeller 형태)
function sellerStats(sellersList, name) {
  if (!Array.isArray(sellersList)) return { actualSales: 0, estimatedSales: 0, marketCount: 0 };
  const found = sellersList.find(s => s.name === name);
  return {
    actualSales: found?.actualSales || 0,
    estimatedSales: found?.estimatedSales || 0,
    marketCount: found?.marketCount || 0,
  };
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const quarter = Math.floor(now.getMonth() / 3) + 1;

    // 기간 계산
    const thisYearRange = yearToDateRange(year);
    const thisQuarterRange = quarterToDateRange(year, quarter);
    const thisMonthRange = monthToDateRange(year, month);
    const lastMonthDate = new Date(year, month - 2, 1);
    const lastMonthRange = monthToDateRange(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1);
    const nextMonthDate = new Date(year, month, 1);
    const nextMonthRange = monthToDateRange(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1);

    // 병렬 fetch
    const [
      sheetData,
      thisMonthView,
      lastMonthView,
      nextMonthView,
      thisYearView,
      thisQuarterView,
    ] = await Promise.all([
      getCachedSheets().catch(e => ({ _error: e.message })),
      getCombinedView(thisMonthRange.startDate, thisMonthRange.endDate).catch(e => ({ _error: e.message })),
      getCombinedView(lastMonthRange.startDate, lastMonthRange.endDate).catch(e => ({ _error: e.message })),
      getCombinedView(nextMonthRange.startDate, nextMonthRange.endDate).catch(e => ({ _error: e.message })),
      getCombinedView(thisYearRange.startDate, thisYearRange.endDate).catch(e => ({ _error: e.message })),
      getCombinedView(thisQuarterRange.startDate, thisQuarterRange.endDate).catch(e => ({ _error: e.message })),
    ]);

    // GSD 연도별 비교 (트렌드 차트용)
    const yearly = sheetData?.yearly && !sheetData.yearly._error ? sheetData.yearly : null;

    // 트렌드: 2024/2025/2026 월별 (모두 백만원으로 통일)
    // GSD 데이터는 이미 사람이 입력한 값이라 단위 그대로 사용 (보통 원 단위라 백만원 변환)
    const trend = (yearly?.months || ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']).map((m, i) => {
      const v2024 = toMillion(yearly?.y2024Sales?.[i] || 0);
      const v2025 = toMillion(yearly?.y2025Sales?.[i] || 0);
      const v2026 = toMillion(yearly?.y2026Sales?.[i] || 0);
      // 2026년의 경우, 현재 월 이후는 null (아직 데이터 없음)
      return {
        month: m,
        '2024': v2024 || null,
        '2025': v2025 || null,
        '2026': i < month ? (v2026 || null) : null,
      };
    });

    // YTD/QTD (실제 매출 = orders.total.sales)
    const ytdSalesWon = thisYearView?.orders?.total?.sales || 0;
    const qtdSalesWon = thisQuarterView?.orders?.total?.sales || 0;
    const ytdSales = toMillion(ytdSalesWon);
    const qtdSales = toMillion(qtdSalesWon);

    // 날짜 진행률 계산
    const daysIntoYear = Math.floor((now - new Date(year, 0, 1)) / (1000 * 60 * 60 * 24)) + 1;
    const yearProgress = (daysIntoYear / 365) * 100;
    const qStart = new Date(year, (quarter - 1) * 3, 1);
    const qEnd = new Date(year, quarter * 3, 0);
    const qTotal = Math.ceil((qEnd - qStart) / (1000 * 60 * 60 * 24)) + 1;
    const qElapsed = Math.floor((now - qStart) / (1000 * 60 * 60 * 24)) + 1;
    const quarterProgress = (qElapsed / qTotal) * 100;

    // 마켓 리스트 (이번달)
    const marketsList = thisMonthView?.marketsList || [];

    // 셀러/브랜드 통합 뷰 (이번달)
    const sellers = thisMonthView?.sellers || [];
    const brands = thisMonthView?.brands || [];

    // 파트너 셀러 통계: 누적/저번달/이번달/다음달(예상)
    // - 누적매출 = thisYearView 의 sellers actualSales
    // - 저번달 = lastMonthView 의 sellers actualSales
    // - 이번달 = thisMonthView 의 sellers actualSales
    // - 다음달(예상) = nextMonthView 의 sellers estimatedSales (아직 진행 안 함)
    // - 마켓건수도 동일하게 각 기간에서
    const partnerStats = PARTNER_SELLER_NAMES.map(name => {
      const ytd = sellerStats(thisYearView?.sellers, name);
      const last = sellerStats(lastMonthView?.sellers, name);
      const cur = sellerStats(thisMonthView?.sellers, name);
      const next = sellerStats(nextMonthView?.sellers, name);
      return {
        name,
        ytdSales: toMillion(ytd.actualSales),
        lastMonth: {
          sales: toMillion(last.actualSales),
          marketCount: last.marketCount,
        },
        thisMonth: {
          sales: toMillion(cur.actualSales),
          marketCount: cur.marketCount,
        },
        nextMonth: {
          // 다음달은 진행 전이라 estimatedSales (예상매출)
          sales: toMillion(next.estimatedSales),
          marketCount: next.marketCount,
        },
        // 컨텐츠 반응(릴스 조회수)은 API 미연동 — null
        reels: null,
      };
    });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      now: { year, month, quarter, daysIntoYear },

      // 차트
      trend,
      monthTargetAvg: Math.round(20000 / 12), // 1666 백만원 (200억/12)

      // 목표 카드
      yearTarget: 20000,    // 200억
      quarterTarget: 5000,  // 50억
      ytdSales,
      qtdSales,
      yearProgress,
      quarterProgress,

      // 마켓 / 브랜드 / 셀러 (이번달)
      marketsList: marketsList.map(m => ({
        id: m.id,
        name: m.name,
        sellerName: m.sellerName,
        brandName: m.brandName,
        managerName: m.managerName,
        status: m.status,
        startedAt: m.startedAt,
        endedAt: m.endedAt,
        // 매출/주문/달성률
        sales: toMillion(m.actualSales),  // 백만원
        salesWon: m.actualSales || 0,
        orderCount: m.uniqueCustomers || m.orderCount || 0,
        estimatedSales: toMillion(m.estimatedSales),
        achievementRate: m.achievementRate,
        salesChannel: m.salesChannel,
        // CS/배송/마케팅 데이터는 아직 API 없음
        csRate: null,
        deliveryRate: null,
        exposure: null,
      })),

      sellers: sellers.map(s => ({
        name: s.name,
        manager: s.manager,
        sales: toMillion(s.actualSales),
        estimatedSales: toMillion(s.estimatedSales),
        marketCount: s.marketCount,
        orderCount: s.uniqueCustomers,
        achievementRate: s.achievementRate,
        isPartner: PARTNER_SELLER_NAMES.includes(s.name),
      })),

      brands: brands.map(b => ({
        name: b.name,
        manager: b.manager,
        sellers: b.sellers,
        sales: toMillion(b.actualSales),
        estimatedSales: toMillion(b.estimatedSales),
        marketCount: b.marketCount,
        orderCount: b.uniqueCustomers,
        achievementRate: b.achievementRate,
      })),

      partnerStats,

      // 에러 정보 — 모든 period의 ordersError/marketsError까지 자세히 노출
      errors: {
        sheets: sheetData?._error || sheetData?.yearly?._error || null,
        thisMonth_orders: thisMonthView?._error || thisMonthView?.ordersError || null,
        thisMonth_markets: thisMonthView?.marketsError || null,
        thisYear_orders: thisYearView?._error || thisYearView?.ordersError || null,
        thisYear_markets: thisYearView?.marketsError || null,
        thisQuarter_orders: thisQuarterView?._error || thisQuarterView?.ordersError || null,
        thisQuarter_markets: thisQuarterView?.marketsError || null,
        lastMonth_orders: lastMonthView?._error || lastMonthView?.ordersError || null,
        lastMonth_markets: lastMonthView?.marketsError || null,
        nextMonth_orders: nextMonthView?._error || nextMonthView?.ordersError || null,
        nextMonth_markets: nextMonthView?.marketsError || null,
      },

      // 디버그: 핵심 카운트 (확인용)
      debug: {
        thisMonthMarkets: thisMonthView?.marketsList?.length || 0,
        thisMonthSellers: thisMonthView?.sellers?.length || 0,
        thisMonthTotalOrders: thisMonthView?.orders?.total?.raw || 0,
        thisYearTotalSales: thisYearView?.orders?.total?.sales || 0,
      },
    });
  } catch (e) {
    console.error('Preview data error:', e);
    return NextResponse.json(
      { error: 'Failed to fetch preview data', message: e.message },
      { status: 500 }
    );
  }
}
