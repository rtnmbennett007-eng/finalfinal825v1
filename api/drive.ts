import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { google } from 'googleapis';

// Target constants for Maple X Financial
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
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
}

interface StoredDriveConfig {
  folderId?: string;
  serviceAccountEmail?: string;
  projectId?: string;
}

interface CredentialLoadResult {
  isValid: boolean;
  credentials: ParsedServiceAccount | null;
  credentialSource: 'GOOGLE_SERVICE_ACCOUNT_JSON' | 'runtime_memory' | 'persistent_storage' | 'none';
  hasServiceAccountJson: boolean;
  jsonParsed: boolean;
  hasClientEmail: boolean;
  hasPrivateKey: boolean;
  projectId: string;
  serviceAccountEmail: string;
  folderId: string;
  parseError?: string;
}

// In-memory runtime cache
let inMemoryServiceAccount: ParsedServiceAccount | null = null;
let inMemoryConfig: StoredDriveConfig = {};

function getWritableDataDirs(): string[] {
  return [path.join(process.cwd(), 'data'), path.join('/tmp', 'maplex-data'), path.join('/tmp', 'maplex-drive-data'), '/tmp'];
}

function getRequestOrigin(req?: any, fallback?: string): string {
  if (!req) {
    if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
    if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '');
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
    return fallback || 'https://portal.maplexfinancial.com';
  }

  const forwardedProto = (req.headers?.['x-forwarded-proto'] || (req.protocol ? req.protocol : 'https')) as string;
  const proto = (forwardedProto ? forwardedProto.split(',')[0].trim() : 'https') || 'https';

  const forwardedHost = (req.headers?.['x-forwarded-host'] || (req.get ? req.get('host') : req.headers?.host)) as string;
  const host = forwardedHost ? forwardedHost.split(',')[0].trim() : '';

  if (host) {
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('0.0.0.0');
    const finalProto = isLocal ? proto : 'https';
    return `${finalProto}://${host}`.replace(/\/$/, '');
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }

  return fallback || 'https://portal.maplexfinancial.com';
}

function parseServiceAccountString(raw: string): { parsed: ParsedServiceAccount | null; error?: string } {
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
  } catch (directErr: any) {
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
      } catch {
        return { parsed: null, error: directErr?.message || 'JSON parse failure' };
      }
    }
  }

  return { parsed: null, error: 'Unknown parse error' };
}

