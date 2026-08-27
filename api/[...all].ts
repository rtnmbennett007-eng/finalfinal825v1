import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/app';

/**
 * Single Authoritative Vercel API Catch-All Handler
 * Forwards every /api/* route directly into the Express application (server/app.ts).
 * Preserves GET, POST, PUT, PATCH, DELETE, query parameters, request bodies, multipart uploads, and headers.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
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

    // 3. Ensure the path starts with /api so Express routes match correctly
    if (!pathname.startsWith('/api')) {
      pathname = `/api${pathname.startsWith('/') ? '' : '/'}${pathname}`;
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

