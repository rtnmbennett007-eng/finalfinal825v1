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

  // Strip wrapping single or double quotes
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"') && !trimmed.startsWith('{"'))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  // 1. Direct JSON parse
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') {
      if (parsed.private_key && typeof parsed.private_key === 'string') {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      return { parsed };
    }
  } catch {
    // 2. Base64 decode attempt
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
      // 3. URL decode attempt
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
 * Self-Contained Google Drive Diagnostic Vercel Function
 * ZERO local file imports — completely bundle-safe for Vercel Serverless.
 * Always returns HTTP 200 JSON.
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
  const folderName = 'MAPLE X FINANCIAL PORTAL';

  const rawEnv = (
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    process.env.GCP_SERVICE_ACCOUNT_JSON ||
    process.env.SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
    ''
  ).trim();

  const isVercel = true;
  const environment = process.env.NODE_ENV || 'production';
  const serverTime = new Date().toISOString();
  const serverInstance =
    process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) ||
    process.env.HOSTNAME ||
    'vercel-serverless';

  // Check if env var exists
  if (!rawEnv) {
    return res.status(200).json({
      success: false,
      authenticated: false,
      driveApiAuthenticated: false,
      folderAccessible: false,
      credentialSource: 'none',
      tokenSource: 'none',
      hasServiceAccountJson: false,
      jsonParsed: false,
      hasClientEmail: false,
      hasPrivateKey: false,
      projectId: DEDICATED_PROJECT_ID,
      serviceAccountEmail: DEDICATED_ACCOUNT_EMAIL,
      serviceAccount: DEDICATED_ACCOUNT_EMAIL,
      folderId,
      folderName,
      error: 'GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not configured.',
      stage: 'CREDENTIAL_ERROR',
      isVercel,
      environment,
      serverTime,
      serverInstance,
    });
  }

  // Parse JSON
  const { parsed, error: parseError } = parseServiceAccountJson(rawEnv);
  if (!parsed) {
    return res.status(200).json({
      success: false,
      authenticated: false,
      driveApiAuthenticated: false,
      folderAccessible: false,
      credentialSource: 'GOOGLE_SERVICE_ACCOUNT_JSON',
      tokenSource: 'environment_variable',
      hasServiceAccountJson: true,
      jsonParsed: false,
      hasClientEmail: false,
      hasPrivateKey: false,
      projectId: DEDICATED_PROJECT_ID,
      serviceAccountEmail: DEDICATED_ACCOUNT_EMAIL,
      serviceAccount: DEDICATED_ACCOUNT_EMAIL,
      folderId,
      folderName,
      error: parseError || 'GOOGLE_SERVICE_ACCOUNT_JSON could not be parsed as valid JSON.',
      stage: 'CREDENTIAL_ERROR',
      isVercel,
      environment,
      serverTime,
      serverInstance,
    });
  }

  const hasClientEmail = Boolean(parsed.client_email && typeof parsed.client_email === 'string');
  const hasPrivateKey = Boolean(parsed.private_key && typeof parsed.private_key === 'string');
  const projectId = parsed.project_id || DEDICATED_PROJECT_ID;
  const serviceAccountEmail = parsed.client_email || DEDICATED_ACCOUNT_EMAIL;
  const isServiceAccount = !parsed.type || parsed.type === 'service_account';

  if (!hasClientEmail || !hasPrivateKey || !isServiceAccount) {
    return res.status(200).json({
      success: false,
      authenticated: false,
      driveApiAuthenticated: false,
      folderAccessible: false,
      credentialSource: 'GOOGLE_SERVICE_ACCOUNT_JSON',
      tokenSource: 'environment_variable',
      hasServiceAccountJson: true,
      jsonParsed: true,
      hasClientEmail,
      hasPrivateKey,
      projectId,
      serviceAccountEmail,
      serviceAccount: serviceAccountEmail,
      folderId,
      folderName,
      error: !isServiceAccount
        ? 'Service account JSON type must be "service_account".'
        : 'Service account JSON is missing client_email or private_key.',
      stage: 'CREDENTIAL_ERROR',
      isVercel,
      environment,
      serverTime,
      serverInstance,
    });
  }

  // Test live Google Drive connection
  try {
    const auth = new google.auth.JWT({
      email: parsed.client_email!,
      key: parsed.private_key!,
      scopes: DRIVE_SCOPES,
    });

    const drive = google.drive({ version: 'v3', auth });
    const folderRes = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, trashed, capabilities',
      supportsAllDrives: true,
    });

    const isAccessible = Boolean(folderRes.data?.id && !folderRes.data.trashed);
    const resolvedFolderName = folderRes.data?.name || folderName;

    return res.status(200).json({
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
      projectId,
      serviceAccountEmail,
      serviceAccount: serviceAccountEmail,
      folderId,
      folderName: resolvedFolderName,
      stage: isAccessible ? 'VERIFIED' : 'FOLDER_ACCESS_ERROR',
      error: isAccessible ? undefined : 'Target folder is in Google Drive trash or inaccessible.',
      isVercel,
      environment,
      serverTime,
      serverInstance,
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const isAuthErr =
      errMsg.toLowerCase().includes('auth') ||
      errMsg.toLowerCase().includes('jwt') ||
      errMsg.toLowerCase().includes('token') ||
      errMsg.toLowerCase().includes('unauthorized');

    return res.status(200).json({
      success: false,
      authenticated: !isAuthErr,
      driveApiAuthenticated: !isAuthErr,
      folderAccessible: false,
      credentialSource: 'GOOGLE_SERVICE_ACCOUNT_JSON',
      tokenSource: 'environment_variable',
      hasServiceAccountJson: true,
      jsonParsed: true,
      hasClientEmail: true,
      hasPrivateKey: true,
      projectId,
      serviceAccountEmail,
      serviceAccount: serviceAccountEmail,
      folderId,
      folderName,
      error: `Google Drive API error: ${errMsg}`,
      stage: isAuthErr ? 'DRIVE_API_ERROR' : 'FOLDER_ACCESS_ERROR',
      isVercel,
      environment,
      serverTime,
      serverInstance,
    });
  }
}