function loadServiceAccountCredentials(): CredentialLoadResult {
  const targetFolderId = (
    process.env.GOOGLE_DRIVE_FOLDER_ID ||
    process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ||
    process.env.GOOGLE_ROOT_FOLDER_ID ||
    inMemoryConfig.folderId ||
    DEFAULT_ROOT_FOLDER_ID
  ).trim();

  const envRaw = (
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    process.env.GCP_SERVICE_ACCOUNT_JSON ||
    process.env.SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
    ''
  ).trim();

  if (envRaw) {
    const { parsed, error } = parseServiceAccountString(envRaw);
    if (parsed) {
      const hasEmail = Boolean(parsed.client_email && typeof parsed.client_email === 'string');
      const hasKey = Boolean(parsed.private_key && typeof parsed.private_key === 'string');
      const isServiceAccountType = !parsed.type || parsed.type === 'service_account';
      const projectId = parsed.project_id || DEDICATED_PROJECT_ID;
      const clientEmail = parsed.client_email || DEDICATED_ACCOUNT_EMAIL;

      if (hasEmail && hasKey && isServiceAccountType) {
        inMemoryServiceAccount = parsed;
        return {
          isValid: true,
          credentials: parsed,
          credentialSource: 'GOOGLE_SERVICE_ACCOUNT_JSON',
          hasServiceAccountJson: true,
          jsonParsed: true,
          hasClientEmail: true,
          hasPrivateKey: true,
          projectId,
          serviceAccountEmail: clientEmail,
          folderId: targetFolderId,
        };
      } else {
        return {
          isValid: false,
          credentials: null,
          credentialSource: 'GOOGLE_SERVICE_ACCOUNT_JSON',
          hasServiceAccountJson: true,
          jsonParsed: true,
          hasClientEmail: hasEmail,
          hasPrivateKey: hasKey,
          projectId,
          serviceAccountEmail: clientEmail,
          folderId: targetFolderId,
          parseError: !isServiceAccountType
            ? 'GOOGLE_SERVICE_ACCOUNT_JSON type must be "service_account".'
            : 'GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key.',
        };
      }
    } else {
      return {
        isValid: false,
        credentials: null,
        credentialSource: 'GOOGLE_SERVICE_ACCOUNT_JSON',
        hasServiceAccountJson: true,
        jsonParsed: false,
        hasClientEmail: false,
        hasPrivateKey: false,
        projectId: DEDICATED_PROJECT_ID,
        serviceAccountEmail: DEDICATED_ACCOUNT_EMAIL,
        folderId: targetFolderId,
        parseError: error || 'GOOGLE_SERVICE_ACCOUNT_JSON exists but could not be parsed.',
      };
    }
  }

  if (inMemoryServiceAccount && inMemoryServiceAccount.client_email && inMemoryServiceAccount.private_key) {
    return {
      isValid: true,
      credentials: inMemoryServiceAccount,
      credentialSource: 'runtime_memory',
      hasServiceAccountJson: false,
      jsonParsed: true,
      hasClientEmail: true,
      hasPrivateKey: true,
      projectId: inMemoryServiceAccount.project_id || DEDICATED_PROJECT_ID,
      serviceAccountEmail: inMemoryServiceAccount.client_email || DEDICATED_ACCOUNT_EMAIL,
      folderId: targetFolderId,
    };
  }

  const dirs = getWritableDataDirs();
  for (const dir of dirs) {
    try {
      const filePath = path.join(dir, 'google-service-account.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const { parsed } = parseServiceAccountString(raw);
        if (parsed && parsed.client_email && parsed.private_key) {
          inMemoryServiceAccount = parsed;
          return {
            isValid: true,
            credentials: parsed,
            credentialSource: 'persistent_storage',
            hasServiceAccountJson: false,
            jsonParsed: true,
            hasClientEmail: true,
            hasPrivateKey: true,
            projectId: parsed.project_id || DEDICATED_PROJECT_ID,
            serviceAccountEmail: parsed.client_email || DEDICATED_ACCOUNT_EMAIL,
            folderId: targetFolderId,
          };
        }
      }
    } catch {
      // Continue
    }
  }

  return {
    isValid: false,
    credentials: null,
    credentialSource: 'none',
    hasServiceAccountJson: false,
    jsonParsed: false,
    hasClientEmail: false,
    hasPrivateKey: false,
    projectId: DEDICATED_PROJECT_ID,
    serviceAccountEmail: DEDICATED_ACCOUNT_EMAIL,
    folderId: targetFolderId,
    parseError: 'GOOGLE_SERVICE_ACCOUNT_JSON is missing from the Vercel Production runtime.',
  };
}

function getDriveClient() {
  const sa = loadServiceAccountCredentials();
  if (!sa.isValid || !sa.credentials || !sa.credentials.client_email || !sa.credentials.private_key) {
    throw new Error(sa.parseError || 'GOOGLE_SERVICE_ACCOUNT_JSON is missing from the Vercel Production runtime.');
  }

  const auth = new google.auth.JWT({
    email: sa.credentials.client_email,
    key: sa.credentials.private_key,
    scopes: DRIVE_SCOPES,
  });

  return google.drive({ version: 'v3', auth });
}

