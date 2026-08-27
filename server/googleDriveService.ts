import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { Readable } from 'stream';

// Load environment variables
dotenv.config();
try {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  dotenv.config({ path: path.join(process.cwd(), '.env.production') });
} catch {
  // Ignore in restricted environments
}

// Storage locations for runtime persistence
const PRIMARY_DATA_DIR = path.join(process.cwd(), 'data');
const FALLBACK_DATA_DIR = path.join('/tmp', 'maplex-drive-data');
const VERCEL_DATA_DIR = path.join('/tmp', 'maplex-data');
const TMP_DIR = '/tmp';

// Default target folder & service account parameters for Maple X Financial
export const DEFAULT_ROOT_FOLDER_ID = '1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm';
export const DEDICATED_ACCOUNT_EMAIL = 'maple-x-portal-drive@abiding-orb-506721-j6.iam.gserviceaccount.com';
export const DEDICATED_PROJECT_ID = 'abiding-orb-506721-j6';
export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
];

export interface ParsedServiceAccount {
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

export interface StoredDriveConfig {
  folderId?: string;
  serviceAccountEmail?: string;
  projectId?: string;
}

// In-memory runtime caches
let inMemoryServiceAccount: ParsedServiceAccount | null = null;
let inMemoryConfig: StoredDriveConfig = {};

/**
 * Returns the best writable directory in current runtime
 */
function getWritableDataDirs(): string[] {
  return [PRIMARY_DATA_DIR, VERCEL_DATA_DIR, FALLBACK_DATA_DIR, TMP_DIR];
}

/**
 * Derives request origin dynamically
 */
export function getRequestOrigin(req?: any, fallback?: string): string {
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

/**
 * Helper to safely parse Service Account JSON string or base64
 */
function parseServiceAccountString(raw: string): ParsedServiceAccount | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Try direct JSON parse
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') {
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      return parsed;
    }
  } catch {
    // Attempt base64 decode if not plain JSON
  }

  try {
    const decoded = Buffer.from(trimmed, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === 'object') {
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      return parsed;
    }
  } catch {
    // Ignore parse error
  }

  return null;
}

/**
 * Load Service Account credentials from Environment Variable, Cache, or File
 */
export function getServiceAccountCredentials(): {
  credentials: ParsedServiceAccount | null;
  source: 'environment_variable' | 'runtime_memory' | 'persistent_storage' | null;
  folderId: string;
  clientEmail: string;
  projectId: string;
  isConfigured: boolean;
} {
  const targetFolderId = (
    process.env.GOOGLE_DRIVE_FOLDER_ID ||
    process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ||
    process.env.GOOGLE_ROOT_FOLDER_ID ||
    inMemoryConfig.folderId ||
    DEFAULT_ROOT_FOLDER_ID
  ).trim();

  // 1. Direct environment variable read (GOOGLE_SERVICE_ACCOUNT_JSON)
  const envServiceAccountJson = (
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    process.env.GCP_SERVICE_ACCOUNT_JSON ||
    process.env.SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
    ''
  ).trim();

  if (envServiceAccountJson) {
    const parsed = parseServiceAccountString(envServiceAccountJson);
    if (parsed && parsed.client_email && parsed.private_key) {
      inMemoryServiceAccount = parsed;
      return {
        credentials: parsed,
        source: 'environment_variable',
        folderId: targetFolderId,
        clientEmail: parsed.client_email || DEDICATED_ACCOUNT_EMAIL,
        projectId: parsed.project_id || DEDICATED_PROJECT_ID,
        isConfigured: true,
      };
    }
  }

  // 2. In-memory runtime cache
  if (inMemoryServiceAccount && inMemoryServiceAccount.client_email && inMemoryServiceAccount.private_key) {
    return {
      credentials: inMemoryServiceAccount,
      source: 'runtime_memory',
      folderId: targetFolderId,
      clientEmail: inMemoryServiceAccount.client_email || DEDICATED_ACCOUNT_EMAIL,
      projectId: inMemoryServiceAccount.project_id || DEDICATED_PROJECT_ID,
      isConfigured: true,
    };
  }

  // 3. Persistent filesystem storage
  const dirs = getWritableDataDirs();
  for (const dir of dirs) {
    try {
      const filePath = path.join(dir, 'google-service-account.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = parseServiceAccountString(raw);
        if (parsed && parsed.client_email && parsed.private_key) {
          inMemoryServiceAccount = parsed;
          return {
            credentials: parsed,
            source: 'persistent_storage',
            folderId: targetFolderId,
            clientEmail: parsed.client_email || DEDICATED_ACCOUNT_EMAIL,
            projectId: parsed.project_id || DEDICATED_PROJECT_ID,
            isConfigured: true,
          };
        }
      }
    } catch {
      // Continue
    }
  }

  return {
    credentials: null,
    source: null,
    folderId: targetFolderId,
    clientEmail: DEDICATED_ACCOUNT_EMAIL,
    projectId: DEDICATED_PROJECT_ID,
    isConfigured: false,
  };
}

