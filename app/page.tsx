'use client';

import { useState } from 'react';
import ResearchInput from '@/components/ResearchInput';
import StreamingBrief from '@/components/StreamingBrief';
import { parseFindings } from '@/lib/parseBrief';
import type { Finding, Source } from '@/types/brief';

type Status = 'idle' | 'searching' | 'done' | 'error';

export default function Home() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [rawText, setRawText] = useState('');

  async function handleResearch(query: string) {
    setStatus('searching');
    setFindings([]);
    setSources([]);
    setRawText('');

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok || !response.body) {
        setStatus('error');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let textAccumulator = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          let event: Record<string, unknown>;
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }

          // Accumulate text deltas and attempt live JSON parse
          const delta = event.delta as Record<string, unknown> | undefined;
          if (event.type === 'content_block_delta' && delta?.type === 'text_delta') {
            textAccumulator += delta.text as string;
            setRawText(textAccumulator);
            const parsed = parseFindings(textAccumulator);
            if (parsed.length > 0) setFindings(parsed);
          }

          // Collect sources from web_search_tool_result blocks (step 6)
          const block = event.content_block as Record<string, unknown> | undefined;
          if (event.type === 'content_block_start' && block?.type === 'web_search_tool_result') {
            const content = block.content;
            if (Array.isArray(content)) {
              const newSources: Source[] = content
                .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
                .map((r) => ({
                  url: String(r.url ?? ''),
                  title: String(r.title ?? r.url ?? ''),
                }));
              setSources((prev) => [...prev, ...newSources]);
            }
          }
        }
      }

      // Final parse once the stream is complete
      const finalFindings = parseFindings(textAccumulator);
      if (finalFindings.length > 0) setFindings(finalFindings);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Research Assistant</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Ask a research question and get a structured brief.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Phase 1: Type a topic, stream Claude's findings, and preserve structured output for later XAI work.
          </p>
        </header>

        <section className="space-y-8">
          <ResearchInput onSubmit={handleResearch} isSearching={status === 'searching'} />
          <StreamingBrief findings={findings} sources={sources} status={status} rawText={rawText} />
        </section>
      </div>
    </main>
  );
}
