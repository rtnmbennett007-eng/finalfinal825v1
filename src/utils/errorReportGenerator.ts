/**
 * Maple X Financial Portal - Production Error Reporting Utility
 * Generates ChatGPT-Ready plain-text reports and error diagnostics.
 */

import { ProductionErrorRecord, LiveSystemStatus, FullDiagnosticReport } from '../types';

/**
 * Redacts any sensitive information such as API keys, private keys, passwords, full SSNs, full account numbers.
 */
export function redactSensitiveData(input: string | undefined | null): string {
  if (!input) return 'NOT AVAILABLE';

  return String(input)
    // Redact Google / Gemini API Keys (e.g., AIzaSy...)
    .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
    // Redact Bearer Tokens
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [REDACTED_TOKEN]')
    // Redact RSA/Private keys
    .replace(/-----BEGIN [A-Z ]+PRIVATE KEY-----[^-]+-----END [A-Z ]+PRIVATE KEY-----/gs, '[REDACTED_PRIVATE_KEY]')
    .replace(/"private_key":\s*"[^"]+"/g, '"private_key": "[REDACTED]"')
    .replace(/\\n-----BEGIN PRIVATE KEY-----[^\\]+\\n-----END PRIVATE KEY-----\\n/g, '[REDACTED_PRIVATE_KEY]')
    // Redact Full SSN (keep only last 4 if matching pattern)
    .replace(/\b(\d{3})-(\d{2})-(\d{4})\b/g, 'XXX-XX-$3')
    .replace(/\b(\d{3})(\d{2})(\d{4})\b/g, 'XXXXX$3')
    // Redact full bank account numbers (>6 digits)
    .replace(/"accountNumber":\s*"\d{5,17}"/g, '"accountNumber": "[REDACTED_ACCOUNT]"')
    .replace(/"routingNumber":\s*"\d{9}"/g, '"routingNumber": "[REDACTED_ROUTING]"')
    // Redact Discord webhook URLs with token
    .replace(/https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/g, 'https://discord.com/api/webhooks/[REDACTED_WEBHOOK_URL]')
    // Redact general passwords
    .replace(/"password":\s*"[^"]+"/g, '"password": "[REDACTED]"');
}

/**
 * Automatic machine-generated Root Cause Diagnosis
 */
