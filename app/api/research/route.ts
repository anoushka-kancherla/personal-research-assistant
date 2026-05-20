import { NextResponse } from 'next/server';
import { createResearchStream } from '@/lib/anthropic';
import { getAuthSession } from '@/lib/auth';
import { listPastBriefs, readBrief, saveBrief } from '@/lib/driveSync';
import { parseFindings } from '@/lib/parseBrief';

export async function POST(request: Request) {
  let query: string;
  try {
    const body = await request.json();
    query = body?.query?.trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!query) {
    return NextResponse.json({ error: 'query is required.' }, { status: 400 });
  }

  const session = await getAuthSession();
  const accessToken = session?.accessToken;

  // Recall past briefs from Drive before calling Anthropic
  let pastBriefContext: string | undefined;
  if (accessToken) {
    try {
      const briefs = await listPastBriefs(accessToken);
      if (briefs.length > 0) {
        const contents = await Promise.all(briefs.map((b) => readBrief(accessToken, b.id)));
        pastBriefContext = briefs
          .map((b, i) => `--- ${b.name} (${b.createdTime.slice(0, 10)}) ---\n${contents[i]}`)
          .join('\n\n');
      }
    } catch {
      // Drive recall failed — continue without context rather than blocking research
    }
  }

  const stream = createResearchStream(query, pastBriefContext);
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let fullText = '';
      try {
        for await (const event of stream) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullText += event.delta.text;
          }
        }

        // Save brief to Drive after Anthropic stream ends, before closing
        if (accessToken && fullText) {
          try {
            const findings = parseFindings(fullText);
            const content = JSON.stringify(findings, null, 2);
            const fileId = await saveBrief(accessToken, query, content);
            const driveUrl = `https://drive.google.com/file/d/${fileId}/view`;
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: 'drive_saved', url: driveUrl }) + '\n')
            );
          } catch {
            // Drive save failed — don't surface to client, research already delivered
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
