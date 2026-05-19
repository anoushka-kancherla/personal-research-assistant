'use client';

import { useState } from 'react';

type Props = {
  onSubmit: (query: string) => void;
  isSearching: boolean;
};

export default function ResearchInput({ onSubmit, isSearching }: Props) {
  const [query, setQuery] = useState('');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim() || isSearching) return;
    onSubmit(query.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
      <label htmlFor="query" className="block text-sm font-medium text-slate-300">
        Research topic
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          id="query"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. latest trends in generative AI research"
          disabled={isSearching}
          className="min-w-0 flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSearching ? 'Searching…' : 'Start research'}
        </button>
      </div>
    </form>
  );
}
