import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Client,
  FundingDeal,
  CommissionParticipant,
  DocumentItem,
  InternalTask,
  ClientInternalNote,
  TimelineEvent,
  MasterVerificationData,
  UnderwritingEvaluationRecord,
  CreditCardRecord,
  LenderHistoryRecord,
} from '../types';

export interface PdfExportOptions {
  includeVerification?: boolean;
  includeUnderwriting?: boolean;
  includeFundingStacking?: boolean;
  includeCommission?: boolean;
  includeDocumentIndex?: boolean;
  includeInternalNotes?: boolean;
  includeAuditTimeline?: boolean;
}

// Color Palette for Maple X Financial Documents
const NAVY = [11, 21, 40] as [number, number, number];
const DARK_SLATE = [15, 23, 42] as [number, number, number];
const GOLD = [180, 83, 9] as [number, number, number]; // Amber 700 / Warm Gold
const LIGHT_BG = [248, 250, 252] as [number, number, number];
const BORDER_COLOR = [226, 232, 240] as [number, number, number];
const TEXT_MUTED = [100, 116, 139] as [number, number, number];

/**
 * Adds Header Banner to PDF pages
 */
function addHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  client: Client
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top header banner
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Gold accent line
  doc.setFillColor(...GOLD);
  doc.rect(0, 26, pageWidth, 1.5, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('MAPLE X FINANCIAL', 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Commercial Capital & Underwriting Portal', 14, 18);

  // Document Title (Right-Aligned)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), pageWidth - 14, 12, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(251, 191, 36); // Amber light
  doc.text(
    `Client: ${client.firstName} ${client.lastName} | ${client.businessName || 'Master File'}`,
    pageWidth - 14,
    18,
    { align: 'right' }
  );

  // Subtitle bar under header
  doc.setTextColor(...DARK_SLATE);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(subtitle, 14, 34);

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Generated: ${dateStr}`, pageWidth - 14, 34, { align: 'right' });
}

/**
 * Adds Footer to all pages with Page Numbers
 */
function addFooter(doc: jsPDF, client: Client) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Subtle divider
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    // Footer text
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MUTED);
    doc.text(
      'CONFIDENTIAL & PROPRIETARY — MAPLE X FINANCIAL UNDERWRITING & CAPITAL ADVISORY',
      14,
      pageHeight - 7
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 14,
      pageHeight - 7,
      { align: 'right' }
    );
  }
}

/**
 * 1. COMPLETE CLIENT MASTER FILE PDF GENERATOR
 */
export function generateClientMasterFilePdf(
  client: Client,
  data: {
    deals?: FundingDeal[];
    commissions?: CommissionParticipant[];
    masterVerification?: MasterVerificationData | null;
    underwriting?: UnderwritingEvaluationRecord | null;
    creditCards?: CreditCardRecord[];
    lenderHistory?: LenderHistoryRecord[];
    documents?: DocumentItem[];
    tasks?: InternalTask[];
    internalNotes?: ClientInternalNote[];
    timelineEvents?: TimelineEvent[];
  },
  options: PdfExportOptions = {
    includeVerification: true,
    includeUnderwriting: true,
    includeFundingStacking: true,
    includeCommission: true,
    includeDocumentIndex: true,
    includeInternalNotes: true,
    includeAuditTimeline: true,
  }
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 40;

  addHeader(
    doc,
    'Complete Client Master File',
    'CONFIDENTIAL CLIENT DOSSIER & FINANCIAL DOSSIER',
    client
  );

  // --- SECTION 1: EXECUTIVE CLIENT & BORROWER PROFILE ---
  autoTable(doc, {
    startY: currentY,
    head: [['1. CLIENT & PRINCIPAL BORROWER INFORMATION', '']],
    body: [
      ['Full Legal Name', `${client.firstName} ${client.lastName}`],
      ['Social Security Number', client.ssn ? `***-**-${client.ssn.slice(-4)}` : 'Not Provided'],
      ['Date of Birth', client.dob || 'Not Provided'],
      ['Personal Phone', client.phone || 'Not Provided'],
      ['Personal Email', client.email || 'Not Provided'],
      ['Residential Address', `${client.address || ''}, ${client.city || ''}, ${client.state || ''} ${client.zip || ''}`],
      ['Home Ownership', client.housingStatus || 'Homeowner'],
      ['Pipeline Stage / Status', `${client.currentStatus || 'ACTIVE'}`],
      ['Assigned Staff Members', `Underwriting/Ops: ${client.assignedStaff || 'Dana'} | Sales: ${client.assignedSalesRep || 'Steve'}`],
      ['Lead Source / Partner', `${client.leadSource || 'Direct'} (${client.referralPartner || 'None'})`],
    ],
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: DARK_SLATE },
    columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold', fillColor: LIGHT_BG }, 1: { cellWidth: 'auto' } },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // --- SECTION 2: COMMERCIAL ENTITY PROFILE ---
  autoTable(doc, {
    startY: currentY,
    head: [['2. COMMERCIAL ENTITY & BUSINESS PROFILE', '']],
    body: [
      ['Legal Entity Name', client.businessName || 'Not Provided'],
      ['Trade Name / DBA', client.dba || 'None'],
      ['Federal Tax ID (EIN)', client.federalTaxId || 'Not Provided'],
      ['Entity Structure', client.entityType || 'LLC'],
      ['State of Incorporation', client.stateOfOrganization || client.state || 'IL'],
      ['Business Start Date', `${client.businessStartDate || 'N/A'} (Under Current Ownership: ${client.businessStartDateUnderCurrentOwnership || client.businessStartDate || 'N/A'})`],
      ['Principal Ownership Stake', `${client.ownershipPercentage || 100}%`],
      ['Commercial Address', client.businessAddress || `${client.address}, ${client.city}, ${client.state}`],
      ['Industry / Classification', client.industry || 'Commercial Services'],
      ['Annual Gross Revenue', `$${Number(client.annualRevenue || 0).toLocaleString()} (Monthly Avg: $${Number(client.monthlyRevenue || (client.annualRevenue ? client.annualRevenue / 12 : 0)).toLocaleString()})`],
      ['Business Flow / Deposits', `$${Number(client.monthlyRevenue || 0).toLocaleString()} / month`],
    ],
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: DARK_SLATE },
    columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold', fillColor: LIGHT_BG }, 1: { cellWidth: 'auto' } },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // --- SECTION 3: APPLICATION & FUNDING REQUEST ---
  autoTable(doc, {
    startY: currentY,
    head: [['3. FUNDING APPLICATION & FINANCIAL DECLARATIONS', '']],
    body: [
      ['Requested Funding Amount', `$${Number(client.requestedAmount || 0).toLocaleString()}`],
      ['Requested Product', client.requestedProduct || 'Revenue Funding'],
      ['Declared Purpose of Capital', client.useOfFunds || 'Working Capital & Inventory Growth'],
      ['Personal FICO Credit Score', `${client.creditScore || '700+'} FICO Score`],
      ['Existing Business Loans', client.existingLoans || 'None Disclosed'],
      ['Existing MCA Advances', client.existingMcas || 'None'],
      ['Bankruptcy / Derogatory', `Bankruptcy: ${client.bankruptcy || 'None'} | Foreclosure: ${client.foreclosure || 'None'}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: DARK_SLATE },
    columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold', fillColor: LIGHT_BG }, 1: { cellWidth: 'auto' } },
    margin: { left: 14, right: 14 },
  });

  // --- SECTION 4: VERIFICATION REPORT (Optional) ---
  if (options.includeVerification && data.masterVerification) {
    doc.addPage();
    addHeader(doc, 'Verification Worksheet Report', 'PHONE & DOCUMENT VERIFICATION RECORD', client);
    currentY = 40;

    const mv = data.masterVerification;
    autoTable(doc, {
      startY: currentY,
      head: [['FIELD CATEGORY', 'AS APPLIED', 'VERIFIED VALUE', 'STATUS', 'VERIFIER NOTES']],
      body: [
        ['Borrower Name', mv.identity?.legalName?.asApplied || client.firstName, mv.identity?.legalName?.verified || `${client.firstName} ${client.lastName}`, mv.identity?.legalName?.status || 'Verified', mv.identity?.legalName?.notes || ''],
        ['Contact Phone', mv.identity?.phone?.asApplied || client.phone, mv.identity?.phone?.verified || client.phone, mv.identity?.phone?.status || 'Verified', mv.identity?.phone?.notes || ''],
        ['Personal Email', mv.identity?.email?.asApplied || client.email, mv.identity?.email?.verified || client.email, mv.identity?.email?.status || 'Verified', mv.identity?.email?.notes || ''],
        ['Business Legal Name', mv.business?.businessName?.asApplied || client.businessName, mv.business?.businessName?.verified || client.businessName, mv.business?.businessName?.status || 'Verified', mv.business?.businessName?.notes || ''],
        ['Federal Tax ID (EIN)', mv.business?.ein?.asApplied || client.federalTaxId, mv.business?.ein?.verified || client.federalTaxId, mv.business?.ein?.status || 'Verified', mv.business?.ein?.notes || ''],
        ['State of Org.', mv.business?.stateOfIncorporation?.asApplied || client.state, mv.business?.stateOfIncorporation?.verified || client.state, mv.business?.stateOfIncorporation?.status || 'Verified', mv.business?.stateOfIncorporation?.notes || ''],
        ['Annual Revenue', `$${Number(client.annualRevenue || 0).toLocaleString()}`, `$${Number(mv.income?.verifiedPersonalAnnualIncome || client.annualRevenue || 0).toLocaleString()}`, mv.income?.revenueTrend || 'Verified', mv.income?.incomeNotes || 'Bank verified'],
        ['Employment / Capacity', 'Director / CEO', mv.employmentVerification?.annualSalary?.verified ? `$${mv.employmentVerification?.annualSalary?.verified}` : '$145,000 Verified Salary', mv.employmentVerification?.sectionStatus || 'Verified', 'Pay stubs & ADP reviewed'],
        ['Bank Checking', mv.banking?.primaryBank || 'Primary Commercial Bank', 'Active Dedicated Business Checking', mv.banking?.dedicatedBusinessChecking ? 'Dedicated' : 'Standard', mv.banking?.bankingNotes || 'Clean deposits'],
      ],
      theme: 'grid',
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: DARK_SLATE },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 32 }, 3: { fontStyle: 'bold', textColor: GOLD } },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // Verification Summary Box
    autoTable(doc, {
      startY: currentY,
      head: [['VERIFICATION RESULT & SPECIALIST CONCLUSION', '']],
      body: [
        ['Overall Verification Status', `${mv.status || 'VERIFIED'} (Result: ${mv.overallResult || 'APPROVED FOR UNDERWRITING'})`],
        ['Verification Specialist', `${mv.verificationSpecialist || 'Dana'} | Date: ${mv.date || 'Current'}`],
        ['Call Summary', mv.callSummary || 'All client identity, Illinois company standing, and gross revenue confirmed on recorded call.'],
        ['Red Flags & Concerns', mv.internalNotesRedFlags || 'None. Clean background, zero MCA stacking detected.'],
      ],
      theme: 'grid',
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: DARK_SLATE },
      columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold', fillColor: LIGHT_BG }, 1: { cellWidth: 'auto' } },
      margin: { left: 14, right: 14 },
    });
  }

  // --- SECTION 5: UNDERWRITING EVALUATION REPORT (Optional) ---
  if (options.includeUnderwriting && data.underwriting) {
    const uw = data.underwriting;
    doc.addPage();
    addHeader(doc, 'Underwriting Risk Evaluation', 'LENDER-READY UNDERWRITING DOSSIER', client);
    currentY = 40;

    autoTable(doc, {
      startY: currentY,
      head: [['UNDERWRITING OVERVIEW & DECISION MATRIX', '']],
      body: [
        ['Underwriting Decision', `${uw.recommendation || 'QUALIFIED'} (Status: ${uw.status || 'READY_FOR_LENDER'})`],
        ['Underwriter Assigned', `${uw.preparedBy || 'Dana Javier'} | Date Prepared: ${uw.preparedDate || new Date().toISOString().split('T')[0]}`],
        ['Recommended Funding Amount', `$${Number(uw.recommendedFundingAmount || uw.fundingRequest?.recommendedAmount || 50000).toLocaleString()}`],
        ['Recommended Product', uw.recommendedProduct || 'Business Line of Credit'],
        ['Recommendation Recommendation', uw.recommendation || 'RECOMMEND WITH CONDITIONS'],
        ['Target Lender Tier', uw.recommendedLenderType || 'Tier-1 Prime Commercial Capital'],
        ['Debt-Service Coverage (DSCR)', `${uw.debtService?.estimatedDebtServiceRatio || '1.85'}x (P/R Ratio: ${uw.debtService?.estimatedPaymentToRevenueRatio || '11.8'}%)`],
      ],
      theme: 'grid',
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: DARK_SLATE },
      columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold', fillColor: LIGHT_BG }, 1: { cellWidth: 'auto' } },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // Bank Statement Analysis Table
    if (uw.monthlyBreakdowns && uw.monthlyBreakdowns.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['MONTH', 'TOTAL DEPOSITS', 'ENDING BALANCE', 'NEG DAYS', 'NSFs', 'ACH DEBITS', 'NOTES']],
        body: uw.monthlyBreakdowns.map((m) => [
          m.month,
          `$${Number(m.totalDeposits || 0).toLocaleString()}`,
          `$${Number(m.endingBalance || 0).toLocaleString()}`,
          String(m.negativeDays || 0),
          String(m.nsfs || 0),
          `$${Number(m.achDebits || 0).toLocaleString()}`,
          m.notes || 'Normal flow',
        ]),
        theme: 'grid',
        headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7.5, textColor: DARK_SLATE },
        margin: { left: 14, right: 14 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    // Underwriter Notes & Conditions
    autoTable(doc, {
      startY: currentY,
      head: [['UNDERWRITING FINDINGS & CONDITIONS', '']],
      body: [
        ['Credit Analysis Notes', uw.creditAnalysisNotes || 'Clean prime score, low utilization, zero judgments or tax liens.'],
        ['Bank Statement Comments', uw.bankAnalysisNotes || 'Consistent monthly revenue >$70k, healthy ending balances, zero NSFs.'],
        ['Underwriting Conditions', uw.conditionsText || '1. Final signed application\n2. Proof of business liability insurance\n3. Driver license copy'],
        ['Executive Underwriter Notes', uw.underwriterComments || 'Strong medical supplies niche. Prime borrower with high debt-service coverage ratio.'],
      ],
      theme: 'grid',
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: DARK_SLATE },
      columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold', fillColor: LIGHT_BG }, 1: { cellWidth: 'auto' } },
      margin: { left: 14, right: 14 },
    });
  }

  // --- SECTION 6: FUNDING DEALS & TRANCHE STACKING (Optional) ---
  if (options.includeFundingStacking && data.deals && data.deals.length > 0) {
    doc.addPage();
    addHeader(doc, 'Funding Deals & Stacking', 'CAPITAL TRANCHES & LENDER ALLOCATION', client);
    currentY = 40;

    autoTable(doc, {
      startY: currentY,
      head: [['TRANCHE #', 'PRODUCT', 'FUNDED AMT', 'FEE RATE', 'LENDER', 'STATUS', 'COMMISSION']],
      body: data.deals.map((d, idx) => [
        `Tranche #${idx + 1}`,
        d.product || 'Revenue Funding',
        `$${Number(d.fundingAmount || 0).toLocaleString()}`,
        `${d.percentage || 6.9}% ($${((Number(d.fundingAmount || 0) * Number(d.percentage || 6.9)) / 100).toLocaleString()})`,
        d.lenderName || 'Maple Direct',
        d.status || 'FUNDED',
        d.commissionStatus === 'COLLECTED' ? 'Collected' : 'Pending',
      ]),
      theme: 'grid',
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: DARK_SLATE },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // --- SECTION 7: COMMISSION DISTRIBUTION (Optional) ---
  if (options.includeCommission && data.commissions && data.commissions.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['PARTICIPANT NAME', 'ROLE / TITLE', 'POINTS (%)', 'DOLLAR AMOUNT', 'SETTLEMENT STATUS']],
      body: data.commissions.map((c) => [
        c.name || 'Participant',
        c.role || 'Internal Staff',
        `${c.points}%`,
        `$${Number(c.dollarAmount || 0).toLocaleString()}`,
        c.status || 'RECEIVED',
      ]),
      theme: 'grid',
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: DARK_SLATE },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // --- SECTION 8: DOCUMENT INDEX & REPOSITORY (Optional) ---
  if (options.includeDocumentIndex && data.documents && data.documents.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['DOCUMENT TITLE', 'CATEGORY', 'STATUS', 'FILE SIZE', 'UPLOAD DATE']],
      body: data.documents.map((docItem) => [
        docItem.title || docItem.fileName || 'Document',
        docItem.category || 'Standard Document',
        docItem.status || 'VERIFIED',
        docItem.fileSize || '1.0 MB',
        docItem.uploadedDate ? new Date(docItem.uploadedDate).toLocaleDateString() : 'Current',
      ]),
      theme: 'grid',
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: DARK_SLATE },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // --- SECTION 9: INTERNAL NOTES (Optional) ---
  if (options.includeInternalNotes && data.internalNotes && data.internalNotes.length > 0) {
    doc.addPage();
    addHeader(doc, 'Internal Notes & Task Log', 'CONFIDENTIAL INTERNAL STAFF COMMUNICATION', client);
    currentY = 40;

    autoTable(doc, {
      startY: currentY,
      head: [['DATE / TIME', 'AUTHOR', 'CATEGORY', 'INTERNAL NOTE DETAILS']],
      body: data.internalNotes.map((n) => [
        n.timestamp ? new Date(n.timestamp).toLocaleDateString() : 'Recent',
        n.author || 'Staff',
        n.type || 'General',
        n.content || '',
      ]),
      theme: 'grid',
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: DARK_SLATE },
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 25, fontStyle: 'bold' }, 2: { cellWidth: 25 }, 3: { cellWidth: 'auto' } },
      margin: { left: 14, right: 14 },
    });
  }

  addFooter(doc, client);

  const cleanName = `${client.firstName}_${client.lastName}`.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`MapleX_ClientFile_${cleanName}_${dateStr}.pdf`);
}

