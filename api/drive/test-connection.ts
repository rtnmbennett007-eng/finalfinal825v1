import type { VercelRequest, VercelResponse } from '@vercel/node';
import { testDriveConnectionLive, getRequestOrigin } from '../_server/googleDriveService';

/**
 * Dedicated Google Drive Live Test Connection Endpoint
 * Statically imports GoogleDriveService so Vercel bundles it into the Lambda.
 * Always returns structured JSON.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const hostOrigin = getRequestOrigin(req);
    const result = await testDriveConnectionLive(hostOrigin);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[API Test Connection Error]:', err);
    return res.status(200).json({
      success: false,
      status: 'FAILED',
      stage: 'MODULE_ERROR',
      summary: `Google Drive test connection threw an error: ${err?.message || 'Unknown error'}`,
      serviceAccountEmail: '',
      targetFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm',
      targetFolderName: 'MAPLE X FINANCIAL PORTAL',
      error: err?.message || 'Connection test failed',
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
