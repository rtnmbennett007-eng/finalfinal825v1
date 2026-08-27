import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server';

export default function handler(req: VercelRequest, res: VercelResponse) {
  let url = req.url || '/';

  // 1. If Vercel passed dynamic catch-all route params (req.query.all)
  if (req.query && req.query.all) {
    const allSegments = Array.isArray(req.query.all)
      ? req.query.all.join('/')
      : String(req.query.all);
    const queryIndex = url.indexOf('?');
    const queryString = queryIndex !== -1 ? url.substring(queryIndex) : '';
    url = `/api/${allSegments}${queryString}`;
  } 
  // 2. If Vercel stripped the /api prefix
  else if (!url.startsWith('/api')) {
    url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
  }

  // 3. Fallback to matched path header if url still contains [...all]
  if (url.includes('[...all]') || url.includes('[all]')) {
    const matchedPath = (req.headers['x-matched-path'] || req.headers['x-vercel-matched-path']) as string;
    if (matchedPath && !matchedPath.includes('[')) {
      const queryIndex = url.indexOf('?');
      const queryString = queryIndex !== -1 ? url.substring(queryIndex) : '';
      url = `${matchedPath}${queryString}`;
    }
  }

  req.url = url;
  return app(req, res);
}
