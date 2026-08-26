import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { Readable } from 'stream';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const TOKEN_FILE_PATH = path.join(DATA_DIR, 'google-drive-tokens.json');
const CONFIG_FILE_PATH = path.join(DATA_DIR, 'google-drive-config.json');

// Default target root folder specified by Maple X Financial
export const DEFAULT_ROOT_FOLDER_ID = '1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm';
export const DEDICATED_ACCOUNT_EMAIL = 'maplexfinancialadmin@gmail.com';
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

interface StoredTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  scope?: string;
  token_type?: string;
  expiry_date?: number | null;
  account_email?: string;
  account_name?: string;
  connected_at?: string;
  root_folder_id?: string;
}

interface StoredConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  rootFolderId?: string;
  accountEmail?: string;
}

// In-memory CSRF state cache with 15-minute TTL
const oauthStates = new Map<string, { createdAt: number; redirectUrl?: string }>();

// Cleanup stale states every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, meta] of oauthStates.entries()) {
    if (now - meta.createdAt > 15 * 60 * 1000) {
      oauthStates.delete(state);
    }
  }
}, 10 * 60 * 1000);

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadStoredTokens(): StoredTokens | null {
  try {
    ensureDataDir();
    if (fs.existsSync(TOKEN_FILE_PATH)) {
      const raw = fs.readFileSync(TOKEN_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading Google Drive token storage:', err);
  }
  return null;
}

export function saveStoredTokens(tokens: StoredTokens): void {
  try {
    ensureDataDir();
    const existing = loadStoredTokens() || {};
    const merged = {
      ...existing,
      ...tokens,
      // If new tokens don't include refresh token (common on renewal), preserve existing
      refresh_token: tokens.refresh_token || existing.refresh_token,
    };
    fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting Google Drive tokens:', err);
  }
}

export function clearStoredTokens(): void {
  try {
    ensureDataDir();
    if (fs.existsSync(TOKEN_FILE_PATH)) {
      fs.unlinkSync(TOKEN_FILE_PATH);
    }
  } catch (err) {
    console.error('Error removing Google Drive tokens:', err);
  }
}

export function loadStoredConfig(): StoredConfig {
  try {
    ensureDataDir();
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading Google Drive config:', err);
  }
  return {};
}

export function saveStoredConfig(config: Partial<StoredConfig>): { success: boolean; error?: string } {
  try {
    ensureDataDir();
    const existing = loadStoredConfig();
    const merged: StoredConfig = { ...existing };
    if (config.clientId !== undefined && config.clientId.trim() !== '') {
      merged.clientId = config.clientId.trim();
    }
    if (config.clientSecret !== undefined && config.clientSecret.trim() !== '') {
      merged.clientSecret = config.clientSecret.trim();
    }
    if (config.redirectUri !== undefined && config.redirectUri.trim() !== '') {
      merged.redirectUri = config.redirectUri.trim();
    }
    if (config.rootFolderId !== undefined && config.rootFolderId.trim() !== '') {
      merged.rootFolderId = config.rootFolderId.trim();
    }
    if (config.accountEmail !== undefined && config.accountEmail.trim() !== '') {
      merged.accountEmail = config.accountEmail.trim();
    }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
    return { success: true };
  } catch (err: any) {
    const errMsg = err?.message || 'Unknown write error';
    console.error('Error saving Google Drive config:', errMsg);
    return { success: false, error: `configuration_storage_error: ${errMsg}` };
  }
}

export function getEffectiveCredentials(reqHostOrigin?: string) {
  const storedConfig = loadStoredConfig();
  const clientId = (process.env.GOOGLE_DRIVE_CLIENT_ID || storedConfig.clientId || '').trim();
  const clientSecret = (process.env.GOOGLE_DRIVE_CLIENT_SECRET || storedConfig.clientSecret || '').trim();
  const rootFolderId = (process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || storedConfig.rootFolderId || DEFAULT_ROOT_FOLDER_ID).trim();
  const accountEmail = (process.env.GOOGLE_DRIVE_ACCOUNT_EMAIL || storedConfig.accountEmail || DEDICATED_ACCOUNT_EMAIL).trim();

  // Compute dynamic or configured redirect URI
  let redirectUri = (process.env.GOOGLE_DRIVE_REDIRECT_URI || storedConfig.redirectUri || '').trim();
  if (!redirectUri && reqHostOrigin) {
    redirectUri = `${reqHostOrigin.replace(/\/$/, '')}/api/auth/google/callback`;
  } else if (!redirectUri) {
    redirectUri = 'https://portal.maplexfinancial.com/api/auth/google/callback';
  }

  const clientIdConfigured = Boolean(clientId && clientId.length > 3);
  const clientSecretConfigured = Boolean(clientSecret && clientSecret.length > 3);
  const redirectUriConfigured = Boolean(redirectUri && redirectUri.length > 5);
  const rootFolderConfigured = Boolean(rootFolderId && rootFolderId.length > 5);
  const accountEmailConfigured = Boolean(accountEmail && accountEmail.includes('@'));

  return {
    clientId,
    clientSecret,
    redirectUri,
    rootFolderId,
    accountEmail,
    hasClientSecret: clientSecretConfigured,
    clientIdConfigured,
    clientSecretConfigured,
    redirectUriConfigured,
    rootFolderConfigured,
    accountEmailConfigured,
    isConfigured: Boolean(clientIdConfigured && clientSecretConfigured),
  };
}

export function getOAuth2Client(redirectUriOverride?: string) {
  const creds = getEffectiveCredentials();
  const redirectUri = redirectUriOverride || creds.redirectUri;

  const oauth2Client = new google.auth.OAuth2(
    creds.clientId,
    creds.clientSecret,
    redirectUri
  );

  const tokens = loadStoredTokens();
  if (tokens) {
    oauth2Client.setCredentials({
      access_token: tokens.access_token || undefined,
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date || undefined,
      token_type: tokens.token_type || 'Bearer',
      scope: tokens.scope || DRIVE_SCOPE,
    });

    // Auto-save refreshed tokens when Google updates them
    oauth2Client.on('tokens', (newTokens) => {
      saveStoredTokens({
        ...tokens,
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || tokens.refresh_token,
        expiry_date: newTokens.expiry_date,
        token_type: newTokens.token_type || 'Bearer',
        scope: newTokens.scope || tokens.scope,
      });
    });
  }

  return oauth2Client;
}

/**
 * Generates an authorization URL with CSRF protection and offline refresh token request.
 */
export function generateAuthUrl(reqHostOrigin?: string, customReturnUrl?: string): { url: string; state: string } {
  const creds = getEffectiveCredentials(reqHostOrigin);
  if (!creds.clientId || !creds.clientSecret) {
    throw new Error('Google Drive OAuth credentials (Client ID and Client Secret) are not yet configured on the server.');
  }

  const oauth2Client = getOAuth2Client(creds.redirectUri);
  const state = crypto.randomBytes(24).toString('hex');

  oauthStates.set(state, {
    createdAt: Date.now(),
    redirectUrl: customReturnUrl,
  });

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Forces refresh token issuance
    scope: [
      DRIVE_SCOPE,
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    state,
    include_granted_scopes: true,
  });

  return { url, state };
}

/**
 * Validates CSRF state and exchanges the authorization code for tokens.
 */
export async function handleAuthCallback(code: string, state: string, reqHostOrigin?: string) {
  if (!state || !oauthStates.has(state)) {
    throw new Error('Invalid or expired OAuth state token (CSRF verification failed).');
  }

  const stateMeta = oauthStates.get(state);
  oauthStates.delete(state);

  const creds = getEffectiveCredentials(reqHostOrigin);
  const oauth2Client = getOAuth2Client(creds.redirectUri);

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Fetch authenticated user profile details
  let accountEmail = DEDICATED_ACCOUNT_EMAIL;
  let accountName = 'Maple X Administrator';

  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    if (userInfo.data.email) {
      accountEmail = userInfo.data.email;
    }
    if (userInfo.data.name) {
      accountName = userInfo.data.name;
    }
  } catch (userErr) {
    console.warn('Could not query userinfo endpoint after Drive OAuth:', userErr);
  }

  saveStoredTokens({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope || DRIVE_SCOPE,
    token_type: tokens.token_type || 'Bearer',
    expiry_date: tokens.expiry_date,
    account_email: accountEmail,
    account_name: accountName,
    connected_at: new Date().toISOString(),
    root_folder_id: creds.rootFolderId,
  });

  return {
    success: true,
    accountEmail,
    accountName,
    returnUrl: stateMeta?.redirectUrl,
  };
}

