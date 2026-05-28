// 새 시안 페이지(/preview)용 통합 데이터 엔드포인트
// 60초 타임아웃 안에 들어가려면 와이어드민은 월 단위만 호출. 연/분기는 GSD에서.
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getCombinedView, getCachedSheets } from '@/lib/cached';
import { monthToDateRange } from '@/lib/period';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// 파트너 셀러 — 표시 이름 → 와이어드민에 등록된 실제 이름들 (alias)
// 노션 페이지 제목은 친근한 이름인데, 와이어드민에는 다르게 등록된 경우가 있어서 매핑.
const PARTNER_ALIASES = {
  '오인스':         ['오인스'],
  '달빛언니':       ['달빛언니', '달빛'],
  '선선부부하우스': ['선선부부하우스'],
  '김영은':         ['김영은', '김영은마켓'],
  '모노마켓':       ['모노마켓'],
  '풀킴':           ['풀킴', '풀킴님'],
};
const PARTNER_DISPLAY_NAMES = Object.keys(PARTNER_ALIASES);

// 와이어드민 셀러명 → 표시 이름 매핑 (역방향)
const ALIAS_TO_DISPLAY = {};
for (const [display, aliases] of Object.entries(PARTNER_ALIASES)) {
  for (const a of aliases) ALIAS_TO_DISPLAY[a] = display;
}

// 셀러명이 파트너인지 (alias 포함 체크)
function isPartnerSeller(name) {
  return !!ALIAS_TO_DISPLAY[name];
}

const toMillion = (won) => Math.round((won || 0) / 1_000_000);

