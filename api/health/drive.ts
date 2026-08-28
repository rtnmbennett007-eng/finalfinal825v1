import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executeDriveDiagnostic } from '../drive-runtime';

/**
 * Dedicated Google Drive Health Endpoint
 * Evaluates Drive diagnostic safely with fallback error isolation.
 * Always returns HTTP 200 JSON even if Drive authentication fails.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const diagnostic = await executeDriveDiagnostic();
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

