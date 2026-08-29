import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getDriveStatus,
  getDriveDiagnostic,
  saveStoredServiceAccount,
  clearStoredServiceAccount,
  testDriveConnectionLive,
  listDriveFiles,
  getDriveFileStream,
  getDriveFileBuffer,
  getRequestOrigin,
  DEFAULT_ROOT_FOLDER_ID,
  DEDICATED_ACCOUNT_EMAIL,
  DEDICATED_PROJECT_ID,
} from '../lib/googleDriveService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const url = req.url || '';
  const method = req.method || 'GET';
  const origin = getRequestOrigin(req);

  try {
    // 1. Diagnostics / Health check
    if (url.includes('/diagnostic') || url.includes('/health') || req.query.action === 'diagnostic') {
      const diagnostic = await getDriveDiagnostic(origin);
      return res.status(200).json(diagnostic);
    }

    // 2. Test Connection (Live 4-step audit)
    if (url.includes('/test-connection') || req.query.action === 'test-connection') {
      const result = await testDriveConnectionLive(origin);
      return res.status(200).json(result);
    }

    // 3. Status
    if (url.includes('/status') || req.query.action === 'status') {
      const status = await getDriveStatus(origin);
      return res.status(200).json(status);
    }

    // 4. Config (GET or POST)
    if (url.includes('/config') || req.query.action === 'config') {
      if (method === 'POST') {
        const { serviceAccountJson, folderId } = req.body || {};
        if (serviceAccountJson) {
          const saveResult = saveStoredServiceAccount(serviceAccountJson, folderId);
          if (!saveResult.success) {
            return res.status(400).json(saveResult);
          }
        }
        const diagnostic = await getDriveDiagnostic(origin);
        return res.status(200).json({
          success: true,
          message: 'Google Drive configuration saved successfully.',
          diagnostic,
        });
      }
      const diagnostic = await getDriveDiagnostic(origin);
      return res.status(200).json({
        success: true,
        folderId: diagnostic.folderId || DEFAULT_ROOT_FOLDER_ID,
        folderName: diagnostic.folderName || 'MAPLE X FINANCIAL PORTAL',
        serviceAccountEmail: diagnostic.serviceAccountEmail || DEDICATED_ACCOUNT_EMAIL,
        projectId: diagnostic.projectId || DEDICATED_PROJECT_ID,
        authenticated: diagnostic.authenticated || false,
        folderAccessible: diagnostic.folderAccessible || false,
      });
    }

    // 5. Set Credentials / Tokens
    if (url.includes('/set-credentials') || url.includes('/set-tokens') || req.query.action === 'set-credentials') {
      const { serviceAccountJson, json, credentials, folderId } = req.body || {};
      const payload = serviceAccountJson || json || credentials;
      if (!payload) {
        return res.status(400).json({ success: false, error: 'Service account JSON string or object is required.' });
      }
      const saveResult = saveStoredServiceAccount(payload, folderId);
      if (!saveResult.success) {
        return res.status(400).json(saveResult);
      }
      const testResult = await testDriveConnectionLive(origin);
      return res.status(200).json({
        success: testResult.success,
        message: testResult.success
          ? 'Credentials stored and verified successfully.'
          : 'Credentials stored but Google Drive connection test failed.',
        testResult,
      });
    }

    // 6. Disconnect
    if (url.includes('/disconnect') || req.query.action === 'disconnect') {
      clearStoredServiceAccount();
      return res.status(200).json({
        success: true,
        message: 'Google Drive runtime credentials cleared.',
      });
    }

    // 7. List Files
    if (url.includes('/files') || req.query.action === 'files') {
      const folderId = (req.query.folderId as string) || undefined;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 50;
      const result = await listDriveFiles(folderId, pageSize);
      return res.status(200).json(result);
    }

    // 8. View File
    if (url.includes('/view') || req.query.action === 'view') {
      const fileIdMatch = url.match(/\/file\/([^/?#]+)\/view/) || [null, req.query.fileId as string];
      const fileId = fileIdMatch[1];
      if (!fileId) {
        return res.status(400).json({ success: false, error: 'File ID is required' });
      }
      const fileData = await getDriveFileBuffer(fileId);
      if (!fileData) {
        return res.status(404).json({ success: false, error: 'File not found on Google Drive' });
      }
      res.setHeader('Content-Type', fileData.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${fileData.name}"`);
      return res.status(200).send(fileData.buffer);
    }

    // 9. Download File
    if (url.includes('/download') || req.query.action === 'download') {
      const fileIdMatch = url.match(/\/file\/([^/?#]+)\/download/) || [null, req.query.fileId as string];
      const fileId = fileIdMatch[1];
      if (!fileId) {
        return res.status(400).json({ success: false, error: 'File ID is required' });
      }
      const fileData = await getDriveFileBuffer(fileId);
      if (!fileData) {
        return res.status(404).json({ success: false, error: 'File not found on Google Drive' });
      }
      res.setHeader('Content-Type', fileData.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileData.name}"`);
      return res.status(200).send(fileData.buffer);
    }

    // Default: Return Google Drive diagnostic
    const diagnostic = await getDriveDiagnostic(origin);
    return res.status(200).json(diagnostic);
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      error: err?.message || 'Drive endpoint failure',
      authenticated: false,
      folderAccessible: false,
    });
  }
}
