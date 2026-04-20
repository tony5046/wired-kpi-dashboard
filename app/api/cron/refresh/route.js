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

  // 1. 캐시 무효화
  revalidateTag('dashboard');
  revalidateTag('sheets');
  revalidateTag('orders');

  // 2. 기본 뷰 prewarm (이번 달)
  const result = { revalidated: true, at: new Date().toISOString() };
  try {
    await getDashboardData({});
    result.prewarmed = 'current-month';
  } catch (e) {
    result.prewarmError = e.message;
  }

  // 추가 prewarm: 지난 달, 올해 전체
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  try {
    await getDashboardData({
      period: 'month',
      year: String(lastMonth.getFullYear()),
      month: String(lastMonth.getMonth() + 1),
    });
  } catch {}
  try {
    await getDashboardData({ period: 'year', year: String(now.getFullYear()) });
  } catch {}

  return NextResponse.json(result);
}
