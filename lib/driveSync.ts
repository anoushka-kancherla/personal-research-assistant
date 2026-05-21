const FOLDER_NAME = 'research-briefs';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

// Cached within a single serverless invocation to avoid redundant API calls
let cachedFolderId: string | null = null;

function driveRequest(url: string, accessToken: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
}

async function findOrCreateBriefsFolder(accessToken: string): Promise<string> {
  if (cachedFolderId) return cachedFolderId;

  const searchUrl = new URL(DRIVE_FILES_URL);
  searchUrl.searchParams.set(
    'q',
    `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`
  );
  searchUrl.searchParams.set('fields', 'files(id)');
  searchUrl.searchParams.set('pageSize', '1');

  const searchRes = await driveRequest(searchUrl.toString(), accessToken);
  const searchData = await searchRes.json() as { files?: { id: string }[] };

  if (searchData.files && searchData.files.length > 0) {
    cachedFolderId = searchData.files[0].id;
    return cachedFolderId;
  }

  const createRes = await driveRequest(DRIVE_FILES_URL, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  const folder = await createRes.json() as { id: string };
  cachedFolderId = folder.id;
  return cachedFolderId;
}

export type BriefMeta = {
  id: string;
  name: string;
  createdTime: string;
};

export async function listAllBriefs(accessToken: string): Promise<BriefMeta[]> {
  const folderId = await findOrCreateBriefsFolder(accessToken);

  const url = new URL(DRIVE_FILES_URL);
  url.searchParams.set(
    'q',
    `'${folderId}' in parents and mimeType='application/json' and trashed=false`
  );
  url.searchParams.set('orderBy', 'createdTime desc');
  url.searchParams.set('pageSize', '100');
  url.searchParams.set('fields', 'files(id,name,createdTime)');

  const res = await driveRequest(url.toString(), accessToken);
  const data = await res.json() as { files?: BriefMeta[] };
  return data.files ?? [];
}

export async function listPastBriefs(accessToken: string): Promise<BriefMeta[]> {
  const folderId = await findOrCreateBriefsFolder(accessToken);

  const url = new URL(DRIVE_FILES_URL);
  url.searchParams.set(
    'q',
    `'${folderId}' in parents and mimeType='application/json' and trashed=false`
  );
  url.searchParams.set('orderBy', 'createdTime desc');
  url.searchParams.set('pageSize', '3');
  url.searchParams.set('fields', 'files(id,name,createdTime)');

  const res = await driveRequest(url.toString(), accessToken);
  const data = await res.json() as { files?: BriefMeta[] };
  return data.files ?? [];
}

export async function readBrief(accessToken: string, fileId: string): Promise<string> {
  const res = await driveRequest(
    `${DRIVE_FILES_URL}/${fileId}?alt=media`,
    accessToken
  );
  return res.text();
}

export async function saveBrief(
  accessToken: string,
  topic: string,
  content: string
): Promise<string> {
  const folderId = await findOrCreateBriefsFolder(accessToken);

  const date = new Date().toISOString().slice(0, 10);
  const slug = topic.trim().slice(0, 50).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
  const filename = `${slug}-${date}.json`;

  const boundary = 'brief_upload_boundary';
  const metadata = JSON.stringify({
    name: filename,
    parents: [folderId],
    mimeType: 'application/json',
  });

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
