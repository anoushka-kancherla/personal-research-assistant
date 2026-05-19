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
