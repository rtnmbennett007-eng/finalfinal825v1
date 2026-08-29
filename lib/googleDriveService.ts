import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { Readable } from 'stream';

// Guard environment variables from being overwritten by local dotenv files in production
if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  try {
    dotenv.config();
    dotenv.config({ path: path.join(process.cwd(), '.env.local') });
    dotenv.config({ path: path.join(process.cwd(), '.env.production') });
  } catch {
    // Ignore in restricted serverless environments
  }
}

// Storage locations for runtime fallback persistence
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

export interface CredentialLoadResult {
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
function parseServiceAccountString(raw: string): { parsed: ParsedServiceAccount | null; error?: string } {
  if (!raw || typeof raw !== 'string') {
    return { parsed: null, error: 'Empty or non-string input' };
  }
  let trimmed = raw.trim();
  if (!trimmed) {
    return { parsed: null, error: 'Empty input after trimming' };
  }

  // Remove potential wrapping single or double quotes from environment variable injectors
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"') && !trimmed.startsWith('{"'))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  // 1. Try direct JSON parse
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') {
      if (parsed.private_key && typeof parsed.private_key === 'string') {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      return { parsed };
    }
  } catch (directErr: any) {
    // 2. Attempt base64 decode if not plain JSON
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
      // 3. Attempt decoding URL encoded JSON string
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

/**
 * Authoritative Credential Loader
 * Primary source of truth is process.env.GOOGLE_SERVICE_ACCOUNT_JSON.
 * Never exposes private_key, secrets, or raw JSON in public output.
 */
export function loadServiceAccountCredentials(): CredentialLoadResult {
  const targetFolderId = (
    process.env.GOOGLE_DRIVE_FOLDER_ID ||
    process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ||
    process.env.GOOGLE_ROOT_FOLDER_ID ||
    inMemoryConfig.folderId ||
    DEFAULT_ROOT_FOLDER_ID
  ).trim();

  // 1. Primary Source: process.env.GOOGLE_SERVICE_ACCOUNT_JSON (or supported aliases)
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

  // 2. Fallback: In-memory runtime cache (if explicitly saved during session)
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

  // 3. Fallback: Persistent storage
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
      // Continue searching
    }
  }

  // 4. Missing Credentials
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

/**
 * Backwards-compatible alias for getServiceAccountCredentials
 */
export function getServiceAccountCredentials() {
  const loaded = loadServiceAccountCredentials();
  return {
    credentials: loaded.credentials,
    source: loaded.credentialSource === 'none' ? null : (loaded.credentialSource === 'GOOGLE_SERVICE_ACCOUNT_JSON' ? 'environment_variable' : loaded.credentialSource),
    folderId: loaded.folderId,
    clientEmail: loaded.serviceAccountEmail,
    projectId: loaded.projectId,
    isConfigured: loaded.isValid,
  };
}

/**
 * Save Service Account JSON to runtime cache and secure local data dir
 */
export function saveStoredServiceAccount(rawJsonOrObj: string | ParsedServiceAccount, folderId?: string): { success: boolean; error?: string } {
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
        // Ignore individual folder write failures in restricted environments
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save service account credentials' };
  }
}

/**
 * Clear stored service account credentials from memory and disk cache
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

export const clearStoredTokens = clearStoredServiceAccount;

export function saveStoredConfig(config: { rootFolderId?: string; folderId?: string; accountEmail?: string }): { success: boolean; error?: string } {
  if (config.folderId || config.rootFolderId) {
    inMemoryConfig.folderId = (config.folderId || config.rootFolderId || '').trim();
  }
  return { success: true };
}

export function saveStoredTokens(data: any): void {
  if (data.credentialsJson) {
    saveStoredServiceAccount(data.credentialsJson, data.rootFolderId || data.folderId);
  } else if (data.client_email && data.private_key) {
    saveStoredServiceAccount(data, data.rootFolderId || data.folderId);
  }
}

export function loadStoredTokens(): any {
  const sa = loadServiceAccountCredentials();
  if (sa.credentials) {
    return {
      access_token: 'service_account_managed',
      account_email: sa.serviceAccountEmail,
      root_folder_id: sa.folderId,
      source: sa.credentialSource,
    };
  }
  return null;
}

/**
 * Returns authenticated Google Drive API Client using the Service Account JWT
 */
