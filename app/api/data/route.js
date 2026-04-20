import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getDashboardData } from '@/lib/cached';

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

  try {
    const data = await getDashboardData(params);
    return NextResponse.json(data);
  } catch (e) {
    console.error('Data fetch error:', e);
    return NextResponse.json(
      { error: 'Failed to fetch data', message: e.message },
      { status: 500 }
    );
  }
}
