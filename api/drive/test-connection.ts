import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Dedicated Google Drive Live Test Connection Endpoint
 * Always returns structured JSON.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const { testDriveConnectionLive, getRequestOrigin } = await import('../_server/googleDriveService.ts');
    const hostOrigin = getRequestOrigin(req);
    const result = await testDriveConnectionLive(hostOrigin);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      summary: `Google Drive test connection threw an error: ${err?.message || 'Unknown error'}`,
      serviceAccountEmail: '',
      targetFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm',
      targetFolderName: 'MAPLE X FINANCIAL PORTAL',
      error: err?.message || 'Connection test failed',
      stage: 'TEST_CONNECTION',
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
