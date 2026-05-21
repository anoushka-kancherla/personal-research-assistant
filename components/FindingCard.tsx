'use client';

import { useState } from 'react';
import type { Finding } from '@/types/brief';

const CONFIDENCE_BADGE: Record<string, string> = {
  high: 'bg-green-900/40 text-green-400',
  medium: 'bg-yellow-900/40 text-yellow-400',
  low: 'bg-red-900/40 text-red-400',
};

type Props = {
  finding: Finding;
  index: number;
};

export default function FindingCard({ finding, index }: Props) {
  const [caveatOpen, setCaveatOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm uppercase tracking-[0.15em] text-sky-400">Finding {index + 1}</p>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${CONFIDENCE_BADGE[finding.confidence] ?? CONFIDENCE_BADGE.low}`}
        >
          {finding.confidence}
        </span>
      </div>

      <p className="mt-2 text-base text-slate-100">{finding.finding}</p>

      {finding.confidence_reason && (
        <p className="mt-2 text-sm text-slate-400">{finding.confidence_reason}</p>
      )}

      {finding.caveats && (
        <div className="mt-3">
          <button
            onClick={() => setCaveatOpen((prev) => !prev)}
            className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-400"
          >
            {caveatOpen ? 'Hide caveat ▲' : 'Show caveat ▼'}
          </button>
          {caveatOpen && (
            <p className="mt-2 text-sm italic text-slate-500">{finding.caveats}</p>
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
                className="break-all text-xs text-sky-500 underline underline-offset-2 hover:text-sky-400"
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
