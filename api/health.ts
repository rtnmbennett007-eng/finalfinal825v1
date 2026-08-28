import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Pure Isolated Vercel Health Check
 * Zero external imports or database dependencies.
 * Guarantees HTTP 200 JSON in any serverless container.
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
