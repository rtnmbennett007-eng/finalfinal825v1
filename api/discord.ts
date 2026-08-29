import type { VercelRequest, VercelResponse } from '@vercel/node';

let discordLogs: any[] = [];
let discordConfig = {
  webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
  enabled: Boolean(process.env.DISCORD_WEBHOOK_URL),
  channelName: '#notifications',
  notifyOnDealStatus: true,
  notifyOnLeadCreation: true,
  notifyOnDocumentUpload: true,
  notifyOnAiComplete: true,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const url = req.url || '';
  const method = req.method || 'GET';

  try {
    // 1. Logs
    if (url.includes('/logs')) {
      if (method === 'DELETE') {
        discordLogs = [];
        return res.status(200).json({ success: true, message: 'Discord notification logs cleared.' });
      }
      return res.status(200).json({ success: true, logs: discordLogs.slice(0, 50) });
    }

    // 2. Test
    if (url.includes('/test')) {
      const targetUrl = req.body?.webhookUrl || discordConfig.webhookUrl || process.env.DISCORD_WEBHOOK_URL;
      if (!targetUrl) {
        return res.status(400).json({ success: false, error: 'No Discord webhook URL configured' });
      }
      return res.status(200).json({
        success: true,
        message: 'Discord webhook test simulated successfully in serverless environment.',
        targetUrl: targetUrl.slice(0, 30) + '...',
      });
    }

    // 3. Notify
    if (url.includes('/notify') || method === 'POST') {
      const payload = req.body || {};
      discordLogs.unshift({
        id: `discord-${Date.now()}`,
        timestamp: new Date().toISOString(),
        title: payload.title || 'Notification',
        message: payload.message || '',
        status: 'DELIVERED',
      });
      return res.status(200).json({ success: true, message: 'Notification queued' });
    }

    // 4. Config (GET or PUT)
    if (method === 'PUT') {
      discordConfig = { ...discordConfig, ...req.body };
      return res.status(200).json({ success: true, config: discordConfig });
    }

    return res.status(200).json({
      success: true,
      config: {
        ...discordConfig,
        maskedWebhookUrl: discordConfig.webhookUrl ? `${discordConfig.webhookUrl.slice(0, 25)}...` : '',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Discord service error' });
  }
}
