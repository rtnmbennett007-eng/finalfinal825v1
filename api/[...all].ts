import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executeDriveDiagnostic, executeDriveTestConnection } from './drive-runtime';
import app from './_server/app';

/**
 * Single Authoritative Vercel API Catch-All Handler
 * Forwards other /api/* routes directly into the Express application.
 * Fast-paths dedicated endpoints safely with the standalone drive-runtime.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    let url = req.url || '/';

    // Extract path and query string safely
    const queryIndex = url.indexOf('?');
    const rawPath = queryIndex !== -1 ? url.substring(0, queryIndex) : url;
    const rawQuery = queryIndex !== -1 ? url.substring(queryIndex + 1) : '';

    let pathname = rawPath;

    // 1. If Vercel passed dynamic catch-all route params (req.query.all)
    if (req.query && req.query.all) {
      const allSegments = Array.isArray(req.query.all)
        ? req.query.all.join('/')
        : String(req.query.all);
      pathname = `/api/${allSegments.replace(/^\/+/, '')}`;
    }
    // 2. If pathname contains [...all] or [all], check headers for real matched path
    else if (pathname.includes('[...all]') || pathname.includes('[all]')) {
      const matchedPath = (req.headers['x-matched-path'] || req.headers['x-vercel-matched-path']) as string;
      if (matchedPath && !matchedPath.includes('[')) {
        pathname = matchedPath.startsWith('/api') ? matchedPath : `/api${matchedPath.startsWith('/') ? '' : '/'}${matchedPath}`;
      }
    }

    // 3. Ensure the path starts with /api
    if (!pathname.startsWith('/api')) {
      pathname = `/api${pathname.startsWith('/') ? '' : '/'}${pathname}`;
    }

    // Dedicated fast paths using bundle-safe runtime (prevents any catch-all failures)
    if (pathname === '/api/health' || pathname === '/health') {
      return res.status(200).json({
        ok: true,
        api: 'ok',
        environment: 'production',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    }

    if (pathname === '/api/health/drive' || pathname === '/health/drive') {
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
    }

    if (pathname === '/api/drive/diagnostic' || pathname === '/drive/diagnostic') {
      const diag = await executeDriveDiagnostic();
      return res.status(200).json(diag);
    }

    if (pathname === '/api/drive/test-connection' || pathname === '/drive/test-connection') {
      const result = await executeDriveTestConnection();
      return res.status(200).json(result);
    }

    // Clean up query string by removing Vercel internal 'all' parameter if present
    let finalQueryString = '';
    if (rawQuery) {
      const params = new URLSearchParams(rawQuery);
      params.delete('all');
      const filteredQuery = params.toString();
      if (filteredQuery) {
        finalQueryString = `?${filteredQuery}`;
      }
    }

    req.url = `${pathname}${finalQueryString}`;

    // Forward request to Express application
    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel API Catch-All Fatal Handler Error]:', err);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({
        success: false,
        error: err?.message || 'Internal Server Error in API catch-all gateway',
        timestamp: new Date().toISOString(),
      });
    }
  }
}


