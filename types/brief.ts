export type Finding = {
  finding: string;
  confidence: 'high' | 'medium' | 'low' | string;
  confidence_reason: string;
  sources: string[];
  caveats: string;
};

export type Source = {
  url: string;
  title: string;
};

export type ResearchBrief = {
  query: string;
  findings: Finding[];
  sources: Source[];
  timestamp: string;
};

export type AuditLog = {
  session_id: string;
  query: string;
  timestamp: string;
  search_queries_run: string[];
  sources_retrieved: number;
  sources_used: number;
  confidence_breakdown: { high: number; medium: number; low: number };
  past_briefs_recalled: string[];
  brief_file_id: string;
};
