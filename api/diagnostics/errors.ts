import type { VercelRequest, VercelResponse } from '@vercel/node';

// Safe in-memory error cache for serverless environment
let serverlessErrorCache: any[] = [];

/**
 * Sanitizes an error payload before saving to ensure NO secrets, keys, passwords, or tokens leak.
 */
function sanitizeErrorPayload(data: any): any {
  if (!data || typeof data !== 'object') return {};

  const safe: any = {
    id: data.id || `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: data.timestamp || new Date().toISOString(),
    module: String(data.module || 'Unknown Module').slice(0, 100),
    endpoint: String(data.endpoint || '/api/unknown').slice(0, 200),
    method: String(data.method || 'POST').toUpperCase().slice(0, 10),
    httpStatus: Number(data.httpStatus) || 500,
    stage: String(data.stage || 'UNKNOWN').slice(0, 50),
    errorCode: String(data.errorCode || 'UNSPECIFIED_ERROR').slice(0, 80),
    message: String(data.message || 'An unexpected production error occurred.').slice(0, 1000),
    requestId: String(data.requestId || `req-${Date.now()}`).slice(0, 100),
    severity: data.severity === 'WARNING' ? 'WARNING' : data.severity === 'INFO' ? 'INFO' : 'CRITICAL',
    environment: 'production',
    isResolved: Boolean(data.isResolved),
    retryCount: Number(data.retryCount) || 0,
  };

  // Optional contextual tags (safely sanitized)
  if (data.userId) safe.userId = String(data.userId).slice(0, 50);
  if (data.userName) safe.userName = String(data.userName).slice(0, 100);
  if (data.clientId) safe.clientId = String(data.clientId).slice(0, 50);
  if (data.clientName) safe.clientName = String(data.clientName).slice(0, 100);
  if (data.dealId) safe.dealId = String(data.dealId).slice(0, 50);
  if (data.documentId) safe.documentId = String(data.documentId).slice(0, 50);
  if (data.documentName) safe.documentName = String(data.documentName).slice(0, 150);
  if (data.fileName) safe.fileName = String(data.fileName).slice(0, 150);
  if (data.fileType) safe.fileType = String(data.fileType).slice(0, 50);
  if (data.fileSize) safe.fileSize = String(data.fileSize).slice(0, 50);
  if (data.aiModel) safe.aiModel = String(data.aiModel).slice(0, 50);
  if (data.resolvedBy) safe.resolvedBy = String(data.resolvedBy).slice(0, 100);
  if (data.resolvedAt) safe.resolvedAt = String(data.resolvedAt).slice(0, 50);
  if (data.resolutionNote) safe.resolutionNote = String(data.resolutionNote).slice(0, 500);

  if (Array.isArray(data.processingTrace)) {
    safe.processingTrace = data.processingTrace.slice(0, 20).map((s: any, idx: number) => ({
      stepNumber: Number(s.stepNumber) || idx + 1,
      name: String(s.name || '').slice(0, 100),
      status: s.status === 'FAIL' ? 'FAIL' : s.status === 'SKIPPED' ? 'SKIPPED' : 'PASS',
      timestamp: s.timestamp || new Date().toISOString(),
      durationMs: Number(s.durationMs) || 0,
      details: s.details ? String(s.details).slice(0, 200) : undefined,
      error: s.error ? { code: String(s.error.code || '').slice(0, 50), message: String(s.error.message || '').slice(0, 200) } : undefined,
    }));
  }

  return safe;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        count: serverlessErrorCache.length,
        errors: serverlessErrorCache.slice(0, 100),
      });
    }

    if (req.method === 'POST') {
      const payload = req.body || {};
      const sanitized = sanitizeErrorPayload(payload);
      
      // Keep most recent 200 errors
      serverlessErrorCache = [sanitized, ...serverlessErrorCache.filter((e) => e.id !== sanitized.id)].slice(0, 200);

      return res.status(200).json({
        success: true,
        error: sanitized,
        message: 'Error logged safely to production diagnostics.',
      });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const { id, isResolved, resolvedBy, resolutionNote } = req.body || {};
      if (!id) {
        return res.status(400).json({ success: false, error: 'Error ID is required' });
      }

      let found = false;
      serverlessErrorCache = serverlessErrorCache.map((err) => {
        if (err.id === id) {
          found = true;
          return {
            ...err,
            isResolved: isResolved !== undefined ? Boolean(isResolved) : true,
            resolvedBy: resolvedBy || err.resolvedBy || 'Authorized Staff',
            resolvedAt: new Date().toISOString(),
            resolutionNote: resolutionNote !== undefined ? String(resolutionNote) : err.resolutionNote,
          };
        }
        return err;
      });

      return res.status(200).json({
        success: true,
        updated: found,
        message: found ? 'Error marked as resolved.' : 'Error not found in memory buffer.',
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Error logging failure',
      message: err?.message || 'Failed to handle error log request',
    });
  }
}