function saveStoredServiceAccount(rawJsonOrObj: string | ParsedServiceAccount, folderId?: string): { success: boolean; error?: string } {
  try {
    let parsed: ParsedServiceAccount | null = null;
    if (typeof rawJsonOrObj === 'string') {
      const res = parseServiceAccountString(rawJsonOrObj);
      parsed = res.parsed;
    } else if (rawJsonOrObj && typeof rawJsonOrObj === 'object') {
      parsed = { ...rawJsonOrObj };
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
    }

    if (!parsed || !parsed.client_email || !parsed.private_key) {
      return { success: false, error: 'Invalid Service Account JSON. Ensure "client_email" and "private_key" are present.' };
    }

    inMemoryServiceAccount = parsed;
    if (folderId) {
      inMemoryConfig.folderId = folderId.trim();
    }

    const dirs = getWritableDataDirs();
    for (const dir of dirs) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const filePath = path.join(dir, 'google-service-account.json');
        fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8');
      } catch {
        // Ignore
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save service account credentials' };
  }
}

function clearStoredServiceAccount(): void {
  inMemoryServiceAccount = null;
  const dirs = getWritableDataDirs();
  for (const dir of dirs) {
    try {
      const filePath = path.join(dir, 'google-service-account.json');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Ignore
    }
  }
}

async function getDriveStatus(reqHostOrigin?: string) {
  const sa = loadServiceAccountCredentials();
  const targetFolderId = sa.folderId;
  const serviceAccountEmail = sa.serviceAccountEmail;
  const projectId = sa.projectId;

  if (!sa.isValid || !sa.credentials) {
    return {
      isConfigured: false,
      isConnected: false,
      authType: 'service_account',
      serviceAccountEmail,
      projectId,
      targetFolderId,
      rootFolderId: targetFolderId,
      serviceAccountConfigured: false,
      folderIdConfigured: Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID),
      tokenSource: null,
      credentialSource: sa.credentialSource,
      hasServiceAccountJson: sa.hasServiceAccountJson,
      hasPrivateKey: sa.hasPrivateKey,
      hasClientEmail: sa.hasClientEmail,
      statusMessage: sa.parseError || 'GOOGLE_SERVICE_ACCOUNT_JSON is missing from the Vercel Production runtime.',
    };
  }

  try {
    const drive = getDriveClient();
    let targetFolderName = 'Maple X Client Document Vault';
    let folderAccessible = false;

    try {
      const folderRes = await drive.files.get({
        fileId: targetFolderId,
        fields: 'id, name, mimeType, capabilities, trashed',
        supportsAllDrives: true,
      });

      if (folderRes.data && folderRes.data.id) {
        targetFolderName = folderRes.data.name || targetFolderName;
        folderAccessible = !folderRes.data.trashed;
      }
    } catch (folderErr: any) {
      console.warn(`Target folder verification note (${targetFolderId}):`, folderErr.message || folderErr);
    }

    return {
      isConfigured: true,
      isConnected: folderAccessible,
      authType: 'service_account',
      serviceAccountEmail,
      projectId,
      targetFolderId,
      rootFolderId: targetFolderId,
      targetFolderName,
      rootFolderName: targetFolderName,
      folderAccessible,
      serviceAccountConfigured: true,
      folderIdConfigured: Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID),
      tokenSource: sa.credentialSource,
      credentialSource: sa.credentialSource,
      hasServiceAccountJson: sa.hasServiceAccountJson,
      hasPrivateKey: sa.hasPrivateKey,
      hasClientEmail: sa.hasClientEmail,
      authorizedAccount: serviceAccountEmail,
      statusMessage: folderAccessible
        ? `Connected to Target Folder via Service Account (${serviceAccountEmail})`
        : `Service Account active; verify folder permissions for ${targetFolderId}`,
    };
  } catch (err: any) {
    return {
      isConfigured: true,
      isConnected: false,
      authType: 'service_account',
      serviceAccountEmail,
      projectId,
      targetFolderId,
      rootFolderId: targetFolderId,
      serviceAccountConfigured: true,
      folderIdConfigured: Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID),
      tokenSource: sa.credentialSource,
      credentialSource: sa.credentialSource,
      hasServiceAccountJson: sa.hasServiceAccountJson,
      hasPrivateKey: sa.hasPrivateKey,
      hasClientEmail: sa.hasClientEmail,
      authorizedAccount: serviceAccountEmail,
      statusMessage: `Authentication issue: ${err.message || 'Service account failed to authenticate with Drive API.'}`,
    };
  }
}

