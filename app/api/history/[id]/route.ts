import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { readBrief } from '@/lib/driveSync';
import { parseFindings } from '@/lib/parseBrief';
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

  let content: string;
  try {
    content = await readBrief(accessToken, params.id);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch brief from Drive.' }, { status: 502 });
  }

  // New format: full ResearchBrief object
  try {
    const parsed: unknown = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return NextResponse.json(parsed as ResearchBrief);
    }
    // Old format: bare Finding[] array
    if (Array.isArray(parsed)) {
      const brief: ResearchBrief = {
        query: '',
        findings: parsed as Finding[],
        sources: [],
        timestamp: '',
      };
      return NextResponse.json(brief);
    }
  } catch {
    // Not valid JSON — fall through to raw-text extraction below
  }

  // Pre-fix format: raw Claude output with markdown fences
  const findings = parseFindings(content);
  if (findings.length > 0) {
    const brief: ResearchBrief = { query: '', findings, sources: [], timestamp: '' };
    return NextResponse.json(brief);
  }

  return NextResponse.json({ error: 'Unrecognised brief format.' }, { status: 422 });
}
