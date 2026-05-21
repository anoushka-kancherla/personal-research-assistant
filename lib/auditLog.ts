import type { AuditLog, Finding } from '@/types/brief';

const LOGS_FOLDER_NAME = 'research-logs';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

let cachedLogsFolderId: string | null = null;

function driveRequest(url: string, accessToken: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
}

async function findOrCreateLogsFolder(accessToken: string): Promise<string> {
  if (cachedLogsFolderId) return cachedLogsFolderId;

  const searchUrl = new URL(DRIVE_FILES_URL);
  searchUrl.searchParams.set(
    'q',
    `mimeType='application/vnd.google-apps.folder' and name='${LOGS_FOLDER_NAME}' and trashed=false`
  );
  searchUrl.searchParams.set('fields', 'files(id)');
  searchUrl.searchParams.set('pageSize', '1');

  const searchRes = await driveRequest(searchUrl.toString(), accessToken);
  const searchData = await searchRes.json() as { files?: { id: string }[] };

  if (searchData.files && searchData.files.length > 0) {
    cachedLogsFolderId = searchData.files[0].id;
    return cachedLogsFolderId;
  }

  const createRes = await driveRequest(DRIVE_FILES_URL, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: LOGS_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  const folder = await createRes.json() as { id: string };
  cachedLogsFolderId = folder.id;
  return cachedLogsFolderId;
}

export function buildAuditLog(params: {
  sessionId: string;
  query: string;
  searchQueriesRun: string[];
  sourcesRetrieved: number;
  findings: Finding[];
  pastBriefIds: string[];
  briefFileId: string;
}): AuditLog {
  const sourcesUsed = new Set(params.findings.flatMap((f) => f.sources)).size;

  const confidenceBreakdown = { high: 0, medium: 0, low: 0 };
  params.findings.forEach((f) => {
    const c = f.confidence as keyof typeof confidenceBreakdown;
    if (c in confidenceBreakdown) confidenceBreakdown[c]++;
  });

  return {
    session_id: params.sessionId,
    query: params.query,
    timestamp: new Date().toISOString(),
    search_queries_run: params.searchQueriesRun,
    sources_retrieved: params.sourcesRetrieved,
    sources_used: sourcesUsed,
    confidence_breakdown: confidenceBreakdown,
    past_briefs_recalled: params.pastBriefIds,
    brief_file_id: params.briefFileId,
  };
}

export async function saveAuditLog(accessToken: string, log: AuditLog): Promise<string> {
  const folderId = await findOrCreateLogsFolder(accessToken);

  const boundary = 'audit_log_boundary';
  const metadata = JSON.stringify({
    name: `${log.session_id}.json`,
    parents: [folderId],
    mimeType: 'application/json',
  });
  const content = JSON.stringify(log, null, 2);

  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n');

  const res = await driveRequest(
    `${DRIVE_UPLOAD_URL}?uploadType=multipart`,
    accessToken,
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    }
  );

  const file = await res.json() as { id: string };
  return file.id;
}