/**
 * Checks Google Drive connection status and verifies access to the target root folder.
 */
export async function getDriveStatus(reqHostOrigin?: string) {
  const creds = getEffectiveCredentials(reqHostOrigin);
  const tokens = loadStoredTokens();

  const isConnected = Boolean(tokens && (tokens.access_token || tokens.refresh_token));

  if (!isConnected) {
    return {
      isConfigured: creds.isConfigured,
      isConnected: false,
      clientIdConfigured: creds.clientIdConfigured,
      clientSecretConfigured: creds.clientSecretConfigured,
      redirectUriConfigured: creds.redirectUriConfigured,
      rootFolderConfigured: creds.rootFolderConfigured,
      accountEmailConfigured: creds.accountEmailConfigured,
      hasClientSecret: creds.clientSecretConfigured,
      authorizedAccount: tokens?.account_email || creds.accountEmail,
      dedicatedAccountEmail: creds.accountEmail,
      rootFolderId: creds.rootFolderId,
      redirectUri: creds.redirectUri,
      statusMessage: creds.isConfigured
        ? 'OAuth credentials configured. Ready to authorize / connect.'
        : 'Google Drive OAuth credentials required.',
    };
  }

  try {
    const oauth2Client = getOAuth2Client(creds.redirectUri);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // 1. Verify user profile & storage quota
    const about = await drive.about.get({
      fields: 'user, storageQuota',
    });

    const userEmail = about.data.user?.emailAddress || tokens?.account_email || creds.accountEmail;
    const userName = about.data.user?.displayName || tokens?.account_name;
    const usedBytes = Number(about.data.storageQuota?.usage || 0);
    const totalBytes = Number(about.data.storageQuota?.limit || 0);

    // 2. Verify root folder access
    let rootFolderName = 'Maple X Client Document Vault';
    try {
      const folder = await drive.files.get({
        fileId: creds.rootFolderId,
        fields: 'id, name, mimeType',
        supportsAllDrives: true,
      });
      if (folder.data.name) {
        rootFolderName = folder.data.name;
      }
    } catch (folderErr: any) {
      console.warn(`Note on root folder (${creds.rootFolderId}):`, folderErr.message || folderErr);
    }

    return {
      isConfigured: creds.isConfigured,
      isConnected: true,
      clientIdConfigured: creds.clientIdConfigured,
      clientSecretConfigured: creds.clientSecretConfigured,
      redirectUriConfigured: creds.redirectUriConfigured,
      rootFolderConfigured: creds.rootFolderConfigured,
      accountEmailConfigured: creds.accountEmailConfigured,
      hasClientSecret: creds.clientSecretConfigured,
      authorizedAccount: userEmail,
      accountName: userName,
      dedicatedAccountEmail: creds.accountEmail,
      rootFolderId: creds.rootFolderId,
      rootFolderName,
      redirectUri: creds.redirectUri,
      lastConnectedAt: tokens?.connected_at || new Date().toISOString(),
      tokenExpiresAt: tokens?.expiry_date ? new Date(tokens.expiry_date).toISOString() : undefined,
      storageUsage: {
        usedBytes,
        totalBytes,
      },
      statusMessage: `Active & Connected to ${userEmail}`,
    };
  } catch (err: any) {
    return {
      isConfigured: creds.isConfigured,
      isConnected: false,
      clientIdConfigured: creds.clientIdConfigured,
      clientSecretConfigured: creds.clientSecretConfigured,
      redirectUriConfigured: creds.redirectUriConfigured,
      rootFolderConfigured: creds.rootFolderConfigured,
      accountEmailConfigured: creds.accountEmailConfigured,
      hasClientSecret: creds.clientSecretConfigured,
      authorizedAccount: tokens?.account_email || creds.accountEmail,
      dedicatedAccountEmail: creds.accountEmail,
      rootFolderId: creds.rootFolderId,
      redirectUri: creds.redirectUri,
      statusMessage: `Connection issue: ${err.message || 'Token refresh failed. Please re-authorize.'}`,
    };
  }
}

