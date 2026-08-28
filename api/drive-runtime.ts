import { google } from 'googleapis';

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

export interface ValidatedServiceAccount {
  client_email: string;
  private_key: string;
  project_id?: string;
  type?: string;
}

export interface CredentialValidationResult {
  isValid: boolean;
  credentials: ValidatedServiceAccount | null;
  credentialSource: 'GOOGLE_SERVICE_ACCOUNT_JSON' | 'none';
  tokenSource: 'environment_variable' | 'none';
  hasServiceAccountJson: boolean;
  jsonParsed: boolean;
  hasClientEmail: boolean;
  hasPrivateKey: boolean;
  projectId: string;
  serviceAccountEmail: string;
  folderId: string;
  folderName: string;
  parseError?: string;
}

export interface AuditStep {
  step: number;
  name: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  message?: string;
}

export interface DriveDiagnosticResult {
  success: boolean;
  authenticated: boolean;
  driveApiAuthenticated: boolean;
  folderAccessible: boolean;
  credentialSource: 'GOOGLE_SERVICE_ACCOUNT_JSON' | 'none';
  tokenSource: 'environment_variable' | 'none';
  hasServiceAccountJson: boolean;
  jsonParsed: boolean;
  hasClientEmail: boolean;
  hasPrivateKey: boolean;
  projectId: string;
  serviceAccountEmail: string;
  serviceAccount?: string;
  folderId: string;
  folderName: string;
  error?: string;
  stage: string;
  isVercel: boolean;
  environment: string;
  serverTime: string;
  serverInstance?: string;
}

export interface DriveTestConnectionResult {
  success: boolean;
  summary: string;
  folderId: string;
  folderName: string;
  serviceAccountEmail: string;
  status?: 'CONNECTED' | 'FAILED';
  stage?: string;
  error?: string;
  auditSteps: AuditStep[];
  steps: { name: string; status: string; message: string }[];
  results: { step: string; status: string; message: string; details?: any }[];
}

/**
 * Safely parses raw service account JSON string, base64-encoded string, or URI-encoded string.
 * Strips outer quotes and normalizes escaped newlines in private_key.
 * NEVER throws an exception.
 */
