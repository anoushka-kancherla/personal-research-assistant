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
type Phase = 'idle' | 'thinking' | 'searching' | 'synthesizing';

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
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [driveSaveFailed, setDriveSaveFailed] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [searchCount, setSearchCount] = useState(0);

  async function handleResearch(query: string) {
    setStatus('searching');
    setFindings([]);
    setSources([]);
    setRawText('');
    setDriveFileUrl(null);
    setThinkingText('');
    setErrorMessage(undefined);
    setDriveSaveFailed(false);
    setPhase('idle');
    setSearchCount(0);

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
      let streamErrorOccurred = false;
      let driveWasSaved = false;

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

          // Drive save confirmation
          if (event.type === 'drive_saved' && typeof event.url === 'string') {
            setDriveFileUrl(event.url);
            driveWasSaved = true;
            continue;
          }

          // Structured error from the stream
          if (event.type === 'stream_error') {
            const msg = typeof event.message === 'string'
              ? event.message
              : 'An unexpected error occurred.';
            setErrorMessage(msg);
            setStatus('error');
            streamErrorOccurred = true;
            continue;
          }

          const delta = event.delta as Record<string, unknown> | undefined;
          const block = event.content_block as Record<string, unknown> | undefined;

          // Thinking block starts
          if (event.type === 'content_block_start' && block?.type === 'thinking') {
            setPhase('thinking');
            if (thinkingAccumulator) thinkingAccumulator += '\n\n---\n\n';
          }

          // Claude is initiating a web search
          if (
            event.type === 'content_block_start' &&
            block?.type === 'server_tool_use' &&
            block?.name === 'web_search'
          ) {
            setPhase('searching');
          }

          // Accumulate thinking deltas
          if (event.type === 'content_block_delta' && delta?.type === 'thinking_delta') {
            thinkingAccumulator += delta.thinking as string;
            setThinkingText(thinkingAccumulator);
          }

          // Accumulate text deltas and attempt live JSON parse
          if (event.type === 'content_block_delta' && delta?.type === 'text_delta') {
            setPhase('synthesizing');
            textAccumulator += delta.text as string;
            setRawText(textAccumulator);
            const parsed = parseFindings(textAccumulator);
            if (parsed.length > 0) setFindings(parsed);
          }

          // Collect sources from web_search_tool_result blocks
          if (event.type === 'content_block_start' && block?.type === 'web_search_tool_result') {
            setSearchCount((prev) => prev + 1);
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

      if (!streamErrorOccurred) {
        const finalFindings = parseFindings(textAccumulator);
        if (finalFindings.length > 0) setFindings(finalFindings);

        if (finalFindings.length === 0) {
          setErrorMessage(
            'No structured findings were returned — the query may be too vague or the search returned no usable results.'
          );
          setStatus('error');
        } else {
          if (isAuthenticated && !driveWasSaved) setDriveSaveFailed(true);
          setStatus('done');
        }
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">

        <header className="mb-10 sm:mb-14">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2.5">
              {/* Diamond mark: 14×14 border square + 3px-inset fill, rotated 45° */}
              <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                <span className="relative h-[14px] w-[14px] rotate-45 border-[1.5px] border-gold">
                  <span className="absolute inset-[3px] bg-gold" />
                </span>
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
                Research Assistant
              </span>
            </span>
            <div className="flex items-center gap-6">
              {isAuthenticated && (
                <Link
                  href="/history"
                  className="font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-cream"
                >
                  Past research →
                </Link>
              )}
              <AuthButton />
            </div>
          </div>
          <h1 className="mt-8 font-serif text-4xl font-medium text-cream sm:text-5xl">
            Your research instrument.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted">
            Create briefs on any topic, with source attribution, confidence signals, and full reasoning traces saved to your Google Drive.
          </p>
        </header>

        <div className="space-y-14">
          <ResearchInput
            onSubmit={handleResearch}
            isSearching={status === 'searching'}
            defaultValue={initialQuery}
          />
          <StreamingBrief
            findings={findings}
            sources={sources}
            status={status}
            rawText={rawText}
            driveFileUrl={driveFileUrl}
            isAuthenticated={isAuthenticated}
            thinkingText={thinkingText}
            errorMessage={errorMessage}
            driveSaveFailed={driveSaveFailed}
            phase={phase}
            searchCount={searchCount}
          />
        </div>

      </div>
    </main>
  );
}
