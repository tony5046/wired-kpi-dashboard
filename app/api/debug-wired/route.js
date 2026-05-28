// 임시 진단 엔드포인트 — 와이어드민 API가 Vercel에서 어떻게 응답하는지 확인.
// 인증 불필요 (진단 후 즉시 삭제 예정).
// Secret query param으로 가벼운 보호: ?key=<CRON_SECRET>
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const token = process.env.WIRED_ADMIN_TOKEN;
  const base = process.env.WIRED_API_BASE || 'https://internal-api.wiredm.in';

  const result = {
    env: {
      hasToken: !!token,
      tokenLen: token ? token.length : 0,
      tokenPrefix: token ? token.slice(0, 20) + '...' : null,
      base,
      vercelEnv: process.env.VERCEL_ENV,
      nodeVersion: process.version,
    },
    tests: {},
  };

  // Test 1: Orders API
  try {
    const t1 = Date.now();
    const url = `${base}/order/orders?durationType=CREATED_AT&startDate=2026-05-01&endDate=2026-05-31&offset=0&size=5`;
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
      cache: 'no-store',
    });
    const text = await res.text();
    result.tests.orders = {
      status: res.status,
      timeMs: Date.now() - t1,
      ok: res.ok,
      bodyPreview: text.slice(0, 300),
    };
  } catch (e) {
    result.tests.orders = { error: e.message, stack: e.stack?.split('\n').slice(0, 3) };
  }

  // Test 2: Markets API
  try {
    const t1 = Date.now();
    const url = `${base}/product/markets?sortBy=startedAt-DESC&durationType=MARKET_DURATION&startDate=2026-05-01&endDate=2026-05-31&offset=0&size=5`;
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
      cache: 'no-store',
    });
    const text = await res.text();
    result.tests.markets = {
      status: res.status,
      timeMs: Date.now() - t1,
      ok: res.ok,
      bodyPreview: text.slice(0, 300),
    };
  } catch (e) {
    result.tests.markets = { error: e.message, stack: e.stack?.split('\n').slice(0, 3) };
  }

  // Test 3: page size 최대값 찾기
  const sizes = [100, 500, 1000, 2000, 3000, 5000];
  for (const size of sizes) {
    try {
      const t1 = Date.now();
      const url = `${base}/order/orders?durationType=CREATED_AT&startDate=2026-05-01&endDate=2026-05-31&offset=0&size=${size}`;
      const res = await fetch(url, {
        headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
        cache: 'no-store',
      });
      const bodyText = await res.text();
      let parsed = null;
      try { parsed = JSON.parse(bodyText); } catch {}
      result.tests[`size_${size}`] = {
        status: res.status,
        timeMs: Date.now() - t1,
        ok: res.ok,
        dataCount: parsed?.data?.length,
        errorBody: !res.ok ? bodyText.slice(0, 300) : undefined,
      };
    } catch (e) {
      result.tests[`size_${size}`] = { error: e.message };
    }
  }

  return NextResponse.json(result, { status: 200 });
}
