'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') return null;

  if (!session) {
    return (
      <button
        onClick={() => signIn('google')}
        className="rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 text-sm text-slate-300 transition hover:border-sky-500 hover:text-sky-400"
      >
        Sign in with Google to save briefs
      </button>
    );
  }

  return (
    <span className="text-sm text-slate-500">
      {session.user?.email}
      {' · '}
      <button
        onClick={() => signOut()}
        className="text-slate-500 underline underline-offset-2 hover:text-slate-300"
      >
        Sign out
      </button>
    </span>
  );
}