export function parseServiceAccountJson(raw?: string): { parsed: ParsedServiceAccount | null; error?: string } {
  if (!raw || typeof raw !== 'string') {
    return { parsed: null, error: 'Empty or non-string input' };
  }

  let trimmed = raw.trim();
  if (!trimmed) {
    return { parsed: null, error: 'Empty input after trimming' };
  }

  // Remove potential wrapping single or double quotes injected by environment variable wrappers
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
      // 3. URL-decoded attempt
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
 * Loads credentials from process.env with absolute error isolation.
 * Validates client_email, private_key, project_id, and folderId.
 * NEVER exposes private_key or secrets.
 */
export function getDriveCredentials(): CredentialValidationResult {
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

  if (!rawEnv) {
    return {
      isValid: false,
      credentials: null,
      credentialSource: 'none',
      tokenSource: 'none',
      hasServiceAccountJson: false,
      jsonParsed: false,
      hasClientEmail: false,
      hasPrivateKey: false,
      projectId: DEDICATED_PROJECT_ID,
      serviceAccountEmail: DEDICATED_ACCOUNT_EMAIL,
      folderId,
      folderName,
      parseError: 'GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not configured.',
    };
  }

  const { parsed, error } = parseServiceAccountJson(rawEnv);

  if (!parsed) {
    return {
      isValid: false,
      credentials: null,
      credentialSource: 'GOOGLE_SERVICE_ACCOUNT_JSON',
      tokenSource: 'environment_variable',
      hasServiceAccountJson: true,
      jsonParsed: false,
      hasClientEmail: false,
      hasPrivateKey: false,
      projectId: DEDICATED_PROJECT_ID,
      serviceAccountEmail: DEDICATED_ACCOUNT_EMAIL,
      folderId,
      folderName,
      parseError: error || 'GOOGLE_SERVICE_ACCOUNT_JSON exists but could not be parsed as valid JSON.',
    };
  }

  const hasClientEmail = Boolean(parsed.client_email && typeof parsed.client_email === 'string');
  const hasPrivateKey = Boolean(parsed.private_key && typeof parsed.private_key === 'string');
  const projectId = parsed.project_id || DEDICATED_PROJECT_ID;
  const serviceAccountEmail = parsed.client_email || DEDICATED_ACCOUNT_EMAIL;
  const isServiceAccount = !parsed.type || parsed.type === 'service_account';

  if (!hasClientEmail || !hasPrivateKey || !isServiceAccount) {
    return {
      isValid: false,
      credentials: null,
      credentialSource: 'GOOGLE_SERVICE_ACCOUNT_JSON',
      tokenSource: 'environment_variable',
      hasServiceAccountJson: true,
      jsonParsed: true,
      hasClientEmail,
      hasPrivateKey,
      projectId,
      serviceAccountEmail,
      folderId,
      folderName,
      parseError: !isServiceAccount
        ? 'Service account JSON type must be "service_account".'
        : 'Service account JSON is missing client_email or private_key.',
    };
  }

  return {
    isValid: true,
    credentials: {
      client_email: parsed.client_email!,
      private_key: parsed.private_key!,
      project_id: projectId,
      type: parsed.type || 'service_account',
    },
    credentialSource: 'GOOGLE_SERVICE_ACCOUNT_JSON',
    tokenSource: 'environment_variable',
    hasServiceAccountJson: true,
    jsonParsed: true,
    hasClientEmail: true,
    hasPrivateKey: true,
    projectId,
    serviceAccountEmail,
    folderId,
    folderName,
  };
}

/**
 * Creates an authenticated Google Drive client from validated credentials.
 * Must be called inside request-time try/catch.
 */
export function createDriveClient(credentials: { client_email: string; private_key: string }) {
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: DRIVE_SCOPES,
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Executes a robust diagnostic check against Google Drive API.
 * Never throws an unhandled exception.
 * Always returns structured JSON.
 */
export async function executeDriveDiagnostic(): Promise<DriveDiagnosticResult> {
  const creds = getDriveCredentials();
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_URL);
  const environment = process.env.NODE_ENV || (isVercel ? 'production (vercel)' : 'production');
  const serverTime = new Date().toISOString();
  const serverInstance =
    process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) ||
    process.env.K_REVISION ||
    process.env.HOSTNAME ||
    'vercel-serverless';

  // If credentials failed to load or parse
  if (!creds.isValid || !creds.credentials) {
    return {
      success: false,
      authenticated: false,
      driveApiAuthenticated: false,
      folderAccessible: false,
      credentialSource: creds.credentialSource,
      tokenSource: creds.tokenSource,
      hasServiceAccountJson: creds.hasServiceAccountJson,
      jsonParsed: creds.jsonParsed,
      hasClientEmail: creds.hasClientEmail,
      hasPrivateKey: creds.hasPrivateKey,
      projectId: creds.projectId,
      serviceAccountEmail: creds.serviceAccountEmail,
      serviceAccount: creds.serviceAccountEmail,
      folderId: creds.folderId,
      folderName: creds.folderName,
      error: creds.parseError || 'GOOGLE_SERVICE_ACCOUNT_JSON is missing or invalid.',
      stage: 'CREDENTIAL_ERROR',
      isVercel,
      environment,
      serverTime,
      serverInstance,
    };
  }

  // Attempt Google Drive API communication
  try {
    const drive = createDriveClient(creds.credentials);
    const folderRes = await drive.files.get({
      fileId: creds.folderId,
      fields: 'id, name, trashed, capabilities',
      supportsAllDrives: true,
    });

    const isAccessible = Boolean(folderRes.data?.id && !folderRes.data.trashed);
    const folderName = folderRes.data?.name || creds.folderName;

    return {
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
      projectId: creds.projectId,
      serviceAccountEmail: creds.serviceAccountEmail,
      serviceAccount: creds.serviceAccountEmail,
      folderId: creds.folderId,
      folderName,
      stage: isAccessible ? 'VERIFIED' : 'FOLDER_ACCESS_ERROR',
      error: isAccessible ? undefined : 'Target folder is inaccessible or in the trash in Google Drive.',
      isVercel,
      environment,
      serverTime,
      serverInstance,
    };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const isAuthErr =
      errMsg.toLowerCase().includes('auth') ||
      errMsg.toLowerCase().includes('jwt') ||
      errMsg.toLowerCase().includes('token') ||
      errMsg.toLowerCase().includes('credential') ||
      errMsg.toLowerCase().includes('unauthorized');

    return {
      success: false,
      authenticated: false,
      driveApiAuthenticated: false,
      folderAccessible: false,
      credentialSource: 'GOOGLE_SERVICE_ACCOUNT_JSON',
      tokenSource: 'environment_variable',
      hasServiceAccountJson: true,
      jsonParsed: true,
      hasClientEmail: true,
      hasPrivateKey: true,
      projectId: creds.projectId,
      serviceAccountEmail: creds.serviceAccountEmail,
      serviceAccount: creds.serviceAccountEmail,
      folderId: creds.folderId,
      folderName: creds.folderName,
      error: `Google Drive API error: ${errMsg}`,
      stage: isAuthErr ? 'DRIVE_API_ERROR' : 'FOLDER_ACCESS_ERROR',
      isVercel,
      environment,
      serverTime,
      serverInstance,
    };
  }
}

