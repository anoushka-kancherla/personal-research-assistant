'use client';

import type { Finding, Source } from '@/types/brief';

type Props = {
  sources: Source[];
  findings: Finding[];
};

export default function SourcesPanel({ sources, findings }: Props) {
  if (sources.length === 0) return null;

  const citationCounts = new Map<string, number>();
  findings.forEach((f) => {
    f.sources.forEach((url) => {
      citationCounts.set(url, (citationCounts.get(url) ?? 0) + 1);
    });
  });

  const sorted = [...sources].sort(
    (a, b) => (citationCounts.get(b.url) ?? 0) - (citationCounts.get(a.url) ?? 0)
  );

  return (
    <div className="border-t border-rule pt-6">
      <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        Sources — {sources.length}
      </h3>
      <ul className="mt-4 space-y-0">
        {sorted.map((source, index) => {
          const citations = citationCounts.get(source.url) ?? 0;
          return (
            <li key={index} className="flex items-start gap-4 border-b border-rule-soft py-3">
              <span className="mt-px shrink-0 font-mono text-xs text-dim">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block line-clamp-2 text-sm text-cream2 hover:text-cream transition-colors"
                >
                  {source.title || source.url}
                </a>
                <span className="mt-0.5 block break-all font-mono text-xs text-dim">
                  {source.url}
                </span>
              </div>
              {citations > 0 && (
                <span className="mt-px shrink-0 font-mono text-xs text-gold-soft">
                  ×{citations}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
