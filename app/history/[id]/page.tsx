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
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <nav className="mb-10">
          <Link
            href="/history"
            className="text-sm text-slate-400 underline underline-offset-2 hover:text-white"
          >
            ← All research
          </Link>
        </nav>

        {loadState === 'loading' && (
          <div className="space-y-4">
            <div className="h-10 w-2/3 animate-pulse rounded-xl bg-slate-800" />
            <div className="h-4 w-1/4 animate-pulse rounded-lg bg-slate-800" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-900" />
            ))}
          </div>
        )}

        {loadState === 'error' && (
          <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-5 text-red-400">
            Could not load this brief.{' '}
            <Link href="/history" className="underline underline-offset-2 hover:text-red-300">
              Back to history
            </Link>
          </div>
        )}

        {loadState === 'loaded' && brief && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm uppercase tracking-[0.2em] text-sky-400">Research brief</p>
                <h1 className="mt-2 text-2xl font-semibold text-white">{brief.query}</h1>
                {brief.timestamp && (
                  <p className="mt-1 text-sm text-slate-500">
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
                className="shrink-0 rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
              >
                Continue research →
              </Link>
            </div>

            {brief.findings.length > 0 && (
              <div className="space-y-4">
                {brief.findings.map((finding, i) => (
                  <FindingCard key={i} finding={finding} index={i} />
                ))}
              </div>
            )}

            <SourcesPanel sources={brief.sources} findings={brief.findings} />
          </section>
        )}
      </div>
    </main>
  );
}