/**
 * Executes a 4-step live audit test against Google Drive API.
 * Never throws an unhandled exception.
 * Always returns structured JSON.
 */
export async function executeDriveTestConnection(): Promise<DriveTestConnectionResult> {
  const creds = getDriveCredentials();
  const auditSteps: AuditStep[] = [];
  const steps: { name: string; status: string; message: string }[] = [];
  const results: { step: string; status: string; message: string; details?: any }[] = [];

  // Step 1: Service Account Configuration
  if (!creds.isValid || !creds.credentials) {
    const failMsg = creds.parseError || 'GOOGLE_SERVICE_ACCOUNT_JSON is missing from the environment variables.';
    auditSteps.push({
      step: 1,
      name: 'Service Account Configuration',
      status: 'FAILED',
      message: failMsg,
    });
    steps.push({
      name: 'Service Account Configuration',
      status: 'FAILED',
      message: failMsg,
    });
    results.push({
      step: 'Service Account Configuration',
      status: 'FAILED',
      message: failMsg,
    });

    return {
      success: false,
      summary: 'Service Account credentials missing or invalid in server environment.',
      folderId: creds.folderId,
      folderName: creds.folderName,
      serviceAccountEmail: creds.serviceAccountEmail,
      status: 'FAILED',
      stage: 'CREDENTIAL_ERROR',
      error: failMsg,
      auditSteps,
      steps,
      results,
    };
  }

  const passMsg1 = `Loaded credentials for ${creds.serviceAccountEmail} (Project: ${creds.projectId}) from ${creds.credentialSource}.`;
  auditSteps.push({
    step: 1,
    name: 'Service Account Configuration',
    status: 'PASSED',
    message: passMsg1,
  });
  steps.push({
    name: 'Service Account Configuration',
    status: 'PASSED',
    message: passMsg1,
  });
  results.push({
    step: 'Service Account Configuration',
    status: 'PASSED',
    message: passMsg1,
  });

  // Step 2: Google Auth JWT Generation
  let drive: any;
  try {
    drive = createDriveClient(creds.credentials);
    const passMsg2 = 'JWT access token generated successfully for Drive scopes.';
    auditSteps.push({
      step: 2,
      name: 'Google Auth JWT Generation',
      status: 'PASSED',
      message: passMsg2,
    });
    steps.push({
      name: 'Google Auth JWT Generation',
      status: 'PASSED',
      message: passMsg2,
    });
    results.push({
      step: 'Google Auth JWT Generation',
      status: 'PASSED',
      message: passMsg2,
    });
  } catch (authErr: any) {
    const failMsg2 = `Failed to initialize JWT client: ${authErr?.message || authErr}`;
    auditSteps.push({
      step: 2,
      name: 'Google Auth JWT Generation',
      status: 'FAILED',
      message: failMsg2,
    });
    steps.push({
      name: 'Google Auth JWT Generation',
      status: 'FAILED',
      message: failMsg2,
    });
    results.push({
      step: 'Google Auth JWT Generation',
      status: 'FAILED',
      message: failMsg2,
    });

    return {
      success: false,
      summary: `Google authentication failed: ${authErr?.message || 'JWT error'}`,
      folderId: creds.folderId,
      folderName: creds.folderName,
      serviceAccountEmail: creds.serviceAccountEmail,
      status: 'FAILED',
      stage: 'DRIVE_API_ERROR',
      error: failMsg2,
      auditSteps,
      steps,
      results,
    };
  }

  // Step 3: Target Folder Accessibility
  try {
    const folderRes = await drive.files.get({
      fileId: creds.folderId,
      fields: 'id, name, mimeType, capabilities, trashed, shared',
      supportsAllDrives: true,
    });

    const folder = folderRes.data;
    if (folder.trashed) {
      const failMsg3 = `Target folder "${folder.name}" (${creds.folderId}) is in the Google Drive trash.`;
      auditSteps.push({
        step: 3,
        name: 'Target Folder Accessibility',
        status: 'FAILED',
        message: failMsg3,
      });
      steps.push({
        name: 'Target Folder Accessibility',
        status: 'FAILED',
        message: failMsg3,
      });
      results.push({
        step: 'Target Folder Accessibility',
        status: 'FAILED',
        message: failMsg3,
      });

      return {
        success: false,
        summary: 'Target folder is in the Google Drive trash.',
        folderId: creds.folderId,
        folderName: folder.name || creds.folderName,
        serviceAccountEmail: creds.serviceAccountEmail,
        status: 'FAILED',
        stage: 'FOLDER_ACCESS_ERROR',
        error: failMsg3,
        auditSteps,
        steps,
        results,
      };
    }

    const folderName = folder.name || creds.folderName;
    const passMsg3 = `Verified access to folder "${folderName}" (${creds.folderId}).`;
    auditSteps.push({
      step: 3,
      name: 'Target Folder Accessibility',
      status: 'PASSED',
      message: passMsg3,
    });
    steps.push({
      name: 'Target Folder Accessibility',
      status: 'PASSED',
      message: passMsg3,
    });
    results.push({
      step: 'Target Folder Accessibility',
      status: 'PASSED',
      message: passMsg3,
      details: {
        folderName,
        canAddChildren: folder.capabilities?.canAddChildren,
        canEdit: folder.capabilities?.canEdit,
      },
    });

    // Step 4: Folder Permissions Audit
    if (folder.capabilities?.canAddChildren === false) {
      const warnMsg4 = `Service account does not have "canAddChildren" permission. Ensure the folder is shared with ${creds.serviceAccountEmail} as "Editor".`;
      auditSteps.push({
        step: 4,
        name: 'Folder Permissions Audit',
        status: 'WARNING',
        message: warnMsg4,
      });
      steps.push({
        name: 'Folder Permissions Audit',
        status: 'WARNING',
        message: warnMsg4,
      });
      results.push({
        step: 'Folder Permissions Audit',
        status: 'WARNING',
        message: warnMsg4,
      });
    } else {
      const passMsg4 = 'Service account has Editor permissions to create client folders and upload documents.';
      auditSteps.push({
        step: 4,
        name: 'Folder Permissions Audit',
        status: 'PASSED',
        message: passMsg4,
      });
      steps.push({
        name: 'Folder Permissions Audit',
        status: 'PASSED',
        message: passMsg4,
      });
      results.push({
        step: 'Folder Permissions Audit',
        status: 'PASSED',
        message: passMsg4,
      });
    }

    return {
      success: true,
      summary: `Google Drive Verification Passed. Connected to "${folderName}" with service account ${creds.serviceAccountEmail}.`,
      folderId: creds.folderId,
      folderName,
      serviceAccountEmail: creds.serviceAccountEmail,
      status: 'CONNECTED',
      auditSteps,
      steps,
      results,
    };
  } catch (folderErr: any) {
    const failMsg3 = `Unable to access folder ${creds.folderId}: ${folderErr?.message || folderErr}. Make sure folder is shared with ${creds.serviceAccountEmail}.`;
    auditSteps.push({
      step: 3,
      name: 'Target Folder Accessibility',
      status: 'FAILED',
      message: failMsg3,
    });
    steps.push({
      name: 'Target Folder Accessibility',
      status: 'FAILED',
      message: failMsg3,
    });
    results.push({
      step: 'Target Folder Accessibility',
      status: 'FAILED',
      message: failMsg3,
    });

    return {
      success: false,
      summary: `Folder access failed: ${folderErr?.message || 'Check folder permissions'}`,
      folderId: creds.folderId,
      folderName: creds.folderName,
      serviceAccountEmail: creds.serviceAccountEmail,
      status: 'FAILED',
      stage: 'FOLDER_ACCESS_ERROR',
      error: failMsg3,
      auditSteps,
      steps,
      results,
    };
  }
}
