'use client';

import { useState } from 'react';

type Props = {
  thinkingText: string;
};

export default function ThinkingPanel({ thinkingText }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (!thinkingText) return null;

  return (
    <div className="border-t border-rule pt-5">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex min-h-[44px] w-full items-center justify-between text-left"
      >
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Reasoning</span>
        <span className="text-xs text-dim">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <pre className="mt-4 max-h-64 overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-dim">
          {thinkingText}
        </pre>
      )}
    </div>
  );
}
