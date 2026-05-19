# Personal Research Assistant — Build Plan & Tech Stack

## What it does

A user types a research topic and the app:
1. Runs multi-step web searches via Claude tool use
2. Synthesizes a structured brief with findings, confidence ratings, and citations
3. Saves the brief to Google Drive via MCP
4. On future visits, recalls past briefs so Claude builds on prior research
5. Exposes reasoning, source grounding, and confidence at every step (XAI)

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind | SSR + streaming support built in |
| AI | Claude Sonnet via Anthropic API | Tool use, extended thinking, structured output |
| MCP | Google Drive MCP (`drivemcp.googleapis.com`) | Read/write briefs, recall past research |
| Web search | `web_search_20250305` tool in API | Live retrieval without a separate search API key |
| Auth | NextAuth.js + Google OAuth | Required for Drive MCP access |
| Hosting | Vercel | One-click deploy, native Next.js support |
| Language | TypeScript throughout | Safer API response parsing, better DX |

---

## Architecture

```
User (browser)
     │
     ▼
Next.js frontend (Vercel)
     │
     ├── /app/page.tsx          — research input UI
     ├── /app/history/page.tsx  — past briefs from Drive
     └── /app/api/research/     — streaming API route
               │
               ▼
         Anthropic API
         ┌────────────────────────────────────┐
         │  System prompt (research persona)  │
         │  Extended thinking (XAI layer 2)   │
         │  Tools:                            │
         │    - web_search (live retrieval)   │
         │    - Google Drive MCP              │
         │      ├── list past briefs          │
         │      ├── read brief content        │
         │      └── write new brief           │
         └────────────────────────────────────┘
               │
               ▼ (streaming response)
         Frontend renders:
           - Thinking panel (collapsible)
           - Structured brief (findings + confidence badges)
           - Sources panel (URLs + snippets)
           - "Saved to Drive" confirmation
```

---

## XAI Features

### Layer 1 — Source transparency
Parse `tool_result` blocks from the API response and render an expandable **Sources** panel below each brief. Each source shows: URL, domain, retrieved snippet, and how many findings cite it.

**Implementation:** After streaming completes, scan `content` array for `tool_result` blocks with type `web_search`. Display inline with each finding.

### Layer 2 — Reasoning trace (extended thinking)
Enable extended thinking in the API call. Stream `thinking` blocks separately from the answer text. Render them in a collapsible **"How Claude approached this"** panel above the brief.

**Implementation:**
```typescript
// In /app/api/research/route.ts
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 16000,
  thinking: { type: "enabled", budget_tokens: 8000 },
  stream: true,
  // ...
});

// On the frontend, separate thinking blocks from text blocks
// and render them in different UI containers
```

### Layer 3 — Confidence signaling
Instruct Claude via system prompt to return structured JSON for each finding with an explicit confidence rating.

**System prompt instruction:**
```
For each finding, return:
{
  "finding": "the claim",
  "confidence": "high | medium | low",
  "confidence_reason": "why",
  "sources": ["url1", "url2"],
  "caveats": "what you couldn't verify"
}
If retrieved sources are insufficient, return confidence: "low" and explain why
rather than generating unsupported claims.
```

**UI:** Render colored badges (green/yellow/red) next to each finding. Low-confidence findings get an expandable caveat note.

### Layer 4 — Decision audit log
After each session, write a structured JSON log to Google Drive alongside the brief. Captures: query, search terms used, sources retrieved, confidence distribution, and timestamp.

**Log schema:**
```json
{
  "session_id": "uuid",
  "query": "user's original question",
  "timestamp": "ISO 8601",
  "search_queries_run": ["query1", "query2"],
  "sources_retrieved": 12,
  "sources_used": 5,
  "confidence_breakdown": { "high": 4, "medium": 3, "low": 1 },
  "past_briefs_recalled": ["brief-id-1"],
  "brief_file_id": "drive-file-id"
}
```

---

## Project Structure

```
research-assistant/
├── app/
│   ├── page.tsx                  # Main research input + results UI
│   ├── history/
│   │   └── page.tsx              # Past briefs sidebar (from Drive)
│   └── api/
│       └── research/
│           └── route.ts          # Streaming API route — core logic
├── components/
│   ├── ResearchInput.tsx          # Topic input + submit
│   ├── StreamingBrief.tsx         # Renders brief as it streams
│   ├── FindingCard.tsx            # Single finding with confidence badge
│   ├── ThinkingPanel.tsx          # Collapsible extended thinking display
│   ├── SourcesPanel.tsx           # Expandable sources list
│   └── AuditLog.tsx               # Session log viewer (optional UI)
├── lib/
│   ├── anthropic.ts               # Anthropic client + API call logic
│   ├── parseBrief.ts              # Parse structured JSON from Claude output
│   ├── driveSync.ts               # Drive MCP read/write helpers
│   └── auditLog.ts                # Build + write audit log to Drive
├── types/
│   └── brief.ts                   # TypeScript types for findings, sources, logs
└── .env.local
    # ANTHROPIC_API_KEY
    # GOOGLE_CLIENT_ID
    # GOOGLE_CLIENT_SECRET
    # NEXTAUTH_SECRET
```

