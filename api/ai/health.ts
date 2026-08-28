import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Dedicated Vercel Serverless Function for AI Health Diagnostics
 * Returns status without executing billable generation requests or exposing secrets.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.trim());
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'production';

  if (isConfigured) {
    return res.status(200).json({
      success: true,
      environment: env,
      aiConfigured: true,
      provider: 'Google Gemini',
      primaryModel: 'gemini-3.6-flash',
      fallbackModel: 'gemini-3.1-pro-preview',
    });
  } else {
    return res.status(200).json({
      success: false,
      environment: env,
      aiConfigured: false,
      error: 'GEMINI_API_KEY is not configured in Production',
    });
  }
}