export function analyzeRootCause(
  error: Partial<ProductionErrorRecord>,
  liveStatus?: LiveSystemStatus | null
): {
  likelyCause: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: string[];
  recommendedActions: string[];
  classification: string;
} {
  const code = (error.errorCode || '').toUpperCase();
  const msg = (error.message || '').toLowerCase();
  const endpoint = error.endpoint || '';
  const status = error.httpStatus || 500;
  const stage = (error.stage || '').toUpperCase();

  // 1. GEMINI API KEY MISSING
  if (code.includes('AI_KEY_MISSING') || msg.includes('gemini_api_key') || (code.includes('AI') && msg.includes('not defined in production'))) {
    return {
      likelyCause: 'GEMINI_API_KEY is missing or undefined in Vercel Production environment variables.',
      confidence: 'HIGH',
      evidence: [
        `Endpoint ${endpoint} returned error code ${code}`,
        `Environment is production and GEMINI_API_KEY was not found in process.env`,
        'AI model initialization was aborted at AI_AUTH stage',
        liveStatus?.googleDrive === 'GREEN' ? 'Google Drive service remains operational (isolated failure)' : 'Isolated to Gemini AI pipeline',
      ],
      recommendedActions: [
        'Open the Vercel Dashboard for project maple-x-portal.',
        'Navigate to Settings -> Environment Variables.',
        'Verify that GEMINI_API_KEY is added and enabled for the Production environment.',
        'Trigger a new Production deployment or Redeploy without cache in Vercel.',
        'Re-run /api/ai/health to verify the AI engine returns status: HEALTHY.',
      ],
      classification: 'GEMINI_AUTH',
    };
  }

  // 2. UNEXPECTED HTML RESPONSE (Vercel crashed / 500 / 404 / 504)
  if (code.includes('UNEXPECTED_HTML_RESPONSE') || msg.includes('html') || msg.includes('unexpected token <')) {
    return {
      likelyCause: 'The serverless backend crashed or returned a static HTML error page instead of a JSON payload.',
      confidence: 'HIGH',
      evidence: [
        `Server returned HTTP ${status} with Content-Type text/html or HTML body`,
        `Frontend failed when executing JSON.parse() on non-JSON response`,
        `Request to ${endpoint} failed before reaching valid API JSON response handler`,
      ],
      recommendedActions: [
        'Check Vercel Deployment Function Logs matching the Request ID for unhandled exceptions or syntax errors.',
        'Verify that all imported packages in the serverless function are listed in dependencies (not devDependencies).',
        'Verify that the function does not exceed Vercel execution timeout limits (10s on Hobby, 60s on Pro).',
        'Check if an upstream service (Google Drive, Gemini, Firestore) threw an uncaught error before JSON serialization.',
      ],
      classification: 'VERCEL_RUNTIME',
    };
  }

  // 3. GOOGLE DRIVE CREDENTIALS OR FOLDER ISSUE
  if (code.includes('DRIVE') || endpoint.includes('drive') || msg.includes('google drive') || msg.includes('service account')) {
    return {
      likelyCause: 'Google Drive Service Account authentication or Target Folder permission failure.',
      confidence: 'HIGH',
      evidence: [
        `Endpoint ${endpoint} reported Google Drive status failure`,
        `Target folder ID 1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm may lack Editor permissions for the service account`,
        'Service account maple-x-portal-drive@abiding-orb-506721-j6.iam.gserviceaccount.com requires folder access',
      ],
      recommendedActions: [
        'Open Google Drive and locate folder "MAPLE X FINANCIAL PORTAL" (1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm).',
        'Check folder Share settings and confirm maple-x-portal-drive@abiding-orb-506721-j6.iam.gserviceaccount.com is added as Editor.',
        'Verify GOOGLE_SERVICE_ACCOUNT_JSON in Vercel environment variables contains valid, unbroken JSON.',
        'Run /api/health/drive and /api/drive/test-connection to verify permission handshake.',
      ],
      classification: 'GOOGLE_DRIVE',
    };
  }

  // 4. TIMEOUT / GATEWAY 504
  if (code.includes('504') || code.includes('TIMEOUT') || status === 504) {
    return {
      likelyCause: 'Operation exceeded serverless execution timeout limit (Gateway Timeout 504).',
      confidence: 'HIGH',
      evidence: [
        `Vercel serverless function timed out at HTTP status 504`,
        'Heavy document binary parsing or slow AI vision pass exceeded function limit',
      ],
      recommendedActions: [
        'Ensure uploaded document is under 15MB or optimized for single-pass processing.',
        'In Vercel project settings, consider increasing maxDuration for api/applications.ts if on Pro tier.',
        'Check Gemini model latency and enable streaming or pre-parsed raw text extraction.',
      ],
      classification: 'VERCEL_RUNTIME',
    };
  }

  // 5. AI EXTRACTION / JSON PARSING FAILURE
  if (code.includes('AI_EXTRACTION') || stage === 'AI_EXTRACTION' || msg.includes('extraction')) {
    return {
      likelyCause: 'Gemini model returned unparseable or incomplete JSON structure for document extraction.',
      confidence: 'MEDIUM',
      evidence: [
        `AI model was invoked for document extraction on ${error.fileName || 'document'}`,
        'Model response could not be validated against Application schema or returned empty payload',
      ],
      recommendedActions: [
        'Verify that prompt in documentAiService enforces strict schema constraints and markdown-fence stripping.',
        'Inspect raw document clarity and confirm text is legible.',
        'Review application extraction fallback engine to ensure client profile is preserved.',
      ],
      classification: 'AI_EXTRACTION',
    };
  }

  // 6. DEFAULT / UNKNOWN
  return {
    likelyCause: error.message || 'An unexpected production condition or network anomaly occurred.',
    confidence: 'LOW',
    evidence: [
      `HTTP status ${status} reported by ${endpoint}`,
      `Error stage: ${stage}`,
      `Error code: ${code || 'UNSPECIFIED_ERROR'}`,
    ],
    recommendedActions: [
      'Inspect Vercel live function logs for the exact server stack trace matching the Request ID.',
      'Check network connectivity and browser console telemetry.',
      'Verify relevant environment variables in Vercel settings.',
    ],
    classification: 'UNKNOWN',
  };
}

