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
      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4 transition-colors hover:border-slate-700 hover:bg-slate-800/80"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-100">{query}</p>
        <p className="mt-1 text-xs text-slate-500">{date}</p>
      </div>
      <span className="shrink-0 text-slate-600">→</span>
    </Link>
  );
}
