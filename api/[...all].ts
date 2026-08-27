import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/app';

/**
 * Single Authoritative Vercel API Catch-All Handler
 * Forwards every /api/* route directly into the Express application (server/app.ts).
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  let url = req.url || '/';
  
  // Extract path and query string safely
  const queryIndex = url.indexOf('?');
  const queryString = queryIndex !== -1 ? url.substring(queryIndex) : '';
  let pathname = queryIndex !== -1 ? url.substring(0, queryIndex) : url;

  // 1. If Vercel passed dynamic catch-all route params (req.query.all)
  if (req.query && req.query.all) {
    const allSegments = Array.isArray(req.query.all)
      ? req.query.all.join('/')
      : String(req.query.all);
    pathname = `/api/${allSegments}`;
  } 
  // 2. If pathname contains [...all] or [all], check headers
  else if (pathname.includes('[...all]') || pathname.includes('[all]')) {
    const matchedPath = (req.headers['x-matched-path'] || req.headers['x-vercel-matched-path']) as string;
    if (matchedPath && !matchedPath.includes('[')) {
      pathname = matchedPath.startsWith('/api') ? matchedPath : `/api${matchedPath.startsWith('/') ? '' : '/'}${matchedPath}`;
    }
  }
  // 3. Ensure the path starts with /api so Express routes match correctly
  else if (!pathname.startsWith('/api')) {
    pathname = `/api${pathname.startsWith('/') ? '' : '/'}${pathname}`;
  }

  req.url = `${pathname}${queryString}`;
  return app(req, res);
}
