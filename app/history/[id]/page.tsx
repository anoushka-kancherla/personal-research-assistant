'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import FindingCard from '@/components/FindingCard';
import SourcesPanel from '@/components/SourcesPanel';
import type { ResearchBrief } from '@/types/brief';

type LoadState = 'loading' | 'loaded' | 'error';

export default function BriefDetailPage({ params }: { params: { id: string } }) {
  const [brief, setBrief] = useState<ResearchBrief | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  useEffect(() => {
    fetch(`/api/history/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json() as Promise<ResearchBrief>;
      })
      .then((data) => {
        setBrief(data);
        setLoadState('loaded');
      })
      .catch(() => setLoadState('error'));
  }, [params.id]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">

        <nav className="mb-10">
          <Link
            href="/history"
            className="font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-cream"
          >
            ← All research
          </Link>
        </nav>

        {/* Loading skeleton */}
        {loadState === 'loading' && (
          <div>
            <div className="mb-2 h-9 w-3/4 animate-pulse rounded bg-surface2" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-surface2" />
            <div className="mt-10 border-t border-rule">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border-b border-rule py-5">
                  <div className="h-4 w-full animate-pulse rounded bg-surface2" />
                  <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-surface2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {loadState === 'error' && (
          <p className="text-sm text-coral-conf">
            Could not load this brief.{' '}
            <Link
              href="/history"
              className="underline underline-offset-2 transition-colors hover:text-cream"
            >
              Back to history
            </Link>
          </p>
        )}

        {/* Loaded */}
        {loadState === 'loaded' && brief && (
          <section>
            {/* Header */}
            <div className="mb-8 border-b border-rule pb-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                    Research brief
                  </span>
                  <h1 className="mt-2 font-serif text-3xl font-medium text-cream sm:text-4xl">
                    {brief.query}
                  </h1>
                  {brief.timestamp && (
                    <p className="mt-2 font-mono text-xs text-dim">
                      {new Date(brief.timestamp).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
                <Link
                  href={`/?q=${encodeURIComponent(brief.query)}`}
                  className="w-full border border-gold px-4 py-3 text-center font-mono text-xs uppercase tracking-[0.15em] text-gold transition-colors hover:bg-gold hover:text-canvas sm:w-auto sm:shrink-0 sm:py-2 sm:text-left"
                >
                  Continue →
                </Link>
              </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 gap-x-14 gap-y-10 lg:grid-cols-[1fr_260px]">
              {/* Main: findings */}
              <div>
                {brief.findings.map((finding, i) => (
                  <FindingCard key={i} finding={finding} index={i} />
                ))}
              </div>

              {/* Sidebar: sources */}
              <div>
                <SourcesPanel sources={brief.sources ?? []} findings={brief.findings} />
              </div>
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
