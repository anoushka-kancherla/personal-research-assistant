'use client';

import type { Finding, Source } from '@/types/brief';

type Props = {
  sources: Source[];
  findings: Finding[];
};

export default function SourcesPanel({ sources, findings }: Props) {
  if (sources.length === 0) return null;

  // Count how many findings cite each source URL
  const citationCounts = new Map<string, number>();
  findings.forEach((f) => {
    f.sources.forEach((url) => {
      citationCounts.set(url, (citationCounts.get(url) ?? 0) + 1);
    });
  });

  // Sort by citation count descending so most-used sources appear first
  const sorted = [...sources].sort(
    (a, b) => (citationCounts.get(b.url) ?? 0) - (citationCounts.get(a.url) ?? 0)
  );

  return (
    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
      <h3 className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
        Sources retrieved ({sources.length})
      </h3>
      <ul className="mt-3 space-y-2">
        {sorted.map((source, index) => {
          const citations = citationCounts.get(source.url) ?? 0;
          return (
            <li key={index} className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-xs text-slate-600">{index + 1}.</span>
              <div className="min-w-0 flex-1">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-sm text-sky-500 underline underline-offset-2 hover:text-sky-400"
                >
                  {source.title || source.url}
                </a>
              </div>
              <span
                className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  citations > 0
                    ? 'bg-sky-900/40 text-sky-400'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {citations > 0 ? `cited ${citations}` : 'retrieved'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