async function testDriveConnectionLive(reqHostOrigin?: string) {
  const sa = loadServiceAccountCredentials();
  const results: {
    step: string;
    status: 'PASSED' | 'FAILED' | 'WARNING';
    message: string;
    details?: any;
  }[] = [];

  if (!sa.isValid || !sa.credentials) {
    results.push({
      step: 'Service Account Configuration',
      status: 'FAILED',
      message: sa.parseError || 'GOOGLE_SERVICE_ACCOUNT_JSON is missing from the Vercel Production runtime.',
    });
    return {
      success: false,
      status: 'FAILED',
      stage: 'CREDENTIAL_ERROR',
      summary: 'Service Account credentials missing or invalid in server environment.',
      serviceAccountEmail: sa.serviceAccountEmail,
      targetFolderId: sa.folderId,
      steps: results.map((r) => ({ name: r.step, status: r.status, message: r.message })),
      results,
    };
  }

  results.push({
    step: 'Service Account Configuration',
    status: 'PASSED',
    message: `Loaded credentials for ${sa.serviceAccountEmail} (Project: ${sa.projectId}) from ${sa.credentialSource}.`,
  });

  let drive: any;
  try {
    drive = getDriveClient();
    results.push({
      step: 'Google Auth JWT Generation',
      status: 'PASSED',
      message: 'JWT access token generated successfully for Drive scopes.',
    });
  } catch (authErr: any) {
    results.push({
      step: 'Google Auth JWT Generation',
      status: 'FAILED',
      message: `Failed to initialize JWT client: ${authErr.message}`,
    });
    return {
      success: false,
      status: 'FAILED',
      stage: 'DRIVE_API_ERROR',
      summary: `Google authentication failed: ${authErr.message}`,
      serviceAccountEmail: sa.serviceAccountEmail,
      targetFolderId: sa.folderId,
      steps: results.map((r) => ({ name: r.step, status: r.status, message: r.message })),
      results,
    };
  }

  try {
    const folderRes = await drive.files.get({
      fileId: sa.folderId,
      fields: 'id, name, mimeType, capabilities, trashed, shared, owners',
      supportsAllDrives: true,
    });

    const folder = folderRes.data;
    if (folder.trashed) {
      results.push({
        step: 'Target Folder Accessibility',
        status: 'FAILED',
        message: `Target folder "${folder.name}" (${sa.folderId}) is marked as trashed in Google Drive.`,
      });
      return {
        success: false,
        status: 'FAILED',
        stage: 'FOLDER_ACCESS_ERROR',
        summary: 'Target folder is in the Google Drive trash.',
        serviceAccountEmail: sa.serviceAccountEmail,
        targetFolderId: sa.folderId,
        steps: results.map((r) => ({ name: r.step, status: r.status, message: r.message })),
        results,
      };
    }

    results.push({
      step: 'Target Folder Accessibility',
      status: 'PASSED',
      message: `Verified access to folder "${folder.name || 'Vault'}" (${sa.folderId}).`,
      details: {
        folderName: folder.name,
        canAddChildren: folder.capabilities?.canAddChildren,
        canEdit: folder.capabilities?.canEdit,
      },
    });

    if (folder.capabilities?.canAddChildren === false) {
      results.push({
        step: 'Folder Permissions Audit',
        status: 'WARNING',
        message: `Service account does not have "canAddChildren" permission. Ensure the folder is shared with ${sa.serviceAccountEmail} as "Editor".`,
      });
    } else {
      results.push({
        step: 'Folder Permissions Audit',
        status: 'PASSED',
        message: `Service account has Editor permissions to create client folders and upload documents.`,
      });
    }

    return {
      success: true,
      status: 'CONNECTED',
      summary: `Google Drive Verification Passed. Connected to "${folder.name}" with service account ${sa.serviceAccountEmail}.`,
      serviceAccountEmail: sa.serviceAccountEmail,
      targetFolderId: sa.folderId,
      targetFolderName: folder.name,
      steps: results.map((r) => ({ name: r.step, status: r.status, message: r.message })),
      results,
    };
  } catch (folderErr: any) {
    results.push({
      step: 'Target Folder Accessibility',
      status: 'FAILED',
      message: `Unable to access folder ${sa.folderId}: ${folderErr.message || folderErr}. Make sure folder is shared with ${sa.serviceAccountEmail}.`,
    });
    return {
      success: false,
      status: 'FAILED',
      stage: 'FOLDER_ACCESS_ERROR',
      summary: `Folder access failed: ${folderErr.message || 'Check folder permissions'}`,
      serviceAccountEmail: sa.serviceAccountEmail,
      targetFolderId: sa.folderId,
      steps: results.map((r) => ({ name: r.step, status: r.status, message: r.message })),
      results,
    };
  }
}

