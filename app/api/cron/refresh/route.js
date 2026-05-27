import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getDashboardData } from '@/lib/cached';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 매일 새벽 3시 KST (18시 UTC) Vercel Cron이 호출.
 * 1. 캐시 무효화
 * 2. 이번달 데이터 prewarm (첫 유저 요청도 즉시 응답)
 *
 * Vercel은 production cron에 자동으로 Authorization: Bearer $CRON_SECRET 전달함.
 */
export async function GET(request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. 캐시 무효화 — 현재 진행 중인 데이터만 (과거 데이터는 TTL로 자연 갱신)
  // PAST_LOCKED(30일 TTL) / PAST_RECENT(7일 TTL)는 안 건드림.
  revalidateTag('sheets');           // 구글시트는 매일
  revalidateTag('orders-current');   // 현재 기간 주문만
  revalidateTag('markets-current');  // 현재 기간 마켓만

  // 2. 가벼운 기본 뷰 prewarm만 (60초 한도 안에 들어가도록)
  const result = { revalidated: true, at: new Date().toISOString() };
  try {
    await getDashboardData({});
    result.prewarmed = 'current-month';
  } catch (e) {
    result.prewarmError = e.message;
  }

  // 지난 달 prewarm (별도 try)
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  try {
    await getDashboardData({
      period: 'month',
      year: String(lastMonth.getFullYear()),
      month: String(lastMonth.getMonth() + 1),
    });
    result.prewarmed += ', last-month';
  } catch (e) {
    // 무시 — 첫 접속 때 캐시됨
  }

  // 연간 prewarm은 너무 무거워서 스킵 (사용자가 연간 클릭 시 첫 호출 때만 느림)
  return NextResponse.json(result);
}
