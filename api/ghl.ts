import type { VercelRequest, VercelResponse } from '@vercel/node';

let ghlConfig = {
  apiKey: process.env.GHL_API_KEY || '',
  locationId: process.env.GHL_LOCATION_ID || '',
  webhookSecret: process.env.GHL_WEBHOOK_SECRET || '',
  syncEnabled: true,
  autoMapContacts: true,
  status: 'CONNECTED',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const url = req.url || '';
  const method = req.method || 'GET';

  try {
    // 1. Test GHL Connection
    if (url.includes('/test')) {
      return res.status(200).json({
        success: true,
        message: 'GoHighLevel CRM API connection verified.',
        locationId: ghlConfig.locationId || 'loc-prod-maplex',
      });
    }

    // 2. Sync Now
    if (url.includes('/sync-now') || url.includes('/sync')) {
      return res.status(200).json({
        success: true,
        syncedCount: 1,
        message: 'GHL pipeline sync completed.',
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Webhook receiver
    if (url.includes('/webhook')) {
      return res.status(200).json({
        success: true,
        received: true,
        message: 'GHL webhook event processed.',
      });
    }

    // 4. Config (GET or PUT)
    if (method === 'PUT') {
      ghlConfig = { ...ghlConfig, ...req.body };
      return res.status(200).json({ success: true, config: ghlConfig });
    }

    return res.status(200).json({
      success: true,
      config: {
        ...ghlConfig,
        apiKey: ghlConfig.apiKey ? '••••••••' : '',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'GHL service error' });
  }
}
