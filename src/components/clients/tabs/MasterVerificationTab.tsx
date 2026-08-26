import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  User,
  Building2,
  Briefcase,
  DollarSign,
  CreditCard,
  Home,
  CheckSquare,
  Square,
  HelpCircle,
  PhoneCall,
  Edit3,
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
  Check,
  ExternalLink,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import {
  Client,
  MasterVerificationData,
  MasterVerificationField,
  ExistingDebtRecord,
  CreditCardRecord,
  RecentCreditActivityRecord,
  VerificationStatusType,
  EmploymentSalaryPayrollVerification,
} from '../../../types';
import { api } from '../../../services/api';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { firestoreService } from '../../../services/firestoreService';
import { formatDate, formatDateTime } from '../../../utils/dateUtils';

interface MasterVerificationTabProps {
  client: Client;
  masterVerification?: MasterVerificationData | null;
  onRefresh: () => void;
}

export const MasterVerificationTab: React.FC<MasterVerificationTabProps> = ({
  client,
  masterVerification,
  onRefresh,
}) => {
  const { addToast, updateClient } = useData();
  const { currentUser } = useAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('identity');

  // Sign-Off States
  const [verifiedByName, setVerifiedByName] = useState<string>(
    masterVerification?.verifiedBy || currentUser?.name || 'Staff Underwriter'
  );
  const [isCompleting, setIsCompleting] = useState(false);

  // New Debt / Card Modal States
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [newDebtForm, setNewDebtForm] = useState<Partial<ExistingDebtRecord>>({
    lender: '',
    loanType: 'Term Loan',
    originalLoanAmount: 0,
    monthlyPayment: 0,
    currentBalance: 0,
    status: 'Current',
  });

  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCardForm, setNewCardForm] = useState<Partial<CreditCardRecord>>({
    cardCategory: 'BUSINESS',
    issuer: '',
    cardName: '',
    creditLimit: 0,
    currentBalance: 0,
    availableCredit: 0,
    monthlyPayment: 0,
    utilization: 0,
    lastFourDigits: '',
  });

  // Pure data initializer with ZERO assumed or fake information
  const initMasterData = (): MasterVerificationData => {
    return {
      id: masterVerification?.id || `mv-${client.id}`,
      clientId: client.id,
      verificationSpecialist: masterVerification?.verificationSpecialist || currentUser?.name || 'Staff Specialist',
      date: masterVerification?.date || new Date().toISOString().split('T')[0],
      status: masterVerification?.status || 'IN_PROGRESS',
      overallResult: masterVerification?.overallResult || 'NEEDS_MORE_INFO',
      callSummary: masterVerification?.callSummary || '',
      internalNotesRedFlags: masterVerification?.internalNotesRedFlags || '',
      verifiedBy: masterVerification?.verifiedBy || '',
      verifiedAt: masterVerification?.verifiedAt || '',

      preCallReview: {
        clientName: masterVerification?.preCallReview?.clientName ?? Boolean(client.firstName && client.lastName),
        businessName: masterVerification?.preCallReview?.businessName ?? Boolean(client.businessName),
        phone: masterVerification?.preCallReview?.phone ?? Boolean(client.phone),
        email: masterVerification?.preCallReview?.email ?? Boolean(client.email),
        businessAddress: masterVerification?.preCallReview?.businessAddress ?? Boolean(client.businessAddress || client.address),
        entityType: masterVerification?.preCallReview?.entityType ?? Boolean(client.entityType),
        ein: masterVerification?.preCallReview?.ein ?? Boolean(client.federalTaxId),
        timeInBusiness: masterVerification?.preCallReview?.timeInBusiness ?? Boolean(client.timeInBusiness || client.businessStartDate),
        ownershipPercentage: masterVerification?.preCallReview?.ownershipPercentage ?? Boolean(client.ownershipPercentage),
        monthlyRevenue: masterVerification?.preCallReview?.monthlyRevenue ?? Boolean(client.monthlyRevenue),
        personalAnnualIncome: masterVerification?.preCallReview?.personalAnnualIncome ?? Boolean(client.personalAnnualIncome),
        requestedFunding: masterVerification?.preCallReview?.requestedFunding ?? Boolean(client.requestedAmount),
        purposeOfFunds: masterVerification?.preCallReview?.purposeOfFunds ?? Boolean(client.useOfFunds),
        uploadedDocuments: masterVerification?.preCallReview?.uploadedDocuments ?? Boolean(client.documents && client.documents.length > 0),
        ssn: masterVerification?.preCallReview?.ssn ?? Boolean(client.ssn),
        dob: masterVerification?.preCallReview?.dob ?? Boolean(client.dob),
        stateOfIncorporation: masterVerification?.preCallReview?.stateOfIncorporation ?? Boolean(client.stateOfOrganization || client.state),
        creditScore: masterVerification?.preCallReview?.creditScore ?? Boolean(client.creditScore),
        missingInfoNotes: masterVerification?.preCallReview?.missingInfoNotes || '',
      },

      openingScript: {
        answered: masterVerification?.openingScript?.answered ?? false,
        continueNow: masterVerification?.openingScript?.continueNow ?? false,
        rescheduleDate: masterVerification?.openingScript?.rescheduleDate || '',
        rescheduleNotes: masterVerification?.openingScript?.rescheduleNotes || '',
      },

      identity: {
        legalName: masterVerification?.identity?.legalName || {
          asApplied: `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Not Provided',
          verified: `${client.firstName || ''} ${client.lastName || ''}`.trim() || '',
          status: 'Unverified',
          notes: '',
        },
        phone: masterVerification?.identity?.phone || {
          asApplied: client.phone || 'Not Provided',
          verified: client.phone || '',
          status: 'Unverified',
          notes: '',
        },
        email: masterVerification?.identity?.email || {
          asApplied: client.email || 'Not Provided',
          verified: client.email || '',
          status: 'Unverified',
          notes: '',
        },
        dob: masterVerification?.identity?.dob || {
          asApplied: client.dob || 'Not Provided',
          verified: client.dob || '',
          status: 'Unverified',
          notes: '',
        },
        ssnLast4: masterVerification?.identity?.ssnLast4 || {
          asApplied: client.ssn ? client.ssn.slice(-4) : 'Not Provided',
          verified: client.ssn ? client.ssn.slice(-4) : '',
          status: 'Unverified',
          notes: '',
        },
      },

      business: {
        businessName: masterVerification?.business?.businessName || {
          asApplied: client.businessName || 'Not Provided',
          verified: client.businessName || '',
          status: 'Unverified',
          notes: '',
        },
        dba: masterVerification?.business?.dba || {
          asApplied: client.dba || 'None',
          verified: client.dba || '',
          status: 'Unverified',
          notes: '',
        },
        businessAddress: masterVerification?.business?.businessAddress || {
          asApplied: client.businessAddress || (client.address ? `${client.address}, ${client.city || ''}, ${client.state || ''}`.trim() : 'Not Provided'),
          verified: client.businessAddress || (client.address ? `${client.address}, ${client.city || ''}, ${client.state || ''}`.trim() : ''),
          status: 'Unverified',
          notes: '',
        },
        ein: masterVerification?.business?.ein || {
          asApplied: client.federalTaxId || 'Not Provided',
          verified: client.federalTaxId || '',
          status: 'Unverified',
          notes: '',
        },
        stateOfIncorporation: masterVerification?.business?.stateOfIncorporation || {
          asApplied: client.stateOfOrganization || client.state || 'Not Provided',
          verified: client.stateOfOrganization || client.state || '',
          status: 'Unverified',
          notes: '',
        },
        entityType: masterVerification?.business?.entityType || {
          asApplied: client.entityType || 'Not Provided',
          verified: client.entityType || '',
          status: 'Unverified',
          notes: '',
        },
        businessStartDate: masterVerification?.business?.businessStartDate || {
          asApplied: client.businessStartDate || 'Not Provided',
          verified: client.businessStartDate || '',
          status: 'Unverified',
          notes: '',
        },
        timeInBusiness: masterVerification?.business?.timeInBusiness || {
          asApplied: client.timeInBusiness || 'Not Provided',
          verified: client.timeInBusiness || '',
          status: 'Unverified',
          notes: '',
        },
        industry: masterVerification?.business?.industry || {
          asApplied: client.industry || 'Not Provided',
          verified: client.industry || '',
          status: 'Unverified',
          notes: '',
        },
        businessDescription: masterVerification?.business?.businessDescription || {
          asApplied: client.businessDescription || 'Not Provided',
          verified: client.businessDescription || '',
          status: 'Unverified',
          notes: '',
        },
        ownershipPercentage: masterVerification?.business?.ownershipPercentage || {
          asApplied: client.ownershipPercentage ? `${client.ownershipPercentage}%` : 'Not Provided',
          verified: client.ownershipPercentage ? `${client.ownershipPercentage}%` : '',
          status: 'Unverified',
          notes: '',
        },
        ownerTitle: masterVerification?.business?.ownerTitle || {
          asApplied: client.ownerTitle || 'Not Provided',
          verified: client.ownerTitle || '',
          status: 'Unverified',
          notes: '',
        },
      },

      employment: {
        selfEmployedOnly: masterVerification?.employment?.selfEmployedOnly ?? true,
        alsoEmployedFullTime: masterVerification?.employment?.alsoEmployedFullTime ?? false,
        employer: masterVerification?.employment?.employer || client.businessName || '',
        position: masterVerification?.employment?.position || client.ownerTitle || '',
        yearsEmployed: masterVerification?.employment?.yearsEmployed || client.timeInBusiness || '',
        employmentStartDate: masterVerification?.employment?.employmentStartDate || client.businessStartDate || '',
        employmentStatus: masterVerification?.employment?.employmentStatus || '',
        annualSalary: masterVerification?.employment?.annualSalary ?? client.personalAnnualIncome ?? 0,
        monthlySalary: masterVerification?.employment?.monthlySalary ?? client.personalMonthlyIncome ?? (client.personalAnnualIncome ? Math.round((client.personalAnnualIncome / 12) * 100) / 100 : 0),
        payFrequency: masterVerification?.employment?.payFrequency || '',
        otherEmploymentIncome: masterVerification?.employment?.otherEmploymentIncome || '',
        employmentNotes: masterVerification?.employment?.employmentNotes || '',
        redFlags: masterVerification?.employment?.redFlags || '',
      },

      employmentVerification: {
        sectionStatus: masterVerification?.employmentVerification?.sectionStatus || 'Unverified',
        currentlyWorking: masterVerification?.employmentVerification?.currentlyWorking || {
          asApplied: 'Not Provided',
          verified: '',
          status: 'Unverified',
          notes: '',
          script: 'Are you currently working, either for your own business or for another employer?',
        },
        selfEmployed: masterVerification?.employmentVerification?.selfEmployed || {
          asApplied: 'Not Provided',
          verified: '',
          status: 'Unverified',
          notes: '',
          script: 'Are you currently self-employed or do you work for another employer?',
        },
        employedByAnotherCompany: masterVerification?.employmentVerification?.employedByAnotherCompany || {
          asApplied: 'Not Provided',
          verified: '',
          status: 'Unverified',
          notes: '',
          script: 'Are you currently employed by another company in addition to owning your business?',
        },
        employerName: masterVerification?.employmentVerification?.employerName || {
          asApplied: client.businessName || 'Not Provided',
          verified: client.businessName || '',
          status: 'Unverified',
          notes: '',
          script: 'What is the name of your current employer?',
        },
        jobTitle: masterVerification?.employmentVerification?.jobTitle || {
          asApplied: client.ownerTitle || 'Not Provided',
          verified: client.ownerTitle || '',
          status: 'Unverified',
          notes: '',
          script: 'What is your current job title or position?',
        },
        jobOccupation: masterVerification?.employmentVerification?.jobOccupation || {
          asApplied: client.industry || 'Not Provided',
          verified: client.industry || '',
          status: 'Unverified',
          notes: '',
          script: 'What do you do in your current job?',
        },
        jobDescription: masterVerification?.employmentVerification?.jobDescription || {
          asApplied: client.businessDescription || 'Not Provided',
          verified: client.businessDescription || '',
          status: 'Unverified',
          notes: '',
          script: 'Can you briefly explain what your responsibilities are in your current job?',
        },
        employmentStartDate: masterVerification?.employmentVerification?.employmentStartDate || {
          asApplied: client.businessStartDate || 'Not Provided',
          verified: client.businessStartDate || '',
          status: 'Unverified',
          notes: '',
          script: 'When did you start working for your current employer?',
        },
        yearsWithEmployer: masterVerification?.employmentVerification?.yearsWithEmployer || {
          asApplied: client.timeInBusiness || 'Not Provided',
          verified: client.timeInBusiness || '',
          status: 'Unverified',
          notes: '',
          script: 'How long have you been with your current employer?',
        },
        employmentTypeStatus: masterVerification?.employmentVerification?.employmentTypeStatus || {
          asApplied: 'Not Provided',
          verified: '',
          status: 'Unverified',
          notes: '',
          script: 'Would you consider your current employment full-time, part-time, contract, seasonal, or other?',
        },
        annualSalary: masterVerification?.employmentVerification?.annualSalary || {
          asApplied: client.personalAnnualIncome ? `$${Number(client.personalAnnualIncome).toLocaleString()}` : 'Not Provided',
          verified: client.personalAnnualIncome ? `$${Number(client.personalAnnualIncome).toLocaleString()}` : '',
          status: 'Unverified',
          notes: '',
          script: 'What is your current annual salary?',
        },
        monthlySalary: masterVerification?.employmentVerification?.monthlySalary || {
          asApplied: client.personalMonthlyIncome ? `$${Number(client.personalMonthlyIncome).toLocaleString()}` : (client.personalAnnualIncome ? `$${Math.round(client.personalAnnualIncome / 12).toLocaleString()}` : 'Not Provided'),
          verified: client.personalMonthlyIncome ? `$${Number(client.personalMonthlyIncome).toLocaleString()}` : (client.personalAnnualIncome ? `$${Math.round(client.personalAnnualIncome / 12).toLocaleString()}` : ''),
          status: 'Unverified',
          notes: '',
          script: 'Approximately how much do you earn from your employment each month?',
        },
        annualEmploymentIncome: masterVerification?.employmentVerification?.annualEmploymentIncome || {
          asApplied: client.personalAnnualIncome ? `$${Number(client.personalAnnualIncome).toLocaleString()}` : 'Not Provided',
          verified: '',
          status: 'Unverified',
          notes: '',
          script: 'What is your total annual employment income?',
        },
        monthlyEmploymentIncome: masterVerification?.employmentVerification?.monthlyEmploymentIncome || {
          asApplied: client.personalMonthlyIncome ? `$${Number(client.personalMonthlyIncome).toLocaleString()}` : (client.personalAnnualIncome ? `$${Math.round(client.personalAnnualIncome / 12).toLocaleString()}` : 'Not Provided'),
          verified: '',
          status: 'Unverified',
          notes: '',
          script: 'What is your total monthly employment income?',
        },
        otherMonthlyIncome: masterVerification?.employmentVerification?.otherMonthlyIncome || {
          asApplied: 'Not Provided',
          verified: '',
          status: 'Unverified',
          notes: '',
          script: 'Do you have any other regular monthly income outside of your business or employment?',
        },
        otherIncomeSource: masterVerification?.employmentVerification?.otherIncomeSource || {
          asApplied: 'Not Provided',
          verified: '',
          status: 'Unverified',
          notes: '',
          script: 'What is the source of that additional income?',
        },
        receivesPayStubs: masterVerification?.employmentVerification?.receivesPayStubs || {
          asApplied: 'Not Provided',
          verified: '',
          status: 'Unverified',
          notes: '',
          script: 'Do you receive pay stubs from your employer?',
        },
        paidThroughPayroll: masterVerification?.employmentVerification?.paidThroughPayroll || {
          asApplied: 'Not Provided',
          verified: '',
          status: 'Unverified',
          notes: '',
          script: 'Are you currently paid through a formal payroll system?',
        },
        payFrequency: masterVerification?.employmentVerification?.payFrequency || {
          asApplied: 'Not Provided',
          verified: '',
          status: 'Unverified',
          notes: '',
          script: 'How often do you receive your paycheck?',
        },
        mostRecentPayStubDate: masterVerification?.employmentVerification?.mostRecentPayStubDate || {
          asApplied: 'Not Provided',
          verified: '',
          status: 'Unverified',
          notes: '',
          script: 'What is the date of your most recent pay stub?',
        },
        payStubReceived: masterVerification?.employmentVerification?.payStubReceived || {
          asApplied: 'Not Provided',
          verified: '',
          status: 'Unverified',
          notes: '',
          script: 'Has the pay stub document been received?',
        },
        payStubReviewed: masterVerification?.employmentVerification?.payStubReviewed || {
          asApplied: 'Not Provided',
          verified: '',
          status: 'Unverified',
          notes: '',
          script: 'Has the pay stub been reviewed for accuracy?',
        },
        employmentIncomeNotes: masterVerification?.employmentVerification?.employmentIncomeNotes || '',
        redFlags: masterVerification?.employmentVerification?.redFlags || '',
        updatedAt: masterVerification?.employmentVerification?.updatedAt || new Date().toISOString(),
        updatedBy: masterVerification?.employmentVerification?.updatedBy || currentUser?.name || 'Staff Underwriter',
      },

      income: {
        personalAnnualIncome: masterVerification?.income?.personalAnnualIncome ?? client.personalAnnualIncome ?? 0,
        monthlyBusinessRevenue: masterVerification?.income?.monthlyBusinessRevenue ?? client.monthlyRevenue ?? (client.annualRevenue ? Math.round((client.annualRevenue / 12) * 100) / 100 : 0),
        verifiedPersonalAnnualIncome: masterVerification?.income?.verifiedPersonalAnnualIncome ?? client.personalAnnualIncome ?? 0,
        verifiedMonthlyBusinessRevenue: masterVerification?.income?.verifiedMonthlyBusinessRevenue ?? client.monthlyRevenue ?? (client.annualRevenue ? Math.round((client.annualRevenue / 12) * 100) / 100 : 0),
        exactCreditScore: masterVerification?.income?.exactCreditScore ?? client.creditScore ?? 0,
        revenueTrend: masterVerification?.income?.revenueTrend || 'Consistent',
        revenueTrendExplanation: masterVerification?.income?.revenueTrendExplanation || '',
        incomeNotes: masterVerification?.income?.incomeNotes || '',
        redFlags: masterVerification?.income?.redFlags || '',
      },

      payroll: {
        paysSelfThroughPayroll: masterVerification?.payroll?.paysSelfThroughPayroll ?? false,
        issuesPayStubs: masterVerification?.payroll?.issuesPayStubs ?? false,
        salary: masterVerification?.payroll?.salary ?? client.personalAnnualIncome ?? 0,
        grossPay: masterVerification?.payroll?.grossPay ?? 0,
        netPay: masterVerification?.payroll?.netPay ?? 0,
        payFrequency: masterVerification?.payroll?.payFrequency || '',
        payrollStartDate: masterVerification?.payroll?.payrollStartDate || '',
        latestPayStubDate: masterVerification?.payroll?.latestPayStubDate || '',
        payStubReceived: masterVerification?.payroll?.payStubReceived ?? false,
        payStubReviewed: masterVerification?.payroll?.payStubReviewed ?? false,
        payrollNotes: masterVerification?.payroll?.payrollNotes || '',
        redFlags: masterVerification?.payroll?.redFlags || '',
      },

      banking: {
        primaryBank: masterVerification?.banking?.primaryBank || client.businessBank || '',
        dedicatedBusinessChecking: masterVerification?.banking?.dedicatedBusinessChecking ?? Boolean(client.businessCheckingAccount || client.businessBank),
        businessAccount: masterVerification?.banking?.businessAccount || client.businessCheckingAccount || '',
        personalAccountUsedForBusiness: masterVerification?.banking?.personalAccountUsedForBusiness ?? false,
        businessIncomeDepositedIntoPersonal: masterVerification?.banking?.businessIncomeDepositedIntoPersonal ?? false,
        regularBusinessToPersonalTransfers: masterVerification?.banking?.regularBusinessToPersonalTransfers ?? false,
        transferFrequency: masterVerification?.banking?.transferFrequency || '',
        approximateTransferAmount: masterVerification?.banking?.approximateTransferAmount ?? 0,
        bankingExplanation: masterVerification?.banking?.bankingExplanation || '',
        bankingNotes: masterVerification?.banking?.bankingNotes || '',
        redFlags: masterVerification?.banking?.redFlags || '',
      },

      documentChecklist: masterVerification?.documentChecklist || {
        driversLicense: { received: false, stillNeeded: true, sentAfterCall: false, reviewed: false, notes: '' },
        bankStatements: { received: false, stillNeeded: true, sentAfterCall: false, reviewed: false, notes: '' },
        taxReturns: { received: false, stillNeeded: true, sentAfterCall: false, reviewed: false, notes: '' },
        voidedCheck: { received: false, stillNeeded: true, sentAfterCall: false, reviewed: false, notes: '' },
        articlesOfInc: { received: false, stillNeeded: true, sentAfterCall: false, reviewed: false, notes: '' },
        einLetter: { received: false, stillNeeded: true, sentAfterCall: false, reviewed: false, notes: '' },
        w2Paystubs: { received: false, stillNeeded: true, sentAfterCall: false, reviewed: false, notes: '' },
        businessLicense: { received: false, stillNeeded: true, sentAfterCall: false, reviewed: false, notes: '' },
      },

      existingDebts: masterVerification?.existingDebts || [],
      bankruptcyForeclosureRepossession5Years: masterVerification?.bankruptcyForeclosureRepossession5Years ?? Boolean(client.bankruptcy && client.bankruptcy !== 'None'),
      bankruptcyForeclosureNotes: masterVerification?.bankruptcyForeclosureNotes || client.bankruptcyDetails || '',

      creditCards: masterVerification?.creditCards || [],
      recentCreditActivity: masterVerification?.recentCreditActivity || [],

      housing: {
        homeAddressSameAsBusiness: masterVerification?.housing?.homeAddressSameAsBusiness ?? false,
        homeAddressIfDifferent: masterVerification?.housing?.homeAddressIfDifferent || client.address || '',
        housingType: masterVerification?.housing?.housingType || client.housingStatus || 'Homeowner',
        monthlyMortgageOrRent: masterVerification?.housing?.monthlyMortgageOrRent ?? client.monthlyHousingPayment ?? 0,
        housingNotes: masterVerification?.housing?.housingNotes || '',
        redFlags: masterVerification?.housing?.redFlags || '',
      },

      fundingRequest: {
        requestedAmount: masterVerification?.fundingRequest?.requestedAmount ?? client.requestedAmount ?? 0,
        verifiedRequestedAmount: masterVerification?.fundingRequest?.verifiedRequestedAmount ?? client.requestedAmount ?? 0,
        purposeOfFunds: masterVerification?.fundingRequest?.purposeOfFunds || client.useOfFunds || '',
        fundingUrgency: masterVerification?.fundingRequest?.fundingUrgency || client.fundingUrgency || '',
        purposeNotes: masterVerification?.fundingRequest?.purposeNotes || '',
        redFlags: masterVerification?.fundingRequest?.redFlags || '',
      },

      creditVerification: {
        exactCreditScore: masterVerification?.creditVerification?.exactCreditScore ?? client.creditScore ?? 0,
        creditUnlocked: masterVerification?.creditVerification?.creditUnlocked ?? false,
        fraudAlert: masterVerification?.creditVerification?.fraudAlert ?? false,
        securityFreeze: masterVerification?.creditVerification?.securityFreeze ?? false,
        creditNotes: masterVerification?.creditVerification?.creditNotes || '',
        redFlags: masterVerification?.creditVerification?.redFlags || '',
      },

      underwriterSummary: {
        overallImpression: masterVerification?.underwriterSummary?.overallImpression || '',
        biggestStrength: masterVerification?.underwriterSummary?.biggestStrength || '',
        biggestConcern: masterVerification?.underwriterSummary?.biggestConcern || '',
        cashFlowNotes: masterVerification?.underwriterSummary?.cashFlowNotes || '',
        businessStabilityNotes: masterVerification?.underwriterSummary?.businessStabilityNotes || '',
        additionalDocumentsNeeded: masterVerification?.underwriterSummary?.additionalDocumentsNeeded || '',
        readyForSubmission: masterVerification?.underwriterSummary?.readyForSubmission ?? false,
        reasonIfNo: masterVerification?.underwriterSummary?.reasonIfNo || '',
      },

      finalChecklist: {
        identityVerified: masterVerification?.finalChecklist?.identityVerified ?? false,
        businessVerified: masterVerification?.finalChecklist?.businessVerified ?? false,
        incomeVerified: masterVerification?.finalChecklist?.incomeVerified ?? false,
        employmentVerified: masterVerification?.finalChecklist?.employmentVerified ?? false,
        bankingVerified: masterVerification?.finalChecklist?.bankingVerified ?? false,
        documentsReceived: masterVerification?.finalChecklist?.documentsReceived ?? false,
        existingDebtReviewed: masterVerification?.finalChecklist?.existingDebtReviewed ?? false,
        housingVerified: masterVerification?.finalChecklist?.housingVerified ?? false,
        fundingAmountConfirmed: masterVerification?.finalChecklist?.fundingAmountConfirmed ?? false,
        creditAvailableForPull: masterVerification?.finalChecklist?.creditAvailableForPull ?? false,
        fileReadyForUnderwriting: masterVerification?.finalChecklist?.fileReadyForUnderwriting ?? false,
      },

      updatedAt: new Date().toISOString(),
    };
  };

  const [formData, setFormData] = useState<MasterVerificationData>(initMasterData);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    setFormData(initMasterData());
    setIsDirty(false);
  }, [client.id, masterVerification]);

  // Handle Save with automatic Client profile synchronization
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Save master verification record
      await api.saveMasterVerification(client.id, formData);

      // 2. Synchronize verified financial & profile data back to the core client record
      const clientUpdate: Partial<Client> = {};

      if (formData.income) {
        if (formData.income.verifiedPersonalAnnualIncome !== undefined && formData.income.verifiedPersonalAnnualIncome > 0) {
          clientUpdate.personalAnnualIncome = formData.income.verifiedPersonalAnnualIncome;
          clientUpdate.personalMonthlyIncome = Math.round((formData.income.verifiedPersonalAnnualIncome / 12) * 100) / 100;
        }
        if (formData.income.verifiedMonthlyBusinessRevenue !== undefined && formData.income.verifiedMonthlyBusinessRevenue > 0) {
          clientUpdate.monthlyRevenue = formData.income.verifiedMonthlyBusinessRevenue;
          clientUpdate.annualRevenue = Math.round(formData.income.verifiedMonthlyBusinessRevenue * 12 * 100) / 100;
        }
        if (formData.income.exactCreditScore !== undefined && formData.income.exactCreditScore > 0) {
          clientUpdate.creditScore = formData.income.exactCreditScore;
          clientUpdate.ficoScore = formData.income.exactCreditScore;
        }
      }

      if (formData.fundingRequest) {
        if (formData.fundingRequest.verifiedRequestedAmount !== undefined && formData.fundingRequest.verifiedRequestedAmount > 0) {
          clientUpdate.requestedAmount = formData.fundingRequest.verifiedRequestedAmount;
        }
        if (formData.fundingRequest.purposeOfFunds) {
          clientUpdate.useOfFunds = formData.fundingRequest.purposeOfFunds;
        }
      }

      if (formData.business) {
        if (formData.business.businessName?.verified) clientUpdate.businessName = formData.business.businessName.verified;
        if (formData.business.dba?.verified) clientUpdate.dba = formData.business.dba.verified;
        if (formData.business.businessAddress?.verified) clientUpdate.businessAddress = formData.business.businessAddress.verified;
        if (formData.business.ein?.verified) clientUpdate.federalTaxId = formData.business.ein.verified;
        if (formData.business.stateOfIncorporation?.verified) clientUpdate.stateOfOrganization = formData.business.stateOfIncorporation.verified;
        if (formData.business.entityType?.verified) clientUpdate.entityType = formData.business.entityType.verified;
        if (formData.business.industry?.verified) clientUpdate.industry = formData.business.industry.verified;
      }

      if (formData.identity) {
        if (formData.identity.phone?.verified) clientUpdate.phone = formData.identity.phone.verified;
        if (formData.identity.email?.verified) clientUpdate.email = formData.identity.email.verified;
        if (formData.identity.dob?.verified) clientUpdate.dob = formData.identity.dob.verified;
      }

      if (Object.keys(clientUpdate).length > 0) {
        await updateClient(client.id, clientUpdate);
      }

      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      addToast(
        'success',
        'Verification File Saved',
        `Master Verification Form for ${client.firstName} ${client.lastName} saved & synchronized to Underwriting.`
      );
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save verification file.');
    } finally {
      setIsSaving(false);
    }
  };

  // Add Debt Handler
  const handleAddDebt = () => {
    if (!newDebtForm.lender) {
      addToast('warning', 'Missing Field', 'Please provide a lender name.');
      return;
    }
    const newDebt: ExistingDebtRecord = {
      id: `debt-${Date.now()}`,
      clientId: client.id,
      lender: newDebtForm.lender || 'Lender',
      loanType: (newDebtForm.loanType as any) || 'Term Loan',
      originalLoanAmount: Number(newDebtForm.originalLoanAmount) || 0,
      termMonths: Number(newDebtForm.termMonths) || 36,
      monthlyPayment: Number(newDebtForm.monthlyPayment) || 0,
      currentBalance: Number(newDebtForm.currentBalance) || 0,
      status: (newDebtForm.status as any) || 'Current',
    };
    setFormData((prev) => ({
      ...prev,
      existingDebts: [...(prev.existingDebts || []), newDebt],
    }));
    setIsDirty(true);
    setSaveSuccess(false);
    setShowAddDebtModal(false);
    setNewDebtForm({
      lender: '',
      loanType: 'Term Loan',
      originalLoanAmount: 0,
      monthlyPayment: 0,
      currentBalance: 0,
      status: 'Current',
    });
    addToast('success', 'Debt Record Added', `Added ${newDebt.lender} to verification liabilities.`);
  };

  const handleDeleteDebt = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      existingDebts: (prev.existingDebts || []).filter((d) => d.id !== id),
    }));
    setIsDirty(true);
    setSaveSuccess(false);
    addToast('info', 'Record Removed', 'Debt record removed from worksheet.');
  };

  // Add Card Handler
  const handleAddCard = () => {
    if (!newCardForm.issuer) {
      addToast('warning', 'Missing Field', 'Please provide a card issuer.');
      return;
    }
    const newCard: CreditCardRecord = {
      id: `card-${Date.now()}`,
      clientId: client.id,
      cardCategory: (newCardForm.cardCategory as any) || 'BUSINESS',
      issuer: newCardForm.issuer || 'Bank',
      cardName: newCardForm.cardName || 'Business Card',
      cardholder: `${client.firstName} ${client.lastName}`,
      creditLimit: Number(newCardForm.creditLimit) || 0,
      currentBalance: Number(newCardForm.currentBalance) || 0,
      availableCredit: Math.max(0, (Number(newCardForm.creditLimit) || 0) - (Number(newCardForm.currentBalance) || 0)),
      monthlyPayment: Number(newCardForm.monthlyPayment) || 0,
      utilization: Number(newCardForm.creditLimit) > 0 ? Math.round(((Number(newCardForm.currentBalance) || 0) / Number(newCardForm.creditLimit)) * 100) : 0,
      lastFourDigits: newCardForm.lastFourDigits || '0000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setFormData((prev) => ({
      ...prev,
      creditCards: [...(prev.creditCards || []), newCard],
    }));
    setIsDirty(true);
    setSaveSuccess(false);
    setShowAddCardModal(false);
    setNewCardForm({
      cardCategory: 'BUSINESS',
      issuer: '',
      cardName: '',
      creditLimit: 0,
      currentBalance: 0,
      availableCredit: 0,
      monthlyPayment: 0,
      utilization: 0,
      lastFourDigits: '',
    });
    addToast('success', 'Credit Card Added', `Added ${newCard.issuer} to verification profile.`);
  };

  const handleDeleteCard = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      creditCards: (prev.creditCards || []).filter((c) => c.id !== id),
    }));
    setIsDirty(true);
    setSaveSuccess(false);
    addToast('info', 'Card Removed', 'Credit card record removed.');
  };

  // Helper for MasterVerificationField updates
  const updateField = (
    section: 'identity' | 'business',
    field: string,
    key: keyof MasterVerificationField,
    val: string
  ) => {
    setIsDirty(true);
    setSaveSuccess(false);
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: {
          ...prev[section][field],
          [key]: val,
        },
      },
    }));
  };

  // Dedicated Helper for Employment, Salary & Payroll Verification Field Updates
  const updateEmploymentField = (
    field: keyof EmploymentSalaryPayrollVerification,
    key: keyof MasterVerificationField,
    val: string
  ) => {
    setIsDirty(true);
    setSaveSuccess(false);
    setFormData((prev: any) => {
      const existingSection = prev.employmentVerification || {};
      const existingField = existingSection[field] || {
        asApplied: '',
        verified: '',
        status: 'Unverified',
        notes: '',
      };
      return {
        ...prev,
        employmentVerification: {
          ...existingSection,
          [field]: {
            ...existingField,
            [key]: val,
          },
        },
      };
    });
  };

  // Helper for Top-Level Employment Section properties (Notes, Red Flags, Status)
  const updateEmploymentProperty = (
    property: 'sectionStatus' | 'employmentIncomeNotes' | 'redFlags',
    val: any
  ) => {
    setIsDirty(true);
    setSaveSuccess(false);
    setFormData((prev: any) => {
      const existingSection = prev.employmentVerification || {};
      return {
        ...prev,
        employmentVerification: {
          ...existingSection,
          [property]: val,
        },
      };
    });
  };

  // Helper to detect all fields across identity, business, and employment that remain Unverified
  const getUnverifiedItems = () => {
    const list: string[] = [];

    if (formData.identity) {
      Object.entries(formData.identity).forEach(([k, field]) => {
        if (field && typeof field === 'object' && 'status' in field) {
          if ((field as any).status === 'Unverified') {
            list.push(`Identity: ${k}`);
          }
        }
      });
    }

    if (formData.business) {
      Object.entries(formData.business).forEach(([k, field]) => {
        if (field && typeof field === 'object' && 'status' in field) {
          if ((field as any).status === 'Unverified') {
            list.push(`Business: ${k}`);
          }
        }
      });
    }

    if (formData.employmentVerification) {
      Object.entries(formData.employmentVerification).forEach(([k, field]) => {
        if (field && typeof field === 'object' && 'status' in field) {
          if ((field as any).status === 'Unverified') {
            list.push(`Employment: ${k}`);
          }
        }
      });
    }

    return list;
  };

  const unverifiedList = getUnverifiedItems();
  const hasUnverifiedItems = unverifiedList.length > 0;

  // Handle Mark Verification Complete Sign-Off
  const handleMarkVerificationComplete = async () => {
    if (hasUnverifiedItems) {
      addToast(
        'error',
        'Verification Incomplete',
        `Cannot complete verification. ${unverifiedList.length} item(s) remain marked 'Unverified'. Please review all verification fields.`
      );
      return;
    }

    if (!verifiedByName.trim()) {
      addToast('warning', 'Missing Sign-Off Name', 'Please enter your name in the "Verified By" field before marking complete.');
      return;
    }

    setIsCompleting(true);
    try {
      const timestamp = new Date().toISOString();
      const updatedData: MasterVerificationData = {
        ...formData,
        status: 'COMPLETE',
        overallResult: 'APPROVED_FOR_UNDERWRITING',
        verifiedBy: verifiedByName.trim(),
        verifiedAt: timestamp,
        finalChecklist: {
          ...formData.finalChecklist,
          identityVerified: true,
          businessVerified: true,
          incomeVerified: true,
          employmentVerified: true,
          bankingVerified: true,
          documentsReceived: true,
          existingDebtReviewed: true,
          housingVerified: true,
          fundingAmountConfirmed: true,
          creditAvailableForPull: true,
          fileReadyForUnderwriting: true,
        },
      };

      // 1. Save to masterVerifications doc
      await api.saveMasterVerification(client.id, updatedData);

      // 2. Advance client status to UNDERWRITING
      await updateClient(client.id, {
        currentStatus: 'UNDERWRITING',
      });

      // 3. Log timeline event
      try {
        await firestoreService.createTimelineEvent({
          clientId: client.id,
          type: 'STATUS_CHANGE',
          title: 'Master Verification Completed & Signed Off',
          description: `Master Verification officially signed off by ${verifiedByName.trim()}. Client pipeline stage advanced to Underwriting.`,
          staffMember: verifiedByName.trim(),
          timestamp,
        });
      } catch (logErr) {
        console.warn('Could not log timeline event:', logErr);
      }

      setFormData(updatedData);
      addToast(
        'success',
        'Verification Complete!',
        `Master Verification successfully signed off by ${verifiedByName.trim()}. Client has been advanced to Underwriting.`
      );
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Sign-Off Failed', err.message || 'Could not complete verification sign-off.');
    } finally {
      setIsCompleting(false);
    }
  };

  // Render a standard Verification Field row (As Applied vs Verified + Status + Notes + Call Script)
  const renderFieldRow = (
    section: 'identity' | 'business',
    fieldKey: string,
    label: string,
    scriptText: string,
    fieldData?: MasterVerificationField,
    inputType: 'text' | 'date' | 'textarea' = 'text'
  ) => {
    const safeFieldData: MasterVerificationField = fieldData || {
      asApplied: '',
      verified: '',
      status: 'Unverified',
      notes: '',
      script: scriptText,
    };
    return (
      <div
        key={fieldKey}
        className="p-4 bg-[#070d18] border border-blue-900/40 hover:border-blue-700/60 rounded-xl space-y-3 transition-colors shadow-sm"
      >
        {/* Row Header with Label & Verification Status Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-900/30 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Status:</span>
            <select
              value={safeFieldData.status || 'Unverified'}
              onChange={(e) => updateField(section, fieldKey, 'status', e.target.value as VerificationStatusType)}
              className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border focus:outline-none transition-colors cursor-pointer ${
                safeFieldData.status === 'Verified' || safeFieldData.status === 'Matches Application'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/80'
                  : safeFieldData.status === 'Client Corrected It'
                  ? 'bg-blue-950 text-blue-300 border-blue-500/80'
                  : safeFieldData.status === 'Needs Correction'
                  ? 'bg-amber-950 text-amber-300 border-amber-500/80'
                  : 'bg-rose-950 text-rose-300 border-rose-500/80'
              }`}
            >
              <option value="Unverified" className="bg-[#0b1528] text-rose-300 font-bold">Unverified</option>
              <option value="Verified" className="bg-[#0b1528] text-emerald-300 font-bold">Verified</option>
              <option value="Matches Application" className="bg-[#0b1528] text-emerald-300 font-bold">Matches Application</option>
              <option value="Client Corrected It" className="bg-[#0b1528] text-cyan-300 font-bold">Client Corrected It</option>
              <option value="Needs Correction" className="bg-[#0b1528] text-amber-300 font-bold">Needs Correction</option>
              <option value="Pending" className="bg-[#0b1528] text-slate-300 font-bold">Pending</option>
            </select>
          </div>
        </div>

        {/* Prominent Call Script / What to Ask */}
        {scriptText && (
          <div className="flex items-start gap-2 bg-blue-950/40 border border-blue-800/40 rounded-lg p-2.5 text-xs text-blue-200/90 font-medium italic">
            <PhoneCall className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 not-italic block mb-0.5">
                Verification Script / What to Ask
              </span>
              <span>"{scriptText}"</span>
            </div>
          </div>
        )}

        {/* As Applied vs Verified Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">
              As Applied / Application Answer
            </label>
            {inputType === 'textarea' ? (
              <textarea
                rows={2}
                value={safeFieldData.asApplied || ''}
                onChange={(e) => updateField(section, fieldKey, 'asApplied', e.target.value)}
                placeholder="As reported on intake application..."
                className="w-full bg-[#0b1528] border border-blue-900/60 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400 resize-y"
              />
            ) : (
              <input
                type={inputType === 'date' ? 'date' : 'text'}
                value={safeFieldData.asApplied || ''}
                onChange={(e) => updateField(section, fieldKey, 'asApplied', e.target.value)}
                placeholder="As reported..."
                className="w-full bg-[#0b1528] border border-blue-900/60 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400 font-medium"
              />
            )}
          </div>

          <div>
            <label className="block text-[10px] text-emerald-400 font-semibold mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>Verified / Corrected Value</span>
              <span className="text-[9px] text-emerald-500 font-normal">Active Underwriting Value</span>
            </label>
            {inputType === 'textarea' ? (
              <textarea
                rows={2}
                value={safeFieldData.verified || ''}
                onChange={(e) => updateField(section, fieldKey, 'verified', e.target.value)}
                placeholder="Verified value confirmed with client..."
                className="w-full bg-[#0b1528] border border-emerald-500/50 rounded-lg p-2 text-xs text-emerald-200 font-bold focus:outline-none focus:border-emerald-400 resize-y"
              />
            ) : (
              <input
                type={inputType === 'date' ? 'date' : 'text'}
                value={safeFieldData.verified || ''}
                onChange={(e) => updateField(section, fieldKey, 'verified', e.target.value)}
                placeholder="Verified value..."
                className="w-full bg-[#0b1528] border border-emerald-500/50 rounded-lg p-2 text-xs text-emerald-200 font-bold focus:outline-none focus:border-emerald-400 font-mono"
              />
            )}
          </div>
        </div>

        {/* Verification Notes */}
        <div>
          <input
            type="text"
            value={safeFieldData.notes || ''}
            onChange={(e) => updateField(section, fieldKey, 'notes', e.target.value)}
            placeholder={`Verification notes for ${label.toLowerCase()} (e.g. verified on call, document match)...`}
            className="w-full bg-[#0b1528] border border-blue-900/40 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-700"
          />
        </div>
      </div>
    );
  };

  // Render a Structured Employment / Salary / Payroll Verification Row with Call Script
  const renderEmploymentField = (
    fieldKey: keyof EmploymentSalaryPayrollVerification,
    label: string,
    scriptText: string,
    fieldData?: MasterVerificationField,
    inputType: 'text' | 'yesno' | 'date' | 'textarea' | 'employmentType' | 'payFrequency' = 'text'
  ) => {
    const safeData: MasterVerificationField = fieldData || {
      asApplied: '',
      verified: '',
      status: 'Unverified',
      notes: '',
      script: scriptText,
    };

    return (
      <div
        key={fieldKey as string}
        className="p-4 bg-[#070d18] border border-blue-900/40 rounded-xl space-y-3 hover:border-blue-700/60 transition-colors shadow-sm"
      >
        {/* Row Header with Label & Verification Status Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-900/30 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Status:</span>
            <select
              value={safeData.status || 'Unverified'}
              onChange={(e) => updateEmploymentField(fieldKey, 'status', e.target.value as VerificationStatusType)}
              className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border focus:outline-none transition-colors ${
                safeData.status === 'Verified' || safeData.status === 'Matches Application'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : safeData.status === 'Client Corrected It'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : safeData.status === 'Needs Correction'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              <option value="Unverified">Unverified</option>
              <option value="Verified">Verified</option>
              <option value="Matches Application">Matches Application</option>
              <option value="Client Corrected It">Client Corrected It</option>
              <option value="Needs Correction">Needs Correction</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Script Callout Box */}
        {scriptText && (
          <div className="flex items-start gap-2 bg-blue-950/40 border border-blue-800/40 rounded-lg p-2.5 text-xs text-blue-200/90 font-medium italic">
            <PhoneCall className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 not-italic block mb-0.5">
                Verification Script
              </span>
              <span>"{scriptText}"</span>
            </div>
          </div>
        )}

        {/* As Applied vs Verified Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">
              As Applied / Application Answer
            </label>
            {inputType === 'textarea' ? (
              <textarea
                rows={2}
                value={safeData.asApplied || ''}
                onChange={(e) => updateEmploymentField(fieldKey, 'asApplied', e.target.value)}
                placeholder="As reported on intake application..."
                className="w-full bg-[#0b1528] border border-blue-900/60 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400 resize-y"
              />
            ) : inputType === 'yesno' ? (
              <select
                value={safeData.asApplied || 'Yes'}
                onChange={(e) => updateEmploymentField(fieldKey, 'asApplied', e.target.value)}
                className="w-full bg-[#0b1528] border border-blue-900/60 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400 font-medium"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            ) : inputType === 'employmentType' ? (
              <select
                value={safeData.asApplied || 'Full-Time'}
                onChange={(e) => updateEmploymentField(fieldKey, 'asApplied', e.target.value)}
                className="w-full bg-[#0b1528] border border-blue-900/60 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Seasonal">Seasonal</option>
                <option value="Other">Other</option>
              </select>
            ) : inputType === 'payFrequency' ? (
              <select
                value={safeData.asApplied || 'Biweekly'}
                onChange={(e) => updateEmploymentField(fieldKey, 'asApplied', e.target.value)}
                className="w-full bg-[#0b1528] border border-blue-900/60 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
              >
                <option value="Weekly">Weekly</option>
                <option value="Biweekly">Biweekly</option>
                <option value="Semi-Monthly">Semi-Monthly</option>
                <option value="Monthly">Monthly</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <input
                type={inputType === 'date' ? 'date' : 'text'}
                value={safeData.asApplied || ''}
                onChange={(e) => updateEmploymentField(fieldKey, 'asApplied', e.target.value)}
                placeholder="As reported..."
                className="w-full bg-[#0b1528] border border-blue-900/60 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
              />
            )}
          </div>

          <div>
            <label className="block text-[10px] text-emerald-400 font-semibold mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>Verified / Corrected Value</span>
              <span className="text-[9px] text-emerald-500 font-normal">Active Underwriting Value</span>
            </label>
            {inputType === 'textarea' ? (
              <textarea
                rows={2}
                value={safeData.verified || ''}
                onChange={(e) => updateEmploymentField(fieldKey, 'verified', e.target.value)}
                placeholder="Verified duties / description..."
                className="w-full bg-[#0b1528] border border-emerald-500/50 rounded-lg p-2 text-xs text-emerald-200 font-semibold focus:outline-none focus:border-emerald-400 resize-y"
              />
            ) : inputType === 'yesno' ? (
              <select
                value={safeData.verified || 'Yes'}
                onChange={(e) => updateEmploymentField(fieldKey, 'verified', e.target.value)}
                className="w-full bg-[#0b1528] border border-emerald-500/50 rounded-lg p-2 text-xs text-emerald-200 font-bold focus:outline-none focus:border-emerald-400"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            ) : inputType === 'employmentType' ? (
              <select
                value={safeData.verified || 'Full-Time'}
                onChange={(e) => updateEmploymentField(fieldKey, 'verified', e.target.value)}
                className="w-full bg-[#0b1528] border border-emerald-500/50 rounded-lg p-2 text-xs text-emerald-200 font-bold focus:outline-none focus:border-emerald-400"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Seasonal">Seasonal</option>
                <option value="Other">Other</option>
              </select>
            ) : inputType === 'payFrequency' ? (
              <select
                value={safeData.verified || 'Biweekly'}
                onChange={(e) => updateEmploymentField(fieldKey, 'verified', e.target.value)}
                className="w-full bg-[#0b1528] border border-emerald-500/50 rounded-lg p-2 text-xs text-emerald-200 font-bold focus:outline-none focus:border-emerald-400"
              >
                <option value="Weekly">Weekly</option>
                <option value="Biweekly">Biweekly</option>
                <option value="Semi-Monthly">Semi-Monthly</option>
                <option value="Monthly">Monthly</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <input
                type={inputType === 'date' ? 'date' : 'text'}
                value={safeData.verified || ''}
                onChange={(e) => updateEmploymentField(fieldKey, 'verified', e.target.value)}
                placeholder="Verified value..."
                className="w-full bg-[#0b1528] border border-emerald-500/50 rounded-lg p-2 text-xs text-emerald-200 font-bold focus:outline-none focus:border-emerald-400 font-mono"
              />
            )}
          </div>
        </div>

        {/* Verification Notes */}
        <div>
          <input
            type="text"
            value={safeData.notes || ''}
            onChange={(e) => updateEmploymentField(fieldKey, 'notes', e.target.value)}
            placeholder={`Verification notes for ${label.toLowerCase()} (e.g. corroborating documents, HR confirmation, pay stub reference)...`}
            className="w-full bg-[#0b1528] border border-blue-900/40 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-700"
          />
        </div>
      </div>
    );
  };

  const renderSectionSaveBar = (sectionName: string, nextSectionId?: string, nextSectionLabel?: string) => (
    <div className="pt-4 border-t border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#070d18] p-4 rounded-xl border border-blue-900/40 mt-4">
      <div className="flex items-center space-x-2 text-xs">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            isDirty
              ? 'bg-amber-400 animate-pulse'
              : saveSuccess
              ? 'bg-emerald-400'
              : 'bg-blue-400'
          }`}
        />
        <span className="text-slate-300 font-medium">
          {isDirty ? (
            <span className="text-amber-300 font-semibold">Unsaved edits in {sectionName}</span>
          ) : saveSuccess ? (
            <span className="text-emerald-300 font-semibold">All changes in {sectionName} saved & synced ✓</span>
          ) : (
            <span>{sectionName} synchronized with Underwriting & 360 view</span>
          )}
        </span>
      </div>
      <div className="flex items-center space-x-2 shrink-0">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
            isDirty
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-400/40'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : isDirty ? 'text-slate-950' : 'text-amber-400'}`} />
          <span>{isSaving ? 'Saving...' : `Save ${sectionName}`}</span>
        </button>
        {nextSectionId && nextSectionLabel && (
          <button
            type="button"
            onClick={async () => {
              if (isDirty) await handleSave();
              setActiveSection(nextSectionId);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
          >
            <span>{nextSectionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 relative">
      {/* Top Banner */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                  Master Verification Form
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                  formData.status === 'COMPLETE'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  Status: {formData.status || 'IN_PROGRESS'}
                </span>
                {isDirty && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    ● Unsaved Changes
                  </span>
                )}
                {saveSuccess && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ✓ Saved & Synced
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  Specialist: <strong className="text-slate-200">{formData.verificationSpecialist}</strong>
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-400 font-mono">Date: {formatDate(formData.date)}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-100 mt-1">
                Live Phone & Underwriting Verification Worksheet
              </h2>
              <p className="text-xs text-slate-400">
                Complete 16-section verification file with "As Applied" vs "Verified" audit synchronization.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              onClick={handleSave}
              disabled={isSaving || isCompleting}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-lg ${
                isDirty
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-400/50'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
              }`}
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : isDirty ? 'text-slate-950' : 'text-white'}`} />
              <span>{isSaving ? 'Saving...' : isDirty ? 'Save Verification Changes' : 'Save Draft'}</span>
            </button>
          </div>
        </div>

        {/* VERIFIED BY SIGN-OFF SECTION */}
        <div className="mt-4 pt-4 border-t border-blue-900/50 bg-[#070d18] border border-blue-900/60 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Underwriting Sign-Off Gatekeeper
              </span>
              {hasUnverifiedItems ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {unverifiedList.length} Unverified Item(s) Remaining
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  All Fields Verified
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {formData.status === 'COMPLETE' && formData.verifiedBy ? (
                <span className="text-emerald-300 font-semibold">
                  Signed off by <strong className="text-white">{formData.verifiedBy}</strong> on{' '}
                  {formData.verifiedAt ? formatDate(formData.verifiedAt) : 'N/A'}. Client advanced to Underwriting.
                </span>
              ) : (
                'All fields must be confirmed and verified before signing off. Marking complete advances client pipeline to Underwriting.'
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-[#0b1528] border border-blue-900/60 rounded-xl px-3 py-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Verified By:</label>
              <input
                type="text"
                value={verifiedByName}
                onChange={(e) => setVerifiedByName(e.target.value)}
                placeholder="Underwriter / Staff Name"
                className="bg-transparent text-xs text-emerald-300 font-semibold focus:outline-none w-36 sm:w-44"
              />
            </div>

            <button
              onClick={handleMarkVerificationComplete}
              disabled={isCompleting || hasUnverifiedItems}
              title={
                hasUnverifiedItems
                  ? `Cannot mark complete while ${unverifiedList.length} items remain Unverified.`
                  : 'Sign off verification and advance client to Underwriting'
              }
              className={`flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                hasUnverifiedItems
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{isCompleting ? 'Completing...' : 'Mark Verification Complete'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MASTER CALL SCRIPT INTRODUCTION BANNER */}
      <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-inner">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
              Caller Opening Script (Read Word-For-Word)
            </span>
            <p className="text-xs text-blue-100 italic leading-relaxed">
              "Hello {client ? `${client.firstName} ${client.lastName}` : 'there'}, this is <strong className="text-amber-300 not-italic">{formData.verificationSpecialist || 'Underwriting Verification'}</strong> calling regarding your active business funding application for <strong className="text-amber-300 not-italic">{client?.businessName || formData.business.businessName.verified || 'your business'}</strong>. I'm conducting your quick 5-minute file verification call to verify your business details and deposit history so we can finalize lender submissions. Do you have a quick moment?"
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-blue-900/40 border border-blue-700/50 text-blue-300 font-bold uppercase">
            Live Call Mode
          </span>
        </div>
      </div>

      {/* Section Navigation Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-blue-900/60">
        {[
          { id: 'identity', label: '1. Identity & Contact', icon: User },
          { id: 'business', label: '2. Business Profile', icon: Building2 },
          { id: 'income', label: '3. Income, Revenue & Employment', icon: DollarSign },
          { id: 'banking', label: '4. Banking & Accounts', icon: CreditCard },
          { id: 'debts', label: '5. Existing Debts & Cards', icon: Briefcase },
          { id: 'housing', label: '6. Housing & Urgency', icon: Home },
          { id: 'checklist', label: '7. Final 11-Checklist & Summary', icon: ShieldCheck },
        ].map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-[#0b1528] text-slate-400 hover:text-slate-200 border border-blue-900/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: IDENTITY & CONTACT */}
      {activeSection === 'identity' && (
        <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" />
              Identity & Contact Information
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-400 font-mono">5 Verification Fields</span>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-blue-900/60 rounded-lg text-xs font-semibold"
              >
                <Save className="w-3 h-3 text-amber-400" />
                <span>Save Section</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFieldRow(
              'identity',
              'legalName',
              'Client Legal Name',
              'Can you please confirm your full legal name as it appears on your government-issued ID?',
              formData.identity.legalName
            )}
            {renderFieldRow(
              'identity',
              'phone',
              'Primary Contact Phone',
              'Can you confirm the best direct phone number where our team and lenders can reach you?',
              formData.identity.phone
            )}
            {renderFieldRow(
              'identity',
              'email',
              'Primary Email Address',
              'What is your primary email address for receiving official funding agreements and disclosures?',
              formData.identity.email
            )}
            {renderFieldRow(
              'identity',
              'dob',
              'Date of Birth',
              'Can you please confirm your date of birth for identity and credit bureau verification?',
              formData.identity.dob,
              'date'
            )}
            {renderFieldRow(
              'identity',
              'ssnLast4',
              'SSN (Last 4 Digits)',
              'Can you please confirm the last 4 digits of your Social Security Number for identity verification?',
              formData.identity.ssnLast4
            )}
          </div>
          {renderSectionSaveBar('Identity & Contact', 'business', 'Next: Business Profile')}
        </div>
      )}

      {/* SECTION 2: BUSINESS PROFILE */}
      {activeSection === 'business' && (
        <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Business Organization & Entity Details
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-400 font-mono">10 Verification Fields</span>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-blue-900/60 rounded-lg text-xs font-semibold"
              >
                <Save className="w-3 h-3 text-amber-400" />
                <span>Save Section</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFieldRow(
              'business',
              'businessName',
              'Legal Business Name',
              'Can you please confirm the exact legal name of your business as registered on your official documents?',
              formData.business.businessName
            )}
            {renderFieldRow(
              'business',
              'dba',
              'DBA (If Applicable)',
              'Does your company operate under any DBA or trade name, or is it strictly operating under the legal name?',
              formData.business.dba
            )}
            {renderFieldRow(
              'business',
              'businessAddress',
              'Physical Business Address',
              'What is the physical commercial address where your business operates?',
              formData.business.businessAddress
            )}
            {renderFieldRow(
              'business',
              'ein',
              'Federal Tax ID (EIN)',
              'Can you please confirm your Federal Employer Identification Number (EIN) as assigned by the IRS?',
              formData.business.ein
            )}
            {renderFieldRow(
              'business',
              'stateOfIncorporation',
              'State of Incorporation',
              'In which state is your business entity legally registered?',
              formData.business.stateOfIncorporation
            )}
            {renderFieldRow(
              'business',
              'entityType',
              'Entity Structure (LLC, S-Corp, etc.)',
              'What is the legal structure of your business entity (such as LLC, S-Corp, C-Corp, or Sole Proprietorship)?',
              formData.business.entityType
            )}
            {renderFieldRow(
              'business',
              'businessStartDate',
              'Business Inception Date',
              'What is the official start date or inception date of your business?',
              formData.business.businessStartDate,
              'date'
            )}
            {renderFieldRow(
              'business',
              'ownershipPercentage',
              'Ownership Percentage',
              'What percentage of the business do you personally own?',
              formData.business.ownershipPercentage
            )}
            {renderFieldRow(
              'business',
              'industry',
              'Industry / NAICS Sector',
              'What primary industry or commercial sector does your business operate within?',
              formData.business.industry
            )}
            {renderFieldRow(
              'business',
              'businessDescription',
              'Business Nature & Description',
              'Can you briefly describe the primary operations and products or services your business provides?',
              formData.business.businessDescription,
              'textarea'
            )}
          </div>
          {renderSectionSaveBar('Business Organization', 'income', 'Next: Income & Payroll')}
        </div>
      )}

      {/* SECTION 3: INCOME & REVENUE + EMPLOYMENT, SALARY & PAYROLL */}
      {activeSection === 'income' && (
        <div className="space-y-6">
          {/* Top Card: Verified Monthly Business Revenue, Personal Income, & Credit Score */}
          <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Income, Monthly Revenue & Credit Score Verification
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Revenue & Personal Income Verification</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#070d18] border border-blue-900/40 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold">
                    Verified Monthly Business Revenue
                  </label>
                  <span className="text-[9px] text-emerald-400 font-mono uppercase font-bold">Bank Deposits</span>
                </div>
                <div className="flex items-start gap-1.5 bg-blue-950/40 border border-blue-800/40 rounded-lg p-2 text-[11px] text-blue-200/90 italic">
                  <PhoneCall className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <span>"Can you please confirm your average gross monthly revenue across all business accounts?"</span>
                </div>
                <input
                  type="number"
                  value={formData.income.verifiedMonthlyBusinessRevenue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      income: {
                        ...formData.income,
                        verifiedMonthlyBusinessRevenue: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full bg-[#0b1528] border border-emerald-500/50 rounded-lg p-2 text-emerald-300 font-bold font-mono text-sm focus:outline-none"
                />
              </div>

              <div className="p-4 bg-[#070d18] border border-blue-900/40 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold">
                    Verified Personal Annual Income
                  </label>
                  <span className="text-[9px] text-emerald-400 font-mono uppercase font-bold">Total Sources</span>
                </div>
                <div className="flex items-start gap-1.5 bg-blue-950/40 border border-blue-800/40 rounded-lg p-2 text-[11px] text-blue-200/90 italic">
                  <PhoneCall className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <span>"What is your total personal annual income from all sources, including salary and draws?"</span>
                </div>
                <input
                  type="number"
                  value={formData.income.verifiedPersonalAnnualIncome}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      income: {
                        ...formData.income,
                        verifiedPersonalAnnualIncome: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full bg-[#0b1528] border border-emerald-500/50 rounded-lg p-2 text-emerald-300 font-bold font-mono text-sm focus:outline-none"
                />
              </div>

              <div className="p-4 bg-[#070d18] border border-blue-900/40 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold">
                    Exact Numeric Credit Score
                  </label>
                  <span className="text-[9px] text-amber-400 font-mono uppercase font-bold">Bureau Confirmed</span>
                </div>
                <div className="flex items-start gap-1.5 bg-blue-950/40 border border-blue-800/40 rounded-lg p-2 text-[11px] text-blue-200/90 italic">
                  <PhoneCall className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <span>"What is your approximate credit score, and are all credit bureaus unlocked for lender review?"</span>
                </div>
                <input
                  type="number"
                  value={formData.income.exactCreditScore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      income: {
                        ...formData.income,
                        exactCreditScore: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full bg-[#0b1528] border border-amber-500/50 rounded-lg p-2 text-amber-300 font-bold font-mono text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-blue-900/40">
              <div className="p-4 bg-[#070d18] border border-blue-900/40 rounded-xl space-y-2.5">
                <label className="block text-xs font-semibold text-slate-300">Revenue Trend (Past 3-6 Months)</label>
                <div className="flex items-start gap-1.5 bg-blue-950/40 border border-blue-800/40 rounded-lg p-2 text-[11px] text-blue-200/90 italic">
                  <PhoneCall className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <span>"How has your business revenue trended over the past 3 to 6 months—steady, growing, or fluctuating?"</span>
                </div>
                <select
                  value={formData.income.revenueTrend}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      income: {
                        ...formData.income,
                        revenueTrend: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-[#0b1528] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none"
                >
                  <option value="Consistent">Consistent Revenue Flow</option>
                  <option value="Increased">Growing / Increasing Revenue</option>
                  <option value="Decreased">Declining Revenue</option>
                </select>
              </div>

              <div className="p-4 bg-[#070d18] border border-blue-900/40 rounded-xl space-y-2.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Revenue Explanation & Consistency Notes
                </label>
                <div className="flex items-start gap-1.5 bg-blue-950/40 border border-blue-800/40 rounded-lg p-2 text-[11px] text-blue-200/90 italic">
                  <PhoneCall className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <span>"Could you provide a brief explanation of any recent changes or drivers behind your revenue trend?"</span>
                </div>
                <input
                  type="text"
                  value={formData.income.revenueTrendExplanation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      income: {
                        ...formData.income,
                        revenueTrendExplanation: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. Seasonal peak in Q4, expanded sales team in Q2..."
                  className="w-full bg-[#0b1528] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* NEW SECTION: EMPLOYMENT, SALARY & PAYROLL VERIFICATION */}
          <div className="bg-[#0b1528] border-2 border-amber-500/50 p-6 rounded-2xl shadow-2xl space-y-6">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-900/60 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider">
                      Canonical Underwriting Record
                    </span>
                    <span className="text-xs text-slate-400">
                      Syncs to Firebase Verification Database
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-100 mt-1 uppercase tracking-wide">
                    Employment, Salary & Payroll Verification
                  </h2>
                </div>
              </div>

              {/* Section Status & Save Section Button */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Section Status:</span>
                  <select
                    value={formData.employmentVerification?.sectionStatus || 'Verified'}
                    onChange={(e) => updateEmploymentProperty('sectionStatus', e.target.value)}
                    className="bg-[#070d18] border border-blue-900 rounded-lg px-2.5 py-1 text-xs font-bold text-amber-300 focus:outline-none"
                  >
                    <option value="Verified">Verified</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                    <option value="Needs Correction">Needs Correction</option>
                    <option value="Unverified">Unverified</option>
                  </select>
                </div>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Section'}</span>
                </button>
              </div>
            </div>

            {/* Sub-Section 1: Employment Status */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-blue-900/40 pb-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  1. Employment Status
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderEmploymentField(
                  'currentlyWorking',
                  'Are you currently working?',
                  'Are you currently working, either for your own business or for another employer?',
                  formData.employmentVerification?.currentlyWorking,
                  'yesno'
                )}

                {renderEmploymentField(
                  'selfEmployed',
                  'Are you self-employed?',
                  'Are you currently self-employed or do you work for another employer?',
                  formData.employmentVerification?.selfEmployed,
                  'yesno'
                )}

                {renderEmploymentField(
                  'employedByAnotherCompany',
                  'Employed by another company?',
                  'Are you currently employed by another company in addition to owning your business?',
                  formData.employmentVerification?.employedByAnotherCompany,
                  'yesno'
                )}
              </div>
            </div>

            {/* Sub-Section 2: Employment & Occupation Details */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-blue-900/40 pb-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                  2. If Currently Working / Employment & Occupation Details
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderEmploymentField(
                  'employerName',
                  'Employer Name',
                  'What is the name of your current employer?',
                  formData.employmentVerification?.employerName,
                  'text'
                )}

                {renderEmploymentField(
                  'jobTitle',
                  'Job Title / Position',
                  'What is your current job title or position?',
                  formData.employmentVerification?.jobTitle,
                  'text'
                )}

                {renderEmploymentField(
                  'jobOccupation',
                  'Job / Occupation',
                  'What do you do in your current job?',
                  formData.employmentVerification?.jobOccupation,
                  'text'
                )}

                {renderEmploymentField(
                  'employmentTypeStatus',
                  'Employment Status / Type',
                  'Would you consider your current employment full-time, part-time, contract, seasonal, or other?',
                  formData.employmentVerification?.employmentTypeStatus,
                  'employmentType'
                )}

                {renderEmploymentField(
                  'employmentStartDate',
                  'Employment Start Date',
                  'When did you start working for your current employer?',
                  formData.employmentVerification?.employmentStartDate,
                  'date'
                )}

                {renderEmploymentField(
                  'yearsWithEmployer',
                  'Years With Current Employer',
                  'How long have you been with your current employer?',
                  formData.employmentVerification?.yearsWithEmployer,
                  'text'
                )}
              </div>

              {/* Job Description (Full width) */}
              <div>
                {renderEmploymentField(
                  'jobDescription',
                  'Job Description',
                  'Can you briefly explain what your responsibilities are in your current job?',
                  formData.employmentVerification?.jobDescription,
                  'textarea'
                )}
              </div>
            </div>

            {/* Sub-Section 3: Employment Income */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-blue-900/40 pb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  3. Employment Income
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderEmploymentField(
                  'annualSalary',
                  'Annual Salary',
                  'What is your current annual salary?',
                  formData.employmentVerification?.annualSalary,
                  'text'
                )}

                {renderEmploymentField(
                  'monthlySalary',
                  'Monthly Salary',
                  'Approximately how much do you earn from your employment each month?',
                  formData.employmentVerification?.monthlySalary,
                  'text'
                )}

                {renderEmploymentField(
                  'annualEmploymentIncome',
                  'Annual Employment Income',
                  'What is your total annual employment income?',
                  formData.employmentVerification?.annualEmploymentIncome,
                  'text'
                )}

                {renderEmploymentField(
                  'monthlyEmploymentIncome',
                  'Monthly Employment Income',
                  'What is your total monthly employment income?',
                  formData.employmentVerification?.monthlyEmploymentIncome,
                  'text'
                )}

                {renderEmploymentField(
                  'otherMonthlyIncome',
                  'Other Monthly Income',
                  'Do you have any other regular monthly income outside of your business or employment?',
                  formData.employmentVerification?.otherMonthlyIncome,
                  'text'
                )}

                {renderEmploymentField(
                  'otherIncomeSource',
                  'Other Income Source',
                  'What is the source of that additional income?',
                  formData.employmentVerification?.otherIncomeSource,
                  'text'
                )}
              </div>
            </div>

            {/* Sub-Section 4: Pay Stub & Payroll Verification */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-blue-900/40 pb-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  4. Pay Stub & Payroll Verification
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderEmploymentField(
                  'receivesPayStubs',
                  'Do you receive pay stubs?',
                  'Do you receive pay stubs from your employer?',
                  formData.employmentVerification?.receivesPayStubs,
                  'yesno'
                )}

                {renderEmploymentField(
                  'paidThroughPayroll',
                  'Paid through payroll?',
                  'Are you currently paid through a formal payroll system?',
                  formData.employmentVerification?.paidThroughPayroll,
                  'yesno'
                )}

                {renderEmploymentField(
                  'payFrequency',
                  'Pay Frequency',
                  'How often do you receive your paycheck?',
                  formData.employmentVerification?.payFrequency,
                  'payFrequency'
                )}

                {renderEmploymentField(
                  'mostRecentPayStubDate',
                  'Most Recent Pay Stub Date',
                  'What is the date of your most recent pay stub?',
                  formData.employmentVerification?.mostRecentPayStubDate,
                  'date'
                )}

                {renderEmploymentField(
                  'payStubReceived',
                  'Pay Stub Received?',
                  'Has the pay stub document been received?',
                  formData.employmentVerification?.payStubReceived,
                  'yesno'
                )}

                {renderEmploymentField(
                  'payStubReviewed',
                  'Pay Stub Reviewed?',
                  'Has the pay stub been reviewed for accuracy?',
                  formData.employmentVerification?.payStubReviewed,
                  'yesno'
                )}
              </div>
            </div>

            {/* Sub-Section 5 & 6: Employment Notes & Red Flags */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              {/* 5. Employment / Income Notes */}
              <div className="p-4 bg-[#070d18] border border-blue-900/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-blue-400" />
                    Employment / Income Notes
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Verification Call Notes</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Record nuances, explanations, employer confirmations, or special payroll arrangements discovered during verification:
                </p>
                <textarea
                  rows={4}
                  value={formData.employmentVerification?.employmentIncomeNotes || ''}
                  onChange={(e) => updateEmploymentProperty('employmentIncomeNotes', e.target.value)}
                  placeholder="e.g. Client verified dual income streams: salary from Apex Healthcare plus owner draws from LLC..."
                  className="w-full bg-[#0b1528] border border-blue-900/60 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-400 resize-y"
                />
              </div>

              {/* 6. Red Flags */}
              <div className="p-4 bg-rose-950/20 border border-rose-900/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Red Flags & Underwriting Concerns
                  </label>
                  <span className="text-[10px] text-rose-400/80 font-mono">Risk Flagging</span>
                </div>
                <p className="text-[11px] text-rose-200/70">
                  Highlight unverified employment, missing stubs, salary variances, recent job hops, or conflicting employer info:
                </p>
                <textarea
                  rows={4}
                  value={formData.employmentVerification?.redFlags || ''}
                  onChange={(e) => updateEmploymentProperty('redFlags', e.target.value)}
                  placeholder="Record any discrepancies or 'None' if clean..."
                  className="w-full bg-[#0b1528] border border-rose-900/70 rounded-xl p-3 text-xs text-rose-200 focus:outline-none focus:border-rose-400 resize-y"
                />
              </div>
            </div>

            {/* Bottom Action / Save Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-blue-900/60 bg-[#070d18] p-4 rounded-xl">
              <div className="text-xs text-slate-400">
                <span>Last updated: </span>
                <span className="font-mono text-slate-200">
                  {formData.employmentVerification?.updatedAt
                    ? formatDateTime(formData.employmentVerification.updatedAt)
                    : 'Current session'}
                </span>
                <span className="ml-2 text-amber-400 font-semibold">
                  • Synced with Underwriting & 360 View
                </span>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Master Verification...' : 'Save All Verification Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: BANKING */}
      {activeSection === 'banking' && (
        <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Banking & Cashflow Accounts Verification
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Operating Accounts & Cashflow</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#070d18] border border-blue-900/40 rounded-xl space-y-2.5">
              <label className="block text-xs font-semibold text-slate-300">Primary Banking Institution</label>
              <div className="flex items-start gap-1.5 bg-blue-950/40 border border-blue-800/40 rounded-lg p-2 text-[11px] text-blue-200/90 italic">
                <PhoneCall className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <span>"What is the name of the primary financial institution where your company maintains its main operating checking account?"</span>
              </div>
              <input
                type="text"
                value={formData.banking.primaryBank}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    banking: { ...formData.banking, primaryBank: e.target.value },
                  })
                }
                placeholder="e.g. Chase Bank, Bank of America, Wells Fargo"
                className="w-full bg-[#0b1528] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="p-4 bg-[#070d18] border border-blue-900/40 rounded-xl space-y-2.5">
              <label className="block text-xs font-semibold text-slate-300">Business Account Title / Number</label>
              <div className="flex items-start gap-1.5 bg-blue-950/40 border border-blue-800/40 rounded-lg p-2 text-[11px] text-blue-200/90 italic">
                <PhoneCall className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <span>"Can you confirm the account title and the last 4 digits of your primary business checking account?"</span>
              </div>
              <input
                type="text"
                value={formData.banking.businessAccount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    banking: { ...formData.banking, businessAccount: e.target.value },
                  })
                }
                placeholder="e.g. Acme Corp Primary Operating #4821"
                className="w-full bg-[#0b1528] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="p-4 bg-[#070d18] border border-blue-900/40 rounded-xl space-y-2.5">
              <label className="block text-xs font-semibold text-slate-300">Approximate Monthly Transfer Amount</label>
              <div className="flex items-start gap-1.5 bg-blue-950/40 border border-blue-800/40 rounded-lg p-2 text-[11px] text-blue-200/90 italic">
                <PhoneCall className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <span>"Approximately what dollar amount do you transfer monthly from the business as owner draws or payroll?"</span>
              </div>
              <input
                type="number"
                value={formData.banking.approximateTransferAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    banking: {
                      ...formData.banking,
                      approximateTransferAmount: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                placeholder="e.g. 8500"
                className="w-full bg-[#0b1528] border border-blue-900/70 rounded-xl p-2.5 text-xs text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-blue-900/40">
            <div className="p-4 bg-[#070d18] border border-blue-900/40 rounded-xl space-y-2">
              <div className="flex items-start gap-1.5 bg-blue-950/40 border border-blue-800/40 rounded-lg p-2 text-[11px] text-blue-200/90 italic mb-2">
                <PhoneCall className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <span>"Do you maintain a dedicated business checking account used exclusively for corporate business transactions?"</span>
              </div>
              <label className="flex items-center space-x-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.banking.dedicatedBusinessChecking}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      banking: { ...formData.banking, dedicatedBusinessChecking: e.target.checked },
                    })
                  }
                  className="rounded border-blue-800 text-amber-500 focus:ring-0"
                />
                <span className="font-semibold text-slate-200">Dedicated Business Checking Account Used Exclusively</span>
              </label>
            </div>

            <div className="p-4 bg-[#070d18] border border-blue-900/40 rounded-xl space-y-2">
              <div className="flex items-start gap-1.5 bg-blue-950/40 border border-blue-800/40 rounded-lg p-2 text-[11px] text-blue-200/90 italic mb-2">
                <PhoneCall className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <span>"Do you make regular scheduled owner draws or transfers from your business checking account into your personal account?"</span>
              </div>
              <label className="flex items-center space-x-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.banking.regularBusinessToPersonalTransfers}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      banking: {
                        ...formData.banking,
                        regularBusinessToPersonalTransfers: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-blue-800 text-amber-500 focus:ring-0"
                />
                <span className="font-semibold text-slate-200">Regular Owner Draw / Business-to-Personal Transfers</span>
              </label>
            </div>
          </div>
          {renderSectionSaveBar('Banking & Cashflow', 'debts', 'Next: Debts & Cards')}
        </div>
      )}

      {/* SECTION 5: DEBTS & CREDIT CARDS */}
      {activeSection === 'debts' && (
        <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Existing Loans, Lines of Credit & MCAs ({(formData.existingDebts || []).length} Records)
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center space-x-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-blue-900/60 rounded-lg text-xs font-semibold"
                >
                  <Save className="w-3 h-3 text-amber-400" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => setShowAddDebtModal(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Debt</span>
                </button>
              </div>
            </div>

            {/* Script Callout for Existing Loans */}
            <div className="flex items-start gap-2 bg-blue-950/40 border border-blue-800/40 rounded-lg p-2.5 text-xs text-blue-200/90 font-medium italic mt-3">
              <PhoneCall className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 not-italic block mb-0.5">
                  Verification Script / What to Ask
                </span>
                <span>"Do you currently have any open business term loans, equipment financing, SBA loans, lines of credit, or Merchant Cash Advances (MCAs) with daily or weekly debits?"</span>
              </div>
            </div>

            <div className="space-y-3 mt-3">
              {(formData.existingDebts || []).map((debt, idx) => (
                <div
                  key={debt.id || idx}
                  className="p-3.5 rounded-xl bg-[#070d18] border border-blue-900/40 grid grid-cols-1 md:grid-cols-6 gap-3 text-xs items-center"
                >
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Lender</span>
                    <div className="font-bold text-slate-100">{debt.lender}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Loan Type</span>
                    <div className="text-amber-300">{debt.loanType}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Monthly Payment</span>
                    <div className="font-mono font-bold text-slate-200">
                      ${debt.monthlyPayment?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Current Balance</span>
                    <div className="font-mono font-bold text-red-300">
                      ${debt.currentBalance?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Status</span>
                    <div className="text-emerald-400 font-semibold">{debt.status}</div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleDeleteDebt(debt.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove debt record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {(formData.existingDebts || []).length === 0 && (
                <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-blue-900/40 rounded-xl">
                  No existing loans or credit lines logged. Click &quot;Add Existing Debt&quot; above.
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Business & Personal Credit Cards ({(formData.creditCards || []).length} Records)
              </h3>
              <button
                onClick={() => setShowAddCardModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Credit Card</span>
              </button>
            </div>

            {/* Script Callout for Credit Cards */}
            <div className="flex items-start gap-2 bg-blue-950/40 border border-blue-800/40 rounded-lg p-2.5 text-xs text-blue-200/90 font-medium italic mt-3">
              <PhoneCall className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 not-italic block mb-0.5">
                  Verification Script / What to Ask
                </span>
                <span>"Can you please confirm your open revolving business and personal credit cards, including the issuing bank, credit limits, and approximate current balances?"</span>
              </div>
            </div>

            <div className="space-y-3 mt-3">
              {(formData.creditCards || []).map((card, idx) => (
                <div
                  key={card.id || idx}
                  className="p-3.5 rounded-xl bg-[#070d18] border border-blue-900/40 grid grid-cols-1 md:grid-cols-6 gap-3 text-xs items-center"
                >
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Card & Issuer</span>
                    <div className="font-bold text-slate-100">{card.issuer} - {card.cardName}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Category</span>
                    <div className="text-blue-300">{card.cardCategory}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Credit Limit</span>
                    <div className="font-mono font-bold text-slate-200">
                      ${card.creditLimit?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Balance / Utilization</span>
                    <div className="font-mono font-bold text-amber-300">
                      ${card.currentBalance?.toLocaleString()} ({card.utilization}%)
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Available</span>
                    <div className="text-emerald-400 font-mono font-bold">
                      ${card.availableCredit?.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove card record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {(formData.creditCards || []).length === 0 && (
                <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-blue-900/40 rounded-xl">
                  No credit cards logged. Click &quot;Add Credit Card&quot; above.
                </div>
              )}
            </div>
          </div>
          {renderSectionSaveBar('Debts & Credit Profile', 'housing', 'Next: Housing & Request')}
        </div>
      )}

      {/* SECTION 6: HOUSING & FUNDING REQUEST */}
      {activeSection === 'housing' && (
        <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Home className="w-4 h-4" />
              Housing & Funding Request Verification
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-400 font-mono">Living Status & Capital Timeline</span>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-blue-900/60 rounded-lg text-xs font-semibold"
              >
                <Save className="w-3 h-3 text-amber-400" />
                <span>Save Section</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#070d18] border border-blue-900/40 rounded-xl space-y-2.5">
              <label className="block text-xs font-semibold text-slate-300">Housing Type</label>
              <div className="flex items-start gap-1.5 bg-blue-950/40 border border-blue-800/40 rounded-lg p-2 text-[11px] text-blue-200/90 italic">
                <PhoneCall className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <span>"Do you own your primary residence, rent, or have another living arrangement?"</span>
              </div>
              <select
                value={formData.housing.housingType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    housing: { ...formData.housing, housingType: e.target.value as any },
                  })
                }
                className="w-full bg-[#0b1528] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="Homeowner">Homeowner</option>
                <option value="Renter">Renter</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="p-4 bg-[#070d18] border border-blue-900/40 rounded-xl space-y-2.5">
              <label className="block text-xs font-semibold text-slate-300">Monthly Mortgage / Rent</label>
              <div className="flex items-start gap-1.5 bg-blue-950/40 border border-blue-800/40 rounded-lg p-2 text-[11px] text-blue-200/90 italic">
                <PhoneCall className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <span>"What is your approximate monthly mortgage or rent payment for your primary residence?"</span>
              </div>
              <input
                type="number"
                value={formData.housing.monthlyMortgageOrRent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    housing: {
                      ...formData.housing,
                      monthlyMortgageOrRent: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                placeholder="e.g. 2400"
                className="w-full bg-[#0b1528] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono font-bold"
              />
            </div>

            <div className="p-4 bg-[#070d18] border border-blue-900/40 rounded-xl space-y-2.5">
              <label className="block text-xs font-semibold text-slate-300">Funding Urgency</label>
              <div className="flex items-start gap-1.5 bg-blue-950/40 border border-blue-800/40 rounded-lg p-2 text-[11px] text-blue-200/90 italic">
                <PhoneCall className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <span>"What is your timeline for deploying these funds—are you looking to fund immediately within 48 hours, this week, or this month?"</span>
              </div>
              <select
                value={formData.fundingRequest.fundingUrgency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fundingRequest: {
                      ...formData.fundingRequest,
                      fundingUrgency: e.target.value as any,
                    },
                  })
                }
                className="w-full bg-[#0b1528] border border-blue-900/70 rounded-xl p-2.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
              >
                <option value="Immediately">Immediately (Within 48 Hours)</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
              </select>
            </div>
          </div>
          {renderSectionSaveBar('Housing & Funding Request', 'checklist', 'Next: Final Checklist')}
        </div>
      )}

      {/* SECTION 7: FINAL 11-CHECKLIST & SUMMARY */}
      {activeSection === 'checklist' && (
        <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Final 11-Point Verification Audit Checklist
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-slate-400 font-mono">11 Quality Gate Milestones</span>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center space-x-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-blue-900/60 rounded-lg text-xs font-semibold"
                >
                  <Save className="w-3 h-3 text-amber-400" />
                  <span>Save</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              All 11 verification milestones must be confirmed prior to submitting the deal file to institutional lenders.
            </p>

            {/* Script Callout for Checklist */}
            <div className="flex items-start gap-2 bg-blue-950/40 border border-blue-800/40 rounded-lg p-2.5 text-xs text-blue-200/90 font-medium italic mt-3 mb-4">
              <PhoneCall className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 not-italic block mb-0.5">
                  Verification Closing Script / Next Steps Explanation
                </span>
                <span>"Thank you for confirming all items. Our underwriting desk will now assemble your verified funding package and match it with our institutional lender network. We will follow up with your term sheets shortly."</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {Object.entries(formData.finalChecklist).map(([key, val]) => (
                <label
                  key={key}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    val
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                      : 'bg-[#070d18] border-blue-900/40 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-semibold capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(val)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        finalChecklist: {
                          ...formData.finalChecklist,
                          [key]: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-blue-800 text-emerald-500 focus:ring-0"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-blue-900/60 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Underwriter Impression & Readiness Decision
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Overall Impression</label>
                <select
                  value={formData.underwriterSummary.overallImpression}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      underwriterSummary: {
                        ...formData.underwriterSummary,
                        overallImpression: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs font-bold text-emerald-300 focus:outline-none"
                >
                  <option value="Excellent">Excellent Tier-1 Profile</option>
                  <option value="Good">Good Standard Profile</option>
                  <option value="Fair">Fair Profile (Requires Mitigating Factors)</option>
                  <option value="Needs More Info">Needs More Information</option>
                  <option value="High Risk">High Risk</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ready for Institutional Submission
                </label>
                <select
                  value={formData.underwriterSummary.readyForSubmission ? 'YES' : 'NO'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      underwriterSummary: {
                        ...formData.underwriterSummary,
                        readyForSubmission: e.target.value === 'YES',
                      },
                    })
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs font-bold text-slate-100 focus:outline-none"
                >
                  <option value="YES">YES - Ready for Submission</option>
                  <option value="NO">NO - Hold for Stips / Corrections</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Biggest Core Strength</label>
              <input
                type="text"
                value={formData.underwriterSummary.biggestStrength}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    underwriterSummary: {
                      ...formData.underwriterSummary,
                      biggestStrength: e.target.value,
                    },
                  })
                }
                placeholder="e.g. Strong recurring cashflow, low existing debt, 740+ FICO..."
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 7 Sign-off Box */}
          <div className="pt-4 border-t border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#070d18] p-4 rounded-xl border border-blue-900/40">
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Final Verification Sign-Off & Status Advance
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {hasUnverifiedItems ? (
                  <span className="text-rose-300 font-semibold">
                    {unverifiedList.length} items remain marked &quot;Unverified&quot;. Resolve them to enable sign-off.
                  </span>
                ) : (
                  'All fields verified. Enter your name and mark complete to move client to UNDERWRITING.'
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <input
                type="text"
                value={verifiedByName}
                onChange={(e) => setVerifiedByName(e.target.value)}
                placeholder="Verified By (Your Name)"
                className="bg-[#0b1528] border border-blue-900/60 rounded-xl px-3 py-2 text-xs text-emerald-300 font-semibold focus:outline-none w-44"
              />
              <button
                type="button"
                onClick={handleMarkVerificationComplete}
                disabled={isCompleting || hasUnverifiedItems}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                  hasUnverifiedItems
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                {isCompleting ? 'Completing...' : 'Mark Verification Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ADD DEBT MODAL */}
      {showAddDebtModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b1528] border border-blue-900/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-400" />
              Add Existing Debt / Loan Record
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Lender Name *</label>
                <input
                  type="text"
                  value={newDebtForm.lender}
                  onChange={(e) => setNewDebtForm({ ...newDebtForm, lender: e.target.value })}
                  placeholder="e.g. OnDeck / Kabbage / Chase"
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Loan Type</label>
                  <select
                    value={newDebtForm.loanType}
                    onChange={(e) => setNewDebtForm({ ...newDebtForm, loanType: e.target.value as any })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                  >
                    <option value="Term Loan">Term Loan</option>
                    <option value="MCA">MCA</option>
                    <option value="Business Line of Credit">Business Line of Credit</option>
                    <option value="Equipment Financing">Equipment Financing</option>
                    <option value="SBA Loan">SBA Loan</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={newDebtForm.status}
                    onChange={(e) => setNewDebtForm({ ...newDebtForm, status: e.target.value as any })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                  >
                    <option value="Current">Current</option>
                    <option value="Paid in Full">Paid in Full</option>
                    <option value="Defaulted">Defaulted</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Original ($)</label>
                  <input
                    type="number"
                    value={newDebtForm.originalLoanAmount}
                    onChange={(e) => setNewDebtForm({ ...newDebtForm, originalLoanAmount: Number(e.target.value) })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2 text-slate-100 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Current ($)</label>
                  <input
                    type="number"
                    value={newDebtForm.currentBalance}
                    onChange={(e) => setNewDebtForm({ ...newDebtForm, currentBalance: Number(e.target.value) })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2 text-red-300 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Monthly ($)</label>
                  <input
                    type="number"
                    value={newDebtForm.monthlyPayment}
                    onChange={(e) => setNewDebtForm({ ...newDebtForm, monthlyPayment: Number(e.target.value) })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2 text-slate-100 font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddDebtModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddDebt}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20"
              >
                Add Debt Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CREDIT CARD MODAL */}
      {showAddCardModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b1528] border border-blue-900/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              Add Credit Card Record
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Issuer / Bank *</label>
                  <input
                    type="text"
                    value={newCardForm.issuer}
                    onChange={(e) => setNewCardForm({ ...newCardForm, issuer: e.target.value })}
                    placeholder="e.g. Chase / Amex"
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Card Product</label>
                  <input
                    type="text"
                    value={newCardForm.cardName}
                    onChange={(e) => setNewCardForm({ ...newCardForm, cardName: e.target.value })}
                    placeholder="Ink Business / Platinum"
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={newCardForm.cardCategory}
                    onChange={(e) => setNewCardForm({ ...newCardForm, cardCategory: e.target.value as any })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                  >
                    <option value="BUSINESS">Business Card</option>
                    <option value="PERSONAL">Personal Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Last 4 Digits</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newCardForm.lastFourDigits}
                    onChange={(e) => setNewCardForm({ ...newCardForm, lastFourDigits: e.target.value })}
                    placeholder="4412"
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Credit Limit ($)</label>
                  <input
                    type="number"
                    value={newCardForm.creditLimit}
                    onChange={(e) => setNewCardForm({ ...newCardForm, creditLimit: Number(e.target.value) })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2 text-slate-100 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Balance ($)</label>
                  <input
                    type="number"
                    value={newCardForm.currentBalance}
                    onChange={(e) => setNewCardForm({ ...newCardForm, currentBalance: Number(e.target.value) })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2 text-amber-300 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Min Pay ($)</label>
                  <input
                    type="number"
                    value={newCardForm.monthlyPayment}
                    onChange={(e) => setNewCardForm({ ...newCardForm, monthlyPayment: Number(e.target.value) })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2 text-slate-100 font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddCardModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCard}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20"
              >
                Add Credit Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Sticky Quick-Save Bar when edits are present */}
      {isDirty && (
        <div className="sticky bottom-4 z-40 bg-[#070d18]/95 backdrop-blur-md border border-amber-500/50 p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 animate-pulse">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-100">You have unsaved verification edits</p>
              <p className="text-[11px] text-slate-400">Save now to persist and synchronize across all tabs & underwriters</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/50"
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Saving Changes...' : 'Save All Verification Changes'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
