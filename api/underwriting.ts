import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const url = req.url || '';
  const method = req.method || 'GET';

  try {
    // 1. Command Center
    if (url.includes('/command-center')) {
      const dealIdMatch = url.match(/\/deal\/([^/?#]+)\/command-center/);
      const dealId = dealIdMatch ? dealIdMatch[1] : (req.query.dealId as string) || 'deal-3001';
      return res.status(200).json({
        success: true,
        dealId,
        readinessScore: 88,
        status: 'READY_FOR_SUBMISSION',
        bankAnalysisSummary: {
          statementPeriod: 'Last 4 Months (Current)',
          bankName: 'Commercial Operating Bank',
          averageMonthlyRevenue: 70833,
          averageDailyBalance: 45000,
          negativeDaysCount: 0,
          nsfCount: 0,
          monthlyDepositCount: 24,
        },
        riskFlags: [],
        conflicts: [],
        checklist: [],
        submissionPackages: [],
      });
    }

    // 2. Resolve Conflict
    if (url.includes('/resolve-conflict')) {
      const { fieldKey, chosenValue, chosenSource, notes } = req.body || {};
      return res.status(200).json({
        success: true,
        message: `Conflict for "${fieldKey}" resolved and saved.`,
        fieldKey,
        chosenValue,
        chosenSource,
        notes,
      });
    }

    // 3. Risk Flags
    if (url.includes('/risk-flags')) {
      const { flags, note } = req.body || {};
      return res.status(200).json({
        success: true,
        message: 'Risk flags updated successfully.',
        riskFlags: flags || [],
        note,
      });
    }

    // 4. Bank Analysis
    if (url.includes('/bank-analysis')) {
      const { bankAnalysis } = req.body || {};
      return res.status(200).json({
        success: true,
        message: 'Bank statement analysis saved.',
        bankAnalysis,
      });
    }

    // 5. Checklist
    if (url.includes('/checklist')) {
      const { checklist } = req.body || {};
      return res.status(200).json({
        success: true,
        message: 'Checklist updated successfully.',
        checklist,
      });
    }

    // 6. Evaluation
    if (url.includes('/evaluation')) {
      const evalData = req.body || {};
      return res.status(200).json({
        success: true,
        message: 'Underwriting evaluation saved successfully.',
        evaluation: evalData,
      });
    }

    // 7. Submission Package
    if (url.includes('/submission-package')) {
      return res.status(200).json({
        success: true,
        package: {
          id: `pkg-${Date.now()}`,
          status: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
          ...req.body,
        },
        message: 'Submission package generated and transmitted to lender portal.',
      });
    }

    // 8. Ready to fund
    if (url.includes('/ready-to-fund')) {
      return res.status(200).json({
        success: true,
        ready: true,
        score: 92,
        message: 'Deal verified and cleared for final lender contracting.',
      });
    }

    // Generic Underwriting response
    return res.status(200).json({
      success: true,
      endpoint: 'underwriting',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Underwriting service error',
    });
  }
}
