import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Dedicated Vercel Serverless Function for Applications AI Health Diagnostic
 * Returns status without executing expensive AI operations or exposing secrets.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const hasApiKey = Boolean(process.env.GEMINI_API_KEY);

  return res.status(200).json({
    success: true,
    endpoint: 'applications-extract',
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    aiConfigured: hasApiKey,
    primaryModel: 'gemini-3.6-flash',
    fallbackModel: 'gemini-3.1-pro-preview',
    timestamp: new Date().toISOString(),
  });
}
