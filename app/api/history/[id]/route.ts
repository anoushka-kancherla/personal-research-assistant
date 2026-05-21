import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { readBrief } from '@/lib/driveSync';
import type { ResearchBrief, Finding } from '@/types/brief';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const content = await readBrief(accessToken, params.id);
    const parsed: unknown = JSON.parse(content);

    // New format: full ResearchBrief object
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return NextResponse.json(parsed as ResearchBrief);
    }

    // Old format: bare Finding[] array — wrap into ResearchBrief shape
    if (Array.isArray(parsed)) {
      const brief: ResearchBrief = {
        query: params.id,
        findings: parsed as Finding[],
        sources: [],
        timestamp: '',
      };
      return NextResponse.json(brief);
    }

    return NextResponse.json({ error: 'Unrecognised brief format.' }, { status: 422 });
  } catch {
    return NextResponse.json({ error: 'Failed to load brief.' }, { status: 500 });
  }
}
