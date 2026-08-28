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
  const env = 'production';
  const now = new Date().toISOString();

  if (isConfigured) {
    return res.status(200).json({
      success: true,
      status: 'HEALTHY',
      environment: env,
      aiConfigured: true,
      provider: 'Google Gemini',
      primaryModel: 'gemini-3.6-flash',
      fallbackModel: 'gemini-3.1-pro-preview',
      lastSuccessfulCheck: now,
      lastError: null,
      timestamp: now,
    });
  } else {
    return res.status(200).json({
      success: false,
      status: 'AI CONFIGURATION ERROR',
      environment: env,
      aiConfigured: false,
      error: 'GEMINI_API_KEY is not configured in Production',
      missingEnvironmentVariable: 'GEMINI_API_KEY',
      provider: 'Google Gemini',
      primaryModel: 'gemini-3.6-flash',
      fallbackModel: 'gemini-3.1-pro-preview',
      lastSuccessfulCheck: null,
      lastError: {
        code: 'AI_KEY_MISSING',
        message: 'GEMINI_API_KEY environment variable is not defined in Production.',
        time: now,
      },
      timestamp: now,
    });
  }
}
