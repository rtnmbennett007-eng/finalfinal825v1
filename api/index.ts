import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from './_server/app.ts';

/**
 * Root /api handler for Vercel Serverless Function
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    let url = req.url || '/';
    if (!url.startsWith('/api')) {
      url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
    }
    req.url = url;
    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel API Root Handler Error]:', err);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({
        success: false,
        error: err?.message || 'Internal Server Error in API root gateway',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
