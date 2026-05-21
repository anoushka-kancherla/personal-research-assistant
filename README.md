# Personal Research Assistant

**[personal-research-assistant.vercel.app](https://personal-research-assistant.vercel.app/)**

Your research instrument. Create briefs on any topic, with source attribution, confidence signals, and full reasoning traces saved to your Google Drive.

Built with Next.js 14, the Anthropic Claude API (with extended thinking + web search), and Google OAuth/Drive.

---

## Features

- **Live web search** — Claude runs multiple searches per query and synthesizes findings from real-time results
- **Structured briefs** — every finding includes a confidence rating (high / medium / low), the reasoning behind it, source URLs, and caveats
- **Confidence signals** — source quality rules distinguish primary sources from secondary reporting from leaks and rumours; outlet count alone cannot raise confidence
- **Extended thinking** — Claude's full reasoning trace is captured and shown in a collapsible sidebar panel
- **Google Drive sync** — completed briefs are saved as JSON to a `Research Briefs` folder in your Drive and recalled as context for future queries
- **Research history** — browse and re-open past briefs; continue any brief as a new query with one click
- **Audit log** — every session writes a structured log (queries run, sources retrieved, findings, brief file ID) to Drive alongside the brief

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| AI | Anthropic Claude (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| Search | `web_search_20250305` built-in tool |
| Reasoning | Extended thinking (`budget_tokens: 8000`) |
| Auth | NextAuth.js v4, Google OAuth 2.0 |
| Storage | Google Drive REST API v3 (direct multipart upload) |
| Styling | Tailwind CSS v3, Google Fonts (Playfair Display, DM Sans, JetBrains Mono) |
| Language | TypeScript |

---

## Project structure

```
app/
  page.tsx                    # Home — query input + streaming brief
  layout.tsx                  # Root layout, Google Fonts
  providers.tsx               # NextAuth SessionProvider
  history/
    page.tsx                  # Brief library
    [id]/page.tsx             # Brief detail view
  api/
    auth/[...nextauth]/       # NextAuth handler
    research/route.ts         # Streaming research endpoint (NDJSON)
    history/route.ts          # List all briefs from Drive
    history/[id]/route.ts     # Fetch and parse a single brief

components/
  ResearchInput.tsx           # Query form
  StreamingBrief.tsx          # Two-column brief layout (findings + sidebar)
  FindingCard.tsx             # Single finding with confidence badge
  ThinkingPanel.tsx           # Collapsible reasoning trace
  SourcesPanel.tsx            # Sorted source list with citation counts
  BriefCard.tsx               # History list row
  AuthButton.tsx              # Sign-in / sign-out

lib/
  anthropic.ts                # Claude client, system prompt, stream factory
  auth.ts                     # NextAuth config with token refresh
  driveSync.ts                # Drive folder management, brief read/write/list
  parseBrief.ts               # Extract Finding[] from raw Claude output
  auditLog.ts                 # Audit log builder and Drive writer

types/
  brief.ts                    # Finding, Source, ResearchBrief, AuditLog
```

---

## How it works

### Research stream (`POST /api/research`)

1. Optionally reads up to 3 past briefs from Drive and injects them as prior context
2. Opens a streaming `messages.stream()` call to Claude with extended thinking and web search enabled
3. Forwards every raw SDK event to the client as newline-delimited JSON (NDJSON)
4. After the stream ends, parses the full output, saves a `ResearchBrief` JSON to Drive, and enqueues a `drive_saved` event with the file URL
5. Writes an audit log to Drive recording queries run, sources retrieved, and findings

### Client streaming (`app/page.tsx`)

The client reads the NDJSON stream line-by-line and routes events:

| Event | Action |
|---|---|
| `content_block_start` (thinking) | Phase → `thinking` |
| `content_block_start` (server_tool_use / web_search) | Phase → `searching` |
| `content_block_start` (web_search_tool_result) | Search count +1, sources collected |
| `content_block_delta` (thinking_delta) | Thinking text accumulates |
| `content_block_delta` (text_delta) | Phase → `synthesizing`; raw text accumulates; live JSON parse attempted |
| `drive_saved` | Drive URL stored |
| `stream_error` | Error message surfaced to UI |

The status label in the brief header updates in real time: `starting… → thinking… → search 1… → synthesizing… → done`.

### Confidence ratings

The system prompt enforces strict source-quality rules:

- **High** — primary sources only: official press releases, regulatory filings, peer-reviewed papers, on-record statements from named individuals with direct knowledge
- **Medium** — credible secondary reporting (Reuters, Bloomberg, WSJ, AP, BBC) with named sourcing, or partial official confirmation
- **Low** — leaks, anonymous sources, fan/enthusiast sites, social media, patent filings, or any information described as unconfirmed

Outlet count does not raise confidence. Ten sites repeating the same anonymous leak is still one low-quality source.

---

## Local setup

### 1. Clone and install

```bash
git clone <repo-url>
cd personal-research-assistant
npm install
```

### 2. Create a Google OAuth app

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add `http://localhost:3000/api/auth/callback/google` to **Authorised redirect URIs**
4. Enable the **Google Drive API** in **APIs & Services → Library**
5. Copy the client ID and secret

### 3. Set environment variables

Create `.env.local` in the project root:

```env
ANTHROPIC_API_KEY=sk-ant-...

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random-string>   # openssl rand -base64 32

GOOGLE_CLIENT_ID=<from-step-2>
GOOGLE_CLIENT_SECRET=<from-step-2>
```

> **Never commit `.env.local`.** It is listed in `.gitignore`.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## License

MIT
