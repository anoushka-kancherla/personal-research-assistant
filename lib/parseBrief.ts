import type { Finding } from '@/types/brief';

export function parseFindings(rawText: string): Finding[] {
  try {
    // Extract the first JSON array from the text, regardless of surrounding prose or fences
    const start = rawText.indexOf('[');
    const end = rawText.lastIndexOf(']');
    if (start === -1 || end === -1 || end <= start) return [];
    const parsed = JSON.parse(rawText.slice(start, end + 1));
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        finding: String(item.finding ?? ''),
        confidence: String(item.confidence ?? 'low'),
        confidence_reason: String(item.confidence_reason ?? ''),
        sources: Array.isArray(item.sources) ? item.sources.map(String) : [],
        caveats: String(item.caveats ?? ''),
      }));
    }
  } catch {
    // fall through
  }

  return [];
}
