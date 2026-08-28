import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

const DEFAULT_ROOT_FOLDER_ID = '1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm';
const DEDICATED_ACCOUNT_EMAIL = 'maple-x-portal-drive@abiding-orb-506721-j6.iam.gserviceaccount.com';
const DEDICATED_PROJECT_ID = 'abiding-orb-506721-j6';
const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
];

interface ParsedServiceAccount {
  type?: string;
  project_id?: string;
  private_key?: string;
  client_email?: string;
}

function parseServiceAccountJson(raw?: string): { parsed: ParsedServiceAccount | null; error?: string } {
  if (!raw || typeof raw !== 'string') {
    return { parsed: null, error: 'Empty or non-string input' };
  }

  let trimmed = raw.trim();
  if (!trimmed) {
    return { parsed: null, error: 'Empty input after trimming' };
  }

  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"') && !trimmed.startsWith('{"'))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') {
      if (parsed.private_key && typeof parsed.private_key === 'string') {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      return { parsed };
    }
  } catch {
    try {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed === 'object') {
        if (parsed.private_key && typeof parsed.private_key === 'string') {
          parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
        }
        return { parsed };
      }
    } catch {
      try {
        const urlDecoded = decodeURIComponent(trimmed);
        const parsed = JSON.parse(urlDecoded);
        if (parsed && typeof parsed === 'object') {
          if (parsed.private_key && typeof parsed.private_key === 'string') {
            parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
          }
          return { parsed };
        }
      } catch (finalErr: any) {
        return { parsed: null, error: finalErr?.message || 'Invalid JSON syntax' };
      }
    }
  }

  return { parsed: null, error: 'Unknown parse error' };
}

/**
 * Self-Contained Google Drive Health Endpoint
 * ZERO local file imports — guarantees HTTP 200 JSON even if Drive fails.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const folderId = (
    process.env.GOOGLE_DRIVE_FOLDER_ID ||
    process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ||
    process.env.GOOGLE_ROOT_FOLDER_ID ||
    DEFAULT_ROOT_FOLDER_ID
  ).trim();

  const rawEnv = (
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    process.env.GCP_SERVICE_ACCOUNT_JSON ||
    process.env.SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
    ''
  ).trim();

  if (!rawEnv) {
    return res.status(200).json({
      success: false,
      api: 'ok',
      environment: 'production',
      driveAuthenticated: false,
      folderAccessible: false,
      error: 'GOOGLE_SERVICE_ACCOUNT_JSON is not configured in server environment',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  }

  const { parsed, error: parseError } = parseServiceAccountJson(rawEnv);
  if (!parsed || !parsed.client_email || !parsed.private_key) {
    return res.status(200).json({
      success: false,
      api: 'ok',
      environment: 'production',
      driveAuthenticated: false,
      folderAccessible: false,
      error: parseError || 'Invalid service account credentials',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  }

  try {
    const auth = new google.auth.JWT({
      email: parsed.client_email,
      key: parsed.private_key,
      scopes: DRIVE_SCOPES,
    });

    const drive = google.drive({ version: 'v3', auth });
    const folderRes = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, trashed, capabilities',
      supportsAllDrives: true,
    });

    const isAccessible = Boolean(folderRes.data?.id && !folderRes.data.trashed);

    return res.status(200).json({
      success: isAccessible,
      api: 'ok',
      environment: 'production',
      driveAuthenticated: true,
      folderAccessible: isAccessible,
      folderId,
      folderName: folderRes.data?.name || 'MAPLE X FINANCIAL PORTAL',
      diagnostic: {
        success: isAccessible,
        authenticated: true,
        driveApiAuthenticated: true,
        folderAccessible: isAccessible,
        credentialSource: 'GOOGLE_SERVICE_ACCOUNT_JSON',
        tokenSource: 'environment_variable',
        hasServiceAccountJson: true,
        jsonParsed: true,
        hasClientEmail: true,
        hasPrivateKey: true,
        projectId: parsed.project_id || DEDICATED_PROJECT_ID,
        serviceAccountEmail: parsed.client_email,
        folderId,
        folderName: folderRes.data?.name || 'MAPLE X FINANCIAL PORTAL',
      },
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      api: 'ok',
      environment: 'production',
      driveAuthenticated: false,
      folderAccessible: false,
      error: err?.message || 'Google Drive connection error',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  }
}