---

## Phased Build Plan

### Phase 1 — Core research loop (3–5 hrs)
**Goal:** Claude takes a topic, searches the web, streams back a structured brief.

Steps:
1. Set up Next.js project with Tailwind and TypeScript
2. Create `/api/research/route.ts` — POST handler with streaming response
3. Write system prompt with research analyst persona and JSON output format
4. Add `web_search_20250305` tool to API call
5. Stream response to frontend, render raw text first
6. Parse `tool_result` blocks from stream and store for Sources panel

Checkpoint: You can type a topic and get a streaming, structured research brief.

---

### Phase 2 — Google Drive MCP integration (2–3 hrs)
**Goal:** Save briefs to Drive and recall past research.

Steps:
1. Set up NextAuth with Google OAuth — get Drive scope
2. Add Google Drive MCP server to API call: `mcp_servers: [{ type: "url", url: "https://drivemcp.googleapis.com/mcp/v1" }]`
3. Instruct Claude in system prompt to:
   - First list and read any past briefs on this topic from Drive
   - Reference past findings before generating new ones
   - Write the new brief to Drive after generating it
4. Show "Saved to Drive ✓" confirmation in UI with a link to the file

Checkpoint: Briefs persist across sessions. Claude references prior research.

---

### Phase 3 — XAI layer implementation (3–4 hrs)
**Goal:** Full explainability — reasoning, sources, confidence, audit log.

Steps:
1. **Extended thinking:** Add `thinking: { type: "enabled", budget_tokens: 8000 }` to API call. Parse `thinking` type blocks in the stream. Render in `ThinkingPanel.tsx` — collapsed by default, expandable.
2. **Confidence badges:** Update system prompt to enforce JSON output per finding. Build `FindingCard.tsx` with colored confidence badges and caveat expansion.
3. **Sources panel:** After stream ends, render all retrieved URLs with snippets in `SourcesPanel.tsx`. Show citation count per source.
4. **Audit log:** After each session, call `auditLog.ts` to write a JSON log to a `/research-logs/` folder in Drive via MCP.

Checkpoint: Every answer is fully grounded, rated, and traceable.

---

### Phase 4 — History & recall UI (2–3 hrs)
**Goal:** Users can browse and reopen past research sessions.

Steps:
1. Build `/history` page — list Drive folder contents via MCP, show title + date
2. Clicking a past brief loads it in read-only view with all XAI panels intact
3. Add "Continue research" button — reopens the topic and pre-loads the past brief as context
4. Add a relevance threshold warning: if Claude's retrieved context is weak (detected via low confidence distribution in audit log), show a banner suggesting the user refine their query

Checkpoint: The app feels stateful and intelligent across sessions.

---

### Phase 5 — Polish & deploy (2 hrs)
**Goal:** Production-ready, shareable, and documented.

Steps:
1. Error handling — graceful fallbacks if Drive MCP fails or search returns nothing
2. Loading states — skeleton UI while streaming starts
3. Mobile responsiveness — Tailwind breakpoints
4. Deploy to Vercel — set environment variables, test production build
5. Write a README with architecture diagram and a short demo GIF

---

## Resume Bullet

> Built an AI research assistant using the Claude API (streaming, extended thinking, tool use) and Google Drive MCP — generates structured research briefs with per-finding confidence ratings, source attribution, reasoning traces, and session audit logs persisted to Drive.

---

## Key Technical Decisions to Discuss in Interviews

**Why streaming?**
Research briefs take 15–30 seconds to generate. Streaming makes the app feel responsive — users read findings as they arrive rather than staring at a spinner.

**Why extended thinking over chain-of-thought prompting?**
Extended thinking uses a dedicated reasoning token budget and is harder to manipulate or shortcut. Chain-of-thought is prompt-level and can be overridden. For XAI, extended thinking gives a more authentic trace.

**Why MCP for Drive instead of the Drive REST API directly?**
MCP keeps Drive interaction in Claude's tool-use loop — Claude decides when to read past briefs and what to write, rather than hardcoding those calls. This makes the system more adaptive and is a direct demonstration of the MCP course skills.

**Why JSON structured output for findings?**
Free-form text is hard to parse reliably for confidence badges and source linking. Structured output lets you build a real UI on top of Claude's response rather than just displaying a text blob.

**What would you add next?**
Re-ranking retrieved web results by relevance before passing to Claude (reduces noise in large search result sets), and a semantic similarity check against past briefs so Claude can surface genuinely new information rather than repeating known findings.
