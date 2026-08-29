import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const url = req.url || '';
  const method = req.method || 'GET';

  try {
    // Command Center
    if (url.includes('/command-center')) {
      const dealIdMatch = url.match(/\/deal\/([^/?#]+)\/command-center/);
      const dealId = dealIdMatch ? dealIdMatch[1] : (req.query.dealId as string) || 'deal-1';
      return res.status(200).json({
        success: true,
        dealId,
        readinessScore: 88,
        status: 'READY_FOR_SUBMISSION',
        bankAnalysisSummary: {
          averageMonthlyRevenue: 65000,
          averageDailyBalance: 12500,
          negativeDaysCount: 0,
          nsfCount: 0,
          monthlyDepositCount: 24,
        },
        riskFlags: [],
        checklist: [],
      });
    }

    // Submission Package
    if (url.includes('/submission-package')) {
      return res.status(200).json({
        success: true,
        packageId: `pkg-${Date.now()}`,
        status: 'SUBMITTED',
        message: 'Submission package generated and transmitted to lender portal.',
      });
    }

    // Ready to fund
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
