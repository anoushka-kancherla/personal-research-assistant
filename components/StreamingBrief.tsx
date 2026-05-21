'use client';

import type { Finding, Source } from '@/types/brief';
import ThinkingPanel from './ThinkingPanel';
import FindingCard from './FindingCard';
import SourcesPanel from './SourcesPanel';

const STATUS_LABEL: Record<string, string> = {
  idle: 'idle',
  searching: 'searching…',
  done: 'done',
  error: 'error',
};

type Props = {
  findings: Finding[];
  sources: Source[];
  status: 'idle' | 'searching' | 'done' | 'error';
  rawText: string;
  driveFileUrl: string | null;
  isAuthenticated: boolean;
  thinkingText: string;
};

export default function StreamingBrief({
  findings,
  sources,
  status,
  rawText,
  driveFileUrl,
  isAuthenticated,
  thinkingText,
}: Props) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Research brief</h2>
          <p className="mt-1 text-sm text-slate-400">Live output from the research engine.</p>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-400">
          {STATUS_LABEL[status]}
        </span>
      </div>

      {status === 'idle' && (
        <div className="rounded-3xl border border-dashed border-slate-700 p-8 text-slate-400">
          Enter a topic above to start researching.
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-5 text-red-400">
          Something went wrong. Check your API key and try again.
        </div>
      )}

      {/* Raw text while streaming before JSON is parseable */}
      {status === 'searching' && findings.length === 0 && (
        <pre className="min-h-24 overflow-x-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-950 p-5 text-xs leading-relaxed text-slate-400">
          {rawText || 'Searching the web…'}
        </pre>
      )}

      <ThinkingPanel thinkingText={thinkingText} />

      {findings.length > 0 && (
        <div className="space-y-4">
          {findings.map((finding, index) => (
            <FindingCard key={index} finding={finding} index={index} />
          ))}
        </div>
      )}

      <SourcesPanel sources={sources} findings={findings} />

      {/* Drive confirmation banner */}
      {status === 'done' && driveFileUrl && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-green-900/50 bg-green-950/30 px-5 py-3">
          <span className="text-sm font-medium text-green-400">✓ Saved to Google Drive</span>
          <a
            href={driveFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto shrink-0 text-sm text-sky-500 underline underline-offset-2 hover:text-sky-400"
          >
            Open →
          </a>
        </div>
      )}

      {/* Prompt unauthenticated users to sign in */}
      {status === 'done' && !driveFileUrl && !isAuthenticated && (
        <p className="mt-6 text-sm text-slate-500">
          Sign in with Google to save this brief to Drive and recall it in future sessions.
        </p>
      )}
    </section>
  );
}