async function listDriveFiles(folderId?: string, limit = 50) {
  const sa = loadServiceAccountCredentials();
  const targetFolder = (folderId || sa.folderId).trim();
  const drive = getDriveClient();

  const res = await drive.files.list({
    q: `'${targetFolder}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, createdTime, modifiedTime, properties)',
    pageSize: Math.min(limit, 100),
    orderBy: 'createdTime desc',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return res.data.files || [];
}

async function getDriveFileBuffer(fileId: string): Promise<{
  buffer: Buffer;
  mimeType: string;
  name: string;
  size?: number;
  metadata: { name: string; mimeType: string; size?: number };
}> {
  const drive = getDriveClient();

  const metaRes = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size',
    supportsAllDrives: true,
  });

  const arrayRes = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'arraybuffer' }
  );

  const name = metaRes.data.name || 'document';
  const mimeType = metaRes.data.mimeType || 'application/octet-stream';
  const size = metaRes.data.size ? parseInt(metaRes.data.size, 10) : undefined;

  return {
    buffer: Buffer.from(arrayRes.data as ArrayBuffer),
    mimeType,
    name,
    size,
    metadata: {
      name,
      mimeType,
      size,
    },
  };
}

export async function getDriveDiagnostic(reqHostOrigin?: string) {
  const sa = loadServiceAccountCredentials();
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_URL);
  const targetFolderId = sa.folderId || DEFAULT_ROOT_FOLDER_ID;
  const serviceAccountEmail = sa.serviceAccountEmail || DEDICATED_ACCOUNT_EMAIL;

  const serverInstance =
    process.env.K_REVISION ||
    process.env.K_SERVICE ||
    process.env.HOSTNAME ||
    process.env.CONTAINER_ID ||
    process.env.INSTANCE_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) ||
    `instance-${process.pid}`;

  const tokenSource =
    sa.credentialSource === 'GOOGLE_SERVICE_ACCOUNT_JSON'
      ? 'environment_variable'
      : sa.credentialSource === 'none'
      ? 'none'
      : sa.credentialSource;

  if (!sa.isValid || !sa.credentials || !sa.credentials.private_key || !sa.credentials.client_email) {
    return {
      success: false,
      authenticated: false,
      driveApiAuthenticated: false,
      folderAccessible: false,
      stage: 'CREDENTIAL_ERROR',
      error: sa.parseError || (sa.hasServiceAccountJson ? 'GOOGLE_SERVICE_ACCOUNT_JSON exists but could not be parsed.' : 'GOOGLE_SERVICE_ACCOUNT_JSON is missing from the Vercel Production runtime.'),
      credentialSource: sa.credentialSource,
      tokenSource,
      hasServiceAccountJson: sa.hasServiceAccountJson,
      jsonParsed: sa.jsonParsed,
      hasClientEmail: sa.hasClientEmail,
      hasPrivateKey: sa.hasPrivateKey,
      projectId: sa.projectId || DEDICATED_PROJECT_ID,
      serviceAccountEmail,
      serviceAccount: serviceAccountEmail,
      folderId: targetFolderId,
      isVercel,
      environment: process.env.NODE_ENV || (isVercel ? 'production (vercel)' : 'production'),
      serverTime: new Date().toISOString(),
      serverInstance,
    };
  }

  try {
    const drive = getDriveClient();
    const folderRes = await drive.files.get({
      fileId: targetFolderId,
      fields: 'id, name, trashed, capabilities',
      supportsAllDrives: true,
    });

    const isAccessible = Boolean(folderRes.data?.id && !folderRes.data.trashed);

    return {
      success: isAccessible,
      authenticated: true,
      driveApiAuthenticated: true,
      folderAccessible: isAccessible,
      stage: isAccessible ? 'VERIFIED' : 'FOLDER_ACCESS_ERROR',
      error: isAccessible ? undefined : 'Target folder is inaccessible or trashed in Google Drive.',
      credentialSource: sa.credentialSource,
      tokenSource,
      hasServiceAccountJson: sa.hasServiceAccountJson,
      jsonParsed: sa.jsonParsed,
      hasClientEmail: sa.hasClientEmail,
      hasPrivateKey: sa.hasPrivateKey,
      projectId: sa.projectId || DEDICATED_PROJECT_ID,
      serviceAccountEmail,
      serviceAccount: serviceAccountEmail,
      folderId: targetFolderId,
      folderName: folderRes.data?.name || 'MAPLE X FINANCIAL PORTAL',
      isVercel,
      environment: process.env.NODE_ENV || (isVercel ? 'production (vercel)' : 'production'),
      serverTime: new Date().toISOString(),
      serverInstance,
    };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const isAuthErr = errMsg.toLowerCase().includes('auth') || errMsg.toLowerCase().includes('jwt') || errMsg.toLowerCase().includes('token');
    return {
      success: false,
      authenticated: false,
      driveApiAuthenticated: false,
      folderAccessible: false,
      stage: isAuthErr ? 'DRIVE_API_ERROR' : 'FOLDER_ACCESS_ERROR',
      error: `Google Drive API error: ${errMsg}`,
      credentialSource: sa.credentialSource,
      tokenSource,
      hasServiceAccountJson: sa.hasServiceAccountJson,
      jsonParsed: sa.jsonParsed,
      hasClientEmail: sa.hasClientEmail,
      hasPrivateKey: sa.hasPrivateKey,
      projectId: sa.projectId || DEDICATED_PROJECT_ID,
      serviceAccountEmail,
      serviceAccount: serviceAccountEmail,
      folderId: targetFolderId,
      isVercel,
      environment: process.env.NODE_ENV || (isVercel ? 'production (vercel)' : 'production'),
      serverTime: new Date().toISOString(),
      serverInstance,
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const url = req.url || '';
  const method = req.method || 'GET';
  const origin = getRequestOrigin(req);

  try {
    // 1. Diagnostics / Health check
    if (url.includes('/diagnostic') || url.includes('/health') || req.query.action === 'diagnostic') {
      const diagnostic = await getDriveDiagnostic(origin);
      return res.status(200).json(diagnostic);
    }

    // 2. Test Connection (Live 4-step audit)
    if (url.includes('/test-connection') || req.query.action === 'test-connection') {
      const result = await testDriveConnectionLive(origin);
      return res.status(200).json(result);
    }

    // 3. Status
    if (url.includes('/status') || req.query.action === 'status') {
      const status = await getDriveStatus(origin);
      return res.status(200).json(status);
    }

    // 4. Config (GET or POST)
    if (url.includes('/config') || req.query.action === 'config') {
      if (method === 'POST') {
        const { serviceAccountJson, folderId } = req.body || {};
        if (serviceAccountJson) {
          const saveResult = saveStoredServiceAccount(serviceAccountJson, folderId);
          if (!saveResult.success) {
            return res.status(400).json(saveResult);
          }
        }
        const diagnostic = await getDriveDiagnostic(origin);
        return res.status(200).json({
          success: true,
          message: 'Google Drive configuration saved successfully.',
          diagnostic,
        });
      }
      const diagnostic = await getDriveDiagnostic(origin);
      return res.status(200).json({
        success: true,
        folderId: diagnostic.folderId || DEFAULT_ROOT_FOLDER_ID,
        folderName: diagnostic.folderName || 'MAPLE X FINANCIAL PORTAL',
        serviceAccountEmail: diagnostic.serviceAccountEmail || DEDICATED_ACCOUNT_EMAIL,
        projectId: diagnostic.projectId || DEDICATED_PROJECT_ID,
        authenticated: diagnostic.authenticated || false,
        folderAccessible: diagnostic.folderAccessible || false,
      });
    }

    // 5. Set Credentials / Tokens
    if (url.includes('/set-credentials') || url.includes('/set-tokens') || req.query.action === 'set-credentials') {
      const { serviceAccountJson, json, credentials, folderId } = req.body || {};
      const payload = serviceAccountJson || json || credentials;
      if (!payload) {
        return res.status(400).json({ success: false, error: 'Service account JSON string or object is required.' });
      }
      const saveResult = saveStoredServiceAccount(payload, folderId);
      if (!saveResult.success) {
        return res.status(400).json(saveResult);
      }
      const testResult = await testDriveConnectionLive(origin);
      return res.status(200).json({
        success: testResult.success,
        message: testResult.success
          ? 'Credentials stored and verified successfully.'
          : 'Credentials stored but Google Drive connection test failed.',
        testResult,
      });
    }

    // 6. Disconnect
    if (url.includes('/disconnect') || req.query.action === 'disconnect') {
      clearStoredServiceAccount();
      return res.status(200).json({
        success: true,
        message: 'Google Drive runtime credentials cleared.',
      });
    }

    // 7. List Files
    if (url.includes('/files') || req.query.action === 'files') {
      const folderId = (req.query.folderId as string) || undefined;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 50;
      const result = await listDriveFiles(folderId, pageSize);
      return res.status(200).json(result);
    }

    // 8. View File
    if (url.includes('/view') || req.query.action === 'view') {
      const fileIdMatch = url.match(/\/file\/([^/?#]+)\/view/) || [null, req.query.fileId as string];
      const fileId = fileIdMatch[1];
      if (!fileId) {
        return res.status(400).json({ success: false, error: 'File ID is required' });
      }
      const fileData = await getDriveFileBuffer(fileId);
      if (!fileData) {
        return res.status(404).json({ success: false, error: 'File not found on Google Drive' });
      }
      res.setHeader('Content-Type', fileData.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${fileData.name}"`);
      return res.status(200).send(fileData.buffer);
    }

    // 9. Download File
    if (url.includes('/download') || req.query.action === 'download') {
      const fileIdMatch = url.match(/\/file\/([^/?#]+)\/download/) || [null, req.query.fileId as string];
      const fileId = fileIdMatch[1];
      if (!fileId) {
        return res.status(400).json({ success: false, error: 'File ID is required' });
      }
      const fileData = await getDriveFileBuffer(fileId);
      if (!fileData) {
        return res.status(404).json({ success: false, error: 'File not found on Google Drive' });
      }
      res.setHeader('Content-Type', fileData.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileData.name}"`);
      return res.status(200).send(fileData.buffer);
    }

    // Default: Return Google Drive diagnostic
    const diagnostic = await getDriveDiagnostic(origin);
    return res.status(200).json(diagnostic);
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      error: err?.message || 'Drive endpoint failure',
      authenticated: false,
      folderAccessible: false,
    });
  }
}
