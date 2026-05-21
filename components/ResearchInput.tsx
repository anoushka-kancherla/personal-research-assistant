'use client';

import { useState } from 'react';

type Props = {
  onSubmit: (query: string) => void;
  isSearching: boolean;
  defaultValue?: string;
};

export default function ResearchInput({ onSubmit, isSearching, defaultValue = '' }: Props) {
  const [query, setQuery] = useState(defaultValue);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim() || isSearching) return;
    onSubmit(query.trim());
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="query" className="block font-mono text-xs uppercase tracking-[0.2em] text-muted">
        Research topic
      </label>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end">
        <input
          id="query"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. latest trends in generative AI research"
          disabled={isSearching}
          className="min-w-0 flex-1 border-b border-rule bg-transparent pb-2.5 pt-1 text-cream placeholder:text-dim focus:border-gold focus:outline-none disabled:opacity-50 transition-colors duration-150"
        />
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="shrink-0 border border-gold px-6 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-gold transition-colors duration-150 hover:bg-gold hover:text-canvas disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSearching ? 'Searching…' : 'Start research'}
        </button>
      </div>
    </form>
  );
}
