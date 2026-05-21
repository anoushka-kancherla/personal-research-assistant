'use client';

import { useState } from 'react';

type Props = {
  thinkingText: string;
};

export default function ThinkingPanel({ thinkingText }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (!thinkingText) return null;

  return (
    <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/60">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-slate-400">How Claude approached this</span>
        <span className="shrink-0 text-xs text-slate-600">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <pre className="max-h-96 overflow-y-auto border-t border-slate-800 px-5 py-4 text-xs leading-relaxed whitespace-pre-wrap break-words text-slate-500">
          {thinkingText}
        </pre>
      )}
    </div>
  );
}
