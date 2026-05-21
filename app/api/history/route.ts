import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { listAllBriefs } from '@/lib/driveSync';

export async function GET() {
  const session = await getAuthSession();
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const briefs = await listAllBriefs(accessToken);
    return NextResponse.json(briefs);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch history.' }, { status: 500 });
  }
}
