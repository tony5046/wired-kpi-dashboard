import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getKpiOverview, getYearlyComparison } from '@/lib/google-sheets';

// Node runtime 필요 (googleapis는 edge에서 못 돔)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [kpi, yearly] = await Promise.all([
      getKpiOverview(),
      getYearlyComparison(),
    ]);
    return NextResponse.json({
      kpi,
      yearly,
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
