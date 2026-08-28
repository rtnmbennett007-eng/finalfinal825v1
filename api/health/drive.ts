import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDriveDiagnostic, getRequestOrigin } from '../_server/googleDriveService';

/**
 * Dedicated Google Drive Health Endpoint
 * Evaluates Drive diagnostic safely with fallback error isolation.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const hostOrigin = getRequestOrigin(req);
    const diagnostic = await getDriveDiagnostic(hostOrigin);
    return res.status(200).json({
      success: diagnostic.success || false,
      api: 'ok',
      environment: 'production',
      driveAuthenticated: diagnostic.authenticated || false,
      folderAccessible: diagnostic.folderAccessible || false,
      diagnostic,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (err: any) {
    console.error('[API Health Drive Error]:', err);
    return res.status(200).json({
      success: false,
      api: 'ok',
      environment: 'production',
      driveAuthenticated: false,
      folderAccessible: false,
      stage: 'MODULE_ERROR',
      error: err?.message || 'Drive health diagnostic evaluation failed',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  }
}
