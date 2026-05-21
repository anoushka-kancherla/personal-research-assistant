'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') return null;

  if (!session) {
    return (
      <button
        onClick={() => signIn('google')}
        className="border border-rule px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:border-gold hover:text-gold"
      >
        Sign in with Google
      </button>
    );
  }

  return (
    <span className="flex items-center gap-3 font-mono text-xs text-dim">
      <span className="hidden sm:inline">{session.user?.email}</span>
      <button
        onClick={() => signOut()}
        className="uppercase tracking-[0.15em] text-dim underline underline-offset-2 transition-colors hover:text-muted"
      >
        Sign out
      </button>
    </span>
  );
}
