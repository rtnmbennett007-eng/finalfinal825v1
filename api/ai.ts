import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.trim().length > 0);

  return res.status(200).json({
    status: isConfigured ? 'healthy' : 'degraded',
    apiKeyConfigured: isConfigured,
    primaryModel: 'gemini-3.6-flash',
    fallbackModel: 'gemini-3.1-pro-preview',
    features: [
      'Document Classification',
      'Bank Statement Analysis',
      'Business Loan Application Extraction',
      'Tax Return Verification',
      'Identity Document Parsing',
    ],
    timestamp: new Date().toISOString(),
  });
}
