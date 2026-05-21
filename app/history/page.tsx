'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import AuthButton from '@/components/AuthButton';
import BriefCard from '@/components/BriefCard';
import type { BriefMeta } from '@/lib/driveSync';

type LoadState = 'loading' | 'loaded' | 'error';

export default function HistoryPage() {
  const { status: authStatus } = useSession();
  const isAuthenticated = authStatus === 'authenticated';

  const [briefs, setBriefs] = useState<BriefMeta[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      setLoadState('loaded');
      return;
    }
    if (authStatus !== 'authenticated') return;

    fetch('/api/history')
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json() as Promise<BriefMeta[]>;
      })
      .then((data) => {
        setBriefs(data);
        setLoadState('loaded');
      })
      .catch(() => setLoadState('error'));
  }, [authStatus]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <Link
              href="/"
              className="text-sm text-slate-400 underline underline-offset-2 hover:text-white"
            >
              ← Back
            </Link>
            <AuthButton />
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Past research
          </h1>
          <p className="mt-4 text-slate-300">
            Briefs saved to your Google Drive.
          </p>
        </header>

        {!isAuthenticated && authStatus !== 'loading' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center">
            <p className="mb-4 text-slate-400">Sign in to view your research history.</p>
            <AuthButton />
          </div>
        )}

        {isAuthenticated && loadState === 'loading' && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/80"
              />
            ))}
          </div>
        )}

        {isAuthenticated && loadState === 'error' && (
          <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-5 text-red-400">
            Could not load history. Check your connection and try again.
          </div>
        )}

        {isAuthenticated && loadState === 'loaded' && briefs.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
            No briefs yet.{' '}
            <Link href="/" className="text-sky-500 underline underline-offset-2 hover:text-sky-400">
              Run a research query
            </Link>{' '}
            to get started.
          </div>
        )}

        {isAuthenticated && loadState === 'loaded' && briefs.length > 0 && (
          <div className="space-y-3">
            {briefs.map((b) => (
              <BriefCard key={b.id} id={b.id} name={b.name} createdTime={b.createdTime} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