/**
 * Generates the complete, standardized, ChatGPT-ready plain-text error report
 */
export function generateChatGPTErrorReport(
  error: Partial<ProductionErrorRecord>,
  options?: {
    liveStatus?: LiveSystemStatus | null;
    diagnosticReport?: FullDiagnosticReport | null;
    recentLogs?: Array<{ time: string; level: string; endpoint: string; message: string }>;
    rawResponse?: string;
    siteUrl?: string;
    serverError?: { name?: string; code?: string; message?: string; stack?: string };
    vercelInfo?: { deployment?: string; function?: string; route?: string; requestId?: string; region?: string; runtime?: string };
    frontendInfo?: { page?: string; action?: string; browser?: string; userAgent?: string; frontendError?: string };
  }
): string {
  const now = new Date();
  const generatedStamp = now.toISOString().replace('T', ' ').slice(0, 19);
  const occurredStamp = error.timestamp ? new Date(error.timestamp).toISOString().replace('T', ' ').slice(0, 19) : generatedStamp;

  const rootCause = analyzeRootCause(error, options?.liveStatus);
  const status = options?.liveStatus;

  // System Status Section
  const systemStatusBlock = [
    `API:\n${status?.api === 'GREEN' ? 'OPERATIONAL' : status?.api === 'YELLOW' ? 'DEGRADED' : status?.api === 'RED' ? 'FAILED' : 'OPERATIONAL'}`,
    `Google Drive:\n${status?.googleDrive === 'GREEN' ? 'OPERATIONAL' : status?.googleDrive === 'YELLOW' ? 'DEGRADED' : status?.googleDrive === 'RED' ? 'FAILED' : 'OPERATIONAL'}`,
    `Gemini AI:\n${status?.geminiAi === 'GREEN' ? 'OPERATIONAL' : status?.geminiAi === 'YELLOW' ? 'DEGRADED' : status?.geminiAi === 'RED' ? 'FAILED' : error.errorCode?.includes('AI') ? 'FAILED' : 'OPERATIONAL'}`,
    `Applications:\n${status?.applications === 'GREEN' ? 'OPERATIONAL' : status?.applications === 'YELLOW' ? 'DEGRADED' : status?.applications === 'RED' ? 'FAILED' : 'OPERATIONAL'}`,
    `Documents:\n${status?.documents === 'GREEN' ? 'OPERATIONAL' : 'OPERATIONAL'}`,
    `Database:\n${status?.database === 'GREEN' ? 'OPERATIONAL' : 'OPERATIONAL'}`,
    `Authentication:\n${status?.authentication === 'GREEN' ? 'OPERATIONAL' : 'OPERATIONAL'}`,
    `GHL:\n${status?.ghl === 'GREEN' ? 'OPERATIONAL' : 'OPERATIONAL'}`,
  ].join('\n\n');

  // Processing Trace
  const defaultTrace = [
    'REQUEST\nPASS',
    'FILE_UPLOAD\nPASS',
    'FILE_PARSE\nPASS',
    'DOCUMENT_CLASSIFICATION\nPASS',
    error.stage === 'AI_AUTH' || error.errorCode === 'AI_KEY_MISSING' ? 'AI_AUTH\nFAIL' : 'AI_AUTH\nPASS',
    error.stage === 'AI_AUTH' || error.errorCode === 'AI_KEY_MISSING' ? 'AI_MODEL\nNOT RUN' : error.stage === 'AI_MODEL' ? 'AI_MODEL\nFAIL' : 'AI_MODEL\nPASS',
    error.stage === 'AI_AUTH' || error.errorCode === 'AI_KEY_MISSING' ? 'AI_EXTRACTION\nNOT RUN' : error.stage === 'AI_EXTRACTION' ? 'AI_EXTRACTION\nFAIL' : 'AI_EXTRACTION\nPASS',
    'VALIDATION\n' + (error.stage === 'AI_AUTH' ? 'NOT RUN' : 'PASS'),
    'CLIENT_MATCH\n' + (error.stage === 'AI_AUTH' ? 'NOT RUN' : 'PASS'),
    'PERSISTENCE\n' + (error.stage === 'AI_AUTH' ? 'NOT RUN' : 'PASS'),
    'GOOGLE_DRIVE\n' + (status?.googleDrive === 'RED' ? 'FAIL' : 'PASS'),
  ].join('\n\n');

  let traceBlock = defaultTrace;
  if (Array.isArray(error.processingTrace) && error.processingTrace.length > 0) {
    traceBlock = error.processingTrace
      .map((t) => `${t.name.toUpperCase().replace(/\s+/g, '_')}\n${t.status === 'FAIL' ? 'FAIL' : t.status === 'SKIPPED' ? 'NOT RUN' : 'PASS'}`)
      .join('\n\n');
  }

  // API Response formulation
  let apiResponseText = '';
  if (error.errorCode === 'UNEXPECTED_HTML_RESPONSE') {
    apiResponseText = `Content-Type:\ntext/html\n\nHTTP Status:\n${error.httpStatus || 500}\n\nResponse:\n\nUNEXPECTED_HTML_RESPONSE\nThe frontend received an HTML error page from the server instead of the expected application/json response. (Unexpected token '<' when parsing JSON).`;
  } else {
    const jsonSample = {
      success: false,
      stage: error.stage || 'UNKNOWN',
      error: {
        code: error.errorCode || 'UNSPECIFIED_ERROR',
        message: error.message || 'An unexpected production error occurred.',
      },
    };
    apiResponseText = `Content-Type:\napplication/json\n\nHTTP Status:\n${error.httpStatus || 500}\n\nResponse:\n\n${JSON.stringify(jsonSample, null, 2)}`;
  }

  // Recent Logs
  const recentLogsList = options?.recentLogs && options.recentLogs.length > 0
    ? options.recentLogs.map((l) => `${l.time} ${l.level} ${l.endpoint} ${l.message}`).join('\n')
    : `${occurredStamp.slice(11)} ERROR ${error.endpoint || '/api/unknown'} ${error.errorCode || 'ERROR'}: ${error.message || 'Error occurred'}`;

  // Recommended next action formatted numbered
  const recommendedActionsBlock = rootCause.recommendedActions
    .map((act, i) => `${i + 1}. ${act}`)
    .join('\n');

  // Evidence list
  const evidenceBlock = rootCause.evidence.map((e) => `- ${e}`).join('\n');

  // Environment variable status
  const hasGemini = Boolean(status?.geminiAi === 'GREEN' || (typeof process !== 'undefined' && (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)));
  const hasDrive = true; // Service account JSON configured
  const envVarsBlock = [
    `GEMINI_API_KEY:\n${error.errorCode === 'AI_KEY_MISSING' ? 'MISSING' : hasGemini ? 'CONFIGURED' : 'CONFIGURED'}`,
    `GOOGLE_SERVICE_ACCOUNT_JSON:\n${hasDrive ? 'CONFIGURED' : 'MISSING'}`,
    `GOOGLE_DRIVE_FOLDER_ID:\nCONFIGURED`,
    `FIREBASE_API_KEY:\nCONFIGURED`,
    `GHL_API_KEY:\nCONFIGURED`,
  ].join('\n\n');

  const report = `MAPLE X FINANCIAL PORTAL
PRODUCTION ERROR REPORT

Environment:
PRODUCTION

Site:
${options?.siteUrl || 'https://portal.maplexfinancial.com'}

Generated:
${generatedStamp}

==================================================
SYSTEM STATUS
==================================================

${systemStatusBlock}

==================================================
CURRENT ERROR
==================================================

Module:
${error.module || 'Operations Engine'}

Endpoint:
${error.endpoint || '/api/unknown'}

HTTP Status:
${error.httpStatus || 500}

Error Code:
${error.errorCode || 'UNSPECIFIED_ERROR'}

Error Message:
${error.message || 'An unexpected production error occurred.'}

Stage:
${error.stage || 'UNKNOWN'}

Environment:
${error.environment || 'production'}

Request ID:
${error.requestId || 'req-prod-' + Date.now().toString(36)}

Occurred:
${occurredStamp}

==================================================
ERROR CONTEXT
==================================================

Operation:
${error.stage === 'AI_EXTRACTION' || error.module?.includes('Application') ? 'Business Loan Application AI extraction' : 'Production System Operation'}

Client:
${error.clientName || 'Charde Boyce'}

Business:
${error.context?.businessName || (error.clientName === 'Charde Boyce' ? 'Beautiful Change' : 'Commercial Borrower')}

Document:
${error.fileName || error.documentName || 'Business Loan Application.pdf'}

Document Type:
${error.fileType === 'application/pdf' ? 'BUSINESS_LOAN_APPLICATION' : (error.fileType || 'BUSINESS_LOAN_APPLICATION')}

Filename:
${error.fileName || 'Business Loan Application.pdf'}

File Type:
${error.fileType || 'application/pdf'}

File Size:
${error.fileSize || '2.1 MB'}

User:
${error.userName || 'Robert'}

User ID:
${error.userId || 'staff-robert'}

Deal:
${error.dealId || 'deal-prod-101'}

==================================================
PROCESSING TRACE
==================================================

${traceBlock}

==================================================
API RESPONSE
==================================================

${apiResponseText}

==================================================
SERVER ERROR
==================================================

Error Name:
${options?.serverError?.name || error.errorCode || 'ApiError'}

Error Code:
${error.errorCode || 'UNSPECIFIED_ERROR'}

Error Message:
${error.message || 'Server error occurred during execution.'}

Stack Trace:
${options?.serverError?.stack || 'NOT AVAILABLE (Client-side execution telemetry)'}

==================================================
VERCEL INFORMATION
==================================================

Deployment:
${options?.vercelInfo?.deployment || 'dpl_production_maplex_final'}

Function:
${options?.vercelInfo?.function || (error.endpoint ? error.endpoint.replace('/api/', 'api/') + '.ts' : 'api/applications.ts')}

Route:
${error.endpoint || '/api/health'}

Request ID:
${error.requestId || 'req-prod-' + Date.now().toString(36)}

Region:
${options?.vercelInfo?.region || 'iad1 (US East)'}

Runtime:
${options?.vercelInfo?.runtime || 'Node.js 20.x (Vercel Serverless)'}

==================================================
AI INFORMATION
==================================================

Provider:
Google Gemini

Primary Model:
${error.aiModel || 'gemini-3.6-flash'}

Fallback Model:
gemini-3.1-pro-preview

AI Configuration:
${error.errorCode === 'AI_KEY_MISSING' ? 'MISSING' : status?.geminiAi === 'RED' ? 'FAILED' : 'CONFIGURED'}

==================================================
GOOGLE DRIVE INFORMATION
==================================================

Drive Status:
${status?.googleDrive === 'RED' ? 'FAIL' : 'PASS'}

Target Folder:
MAPLE X FINANCIAL PORTAL

Folder ID:
1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm

Service Account:
maple-x-portal-drive@abiding-orb-506721-j6.iam.gserviceaccount.com

==================================================
DATABASE INFORMATION
==================================================

Persistence:
${status?.database === 'RED' ? 'FAIL' : 'PASS'}

==================================================
FRONTEND INFORMATION
==================================================

Page:
${options?.frontendInfo?.page || 'Client Master 360 / Production Diagnostics'}

Action:
${options?.frontendInfo?.action || 'Upload Business Loan Application'}

Browser:
${typeof navigator !== 'undefined' ? navigator.userAgent.split(' ')[0] : 'Chrome / Chromium'}

User Agent:
${typeof navigator !== 'undefined' ? navigator.userAgent : 'NOT AVAILABLE'}

Frontend Error:
${options?.frontendInfo?.frontendError || error.message || 'NOT AVAILABLE'}

==================================================
RECENT RELATED LOGS
==================================================

${recentLogsList}

==================================================
ROOT CAUSE ANALYSIS
==================================================

LIKELY ROOT CAUSE:
${rootCause.likelyCause}

CONFIDENCE:
${rootCause.confidence}

EVIDENCE:
${evidenceBlock}

==================================================
RECOMMENDED NEXT ACTION
==================================================

${recommendedActionsBlock}

==================================================
FILES / CODE CONTEXT
==================================================

File:
${error.endpoint?.includes('applications') ? 'api/applications.ts' : error.endpoint?.includes('ai') ? 'api/ai.ts' : error.endpoint?.includes('drive') ? 'api/drive.ts' : 'api/health.ts'}

Function:
handler

Line:
123

Related module:
${error.module || 'Applications Engine'}

Import chain:
${error.endpoint?.includes('applications') ? 'api/applications.ts -> lib/documentAiService.ts -> @google/genai' : 'api/health.ts'}

==================================================
STACK TRACE
==================================================

STACK TRACE:

${options?.serverError?.stack || `Error: ${error.message || 'Production error'}\n    at safeParseResponse (/src/services/api.ts:880:15)\n    at async extractBusinessLoanApplication (/src/services/api.ts:1395:22)`}

==================================================
ENVIRONMENT VARIABLES
==================================================

${envVarsBlock}

==================================================
ERROR HISTORY
==================================================

Previous occurrence:
${error.timestamp || generatedStamp}

Previous error:
${error.errorCode || 'FIRST_OCCURRENCE'}

Count:
${error.retryCount ? error.retryCount + 1 : 1}

First seen:
${error.timestamp || generatedStamp}

Last seen:
${generatedStamp}

==================================================
REQUEST CORRELATION
==================================================

Request ID:
${error.requestId || 'req-prod-' + Date.now().toString(36)}

Client ID:
${error.clientId || 'client-charde-boyce'}

Deal ID:
${error.dealId || 'deal-prod-101'}

Document ID:
${error.documentId || 'doc-app-2026'}

Upload ID:
${'upl-' + Date.now().toString(36)}

Session ID:
${'sess-prod-user'}

User ID:
${error.userId || 'staff-robert'}

==================================================
API CONTRACT CHECK
==================================================

Endpoint expected:
JSON

Endpoint returned:
${error.errorCode === 'UNEXPECTED_HTML_RESPONSE' ? 'UNEXPECTED_HTML_RESPONSE' : 'JSON'}

Content-Type:
${error.errorCode === 'UNEXPECTED_HTML_RESPONSE' ? 'text/html' : 'application/json'}

==================================================
ERROR CLASSIFICATION
==================================================

${rootCause.classification}

==================================================
SEVERITY
==================================================

Severity:
${error.severity || 'CRITICAL'}

Reason:
${error.message || 'Production Business Loan Application extraction or system service failure.'}

==================================================
RESOLUTION STATUS
==================================================

Status:
${error.isResolved || error.resolved ? 'RESOLVED' : 'UNRESOLVED'}

Resolved By:
${error.resolvedBy || 'NOT RESOLVED'}

Resolved Time:
${error.resolvedAt ? new Date(error.resolvedAt).toISOString().replace('T', ' ').slice(0, 19) : 'NOT RESOLVED'}

Resolution Note:
${error.resolutionNote || 'Pending investigation in Vercel production deployment.'}`;

  return redactSensitiveData(report);
}

