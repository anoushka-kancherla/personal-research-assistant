'use client';

import Link from 'next/link';

type Props = {
  id: string;
  name: string;
  createdTime: string;
};

function deriveQuery(name: string): string {
  return name
    .replace(/\.json$/, '')
    .replace(/-\d{4}-\d{2}-\d{2}$/, '')
    .replace(/-/g, ' ');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BriefCard({ id, name, createdTime }: Props) {
  const query = deriveQuery(name);
  const date = formatDate(createdTime);

  return (
    <Link
      href={`/history/${id}`}
      title={query}
      className="group flex items-center justify-between gap-4 border-b border-rule py-4 transition-colors hover:bg-surface"
    >
      <div className="min-w-0">
        <p className="truncate text-sm text-cream2 transition-colors group-hover:text-cream">
          {query}
        </p>
        <p className="mt-1 font-mono text-xs text-dim">{date}</p>
      </div>
      <span className="shrink-0 text-dim transition-colors group-hover:text-gold">→</span>
    </Link>
  );
}
