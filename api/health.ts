import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const url = req.url || '';

  // 1. Drive-specific health query if requested at /api/health/drive or ?type=drive
  if (url.includes('/drive') || req.query.type === 'drive') {
    try {
      const { getDriveDiagnostic, getRequestOrigin } = await import('../lib/googleDriveService');
      const origin = getRequestOrigin(req);
      const diagnostic = await getDriveDiagnostic(origin);
      return res.status(200).json({
        success: diagnostic.success || false,
        api: 'ok',
        environment: 'production',
        driveAuthenticated: diagnostic.authenticated || false,
        folderAccessible: diagnostic.folderAccessible || false,
        folderId: diagnostic.folderId,
        folderName: diagnostic.folderName,
        diagnostic,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        api: 'ok',
        environment: 'production',
        driveAuthenticated: false,
        folderAccessible: false,
        error: err?.message || 'Google Drive connection error',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    }
  }

  // 2. Fast completely standalone health endpoint (never fails, zero heavy dependencies)
  return res.status(200).json({
    ok: true,
    api: 'ok',
    success: true,
    environment: 'production',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}

