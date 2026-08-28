import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executeDriveTestConnection } from '../drive-runtime';

/**
 * Dedicated Google Drive Live Test Connection Endpoint
 * Statically imports bundle-safe drive-runtime with zero filesystem dependencies.
 * Always returns HTTP 200 structured JSON.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const result = await executeDriveTestConnection();
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[API Test Connection Error]:', err);
    return res.status(200).json({
      success: false,
      status: 'FAILED',
      stage: 'MODULE_ERROR',
      summary: `Google Drive test connection threw an error: ${err?.message || 'Unknown error'}`,
      serviceAccountEmail: 'maple-x-portal-drive@abiding-orb-506721-j6.iam.gserviceaccount.com',
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm',
      folderName: 'MAPLE X FINANCIAL PORTAL',
      targetFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm',
      targetFolderName: 'MAPLE X FINANCIAL PORTAL',
      error: err?.message || 'Connection test failed',
      auditSteps: [
        {
          step: 1,
          name: 'Service Account Configuration',
          status: 'FAILED',
          message: err?.message || 'Execution error during test connection',
        },
      ],
      steps: [
        {
          name: 'Service Account Configuration',
          status: 'FAILED',
          message: err?.message || 'Execution error during test connection',
        },
      ],
      results: [
        {
          step: 'Execution Check',
          status: 'FAILED',
          message: err?.message || 'Execution error during test connection',
        },
      ],
    });
  }
}

