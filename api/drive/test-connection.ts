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
 * Self-Contained Google Drive Live Test Connection Endpoint
 * ZERO local file imports — performs 4-step live audit.
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

  const auditSteps: { step: number; name: string; status: 'PASSED' | 'FAILED' | 'WARNING'; message?: string }[] = [];
  const steps: { name: string; status: string; message: string }[] = [];
  const results: { step: string; status: string; message: string; details?: any }[] = [];

  // Step 1: Service Account Configuration
  if (!rawEnv) {
    const failMsg = 'GOOGLE_SERVICE_ACCOUNT_JSON is missing from the environment variables.';
    auditSteps.push({ step: 1, name: 'Service Account Configuration', status: 'FAILED', message: failMsg });
    steps.push({ name: 'Service Account Configuration', status: 'FAILED', message: failMsg });
    results.push({ step: 'Service Account Configuration', status: 'FAILED', message: failMsg });

    return res.status(200).json({
      success: false,
      summary: 'Service Account credentials missing from environment variables.',
      folderId,
      folderName,
      serviceAccountEmail: DEDICATED_ACCOUNT_EMAIL,
      status: 'FAILED',
      stage: 'CREDENTIAL_ERROR',
      error: failMsg,
      auditSteps,
      steps,
      results,
    });
  }

  const { parsed, error: parseErr } = parseServiceAccountJson(rawEnv);
  if (!parsed || !parsed.client_email || !parsed.private_key) {
    const failMsg = parseErr || 'Service account JSON is invalid or missing client_email/private_key.';
    auditSteps.push({ step: 1, name: 'Service Account Configuration', status: 'FAILED', message: failMsg });
    steps.push({ name: 'Service Account Configuration', status: 'FAILED', message: failMsg });
    results.push({ step: 'Service Account Configuration', status: 'FAILED', message: failMsg });

    return res.status(200).json({
      success: false,
      summary: 'Service Account JSON invalid.',
      folderId,
      folderName,
      serviceAccountEmail: parsed?.client_email || DEDICATED_ACCOUNT_EMAIL,
      status: 'FAILED',
      stage: 'CREDENTIAL_ERROR',
      error: failMsg,
      auditSteps,
      steps,
      results,
    });
  }

  const passMsg1 = `Loaded credentials for ${parsed.client_email} (Project: ${parsed.project_id || DEDICATED_PROJECT_ID}).`;
  auditSteps.push({ step: 1, name: 'Service Account Configuration', status: 'PASSED', message: passMsg1 });
  steps.push({ name: 'Service Account Configuration', status: 'PASSED', message: passMsg1 });
  results.push({ step: 'Service Account Configuration', status: 'PASSED', message: passMsg1 });

  // Step 2: Google Auth JWT Generation
  let drive: any;
  try {
    const auth = new google.auth.JWT({
      email: parsed.client_email,
      key: parsed.private_key,
      scopes: DRIVE_SCOPES,
    });
    drive = google.drive({ version: 'v3', auth });

    const passMsg2 = 'JWT client created and scopes configured successfully.';
    auditSteps.push({ step: 2, name: 'Google Auth JWT Generation', status: 'PASSED', message: passMsg2 });
    steps.push({ name: 'Google Auth JWT Generation', status: 'PASSED', message: passMsg2 });
    results.push({ step: 'Google Auth JWT Generation', status: 'PASSED', message: passMsg2 });
  } catch (authErr: any) {
    const failMsg2 = `Failed to generate JWT: ${authErr?.message || authErr}`;
    auditSteps.push({ step: 2, name: 'Google Auth JWT Generation', status: 'FAILED', message: failMsg2 });
    steps.push({ name: 'Google Auth JWT Generation', status: 'FAILED', message: failMsg2 });
    results.push({ step: 'Google Auth JWT Generation', status: 'FAILED', message: failMsg2 });

    return res.status(200).json({
      success: false,
      summary: `Google authentication failed: ${authErr?.message || 'JWT error'}`,
      folderId,
      folderName,
      serviceAccountEmail: parsed.client_email,
      status: 'FAILED',
      stage: 'DRIVE_API_ERROR',
      error: failMsg2,
      auditSteps,
      steps,
      results,
    });
  }

  // Step 3: Target Folder Accessibility
  try {
    const folderRes = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, mimeType, capabilities, trashed, shared',
      supportsAllDrives: true,
    });

    const folder = folderRes.data;
    if (folder.trashed) {
      const failMsg3 = `Target folder "${folder.name}" (${folderId}) is in the Google Drive trash.`;
      auditSteps.push({ step: 3, name: 'Target Folder Accessibility', status: 'FAILED', message: failMsg3 });
      steps.push({ name: 'Target Folder Accessibility', status: 'FAILED', message: failMsg3 });
      results.push({ step: 'Target Folder Accessibility', status: 'FAILED', message: failMsg3 });

      return res.status(200).json({
        success: false,
        summary: 'Target folder is in the Google Drive trash.',
        folderId,
        folderName: folder.name || folderName,
        serviceAccountEmail: parsed.client_email,
        status: 'FAILED',
        stage: 'FOLDER_ACCESS_ERROR',
        error: failMsg3,
        auditSteps,
        steps,
        results,
      });
    }

    const resolvedFolderName = folder.name || folderName;
    const passMsg3 = `Verified access to folder "${resolvedFolderName}" (${folderId}).`;
    auditSteps.push({ step: 3, name: 'Target Folder Accessibility', status: 'PASSED', message: passMsg3 });
    steps.push({ name: 'Target Folder Accessibility', status: 'PASSED', message: passMsg3 });
    results.push({
      step: 'Target Folder Accessibility',
      status: 'PASSED',
      message: passMsg3,
      details: {
        folderName: resolvedFolderName,
        canAddChildren: folder.capabilities?.canAddChildren,
        canEdit: folder.capabilities?.canEdit,
      },
    });

    // Step 4: Folder Permissions Audit
    if (folder.capabilities?.canAddChildren === false) {
      const warnMsg4 = `Service account does not have "canAddChildren" permission. Ensure the folder is shared with ${parsed.client_email} as "Editor".`;
      auditSteps.push({ step: 4, name: 'Folder Permissions Audit', status: 'WARNING', message: warnMsg4 });
      steps.push({ name: 'Folder Permissions Audit', status: 'WARNING', message: warnMsg4 });
      results.push({ step: 'Folder Permissions Audit', status: 'WARNING', message: warnMsg4 });
    } else {
      const passMsg4 = 'Service account has Editor permissions to create deal folders and upload documents.';
      auditSteps.push({ step: 4, name: 'Folder Permissions Audit', status: 'PASSED', message: passMsg4 });
      steps.push({ name: 'Folder Permissions Audit', status: 'PASSED', message: passMsg4 });
      results.push({ step: 'Folder Permissions Audit', status: 'PASSED', message: passMsg4 });
    }

    return res.status(200).json({
      success: true,
      summary: `Google Drive Verification Passed. Connected to "${resolvedFolderName}" with service account ${parsed.client_email}.`,
      folderId,
      folderName: resolvedFolderName,
      serviceAccountEmail: parsed.client_email,
      status: 'CONNECTED',
      auditSteps,
      steps,
      results,
    });
  } catch (folderErr: any) {
    const failMsg3 = `Unable to access folder ${folderId}: ${folderErr?.message || folderErr}. Make sure folder is shared with ${parsed.client_email}.`;
    auditSteps.push({ step: 3, name: 'Target Folder Accessibility', status: 'FAILED', message: failMsg3 });
    steps.push({ name: 'Target Folder Accessibility', status: 'FAILED', message: failMsg3 });
    results.push({ step: 'Target Folder Accessibility', status: 'FAILED', message: failMsg3 });

    return res.status(200).json({
      success: false,
      summary: `Folder access failed: ${folderErr?.message || 'Check folder permissions'}`,
      folderId,
      folderName,
      serviceAccountEmail: parsed.client_email,
      status: 'FAILED',
      stage: 'FOLDER_ACCESS_ERROR',
      error: failMsg3,
      auditSteps,
      steps,
      results,
    });
  }
}