/**
 * Gets or creates a designated client folder under the Maple X root folder.
 */
export async function getOrCreateClientFolder(
  clientId: string,
  clientName?: string,
  businessName?: string
): Promise<string> {
  const creds = getEffectiveCredentials();
  const oauth2Client = getOAuth2Client();
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const rootFolderId = creds.rootFolderId;
  const folderDisplayName = businessName
    ? `${businessName} (${clientId})`
    : clientName
    ? `${clientName} (${clientId})`
    : `Client ${clientId}`;

  // Check if folder already exists in the root folder
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
    console.warn('Folder search notice in Drive, will attempt creation:', searchErr);
  }

  // Create client folder
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
 * Uploads a document directly to Google Drive into the client folder.
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
  const creds = getEffectiveCredentials();
  const oauth2Client = getOAuth2Client();
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // 1. Get or create Client folder
  let targetFolderId = creds.rootFolderId;
  try {
    targetFolderId = await getOrCreateClientFolder(clientId, clientName, businessName);
  } catch (folderErr) {
    console.warn('Could not create subfolder, uploading to root folder:', folderErr);
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
  const oauth2Client = getOAuth2Client();
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

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
  const oauth2Client = getOAuth2Client();
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

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
    const oauth2Client = getOAuth2Client();
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
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
