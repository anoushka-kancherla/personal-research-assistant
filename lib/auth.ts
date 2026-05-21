import { type NextAuthOptions, getServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number } | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    const data = await res.json() as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    return {
      accessToken: data.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
    };
  } catch {
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // First sign-in — persist tokens
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        return token;
      }

      // Token still valid
      const expiresAt = token.expiresAt as number | undefined;
      if (expiresAt && Date.now() / 1000 < expiresAt - 60) {
        return token;
      }

      // Token expired — refresh it
      const refreshToken = token.refreshToken as string | undefined;
      if (!refreshToken) return token;

      const refreshed = await refreshAccessToken(refreshToken);
      if (refreshed) {
        token.accessToken = refreshed.accessToken;
        token.expiresAt = refreshed.expiresAt;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}