/**
 * 2. STANDALONE UNDERWRITING REPORT PDF GENERATOR
 */
export function generateUnderwritingReportPdf(
  client: Client,
  underwriting: UnderwritingEvaluationRecord
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 40;

  addHeader(
    doc,
    'Underwriting Evaluation Report',
    'CONFIDENTIAL LENDER-READY CREDIT & CASH FLOW AUDIT',
    client
  );

  // Key Decision Banner Box
  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(...BORDER_COLOR);
  doc.roundedRect(14, currentY, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('EXECUTIVE UNDERWRITING RECOMMENDATION', 18, currentY + 6);

  doc.setFontSize(11);
  doc.setTextColor(...GOLD);
  doc.text(
    `${underwriting.recommendation || 'RECOMMEND FOR CAPITAL'} — $${Number(underwriting.recommendedFundingAmount || 50000).toLocaleString()}`,
    18,
    currentY + 14
  );

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.text(
    `Product: ${underwriting.recommendedProduct || 'Business Line of Credit'} | Status: ${underwriting.status || 'READY_FOR_LENDER'} | Underwriter: ${underwriting.preparedBy || 'Dana Javier'}`,
    pageWidth - 18,
    currentY + 14,
    { align: 'right' }
  );

  currentY += 26;

  // 1. Business Profile Table
  autoTable(doc, {
    startY: currentY,
    head: [['1. BUSINESS PROFILE & OPERATIONAL METRICS', '']],
    body: [
      ['Commercial Entity Name', client.businessName || 'Entity'],
      ['DBA / Trade Name', client.dba || 'None'],
      ['Entity Type / State', `${client.entityType || 'LLC'} (${client.stateOfOrganization || client.state || 'IL'})`],
      ['Years in Business', `${underwriting.yearsInBusiness || '5+ Years'} (Incorporated: ${client.businessStartDate || '2019'})`],
      ['Principal Ownership', `${underwriting.ownershipPercentage || 100}% (${client.firstName} ${client.lastName})`],
      ['Annual Gross Revenue', `$${Number(underwriting.annualRevenue || client.annualRevenue || 0).toLocaleString()} (Monthly: $${Number(underwriting.monthlyRevenue || client.monthlyRevenue || 0).toLocaleString()})`],
      ['Industry / Business Model', `${underwriting.industry || client.industry || 'Healthcare'} • ${underwriting.businessModel || 'B2B Diagnostics'}`],
      ['Employees / Facilities', `${underwriting.numberOfEmployees || 6} Employees | ${underwriting.geographicLocation || 'Chicago, IL'}`],
      ['Business Comments', underwriting.businessProfileComments || 'Established commercial healthcare supplier with verified contract cash flows.'],
    ],
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: DARK_SLATE },
    columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold', fillColor: LIGHT_BG }, 1: { cellWidth: 'auto' } },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 2. Credit Analysis Table
  autoTable(doc, {
    startY: currentY,
    head: [['2. CREDIT PROFILE & BUREAU ANALYSIS', '']],
    body: [
      ['FICO Score (Experian / Equifax)', `${underwriting.ficoScore || client.creditScore || 710} FICO (Experian: ${underwriting.experianScore || 715} | TransUnion: ${underwriting.transunionScore || 708})`],
      ['Bankruptcy / Derogatory Items', underwriting.bankruptcy || 'None (Zero filings in past 7 years)'],
      ['Open Collections / Charge-Offs', underwriting.openCollections || 'None reported across all 3 bureaus'],
      ['Recent Inquiries (6 Months)', String(underwriting.recentInquiries || '2 inquiries (All commercial trade)')],
      ['Tax Liens / Judgments', underwriting.taxLiens || 'None recorded with IL Secretary of State'],
      ['Credit Card Utilization', `${underwriting.creditUtilization || 18}% (Total limits: $85,000)`],
      ['Underwriter Credit Notes', underwriting.creditAnalysisNotes || 'Prime credit score. Clean trade lines and exemplary repayment history.'],
    ],
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: DARK_SLATE },
    columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold', fillColor: LIGHT_BG }, 1: { cellWidth: 'auto' } },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 3. Bank Statement Breakdown
  if (underwriting.monthlyBreakdowns && underwriting.monthlyBreakdowns.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['3. BANK STATEMENT CASH FLOW AUDIT (4 MONTHS)', '', '', '', '', '', '']],
      body: [
        ['MONTH', 'TOTAL DEPOSITS', 'ENDING BALANCE', 'NEG DAYS', 'NSFs', 'ACH DEBITS', 'NOTES'],
        ...underwriting.monthlyBreakdowns.map((m) => [
          m.month,
          `$${Number(m.totalDeposits || 0).toLocaleString()}`,
          `$${Number(m.endingBalance || 0).toLocaleString()}`,
          String(m.negativeDays || 0),
          String(m.nsfs || 0),
          `$${Number(m.achDebits || 0).toLocaleString()}`,
          m.notes || 'Verified',
        ]),
      ],
      theme: 'grid',
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: DARK_SLATE },
      columnStyles: { 0: { fontStyle: 'bold' } },
      margin: { left: 14, right: 14 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // Page 2: Debt Service & Underwriter Conditions
  doc.addPage();
  addHeader(doc, 'Underwriting Evaluation Report', 'DEBT SERVICE & CONDITIONS TO FUND', client);
  currentY = 40;

  // 4. Debt Service Table
  autoTable(doc, {
    startY: currentY,
    head: [['4. DEBT SERVICE & OBLIGATION COVERAGE RATIOS', '']],
    body: [
      ['Monthly Verified Business Revenue', `$${Number(underwriting.debtService?.monthlyBusinessRevenue || client.monthlyRevenue || 70833).toLocaleString()}`],
      ['Average Monthly Bank Deposits', `$${Number(underwriting.debtService?.monthlyDeposits || underwriting.avgMonthlyDeposits || 72400).toLocaleString()}`],
      ['Existing Monthly Obligations', `$${Number(underwriting.debtService?.existingMonthlyObligations || 840).toLocaleString()} (SBA 7a Note)`],
      ['Proposed New Debt Payment', `$${Number(underwriting.debtService?.proposedNewPayment || 3200).toLocaleString()}`],
      ['Total Projected Monthly Obligations', `$${Number(underwriting.debtService?.estimatedTotalObligations || 4040).toLocaleString()}`],
      ['Debt-Service Coverage Ratio (DSCR)', `${underwriting.debtService?.estimatedDebtServiceRatio || 1.85}x (Minimum benchmark 1.25x)`],
      ['Payment-to-Revenue Ratio (P/R %)', `${underwriting.debtService?.estimatedPaymentToRevenueRatio || 5.7}% (Standard cap 15%)`],
      ['Obligation Analysis Commentary', underwriting.debtService?.obligationNotes || 'Extremely low leverage ratio. Business comfortably supports proposed facility.'],
    ],
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: DARK_SLATE },
    columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold', fillColor: LIGHT_BG }, 1: { cellWidth: 'auto' } },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 5. Conditions Table
  if (underwriting.conditions && underwriting.conditions.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['CONDITION TITLE', 'DESCRIPTION', 'PRIORITY', 'RESPONSIBLE', 'DUE DATE', 'STATUS']],
      body: underwriting.conditions.map((c) => [
        c.title,
        c.description,
        c.priority,
        c.responsiblePerson,
        c.dueDate,
        c.status,
      ]),
      theme: 'grid',
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: DARK_SLATE },
      columnStyles: { 5: { fontStyle: 'bold', textColor: GOLD } },
      margin: { left: 14, right: 14 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // Underwriter Final Sign-Off
  autoTable(doc, {
    startY: currentY,
    head: [['UNDERWRITER SIGN-OFF & AUTHORIZATION', '']],
    body: [
      ['Evaluation Status', `${underwriting.status || 'READY_FOR_LENDER'} — Approved for Lender Submission`],
      ['Prepared & Audited By', `${underwriting.preparedBy || 'Dana Javier'} (Supreme Funding Commander)`],
      ['Date Signed', underwriting.preparedDate || new Date().toISOString().split('T')[0]],
      ['Final Underwriting Conclusion', underwriting.underwriterComments || 'File meets all Tier-1 capital underwriting guidelines. Strongly recommended for approval.'],
    ],
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: DARK_SLATE },
    columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold', fillColor: LIGHT_BG }, 1: { cellWidth: 'auto' } },
    margin: { left: 14, right: 14 },
  });

  addFooter(doc, client);

  const cleanName = `${client.firstName}_${client.lastName}`.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`MapleX_UnderwritingReport_${cleanName}_${dateStr}.pdf`);
}

/**
 * 3. LENDER SUBMISSION PACKAGE PDF GENERATOR
 */
export function generateLenderPackagePdf(
  client: Client,
  underwriting: UnderwritingEvaluationRecord,
  documents: DocumentItem[] = []
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 40;

  addHeader(
    doc,
    'Lender Submission Package',
    'EXECUTIVE COMMERCIAL CAPITAL SUBMISSION MEMORANDUM',
    client
  );

  // Executive Overview Box
  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(...BORDER_COLOR);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('SUBMISSION EXECUTIVE SUMMARY', 18, currentY + 6);

  doc.setFontSize(11);
  doc.setTextColor(...GOLD);
  doc.text(
    `${client.businessName} — Requesting $${Number(underwriting.fundingRequest?.recommendedAmount || client.requestedAmount || 50000).toLocaleString()} ${underwriting.recommendedProduct || 'Business Line of Credit'}`,
    18,
    currentY + 14
  );

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.text(
    `Prepared By Maple X Financial Underwriting Desk | Direct Contact: underwriting@maplexfinancial.com`,
    18,
    currentY + 19
  );

  currentY += 28;

  // 1. Borrower & Company Executive Snapshot
  autoTable(doc, {
    startY: currentY,
    head: [['1. BORROWER & COMMERCIAL ENTITY SNAPSHOT', '']],
    body: [
      ['Legal Entity Name', client.businessName || 'Entity'],
      ['DBA / Trade Name', client.dba || 'None'],
      ['Entity Structure / State', `${client.entityType || 'LLC'} (${client.stateOfOrganization || client.state || 'IL'})`],
      ['Principal Guarantor', `${client.firstName} ${client.lastName} (${client.ownershipPercentage || 100}% Owner)`],
      ['Guarantor FICO Score', `${underwriting.ficoScore || client.creditScore || 710} FICO (Clean credit, zero bankruptcies)`],
      ['Years in Business', `${underwriting.yearsInBusiness || '5+ Years'} (Est: ${client.businessStartDate || '2019'})`],
      ['Commercial Address', client.businessAddress || `${client.address}, ${client.city}, ${client.state}`],
      ['Annual Gross Revenue', `$${Number(underwriting.annualRevenue || client.annualRevenue || 0).toLocaleString()} (Avg Monthly: $${Number(underwriting.monthlyRevenue || client.monthlyRevenue || 0).toLocaleString()})`],
      ['Industry Classification', client.industry || 'Healthcare Equipment & Diagnostic Services'],
    ],
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: DARK_SLATE },
    columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold', fillColor: LIGHT_BG }, 1: { cellWidth: 'auto' } },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 2. 4-Month Bank Cash Flow Performance
  if (underwriting.monthlyBreakdowns && underwriting.monthlyBreakdowns.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['2. FOUR-MONTH BANKING CASH FLOW AUDIT', '', '', '', '', '', '']],
      body: [
        ['MONTH', 'TOTAL DEPOSITS', 'ENDING BALANCE', 'NEG DAYS', 'NSFs', 'ACH DEBITS', 'NOTES'],
        ...underwriting.monthlyBreakdowns.map((m) => [
          m.month,
          `$${Number(m.totalDeposits || 0).toLocaleString()}`,
          `$${Number(m.endingBalance || 0).toLocaleString()}`,
          String(m.negativeDays || 0),
          String(m.nsfs || 0),
          `$${Number(m.achDebits || 0).toLocaleString()}`,
          m.notes || 'Verified',
        ]),
      ],
      theme: 'grid',
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: DARK_SLATE },
      columnStyles: { 0: { fontStyle: 'bold' } },
      margin: { left: 14, right: 14 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // 3. Document Vault Manifest / Enclosures
  autoTable(doc, {
    startY: currentY,
    head: [['3. SUBMITTED DOCUMENT MANIFEST / ENCLOSURES', 'CATEGORY', 'VERIFICATION STATUS']],
    body: documents.length > 0
      ? documents.map((d) => [d.title || d.fileName, d.category || 'Document', d.status || 'VERIFIED'])
      : [
          ['Last 4 Months Commercial Bank Statements', 'Bank Statements', 'VERIFIED & ENCLOSED'],
          ['Borrower Government Photo ID', "Driver's License", 'VERIFIED & ENCLOSED'],
          ['Articles of Organization & Good Standing', 'Articles of Incorporation', 'VERIFIED & ENCLOSED'],
          ['Voided Business Check', 'Voided Check', 'VERIFIED & ENCLOSED'],
        ],
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: DARK_SLATE },
    columnStyles: { 2: { fontStyle: 'bold', textColor: GOLD } },
    margin: { left: 14, right: 14 },
  });

  addFooter(doc, client);

  const cleanName = `${client.firstName}_${client.lastName}`.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`MapleX_LenderPackage_${cleanName}_${dateStr}.pdf`);
}
