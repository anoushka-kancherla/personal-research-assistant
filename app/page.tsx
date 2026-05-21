'use client';

import { Suspense, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ResearchInput from '@/components/ResearchInput';
import StreamingBrief from '@/components/StreamingBrief';
import AuthButton from '@/components/AuthButton';
import { parseFindings } from '@/lib/parseBrief';
import type { Finding, Source } from '@/types/brief';

type Status = 'idle' | 'searching' | 'done' | 'error';

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { status: authStatus } = useSession();
  const isAuthenticated = authStatus === 'authenticated';
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';

  const [findings, setFindings] = useState<Finding[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [rawText, setRawText] = useState('');
  const [driveFileUrl, setDriveFileUrl] = useState<string | null>(null);
  const [thinkingText, setThinkingText] = useState('');

  async function handleResearch(query: string) {
    setStatus('searching');
    setFindings([]);
    setSources([]);
    setRawText('');
    setDriveFileUrl(null);
    setThinkingText('');

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
      let thinkingAccumulator = '';

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

          // Drive save confirmation from route handler
          if (event.type === 'drive_saved' && typeof event.url === 'string') {
            setDriveFileUrl(event.url);
            continue;
          }

          const delta = event.delta as Record<string, unknown> | undefined;
          const block = event.content_block as Record<string, unknown> | undefined;

          // Separator between thinking blocks when a new one starts
          if (event.type === 'content_block_start' && block?.type === 'thinking') {
            if (thinkingAccumulator) thinkingAccumulator += '\n\n---\n\n';
          }

          // Accumulate thinking deltas
          if (event.type === 'content_block_delta' && delta?.type === 'thinking_delta') {
            thinkingAccumulator += delta.thinking as string;
            setThinkingText(thinkingAccumulator);
          }

          // Accumulate text deltas and attempt live JSON parse
          if (event.type === 'content_block_delta' && delta?.type === 'text_delta') {
            textAccumulator += delta.text as string;
            setRawText(textAccumulator);
            const parsed = parseFindings(textAccumulator);
            if (parsed.length > 0) setFindings(parsed);
          }

          // Collect sources from web_search_tool_result blocks
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
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Research Assistant</p>
            <div className="flex items-center gap-4">
              {isAuthenticated && (
                <Link
                  href="/history"
                  className="text-sm text-slate-400 underline underline-offset-2 hover:text-white"
                >
                  Past research →
                </Link>
              )}
              <AuthButton />
            </div>
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Ask a research question and get a structured brief.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Searches the web, synthesizes findings, and saves briefs to Google Drive.
          </p>
        </header>

        <section className="space-y-8">
          <ResearchInput onSubmit={handleResearch} isSearching={status === 'searching'} defaultValue={initialQuery} />
          <StreamingBrief
            findings={findings}
            sources={sources}
            status={status}
            rawText={rawText}
            driveFileUrl={driveFileUrl}
            isAuthenticated={isAuthenticated}
            thinkingText={thinkingText}
          />
        </section>
      </div>
    </main>
  );
}