// 셀러 통계: alias 목록 중 하나라도 매칭되면 합산
function sellerStatsByAliases(sellersList, aliases) {
  if (!Array.isArray(sellersList)) return { actualSales: 0, estimatedSales: 0, marketCount: 0 };
  let actualSales = 0, estimatedSales = 0, marketCount = 0;
  for (const a of aliases) {
    const found = sellersList.find(s => s.name === a);
    if (found) {
      actualSales += found.actualSales || 0;
      estimatedSales += found.estimatedSales || 0;
      marketCount += found.marketCount || 0;
    }
  }
  return { actualSales, estimatedSales, marketCount };
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

    // 기간 계산 — 와이어드민은 월 단위만!
    const thisMonthRange = monthToDateRange(year, month);
    const lastMonthDate = new Date(year, month - 2, 1);
    const lastMonthRange = monthToDateRange(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1);
    const nextMonthDate = new Date(year, month, 1);
    const nextMonthRange = monthToDateRange(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1);

    // 병렬 fetch — 와이어드민 3개월치만 (이/저/다음달)
    // 매출 = totalWiredSalesAmount (와이어드 회계 기준), 전체 status 포함
    const [sheetData, thisMonthView, lastMonthView, nextMonthView] = await Promise.all([
      getCachedSheets().catch(e => ({ _error: e.message })),
      getCombinedView(thisMonthRange.startDate, thisMonthRange.endDate).catch(e => ({ _error: e.message })),
      getCombinedView(lastMonthRange.startDate, lastMonthRange.endDate).catch(e => ({ _error: e.message })),
      getCombinedView(nextMonthRange.startDate, nextMonthRange.endDate).catch(e => ({ _error: e.message })),
    ]);

    // GSD 연도별 비교 (트렌드 + YTD/QTD 계산 기준)
    const yearly = sheetData?.yearly && !sheetData.yearly._error ? sheetData.yearly : null;

    // 트렌드 차트
    const trend = (yearly?.months || ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']).map((m, i) => {
      const v2024 = toMillion(yearly?.y2024Sales?.[i] || 0);
      const v2025 = toMillion(yearly?.y2025Sales?.[i] || 0);
      const v2026 = toMillion(yearly?.y2026Sales?.[i] || 0);
      return {
        month: m,
        '2024': v2024 || null,
        '2025': v2025 || null,
        '2026': i < month ? (v2026 || null) : null,
      };
    });

    // ─── YTD/QTD: GSD 트렌드에서 합산 (와이어드민 호출 없이) ───
    // 트렌드 데이터는 이미 백만원 단위로 변환됨
    const ytdSales = trend
      .slice(0, month)
      .reduce((s, r) => s + (r['2026'] || 0), 0);
    const qStartIdx = (quarter - 1) * 3;
    const qtdSales = trend
      .slice(qStartIdx, month)
      .reduce((s, r) => s + (r['2026'] || 0), 0);

    // 날짜 진행률
    const daysIntoYear = Math.floor((now - new Date(year, 0, 1)) / (1000 * 60 * 60 * 24)) + 1;
    const yearProgress = (daysIntoYear / 365) * 100;
    const qStart = new Date(year, (quarter - 1) * 3, 1);
    const qEnd = new Date(year, quarter * 3, 0);
    const qTotal = Math.ceil((qEnd - qStart) / (1000 * 60 * 60 * 24)) + 1;
    const qElapsed = Math.floor((now - qStart) / (1000 * 60 * 60 * 24)) + 1;
    const quarterProgress = (qElapsed / qTotal) * 100;

    const marketsList = thisMonthView?.marketsList || [];
    const sellers = thisMonthView?.sellers || [];
    const brands = thisMonthView?.brands || [];

    // 파트너 통계 — alias 목록을 모두 합산해서 찾기
    // ytdSales는 와이어드민 1년 호출이 너무 무거워서 일단 "저번달+이번달 누적"으로 대체
    const partnerStats = PARTNER_DISPLAY_NAMES.map(displayName => {
      const aliases = PARTNER_ALIASES[displayName];
      const last = sellerStatsByAliases(lastMonthView?.sellers, aliases);
      const cur = sellerStatsByAliases(thisMonthView?.sellers, aliases);
      const next = sellerStatsByAliases(nextMonthView?.sellers, aliases);
      const recentTwoMonthsWon = (last.actualSales || 0) + (cur.actualSales || 0);
      return {
        name: displayName,
        aliases,    // 디버깅용
        ytdSales: toMillion(recentTwoMonthsWon),
        ytdLabel: '최근 2개월 누적',
        lastMonth: {
          sales: toMillion(last.actualSales),
          marketCount: last.marketCount,
        },
        thisMonth: {
          sales: toMillion(cur.actualSales),
          marketCount: cur.marketCount,
        },
        nextMonth: {
          sales: toMillion(next.estimatedSales),
          marketCount: next.marketCount,
        },
        reels: null,
      };
    });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      now: { year, month, quarter, daysIntoYear },

      trend,
      monthTargetAvg: Math.round(20000 / 12),

      yearTarget: 20000,
      quarterTarget: 5000,
      ytdSales,
      qtdSales,
      yearProgress,
      quarterProgress,

      salesMetric: 'RELEASE_COMPLETE',  // 출고완료된 매출만 (확정 매출)
      ytdSource: 'GSD trend sum (사업개발 시트)',

      marketsList: marketsList.map(m => ({
        id: m.id,
        name: m.name,
        // 셀러명을 표시 이름으로 normalize (예: '달빛' → '달빛언니')
        sellerName: ALIAS_TO_DISPLAY[m.sellerName] || m.sellerName,
        sellerNameRaw: m.sellerName,  // 원본 이름 (디버깅용)
        brandName: m.brandName,
        managerName: m.managerName,
        status: m.status,
        startedAt: m.startedAt,
        endedAt: m.endedAt,
        sales: toMillion(m.actualSales),
        salesWon: m.actualSales || 0,
        orderCount: m.uniqueCustomers || m.orderCount || 0,
        estimatedSales: toMillion(m.estimatedSales),
        achievementRate: m.achievementRate,
        salesChannel: m.salesChannel,
        csRate: null,
        deliveryRate: null,
        exposure: null,
        isPartner: isPartnerSeller(m.sellerName),
      })),

      sellers: sellers.map(s => ({
        // 셀러명도 표시 이름으로
        name: ALIAS_TO_DISPLAY[s.name] || s.name,
        nameRaw: s.name,
        manager: s.manager,
        sales: toMillion(s.actualSales),
        estimatedSales: toMillion(s.estimatedSales),
        marketCount: s.marketCount,
        orderCount: s.uniqueCustomers,
        achievementRate: s.achievementRate,
        isPartner: isPartnerSeller(s.name),
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

      errors: {
        sheets: sheetData?._error || null,
        thisMonth_orders: thisMonthView?._error || thisMonthView?.ordersError || null,
        thisMonth_markets: thisMonthView?.marketsError || null,
        lastMonth_orders: lastMonthView?._error || lastMonthView?.ordersError || null,
        lastMonth_markets: lastMonthView?.marketsError || null,
        nextMonth_orders: nextMonthView?._error || nextMonthView?.ordersError || null,
        nextMonth_markets: nextMonthView?.marketsError || null,
      },

      debug: {
        thisMonthMarkets: thisMonthView?.marketsList?.length || 0,
        thisMonthSellers: thisMonthView?.sellers?.length || 0,
        thisMonthTotalOrders: thisMonthView?.orders?.total?.raw || 0,
        ytdFromGSD: ytdSales,
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
