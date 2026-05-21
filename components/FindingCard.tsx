'use client';

import { useState } from 'react';
import type { Finding } from '@/types/brief';

const CONFIDENCE_STYLES: Record<string, { dot: string; label: string; text: string }> = {
  high:   { dot: 'bg-teal-conf',  label: 'text-teal-conf',  text: 'High'   },
  medium: { dot: 'bg-amber-conf', label: 'text-amber-conf', text: 'Medium' },
  low:    { dot: 'bg-coral-conf', label: 'text-coral-conf', text: 'Low'    },
};

type Props = {
  finding: Finding;
  index: number;
};

export default function FindingCard({ finding, index }: Props) {
  const [caveatOpen, setCaveatOpen] = useState(false);
  const conf = CONFIDENCE_STYLES[finding.confidence] ?? CONFIDENCE_STYLES.low;

  return (
    <div className="border-t border-rule pb-5 pt-5">
      <div className="flex items-start justify-between gap-4">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-dim">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className={`flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.15em] ${conf.label}`}>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${conf.dot}`} />
          {conf.text}
        </span>
      </div>

      <p className="mt-3 text-base leading-relaxed text-cream">{finding.finding}</p>

      {finding.confidence_reason && (
        <p className="mt-2 text-sm leading-relaxed text-muted">{finding.confidence_reason}</p>
      )}

      {finding.caveats && (
        <div className="mt-3">
          <button
            onClick={() => setCaveatOpen((prev) => !prev)}
            className="py-1 font-mono text-xs uppercase tracking-[0.15em] text-dim underline underline-offset-2 hover:text-muted transition-colors"
          >
            {caveatOpen ? 'Hide caveat ▲' : 'Show caveat ▼'}
          </button>
          {caveatOpen && (
            <p className="mt-2 text-sm italic leading-relaxed text-dim">{finding.caveats}</p>
          )}
        </div>
      )}

      {finding.sources.length > 0 && (
        <ul className="mt-3 space-y-1">
          {finding.sources.map((src, si) => (
            <li key={si}>
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all font-mono text-xs text-gold-soft underline underline-offset-2 hover:text-gold transition-colors"
              >
                {src}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
