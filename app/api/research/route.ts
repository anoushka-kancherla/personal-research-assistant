import { NextResponse } from 'next/server';
import { createResearchStream } from '@/lib/anthropic';
import { getAuthSession } from '@/lib/auth';
import { listPastBriefs, readBrief, saveBrief } from '@/lib/driveSync';
import { parseFindings } from '@/lib/parseBrief';
import { buildAuditLog, saveAuditLog } from '@/lib/auditLog';
import type { Source } from '@/types/brief';

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

  const sessionId = crypto.randomUUID();
  const session = await getAuthSession();
  const accessToken = session?.accessToken;

  // Recall past briefs from Drive before calling Anthropic
  let pastBriefContext: string | undefined;
  let pastBriefIds: string[] = [];
  if (accessToken) {
    try {
      const briefs = await listPastBriefs(accessToken);
      pastBriefIds = briefs.map((b) => b.id);
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
      const searchQueriesRun: string[] = [];
      let sourcesRetrieved = 0;
      const sourcesCollected: Source[] = [];
      // Maps block index → accumulated input JSON string for in-flight tool calls
      const pendingToolInputs = new Map<number, string>();

      try {
        for await (const event of stream) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));

          // Accumulate text for Drive save and audit log
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullText += event.delta.text;
          }

          if (event.type === 'content_block_start') {
            const block = event.content_block as unknown as Record<string, unknown>;

            // Start accumulating input for web search tool calls
            if (block.type === 'server_tool_use' && block.name === 'web_search') {
              pendingToolInputs.set(event.index, '');
            }

            // Count and collect sources from each web search result block
            if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
              sourcesRetrieved += block.content.length;
              for (const r of block.content as Record<string, unknown>[]) {
                sourcesCollected.push({
                  url: String(r.url ?? ''),
                  title: String(r.title ?? r.url ?? ''),
                });
              }
            }
          }

          // Append partial JSON as tool input arrives
          if (event.type === 'content_block_delta' && pendingToolInputs.has(event.index)) {
            const delta = event.delta as unknown as Record<string, unknown>;
            if (delta.type === 'input_json_delta') {
              pendingToolInputs.set(
                event.index,
                (pendingToolInputs.get(event.index) ?? '') + (delta.partial_json as string)
              );
            }
          }

          // Parse completed tool input to extract the search query string
          if (event.type === 'content_block_stop' && pendingToolInputs.has(event.index)) {
            try {
              const input = JSON.parse(pendingToolInputs.get(event.index) ?? '{}') as Record<string, unknown>;
              if (typeof input.query === 'string') searchQueriesRun.push(input.query);
            } catch { /* malformed input — skip */ }
            pendingToolInputs.delete(event.index);
          }
        }

        // Save brief and audit log after stream ends
        if (accessToken && fullText) {
          try {
            const findings = parseFindings(fullText);
            const brief = {
              query,
              findings,
              sources: sourcesCollected,
              timestamp: new Date().toISOString(),
            };
            const fileId = await saveBrief(accessToken, query, JSON.stringify(brief, null, 2));
            const driveUrl = `https://drive.google.com/file/d/${fileId}/view`;
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: 'drive_saved', url: driveUrl }) + '\n')
            );

            try {
              const log = buildAuditLog({
                sessionId,
                query,
                searchQueriesRun,
                sourcesRetrieved,
                findings,
                pastBriefIds,
                briefFileId: fileId,
              });
              await saveAuditLog(accessToken, log);
            } catch {
              // Audit log failure is always silent — brief already delivered
            }
          } catch {
            // Drive save failed — don't surface to client
          }
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred.';
        try {
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: 'stream_error', message }) + '\n')
          );
        } catch {
          // controller may already be closing — ignore
        }
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
