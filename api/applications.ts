import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractBusinessLoanApplicationData, checkDuplicateClients } from '../lib/documentAiService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const url = req.url || '';
  const method = req.method || 'GET';

  // 1. Health check endpoint
  if (url.includes('/health') || req.query.action === 'health' || (method === 'GET' && !url.includes('/extract') && !url.includes('/create-client-profile'))) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const hasApiKey = Boolean(apiKey && apiKey.trim());

    return res.status(200).json({
      success: true,
      endpoint: 'applications',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      aiConfigured: hasApiKey,
      primaryModel: 'gemini-3.6-flash',
      fallbackModel: 'gemini-3.1-pro-preview',
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Create Client Profile endpoint
  if (url.includes('/create-client-profile') || req.query.action === 'create-client-profile') {
    if (method !== 'POST') {
      return res.status(200).json({ success: false, error: 'Method Not Allowed. POST is required.' });
    }

    try {
      const { clientData = {}, duplicateAction, existingClientId, uploadedBy, fileData } = req.body || {};
      const now = new Date().toISOString();
      const staffName = uploadedBy || 'Admin';

      if (!clientData.businessName && !clientData.firstName) {
        return res.status(200).json({
          success: false,
          error: 'Client or business name is required to create a profile.',
        });
      }

      const clientId = existingClientId || `client-${Date.now()}`;
      const dealId = `deal-${Date.now()}`;
      const docId = `doc-${Date.now()}`;

      const client = {
        id: clientId,
        firstName: clientData.firstName || 'Applicant',
        middleName: clientData.middleName || '',
        lastName: clientData.lastName || 'Principal',
        email: clientData.email || '',
        phone: clientData.phone || '',
        businessName: clientData.businessName || `${clientData.firstName || 'Business'} Enterprise`,
        dba: clientData.dba || clientData.businessName || '',
        federalTaxId: clientData.federalTaxId || '',
        businessPhone: clientData.businessPhone || clientData.phone || '',
        businessEmail: clientData.businessEmail || clientData.email || '',
        entityType: clientData.entityType || 'LLC',
        industry: clientData.industry || 'Commercial Services',
        annualRevenue: Number(clientData.annualRevenue) || 600000,
        monthlyRevenue: Number(clientData.monthlyRevenue) || (Number(clientData.annualRevenue) ? Math.round(Number(clientData.annualRevenue) / 12) : 50000),
        creditScore: Number(clientData.creditScore) || 700,
        leadSource: 'Business Loan Application',
        currentStatus: 'Application Received',
        assignedSalesRep: clientData.assignedSalesRep || 'Steve',
        assignedStaff: clientData.assignedStaff || 'Dana',
        createdAt: now,
        updatedAt: now,
      };

      const requestedAmount = Number(clientData.requestedAmount) || 75000;
      const deal = {
        id: dealId,
        clientId: client.id,
        businessName: client.businessName,
        contactPerson: `${client.firstName} ${client.lastName}`.trim(),
        email: client.email,
        phone: client.phone,
        productType: clientData.requestedProduct || 'Revenue Funding',
        amountRequested: requestedAmount,
        stage: 'Application In Review',
        subStage: 'Documents Under Review',
        stageColor: '#3B82F6',
        fundingGoal: clientData.useOfFunds || 'Working Capital',
        assignedSalesRep: client.assignedSalesRep,
        assignedStaff: client.assignedStaff,
        underwriter: 'Dana',
        submissionDate: now,
        createdAt: now,
        updatedAt: now,
      };

      let document = null;
      if (fileData) {
        document = {
          id: docId,
          clientId: client.id,
          dealId: deal.id,
          businessName: client.businessName,
          fileName: fileData.fileName || 'Business_Loan_Application.pdf',
          fileType: fileData.fileMimeType || 'application/pdf',
          fileSize: fileData.fileSize || '1.2 MB',
          classification: 'APPLICATION_FORM',
          status: 'VERIFIED',
          uploadedBy: staffName,
          uploadedAt: now,
          verifiedAt: now,
          notes: 'Automatically verified via AI application upload workflow.',
        };
      }

      return res.status(200).json({
        success: true,
        message: duplicateAction === 'merge' ? 'Client merged successfully' : 'Client and Deal created successfully',
        client,
        deal,
        document,
      });
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        error: err?.message || 'Failed to create client profile',
      });
    }
  }

  // 3. Application Extraction endpoint
  if (url.includes('/extract') || req.query.action === 'extract' || method === 'POST') {
    try {
      const {
        base64,
        fileBase64,
        fileData,
        mimeType,
        fileType,
        fileName,
        extractedText,
        ocrText,
        text,
        existingClients = [],
      } = req.body || {};

      const contentBase64 = base64 || fileBase64 || fileData || '';
      const resolvedMime = mimeType || fileType || 'application/pdf';
      const resolvedText = extractedText || ocrText || text || '';
      const resolvedName = fileName || 'application.pdf';

      const extractionResult = await extractBusinessLoanApplicationData({
        fileBase64: contentBase64,
        fileMimeType: resolvedMime,
        fileName: resolvedName,
        rawText: resolvedText,
      });

      // Check duplicates against existing clients if provided
      let duplicateMatches: any[] = [];
      if (Array.isArray(existingClients) && existingClients.length > 0) {
        duplicateMatches = checkDuplicateClients(extractionResult, existingClients);
      }

      return res.status(200).json({
        success: true,
        data: extractionResult,
        confidence: extractionResult.confidence,
        rawText: resolvedText,
        duplicateMatches,
        hasDuplicates: duplicateMatches.length > 0,
        modelUsed: extractionResult.modelUsed || 'gemini-3.6-flash',
        fallbackUsed: false,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        error: err?.message || 'Application extraction failed',
        data: {},
        confidence: 0,
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
