import { NextResponse } from 'next/server';
import { createResearchStream } from '@/lib/anthropic';

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

  const stream = createResearchStream(query);
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
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