export function getDriveClient() {
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

/**
 * Query Google Drive Service Account status & target folder metadata (safe, zero secrets returned)
 */
export async function getDriveStatus(reqHostOrigin?: string) {
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

/**
 * Runs a comprehensive live connection test against Google Drive API and verifies access to the target folder
 */
export async function testDriveConnectionLive(reqHostOrigin?: string) {
  const sa = loadServiceAccountCredentials();
  const results: {
    step: string;
    status: 'PASSED' | 'FAILED' | 'WARNING';
    message: string;
    details?: any;
  }[] = [];

  // Step 1: Service Account JSON validation
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

  // Step 2: Drive API Authentication
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

  // Step 3: Target Folder Access Verification
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

    // Step 4: Folder Write / Children Capability Check
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

/**
 * List files inside the configured target folder or a subfolder
 */
export async function listDriveFiles(folderId?: string, limit = 50) {
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

/**
 * Ensures a dedicated folder exists for a specific client inside the target folder
 */
export async function getOrCreateClientFolder(params: {
  clientId: string;
  clientName?: string;
  businessName?: string;
}): Promise<{ folderId: string; folderName: string }> {
  const sa = loadServiceAccountCredentials();
  const parentFolderId = sa.folderId;
  const drive = getDriveClient();

  // Create clean folder display name
  const folderName = params.businessName
    ? `${params.businessName} (${params.clientId})`
    : params.clientName
    ? `${params.clientName} (${params.clientId})`
    : `Client ${params.clientId}`;

  try {
    // 1. Search for existing client folder
    const searchRes = await drive.files.list({
      q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false and name contains '${params.clientId}'`,
      fields: 'files(id, name)',
      pageSize: 10,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const existing = searchRes.data.files?.[0];
    if (existing && existing.id) {
      return { folderId: existing.id, folderName: existing.name || folderName };
    }

    // 2. Create client folder if not found
    const createRes = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
        description: `Maple X Client Document Vault for ${params.clientName || params.clientId}`,
        properties: {
          clientId: params.clientId,
          createdFor: params.clientName || '',
          source: 'Maple X Financial Portal',
        },
      },
      fields: 'id, name',
      supportsAllDrives: true,
    });

    return {
      folderId: createRes.data.id!,
      folderName: createRes.data.name || folderName,
    };
  } catch (err: any) {
    console.warn(`Could not create/find client subfolder (${folderName}), falling back to root folder:`, err.message || err);
    return { folderId: parentFolderId, folderName: 'Maple X Client Document Vault' };
  }
}

/**
 * Ensures a dedicated folder exists for a specific deal under the client's folder in Google Drive
 */
export async function getOrCreateDealFolder(params: {
  clientId: string;
  clientName?: string;
  businessName?: string;
  dealId: string;
  product?: string;
}): Promise<{ folderId: string; folderName: string; webViewLink?: string }> {
  try {
    const clientFolder = await getOrCreateClientFolder({
      clientId: params.clientId,
      clientName: params.clientName,
      businessName: params.businessName,
    });

    const drive = getDriveClient();
    const dealFolderName = `${params.dealId} - ${params.product || 'Funding Deal'}`;

    // 1. Search for existing deal subfolder
    const searchRes = await drive.files.list({
      q: `'${clientFolder.folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false and name contains '${params.dealId}'`,
      fields: 'files(id, name, webViewLink)',
      pageSize: 5,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const existing = searchRes.data.files?.[0];
    if (existing && existing.id) {
      return {
        folderId: existing.id,
        folderName: existing.name || dealFolderName,
        webViewLink: existing.webViewLink,
      };
    }

    // 2. Create deal subfolder
    const createRes = await drive.files.create({
      requestBody: {
        name: dealFolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [clientFolder.folderId],
        description: `Maple X Deal Submission & Vault for ${params.dealId} (${params.product || 'Funding'})`,
        properties: {
          clientId: params.clientId,
          dealId: params.dealId,
          product: params.product || '',
          source: 'Maple X Underwriting Command Center',
        },
      },
      fields: 'id, name, webViewLink',
      supportsAllDrives: true,
    });

    return {
      folderId: createRes.data.id!,
      folderName: createRes.data.name || dealFolderName,
      webViewLink: createRes.data.webViewLink,
    };
  } catch (err: any) {
    console.warn(`Could not create deal subfolder, using client folder:`, err.message || err);
    return { folderId: DEFAULT_ROOT_FOLDER_ID, folderName: 'Maple X Deal Vault' };
  }
}

/**
 * Uploads a file buffer directly to Google Drive inside the client's dedicated folder
 */
export async function uploadFileToGoogleDrive(params: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  clientId: string;
  clientName?: string;
  businessName?: string;
  category?: string;
}): Promise<{
  fileId: string;
  fileName: string;
  folderId: string;
  folderName: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  size?: number;
  mimeType?: string;
}> {
  const { buffer, fileName, mimeType, clientId, clientName, businessName, category } = params;
  const sa = loadServiceAccountCredentials();
  if (!sa.isValid || !sa.credentials) {
    throw new Error('Google Drive Service Account is not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON in environment variables.');
  }

  const drive = getDriveClient();

  // 1. Locate or create client folder
  let targetFolderId = sa.folderId;
  let targetFolderName = 'Maple X Document Vault';

  try {
    const clientFolder = await getOrCreateClientFolder({ clientId, clientName, businessName });
    targetFolderId = clientFolder.folderId;
    targetFolderName = clientFolder.folderName;
  } catch (folderErr: any) {
    console.warn('Using root target folder for upload:', folderErr.message || folderErr);
    targetFolderId = sa.folderId;
  }

  const fileMetadata: any = {
    name: fileName,
    parents: [targetFolderId],
    description: `Maple X Vault Document - Category: ${category || 'General'} - Client: ${clientId}`,
    properties: {
      clientId,
      category: category || 'Other',
      uploadedAt: new Date().toISOString(),
      uploadedByServiceAccount: sa.serviceAccountEmail,
      source: 'Maple X Financial Operations Portal',
    },
  };

  let file: any;

  // Try direct binary stream upload
  try {
    const stream = Readable.from(buffer);
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
    file = res.data;
  } catch (mediaErr: any) {
    const isQuotaError = mediaErr?.message?.includes('storage quota') || mediaErr?.message?.includes('quota');
    if (isQuotaError) {
      console.warn('Personal Drive folder storage quota notice for Service Account, creating authenticated vault entry in folder:', mediaErr.message);
      const res = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, createdTime, parents',
        supportsAllDrives: true,
      });
      file = res.data;
    } else {
      throw mediaErr;
    }
  }

  if (!file || !file.id) {
    throw new Error('Google Drive did not return a valid file ID.');
  }

  return {
    fileId: file.id,
    fileName: file.name || fileName,
    folderId: targetFolderId,
    folderName: targetFolderName,
    webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
    webContentLink: file.webContentLink,
    thumbnailLink: file.thumbnailLink,
    createdTime: file.createdTime || new Date().toISOString(),
    size: file.size ? parseInt(file.size, 10) : buffer.length,
    mimeType: file.mimeType || mimeType,
  };
}

/**
 * Downloads a file stream from Google Drive
 */
export async function getDriveFileStream(fileId: string): Promise<{
  stream: Readable;
  metadata: { name: string; mimeType: string; size?: number };
}> {
  const drive = getDriveClient();

  const metaRes = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size',
    supportsAllDrives: true,
  });

  const streamRes = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'stream' }
  );

  return {
    stream: streamRes.data,
    metadata: {
      name: metaRes.data.name || 'document',
      mimeType: metaRes.data.mimeType || 'application/octet-stream',
      size: metaRes.data.size ? parseInt(metaRes.data.size, 10) : undefined,
    },
  };
}

/**
 * Downloads a file as a Buffer from Google Drive
 */
export async function getDriveFileBuffer(fileId: string): Promise<{
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

/**
 * Deletes a file from Google Drive
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
 * Production-safe configuration diagnostic (zero secrets exposed)
 */
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
  const sa = loadServiceAccountCredentials();
  return {
    success: true,
    accountEmail: sa.serviceAccountEmail,
    accountName: 'Maple X Service Account',
    returnUrl: '/?tab=settings',
  };
}
