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
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">

        <header className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-cream"
            >
              ← Back
            </Link>
            <AuthButton />
          </div>
          <h1 className="mt-10 font-serif text-4xl font-medium text-cream sm:text-5xl">
            Past research
          </h1>
          <p className="mt-3 text-sm text-muted">Briefs saved to your Google Drive.</p>
        </header>

        {/* Not signed in */}
        {!isAuthenticated && authStatus !== 'loading' && (
          <div className="border-t border-rule pt-8 text-center">
            <p className="mb-6 text-sm text-muted">Sign in to view your research history.</p>
            <AuthButton />
          </div>
        )}

        {/* Loading skeleton */}
        {isAuthenticated && loadState === 'loading' && (
          <div className="border-t border-rule">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border-b border-rule py-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-surface2" />
                <div className="mt-2 h-3 w-1/4 animate-pulse rounded bg-surface2" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isAuthenticated && loadState === 'error' && (
          <p className="border-t border-rule pt-6 text-sm text-coral-conf">
            Could not load history. Check your connection and try again.
          </p>
        )}

        {/* Empty state */}
        {isAuthenticated && loadState === 'loaded' && briefs.length === 0 && (
          <div className="border-t border-rule pt-8">
            <p className="text-sm text-muted">
              No briefs yet.{' '}
              <Link
                href="/"
                className="text-gold underline underline-offset-2 transition-colors hover:text-cream"
              >
                Run a research query
              </Link>{' '}
              to get started.
            </p>
          </div>
        )}

        {/* Brief list */}
        {isAuthenticated && loadState === 'loaded' && briefs.length > 0 && (
          <div className="border-t border-rule">
            {briefs.map((b) => (
              <BriefCard key={b.id} id={b.id} name={b.name} createdTime={b.createdTime} />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
