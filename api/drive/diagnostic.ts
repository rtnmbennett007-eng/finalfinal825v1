import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDriveDiagnostic, getRequestOrigin } from '../_server/googleDriveService';

/**
 * Dedicated Google Drive Diagnostic Endpoint
 * Statically imports GoogleDriveService so Vercel bundles it into the Lambda.
 * Always returns structured JSON with stage classification.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const hostOrigin = getRequestOrigin(req);
    const diag = await getDriveDiagnostic(hostOrigin);
    return res.status(200).json(diag);
  } catch (err: any) {
    console.error('[API Diagnostic Error]:', err);
    return res.status(200).json({
      success: false,
      authenticated: false,
      driveApiAuthenticated: false,
      folderAccessible: false,
      credentialSource: 'none',
      tokenSource: 'none',
      hasServiceAccountJson: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      jsonParsed: false,
      hasClientEmail: false,
      hasPrivateKey: false,
      projectId: 'abiding-orb-506721-j6',
      serviceAccountEmail: '',
      serviceAccount: '',
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm',
      folderName: 'MAPLE X FINANCIAL PORTAL',
      error: `Diagnostic module error: ${err?.message || err}`,
      stage: 'MODULE_ERROR',
      isVercel: true,
      environment: 'production',
      serverTime: new Date().toISOString(),
    });
  }
}
