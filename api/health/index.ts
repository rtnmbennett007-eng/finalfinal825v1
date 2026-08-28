import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Pure Isolated Vercel Health Check Directory Handler
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  return res.status(200).json({
    ok: true,
    api: 'ok',
    environment: 'production',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