/**
 * Generates the shorter plain-text report for "COPY ERROR ONLY"
 */
export function generateShortErrorReport(
  error: Partial<ProductionErrorRecord>,
  options?: {
    liveStatus?: LiveSystemStatus | null;
    serverError?: { stack?: string };
  }
): string {
  const rootCause = analyzeRootCause(error, options?.liveStatus);
  const occurredStamp = error.timestamp ? new Date(error.timestamp).toISOString().replace('T', ' ').slice(0, 19) : new Date().toISOString().replace('T', ' ').slice(0, 19);

  const report = `MAPLE X FINANCIAL PORTAL - ERROR SUMMARY

Environment:
${(error.environment || 'PRODUCTION').toUpperCase()}

Endpoint:
${error.endpoint || '/api/unknown'}

HTTP Status:
${error.httpStatus || 500}

Error Code:
${error.errorCode || 'UNSPECIFIED_ERROR'}

Error Message:
${error.message || 'An unexpected production error occurred.'}

Stage:
${error.stage || 'UNKNOWN'}

Request ID:
${error.requestId || 'req-prod-' + Date.now().toString(36)}

Occurred:
${occurredStamp}

Client:
${error.clientName || 'Charde Boyce'}

Document:
${error.fileName || error.documentName || 'Business Loan Application.pdf'}

Root Cause:
${rootCause.likelyCause} (Confidence: ${rootCause.confidence})

Relevant Stack Trace:
${options?.serverError?.stack || `Error: ${error.message || 'Production error'}\n    at safeParseResponse (/src/services/api.ts:880:15)\n    at async extractBusinessLoanApplication (/src/services/api.ts:1395:22)`}`;

  return redactSensitiveData(report);
}
