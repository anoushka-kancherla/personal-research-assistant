'use client';

import type { Finding, Source } from '@/types/brief';
import ThinkingPanel from './ThinkingPanel';
import FindingCard from './FindingCard';
import SourcesPanel from './SourcesPanel';

type Status = 'idle' | 'searching' | 'done' | 'error';

type Props = {
  findings: Finding[];
  sources: Source[];
  status: Status;
  rawText: string;
  driveFileUrl: string | null;
  isAuthenticated: boolean;
  thinkingText: string;
  errorMessage?: string;
  driveSaveFailed?: boolean;
  phase: string;
  searchCount: number;
};

function getStatusLabel(status: Status, phase: string, searchCount: number): string {
  if (status === 'idle') return 'idle';
  if (status === 'done') return 'done';
  if (status === 'error') return 'error';
  if (phase === 'thinking') return 'thinking…';
  if (phase === 'searching') return `search ${searchCount}…`;
  if (phase === 'synthesizing') return 'synthesizing…';
  return 'starting…';
}

function FindingSkeleton() {
  return (
    <div className="border-t border-rule pt-5">
      <div className="flex items-start justify-between">
        <div className="h-3 w-6 animate-pulse rounded bg-surface2" />
        <div className="h-3 w-14 animate-pulse rounded bg-surface2" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-surface2" />
        <div className="h-4 w-[90%] animate-pulse rounded bg-surface2" />
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-3 w-4/5 animate-pulse rounded bg-surface2" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-surface2" />
      </div>
    </div>
  );
}

export default function StreamingBrief({
  findings,
  sources,
  status,
  rawText,
  driveFileUrl,
  isAuthenticated,
  thinkingText,
  errorMessage,
  driveSaveFailed,
  phase,
  searchCount,
}: Props) {
  const statusLabel = getStatusLabel(status, phase, searchCount);
  const isSkeletonVisible =
    status === 'searching' && findings.length === 0 && !rawText && !thinkingText;

  return (
    <section>
      {/* Section header */}
      <div className="mb-8 flex items-center justify-between border-b border-rule pb-5">
        <h2 className="font-serif text-2xl font-medium text-cream">Research brief</h2>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          {statusLabel}
        </span>
      </div>

      {status === 'idle' && (
        <p className="text-sm text-muted">Enter a topic above to start researching.</p>
      )}

      {status !== 'idle' && (
        <div className="grid grid-cols-1 gap-x-14 gap-y-10 lg:grid-cols-[1fr_260px]">

          {/* ── Main column ── */}
          <div>
            {status === 'error' && (
              <p className="text-sm leading-relaxed text-coral-conf">
                {errorMessage ?? 'Something went wrong. Check your API key and try again.'}
              </p>
            )}

            {/* Skeleton — nothing has arrived yet */}
            {isSkeletonVisible && (
              <div>
                <FindingSkeleton />
                <FindingSkeleton />
                <FindingSkeleton />
              </div>
            )}

            {/* Raw text — Claude is writing JSON but it's not parseable yet */}
            {status === 'searching' && findings.length === 0 && rawText && (
              <pre className="min-h-24 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-dim">
                {rawText}
              </pre>
            )}

            {findings.length > 0 && (
              <div>
                {findings.map((finding, index) => (
                  <FindingCard key={index} finding={finding} index={index} />
                ))}
              </div>
            )}

            {status === 'done' &&
              findings.length > 0 &&
              findings.filter((f) => f.confidence === 'low').length / findings.length >= 0.5 && (
                <p className="mt-6 text-sm text-amber-conf">
                  Most findings have low confidence — try a more specific query for stronger results.
                </p>
              )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">
            <ThinkingPanel thinkingText={thinkingText} />

            <SourcesPanel sources={sources} findings={findings} />

            {status === 'done' && driveFileUrl && (
              <div className="border-t border-rule pt-5">
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-teal-conf">
                  Saved to Drive
                </span>
                <a
                  href={driveFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 block text-sm text-gold underline underline-offset-2 transition-colors hover:text-cream"
                >
                  Open in Drive →
                </a>
              </div>
            )}

            {status === 'done' && driveSaveFailed && (
              <p className="border-t border-rule pt-5 text-sm text-amber-conf">
                Brief could not be saved to Drive — sign out and back in to refresh your session.
              </p>
            )}

            {status === 'done' && !driveFileUrl && !isAuthenticated && (
              <p className="border-t border-rule pt-5 text-sm text-muted">
                Sign in with Google to save briefs to Drive and recall them in future sessions.
              </p>
            )}
          </div>

        </div>
      )}
    </section>
  );
}
