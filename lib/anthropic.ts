import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' });

export const SYSTEM_PROMPT = `You are a professional research analyst. When given a research topic:
1. Use the web_search tool to gather current, live information — run multiple searches as needed to cover the topic thoroughly.
2. After searching, return a JSON array of findings grounded in what you retrieved. Each element must conform exactly to this shape:

{
  "finding": "the specific claim or insight",
  "confidence": "high | medium | low",
  "confidence_reason": "the evidence supporting this confidence level, or the limitation reducing it",
  "sources": ["url1", "url2"],
  "caveats": "what could not be verified, or empty string if none"
}

Rules:
- Populate "sources" with real URLs from your search results, not placeholder text.
- Return ONLY the JSON array — no markdown fences, no prose before or after.
- If retrieved sources are insufficient for a claim, set confidence to "low" and explain in caveats rather than fabricating support.
- Aim for 5–8 findings that together give a complete picture of the topic.`;

const TOOLS: Anthropic.Tool[] = [
  {
    type: 'web_search_20250305',
    name: 'web_search',
  } as unknown as Anthropic.Tool,
];

export function createResearchStream(query: string, pastBriefContext?: string) {
  const userContent = pastBriefContext
    ? `Past research on related topics (use this as context and build on it where relevant):\n\n${pastBriefContext}\n\n---\n\nResearch topic: ${query}`
    : `Research topic: ${query}`;

  return client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    thinking: { type: 'enabled', budget_tokens: 8000 },
    system: SYSTEM_PROMPT,
    tools: TOOLS,
    messages: [{ role: 'user', content: userContent }],
  });
}