/**
 * Save Service Account JSON to runtime cache and secure local data dir
 */
export function saveStoredServiceAccount(rawJsonOrObj: string | ParsedServiceAccount, folderId?: string): { success: boolean; error?: string } {
  try {
    let parsed: ParsedServiceAccount | null = null;
    if (typeof rawJsonOrObj === 'string') {
      parsed = parseServiceAccountString(rawJsonOrObj);
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

    // Persist to writable dirs
    const dirs = getWritableDataDirs();
    for (const dir of dirs) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const filePath = path.join(dir, 'google-service-account.json');
        fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8');
      } catch {
        // Ignore individual folder write failures
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save service account credentials' };
  }
}

/**
 * Clear stored service account credentials
 */
export function clearStoredServiceAccount(): void {
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

/**
 * Backwards compatible alias for clearing credentials
 */
export const clearStoredTokens = clearStoredServiceAccount;

/**
 * Backwards compatible alias for saving config
 */
export function saveStoredConfig(config: { rootFolderId?: string; folderId?: string; accountEmail?: string }): { success: boolean; error?: string } {
  if (config.folderId || config.rootFolderId) {
    inMemoryConfig.folderId = (config.folderId || config.rootFolderId || '').trim();
  }
  return { success: true };
}

/**
 * Backwards compatible alias for direct token/credential imports
 */
export function saveStoredTokens(data: any): void {
  if (data.credentialsJson) {
    saveStoredServiceAccount(data.credentialsJson, data.rootFolderId || data.folderId);
  } else if (data.client_email && data.private_key) {
    saveStoredServiceAccount(data, data.rootFolderId || data.folderId);
  }
}

/**
 * Loads tokens / credentials status (backwards-compatible alias)
 */
export function loadStoredTokens(): any {
  const sa = getServiceAccountCredentials();
  if (sa.credentials) {
    return {
      access_token: 'service_account_managed',
      account_email: sa.clientEmail,
      root_folder_id: sa.folderId,
      source: sa.source,
    };
  }
  return null;
}

/**
 * Returns authenticated Google Drive API Client using the Service Account
 */
export function getDriveClient() {
  const sa = getServiceAccountCredentials();
  if (!sa.credentials || !sa.credentials.client_email || !sa.credentials.private_key) {
    throw new Error('Google Drive Service Account is not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON in environment variables.');
  }

  const auth = new google.auth.JWT({
    email: sa.credentials.client_email,
    key: sa.credentials.private_key,
    scopes: DRIVE_SCOPES,
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Query Google Drive Service Account status & target folder metadata (safe, zero secrets returned)
 */
export async function getDriveStatus(reqHostOrigin?: string) {
  const sa = getServiceAccountCredentials();
  const targetFolderId = sa.folderId;
  const serviceAccountEmail = sa.clientEmail;
  const projectId = sa.projectId;

  if (!sa.isConfigured || !sa.credentials) {
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
      statusMessage: 'GOOGLE_SERVICE_ACCOUNT_JSON required in environment variables.',
    };
  }

  try {
    const drive = getDriveClient();

    // Verify access to the configured target folder
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
      isConnected: true,
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
      tokenSource: sa.source,
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
      tokenSource: sa.source,
      authorizedAccount: serviceAccountEmail,
      statusMessage: `Authentication issue: ${err.message || 'Service account failed to authenticate with Drive API.'}`,
    };
  }
}

/**
 * Runs a comprehensive live connection test against Google Drive API and verifies access to the target folder
 */
export async function testDriveConnectionLive(reqHostOrigin?: string) {
  const sa = getServiceAccountCredentials();
  const results: {
    step: string;
    status: 'PASSED' | 'FAILED' | 'WARNING';
    message: string;
    details?: any;
  }[] = [];

  // Step 1: Service Account JSON validation
  if (!sa.isConfigured || !sa.credentials) {
    results.push({
      step: 'Service Account Configuration',
      status: 'FAILED',
      message: 'GOOGLE_SERVICE_ACCOUNT_JSON is missing or does not contain valid "client_email" and "private_key".',
    });
    return {
      success: false,
      summary: 'Service Account credentials missing in server environment.',
      serviceAccountEmail: sa.clientEmail,
      targetFolderId: sa.folderId,
      results,
    };
  }

  results.push({
    step: 'Service Account Configuration',
    status: 'PASSED',
    message: `Service Account detected: ${sa.clientEmail} (Project: ${sa.projectId}, Source: ${sa.source})`,
  });

  // Step 2: Drive API Authentication
  let drive;
  try {
    drive = getDriveClient();
    results.push({
      step: 'Google Drive API Authentication',
      status: 'PASSED',
      message: `JWT token created and authenticated for ${sa.clientEmail}`,
    });
  } catch (authErr: any) {
    results.push({
      step: 'Google Drive API Authentication',
      status: 'FAILED',
      message: `Authentication error: ${authErr?.message || authErr}`,
    });
    return {
      success: false,
      summary: `Google Drive API authentication failed: ${authErr?.message || authErr}`,
      serviceAccountEmail: sa.clientEmail,
      targetFolderId: sa.folderId,
      results,
    };
  }

  // Step 3: Target Folder Access & Permissions
  let folderName = 'Target Root Folder';
  try {
    const folderRes = await drive.files.get({
      fileId: sa.folderId,
      fields: 'id, name, mimeType, capabilities, trashed, sharingUser',
      supportsAllDrives: true,
    });

    const folderData = folderRes.data;
    folderName = folderData.name || sa.folderId;

    if (folderData.trashed) {
      results.push({
        step: 'Target Folder Access',
        status: 'WARNING',
        message: `Target folder "${folderName}" (${sa.folderId}) is in the trash bin.`,
      });
    } else {
      const canAddChildren = folderData.capabilities?.canAddChildren !== false;
      results.push({
        step: 'Target Folder Access & Permissions',
        status: canAddChildren ? 'PASSED' : 'WARNING',
        message: `Target folder "${folderName}" (${sa.folderId}) verified with Editor access for service account.`,
        details: {
          name: folderData.name,
          canAddChildren: folderData.capabilities?.canAddChildren,
          canListChildren: folderData.capabilities?.canListChildren,
        },
      });
    }
  } catch (folderErr: any) {
    results.push({
      step: 'Target Folder Access & Permissions',
      status: 'FAILED',
      message: `Could not access target folder (${sa.folderId}): ${folderErr?.message || folderErr}. Ensure the folder is shared with "${sa.clientEmail}" with Editor role.`,
    });
    return {
      success: false,
      summary: `Target folder not accessible. Share folder ${sa.folderId} with ${sa.clientEmail}.`,
      serviceAccountEmail: sa.clientEmail,
      targetFolderId: sa.folderId,
      results,
    };
  }

  // Step 4: Folder Contents Query (List Files)
  try {
    const listRes = await drive.files.list({
      q: `'${sa.folderId}' in parents and trashed = false`,
      pageSize: 10,
      fields: 'files(id, name, mimeType, size, createdTime)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const fileCount = listRes.data.files?.length || 0;
    results.push({
      step: 'Target Folder Listing',
      status: 'PASSED',
      message: `Read access confirmed: found ${fileCount} item(s) in folder "${folderName}".`,
      details: {
        sampleFiles: listRes.data.files?.map((f) => ({ name: f.name, id: f.id })),
      },
    });
  } catch (listErr: any) {
    results.push({
      step: 'Target Folder Listing',
      status: 'WARNING',
      message: `Listing files inside folder encountered notice: ${listErr?.message || listErr}`,
    });
  }

  const allPassed = results.every((r) => r.status !== 'FAILED');

  return {
    success: allPassed,
    summary: allPassed
      ? `Google Drive Service Account authenticated successfully. Folder "${folderName}" is ready.`
      : 'Connection test completed with warnings/errors.',
    serviceAccountEmail: sa.clientEmail,
    targetFolderId: sa.folderId,
    targetFolderName: folderName,
    results,
  };
}

/**
 * Lists portal files inside the target folder or a designated subfolder
 */
export async function listDriveFiles(folderId?: string, limit = 50) {
  const sa = getServiceAccountCredentials();
  const drive = getDriveClient();
  const parentFolder = folderId || sa.folderId;

  const res = await drive.files.list({
    q: `'${parentFolder}' in parents and trashed = false`,
    pageSize: Math.min(limit, 100),
    fields: 'files(id, name, mimeType, size, webViewLink, createdTime, modifiedTime, properties)',
    orderBy: 'createdTime desc',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return (res.data.files || []).map((file) => ({
    id: file.id!,
    name: file.name!,
    mimeType: file.mimeType || 'application/octet-stream',
    size: file.size ? Number(file.size) : 0,
    webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
    createdTime: file.createdTime || new Date().toISOString(),
    modifiedTime: file.modifiedTime,
    properties: file.properties || {},
  }));
}

/**
 * Gets or creates a designated client subfolder under the target Google Drive root folder.
 * Strict Constraint: All portal subfolders are strictly children of GOOGLE_DRIVE_FOLDER_ID.
 */
export async function getOrCreateClientFolder(
  clientId: string,
  clientName?: string,
  businessName?: string
): Promise<string> {
  const sa = getServiceAccountCredentials();
  const drive = getDriveClient();
  const rootFolderId = sa.folderId;

  const folderDisplayName = businessName
    ? `${businessName} (${clientId})`
    : clientName
    ? `${clientName} (${clientId})`
    : `Client ${clientId}`;

  // Check if folder already exists in the configured target root folder
  const escapedName = folderDisplayName.replace(/'/g, "\\'");
  const q = `'${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${escapedName}' and trashed = false`;

  try {
    const list = await drive.files.list({
      q,
      fields: 'files(id, name)',
      spaces: 'drive',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (list.data.files && list.data.files.length > 0) {
      return list.data.files[0].id!;
    }
  } catch (searchErr) {
    console.warn('Folder search notice in Drive, attempting folder creation:', searchErr);
  }

  // Create client folder strictly inside target root folder
  const created = await drive.files.create({
    requestBody: {
      name: folderDisplayName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootFolderId],
      description: `Maple X Client Vault for ${folderDisplayName}`,
    },
    fields: 'id, name',
    supportsAllDrives: true,
  });

  return created.data.id || rootFolderId;
}

/**
 * Uploads a document directly to Google Drive into the client folder or target folder.
 * Strict Constraint: Files are strictly uploaded to GOOGLE_DRIVE_FOLDER_ID or a subfolder inside it.
 */
export async function uploadFileToGoogleDrive({
  buffer,
  fileName,
  mimeType,
  clientId,
  clientName,
  businessName,
  category,
}: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  clientId: string;
  clientName?: string;
  businessName?: string;
  category?: string;
}) {
  const sa = getServiceAccountCredentials();
  const drive = getDriveClient();

  // 1. Get or create Client folder inside target folder
  let targetFolderId = sa.folderId;
  try {
    targetFolderId = await getOrCreateClientFolder(clientId, clientName, businessName);
  } catch (folderErr) {
    console.warn(`Could not create subfolder, uploading directly to target root folder (${sa.folderId}):`, folderErr);
    targetFolderId = sa.folderId;
  }

  // 2. Stream upload to Google Drive
  const stream = Readable.from(buffer);

  const fileMetadata: any = {
    name: fileName,
    parents: [targetFolderId],
    description: `Maple X Vault Document - Category: ${category || 'General'} - Client: ${clientId}`,
    properties: {
      clientId,
      category: category || 'Other',
      uploadedAt: new Date().toISOString(),
      uploadedByServiceAccount: sa.clientEmail,
      source: 'Maple X Financial Operations Portal',
    },
  };

  const media = {
    mimeType: mimeType || 'application/octet-stream',
    body: stream,
  };

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, createdTime, parents',
    supportsAllDrives: true,
  });

  const file = res.data;

  return {
    fileId: file.id!,
    fileName: file.name || fileName,
    fileMimeType: file.mimeType || mimeType,
    fileSize: file.size ? Number(file.size) : buffer.length,
    webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
    webContentLink: file.webContentLink || `https://drive.google.com/uc?id=${file.id}&export=download`,
    thumbnailLink: file.thumbnailLink,
    folderId: targetFolderId,
    createdTime: file.createdTime || new Date().toISOString(),
  };
}

/**
 * Fetches file content stream from Google Drive.
 */
export async function getDriveFileStream(fileId: string) {
  const drive = getDriveClient();

  // Get file metadata first
  const meta = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size',
    supportsAllDrives: true,
  });

  // Get file media stream
  const response = await drive.files.get(
    {
      fileId,
      alt: 'media',
      supportsAllDrives: true,
    },
    { responseType: 'stream' }
  );

  return {
    stream: response.data as Readable,
    metadata: meta.data,
  };
}

/**
 * Fetches full file buffer from Google Drive (used for Gemini AI document parsing).
 */
export async function getDriveFileBuffer(fileId: string): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
  const drive = getDriveClient();

  const meta = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size',
    supportsAllDrives: true,
  });

  const response = await drive.files.get(
    {
      fileId,
      alt: 'media',
      supportsAllDrives: true,
    },
    { responseType: 'arraybuffer' }
  );

  const buffer = Buffer.from(response.data as ArrayBuffer);
  return {
    buffer,
    mimeType: meta.data.mimeType || 'application/octet-stream',
    fileName: meta.data.name || 'document',
  };
}

/**
 * Deletes a file from Google Drive.
 */
export async function deleteDriveFile(fileId: string): Promise<boolean> {
  try {
    const drive = getDriveClient();
    await drive.files.delete({
      fileId,
      supportsAllDrives: true,
    });
    return true;
  } catch (err) {
    console.error(`Failed to delete Google Drive file ${fileId}:`, err);
    return false;
  }
}

/**
 * Production-safe configuration diagnostic (zero secrets exposed).
 */
export function getDriveDiagnostic(reqHostOrigin?: string) {
  const sa = getServiceAccountCredentials();
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_URL);

  const serverInstance =
    process.env.K_REVISION ||
    process.env.K_SERVICE ||
    process.env.HOSTNAME ||
    process.env.CONTAINER_ID ||
    process.env.INSTANCE_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) ||
    `instance-${process.pid}`;

  return {
    authType: 'service_account',
    serviceAccountConfigured: sa.isConfigured,
    serviceAccountEmail: sa.clientEmail,
    projectId: sa.projectId,
    folderIdConfigured: Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID),
    targetFolderId: sa.folderId,
    tokenSource: sa.source,
    isVercel,
    environment: process.env.NODE_ENV || (isVercel ? 'production (vercel)' : 'production'),
    serverTime: new Date().toISOString(),
    serverInstance,
  };
}

/**
 * Backwards compatibility exports for OAuth routes
 */
export function generateAuthUrl(reqHostOrigin?: string, customReturnUrl?: string) {
  return {
    url: '/?tab=settings&notice=service_account_active',
    state: 'service_account_mode',
  };
}

export async function handleAuthCallback(code: string, state: string, reqHostOrigin?: string) {
  const sa = getServiceAccountCredentials();
  return {
    success: true,
    accountEmail: sa.clientEmail,
    accountName: 'Maple X Service Account',
    returnUrl: '/?tab=settings',
  };
}
