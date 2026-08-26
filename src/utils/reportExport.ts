import { Client, CommissionParticipant, FundingDeal, Lead } from '../types';

/**
 * Converts array of objects to downloadable CSV
 */
export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const sanitize = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(sanitize).join(','),
    ...rows.map((row) => row.map(sanitize).join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/\.csv$/, '')}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats Deals for CSV Export
 */
export function exportDealsToCsv(deals: FundingDeal[], filename: string = 'Maple_X_Deals_Report') {
  const headers = [
    'Deal ID',
    'Client Name',
    'Business Name',
    'Product',
    'Funding Amount ($)',
    'Fee ($)',
    'Commission Rate (%)',
    'Expected Commission ($)',
    'Status',
    'Lender Name',
    'Lender Status',
    'Commission Status',
    'Assigned Staff',
    'Is Stacked Position',
    'Funding Date',
    'Commission Received Date',
    'Created Date',
  ];

  const rows = deals.map((d) => {
    const amt = Number(d.fundingAmount) || 0;
    const pct = Number(d.percentage) || 0;
    const expCommission = (amt * pct) / 100;
    return [
      d.id,
      d.clientName || 'N/A',
      d.businessName || 'N/A',
      d.product || 'Revenue Funding',
      amt,
      Number(d.fee) || 0,
      pct,
      expCommission.toFixed(2),
      d.status || 'PROPOSED',
      d.lenderName || 'N/A',
      d.lenderStatus || 'PENDING',
      d.commissionStatus || 'PENDING',
      d.assignedStaff || 'Dana',
      d.isStacked ? 'YES (Stacked)' : 'NO (Primary)',
      d.fundingDate || 'N/A',
      d.commissionReceivedDate || 'N/A',
      d.createdAt || '',
    ];
  });

  exportToCsv(filename, headers, rows);
}

/**
 * Formats Commission Participant Ledger for CSV Export
 */
export function exportCommissionsToCsv(
  commissions: CommissionParticipant[],
  deals: FundingDeal[],
  filename: string = 'Maple_X_Commission_Ledger'
) {
  const dealMap = new Map(deals.map((d) => [d.id, d]));

  const headers = [
    'Participant ID',
    'Deal ID',
    'Client Name',
    'Business Name',
    'Deal Product',
    'Deal Funding Amount ($)',
    'Participant Name',
    'Participant Type',
    'Role',
    'Points (%)',
    'Dollar Amount ($)',
    'Status',
    'Received Date',
    'Notes',
    'Created At',
  ];

  const rows = commissions.map((cp) => {
    const deal = dealMap.get(cp.dealId);
    return [
      cp.id,
      cp.dealId,
      deal?.clientName || 'N/A',
      deal?.businessName || 'N/A',
      deal?.product || 'N/A',
      Number(deal?.fundingAmount) || 0,
      cp.name,
      cp.type || 'Internal Staff',
      cp.role || 'Staff',
      Number(cp.points) || 0,
      (Number(cp.dollarAmount) || 0).toFixed(2),
      cp.status || 'PENDING',
      cp.receivedDate || 'N/A',
      cp.notes || '',
      cp.createdAt || '',
    ];
  });

  exportToCsv(filename, headers, rows);
}

/**
 * Formats Comprehensive Operations Master Dataset
 */
export function exportMasterOperationsToCsv(
  clients: Client[],
  deals: FundingDeal[],
  leads: Lead[],
  filename: string = 'Maple_X_Master_Operations_Dataset'
) {
  const headers = [
    'Record Type',
    'ID',
    'Name',
    'Business Name',
    'Email',
    'Phone',
    'State',
    'Industry',
    'Pipeline Status',
    'Assigned Rep / Staff',
    'Annual Revenue ($)',
    'Credit Score',
    'Requested / Estimated ($)',
    'Product',
    'Funded Deals Count',
    'Total Funded ($)',
    'Created Date',
  ];

  const clientRows = clients.map((c) => {
    const clientDeals = deals.filter((d) => d.clientId === c.id);
    const fundedDeals = clientDeals.filter((d) => d.status === 'FUNDED');
    const totalFunded = fundedDeals.reduce((sum, d) => sum + (Number(d.fundingAmount) || 0), 0);

    return [
      'CLIENT FILE',
      c.id,
      `${c.firstName} ${c.lastName}`.trim(),
      c.businessName || '',
      c.email || '',
      c.phone || '',
      c.state || '',
      c.industry || '',
      c.currentStatus || 'APPLICATION_RECEIVED',
      c.assignedStaff || c.assignedSalesRep || 'Dana',
      Number(c.annualRevenue) || 0,
      c.creditScore || 0,
      Number(c.requestedAmount) || 0,
      c.requestedProduct || 'Revenue Funding',
      fundedDeals.length,
      totalFunded,
      c.createdAt || '',
    ];
  });

  const leadRows = leads.map((l) => [
    'INBOUND LEAD',
    l.id,
    `${l.firstName} ${l.lastName}`.trim(),
    l.businessName || '',
    l.email || '',
    l.phone || '',
    l.state || '',
    l.industry || '',
    l.status || 'NEW_LEAD',
    l.assignedSalesRep || 'Steve',
    0,
    0,
    Number(l.estimatedAmount) || 0,
    'Revenue Funding',
    0,
    0,
    l.createdAt || '',
  ]);

  exportToCsv(filename, headers, [...clientRows, ...leadRows]);
}
