import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle,
  Building2,
  User,
  Phone,
  Mail,
  DollarSign,
  Briefcase,
  Landmark,
  FileSearch,
  ArrowRight,
  RefreshCw,
  Edit3,
  ShieldAlert,
  HelpCircle,
  Check,
  CreditCard,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Client, FundingProductType } from '../../types';

interface UploadApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated?: (newClient: Client) => void;
}

export const UploadApplicationModal: React.FC<UploadApplicationModalProps> = ({
  isOpen,
  onClose,
  onClientCreated,
}) => {
  const { clients, setSelectedClientId, addToast } = useData();
  const { currentUser } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flow step: 'UPLOAD' | 'EXTRACTING' | 'REVIEW' | 'SAVING'
  const [step, setStep] = useState<'UPLOAD' | 'EXTRACTING' | 'REVIEW' | 'SAVING'>('UPLOAD');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [extractionProgress, setExtractionProgress] = useState<string>('Initializing document analyzer...');

  // Extracted data & duplicate states
  const [extractedData, setExtractedData] = useState<any>(null);
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [duplicateResolution, setDuplicateResolution] = useState<'CREATE_NEW' | 'MERGE_EXISTING'>('CREATE_NEW');
  const [selectedDuplicateClientId, setSelectedDuplicateClientId] = useState<string>('');
  const [modelUsed, setModelUsed] = useState<string>('Gemini AI Document Intelligence');
  const [confidenceScore, setConfidenceScore] = useState<number>(0.96);
  const [summary, setSummary] = useState<string>('');
  const [unfoundFields, setUnfoundFields] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable Form State in Review Screen
  const [formData, setFormData] = useState({
    // Applicant / Identity
    firstName: '',
    middleName: '',
    lastName: '',
    ssn: '',
    dob: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    personalAnnualIncome: '',
    housingStatus: 'Homeowner',
    driversLicenseNumber: '',
    driversLicenseState: '',

    // Contact
    phone: '',
    altPhone: '',
    email: '',
    businessPhone: '',
    businessEmail: '',

    // Business & Entity
    businessName: '',
    dba: '',
    federalTaxId: '',
    stateOfOrganization: '',
    entityType: 'LLC',
    industry: 'Commercial Services',
    businessStartDate: '',
    timeInBusiness: '',
    ownershipPercentage: '100',
    ownerTitle: 'Owner / President',
    businessDescription: '',

    // Business Address
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessZip: '',

    // Revenue & Financials
    annualRevenue: '',
    monthlyRevenue: '',
    creditScore: '700',

    // Funding Request
    requestedAmount: '75000',
    requestedProduct: 'Revenue Funding' as FundingProductType,
    useOfFunds: 'Working Capital',
    fundingUrgency: 'Immediate / This Week',

    // Banking
    businessBank: '',
    businessRoutingNumber: '',
    businessCheckingAccount: '',

    // Existing Debts
    existingLoans: 'None',
    existingMcas: 'None',
    lenderBalances: '$0',

    // Assignment
    assignedStaff: 'Dana',
    assignedSalesRep: 'Steve',
  });

  if (!isOpen) return null;

  const handleReset = () => {
    setStep('UPLOAD');
    setSelectedFile(null);
    setFileBase64('');
    setExtractedData(null);
    setDuplicateMatches([]);
    setDuplicateResolution('CREATE_NEW');
    setSelectedDuplicateClientId('');
    setErrorMsg(null);
    setUnfoundFields([]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    const validExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const fileNameLower = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileNameLower.endsWith(ext));

    if (!isValid) {
      setErrorMsg('Unsupported file type. Please upload a PDF, DOC, DOCX, JPG, JPEG, or PNG business loan application.');
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);

    // Read as Base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFileBase64(base64);
      runAiExtraction(file, base64);
    };
    reader.onerror = () => {
      setErrorMsg('Error reading uploaded file.');
    };
    reader.readAsDataURL(file);
  };

  const runAiExtraction = async (file: File, base64: string) => {
    setStep('EXTRACTING');
    setExtractionProgress('Uploading & scanning business loan application...');

    try {
      setTimeout(() => {
        setExtractionProgress('AI reading applicant, business entity, and revenue fields...');
      }, 1000);

      setTimeout(() => {
        setExtractionProgress('Cross-referencing Client Master 360 database for existing client duplicates...');
      }, 2200);

      const res = await api.extractBusinessLoanApplication({
        file,
        fileName: file.name,
        fileBase64: base64,
        fileMimeType: file.type,
      });

      const extracted = res.extractedData || {};
      const duplicates = res.duplicateMatches || [];

      setExtractedData(extracted);
      setDuplicateMatches(duplicates);
      if (duplicates.length > 0) {
        setSelectedDuplicateClientId(duplicates[0].existingClient?.id || '');
        setDuplicateResolution('MERGE_EXISTING');
      } else {
        setDuplicateResolution('CREATE_NEW');
      }

      setModelUsed(res.modelUsed || 'Gemini 2.5 Intelligence');
      setConfidenceScore(res.confidence || 0.96);
      setSummary(res.summary || 'Business loan application successfully extracted.');
      setUnfoundFields(res.unfoundFields || []);

      // Populate review form data
      setFormData({
        firstName: extracted.firstName || '',
        middleName: extracted.middleName || '',
        lastName: extracted.lastName || '',
        ssn: extracted.ssn || '',
        dob: extracted.dob || '',
        address: extracted.address || '',
        city: extracted.city || '',
        state: extracted.state || '',
        zip: extracted.zip || '',
        personalAnnualIncome: extracted.personalAnnualIncome ? String(extracted.personalAnnualIncome) : '',
        housingStatus: extracted.housingStatus || 'Homeowner',
        driversLicenseNumber: extracted.driversLicenseNumber || '',
        driversLicenseState: extracted.driversLicenseState || extracted.state || '',

        phone: extracted.phone || '',
        altPhone: extracted.altPhone || '',
        email: extracted.email || '',
        businessPhone: extracted.businessPhone || extracted.phone || '',
        businessEmail: extracted.businessEmail || extracted.email || '',

        businessName: extracted.businessName || '',
        dba: extracted.dba || '',
        federalTaxId: extracted.federalTaxId || '',
        stateOfOrganization: extracted.stateOfOrganization || extracted.state || '',
        entityType: extracted.entityType || 'LLC',
        industry: extracted.industry || 'Commercial Services',
        businessStartDate: extracted.businessStartDate || '',
        timeInBusiness: extracted.timeInBusiness || '',
        ownershipPercentage: extracted.ownershipPercentage !== undefined ? String(extracted.ownershipPercentage) : '100',
        ownerTitle: extracted.ownerTitle || 'Owner / President',
        businessDescription: extracted.businessDescription || '',

        businessAddress: extracted.businessAddress || extracted.address || '',
        businessCity: extracted.businessCity || extracted.city || '',
        businessState: extracted.businessState || extracted.state || '',
        businessZip: extracted.businessZip || extracted.zip || '',

        annualRevenue: extracted.annualRevenue ? String(extracted.annualRevenue) : '',
        monthlyRevenue: extracted.monthlyRevenue ? String(extracted.monthlyRevenue) : '',
        creditScore: extracted.creditScore ? String(extracted.creditScore) : '700',

        requestedAmount: extracted.requestedAmount ? String(extracted.requestedAmount) : '75000',
        requestedProduct: (extracted.requestedProduct as FundingProductType) || 'Revenue Funding',
        useOfFunds: extracted.useOfFunds || 'Working Capital & Growth Expansion',
        fundingUrgency: extracted.fundingUrgency || 'Immediate / This Week',

        businessBank: extracted.businessBank || '',
        businessRoutingNumber: extracted.businessRoutingNumber || '',
        businessCheckingAccount: extracted.businessCheckingAccount || '',

        existingLoans: extracted.existingLoans || 'None',
        existingMcas: extracted.existingMcas || 'None',
        lenderBalances: extracted.lenderBalances || '$0',

        assignedStaff: 'Dana',
        assignedSalesRep: 'Steve',
      });

      setStep('REVIEW');
    } catch (err: any) {
      console.error('AI application extraction failed:', err);
      setErrorMsg(err.message || 'AI extraction failed. You can still input details manually.');
      setStep('REVIEW');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'annualRevenue' && value && !isNaN(Number(value))) {
        updated.monthlyRevenue = String(Math.round(Number(value) / 12));
      }
      return updated;
    });
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName && !formData.firstName) {
      setErrorMsg('Please specify at least a business name or applicant name.');
      return;
    }

    setStep('SAVING');
    setErrorMsg(null);

    const clientPayload: Partial<Client> = {
      firstName: formData.firstName.trim(),
      middleName: formData.middleName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      ssn: formData.ssn.trim(),
      dob: formData.dob.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      zip: formData.zip.trim(),

      businessName: formData.businessName.trim(),
      dba: formData.dba.trim(),
      businessPhone: formData.businessPhone.trim() || formData.phone.trim(),
      businessEmail: formData.businessEmail.trim() || formData.email.trim(),
      businessAddress: formData.businessAddress.trim() || formData.address.trim(),
      businessCity: formData.businessCity.trim() || formData.city.trim(),
      businessState: formData.businessState.trim() || formData.state.trim(),
      businessZip: formData.businessZip.trim() || formData.zip.trim(),

      industry: formData.industry.trim(),
      businessStartDate: formData.businessStartDate.trim(),
      businessStartDateUnderCurrentOwnership: formData.businessStartDate.trim(),
      federalTaxId: formData.federalTaxId.trim(),
      stateOfOrganization: formData.stateOfOrganization.trim() || formData.state.trim(),
      entityType: formData.entityType,
      annualRevenue: Number(formData.annualRevenue) || 0,
      monthlyRevenue: Number(formData.monthlyRevenue) || (Number(formData.annualRevenue) ? Math.round(Number(formData.annualRevenue) / 12) : 0),
      ownershipPercentage: Number(formData.ownershipPercentage) || 100,
      ownerTitle: formData.ownerTitle.trim() || 'Owner / President',
      businessDescription: formData.businessDescription.trim(),

      leadSource: 'Business Loan Application',
      referralPartner: '',
      assignedSalesRep: formData.assignedSalesRep || 'Steve',
      assignedStaff: formData.assignedStaff || 'Dana',
      currentStatus: 'Application Received',

      requestedAmount: Number(formData.requestedAmount) || 50000,
      requestedProduct: formData.requestedProduct || 'Revenue Funding',
      useOfFunds: formData.useOfFunds.trim() || 'Working Capital',
      creditScore: Number(formData.creditScore) || 700,

      existingLoans: formData.existingLoans || 'None',
      existingMcas: formData.existingMcas || 'None',
      lenderBalances: formData.lenderBalances || '$0',
      bankruptcy: 'None',
      foreclosure: 'None',
      repossession: 'None',

      isVerified: false,
      isUnderwritten: false,
    };

    try {
      const isMerge = duplicateResolution === 'MERGE_EXISTING' && Boolean(selectedDuplicateClientId);

      const result = await api.createClientFromApplication({
        clientData: clientPayload,
        duplicateAction: isMerge ? 'merge' : 'create',
        existingClientId: isMerge ? selectedDuplicateClientId : undefined,
        uploadedBy: currentUser?.name || 'Admin',
        fileData: selectedFile
          ? {
              fileName: selectedFile.name,
              fileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
              fileBase64,
              fileMimeType: selectedFile.type || 'application/pdf',
            }
          : undefined,
        extractionDetails: extractedData,
      });

      const finalClient = result.client || clientPayload;

      addToast(
        'success',
        isMerge ? 'Application Merged to Existing Client File' : 'New Client Master 360 File Created',
        `${finalClient.businessName || finalClient.firstName} initialized from uploaded Business Loan Application. Original document attached to Vault.`
      );

      if (finalClient.id) {
        setSelectedClientId(finalClient.id);
      }

      if (onClientCreated && result.client) {
        onClientCreated(result.client);
      }

      handleReset();
      onClose();
    } catch (err: any) {
      console.error('Error finalizing client file creation:', err);
      setErrorMsg(err.message || 'Failed to create client file. Please verify details and try again.');
      setStep('REVIEW');
    }
  };

  const isFieldUnfound = (fieldName: string) => {
    return unfoundFields.some((f) => f.toLowerCase().includes(fieldName.toLowerCase()));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Upload Business Loan Application</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Client Master 360 AI Intake
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically extracts applicant and commercial business information, pre-fills the Client Master 360 profile, and vaults the application.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3 text-red-300 text-sm animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-red-200">Attention Required</div>
                <div>{errorMsg}</div>
              </div>
            </div>
          )}

          {/* STEP 1: UPLOAD DROPZONE */}
          {step === 'UPLOAD' && (
            <div className="space-y-6">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                    : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800/70 hover:border-slate-600'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-white">
                    Click to select or drag & drop application document
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports commercial loan applications in <span className="text-slate-200 font-medium">PDF, DOC, DOCX, JPG, JPEG, and PNG</span> formats (up to 35 MB)
                  </p>
                </div>

                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>AI will automatically map all applicant, business, revenue, banking & debt fields</span>
                </div>
              </div>

              {/* FEATURES BREAKDOWN */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Full Profile Synthesis</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Extracts entity structure, EIN, annual revenue, ownership %, contact and address.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Duplicate Guard</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Scans existing Master 360 records by EIN, Business Name, Email & Phone to prevent duplicate files.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Pre-fill Verification</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Marks imported fields as <span className="text-emerald-300">Source: Business Loan Application (Not Verified)</span> for underwriter audit.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EXTRACTING SPINNER */}
          {step === 'EXTRACTING' && (
            <div className="py-16 text-center space-y-6 flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Processing Business Loan Application</h3>
                <p className="text-sm text-emerald-400 font-medium mt-1 animate-pulse">{extractionProgress}</p>
                <p className="text-xs text-slate-400 mt-2">
                  File: <span className="text-slate-300">{selectedFile?.name}</span>
                </p>
              </div>

              <div className="w-full max-w-md bg-slate-800/60 rounded-full h-2 overflow-hidden border border-slate-700">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-4/5 animate-pulse" />
              </div>
            </div>
          )}

          {/* STEP 3 & 4: IMPORT REVIEW SCREEN */}
          {(step === 'REVIEW' || step === 'SAVING') && (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              {/* TOP BANNER WITH EXTRACTION STATS */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <FileSearch className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">{selectedFile?.name || 'Application Form'}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {Math.round(confidenceScore * 100)}% Confidence
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{summary}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    Source: Business Loan Application
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-700 text-slate-300 border border-slate-600">
                    Status: Not Verified
                  </span>
                </div>
              </div>

              {/* DUPLICATE WARNING BANNER (IF DETECTED) */}
              {duplicateMatches.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200 space-y-3 animate-fadeIn">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-amber-300">
                        Potential Duplicate Client Detected ({duplicateMatches.length} match found in Client Master 360)
                      </h4>
                      <p className="text-xs text-amber-200/80 mt-0.5">
                        The uploaded application matches an existing client record in the database. Please select your preferred action:
                      </p>
                    </div>
                  </div>

                  <div className="pl-8 space-y-2">
                    {duplicateMatches.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-900/80 border border-amber-500/30 rounded-lg flex items-center justify-between flex-wrap gap-2 text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">{m.existingClient.businessName || 'Business Entity'}</span>
                          <span className="text-slate-400 ml-2">
                            ({m.existingClient.firstName} {m.existingClient.lastName})
                          </span>
                          <div className="text-[11px] text-amber-400 mt-0.5 flex items-center space-x-2">
                            {m.matchReasons.map((r: string, rIdx: number) => (
                              <span key={rIdx} className="bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-slate-400 font-mono">ID: {m.existingClient.id}</span>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center space-x-4 pt-2">
                      <label className="flex items-center space-x-2 cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="duplicateResolution"
                          checked={duplicateResolution === 'MERGE_EXISTING'}
                          onChange={() => setDuplicateResolution('MERGE_EXISTING')}
                          className="text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="font-semibold text-white">
                          📁 Merge & Update Existing Client Profile (Attach Application Document)
                        </span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="duplicateResolution"
                          checked={duplicateResolution === 'CREATE_NEW'}
                          onChange={() => setDuplicateResolution('CREATE_NEW')}
                          className="text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="font-semibold text-white">
                          ➕ Create New Distinct Client File Anyway
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* REVIEW FIELDS TABS / ACCORDION SECTIONS */}
              <div className="space-y-6">
                {/* 1. APPLICANT & IDENTITY */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                    <div className="flex items-center space-x-2 text-white font-bold text-sm">
                      <User className="w-4 h-4 text-emerald-400" />
                      <span>1. Applicant / Personal Information</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                      Source: Business Loan Application
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">
                        First Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder={isFieldUnfound('first') ? '[Not Found / Requires Review]' : ''}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Middle Name</label>
                      <input
                        type="text"
                        value={formData.middleName}
                        onChange={(e) => handleInputChange('middleName', e.target.value)}
                        placeholder={isFieldUnfound('middle') ? '[Not Found]' : ''}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">
                        Last Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder={isFieldUnfound('last') ? '[Not Found / Requires Review]' : ''}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Social Security Number (SSN)</label>
                      <input
                        type="text"
                        value={formData.ssn}
                        onChange={(e) => handleInputChange('ssn', e.target.value)}
                        placeholder={isFieldUnfound('ssn') ? '[Not Found]' : 'XXX-XX-XXXX'}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Date of Birth (DOB)</label>
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => handleInputChange('dob', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Personal Annual Income ($)</label>
                      <input
                        type="number"
                        value={formData.personalAnnualIncome}
                        onChange={(e) => handleInputChange('personalAnnualIncome', e.target.value)}
                        placeholder={isFieldUnfound('personal') ? '[Not Found]' : '120000'}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 mb-1">Residential Street Address</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder={isFieldUnfound('address') ? '[Not Found]' : 'Street Address'}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">City, State, Zip</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <input
                          type="text"
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white focus:border-emerald-500 outline-none text-xs"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white focus:border-emerald-500 outline-none text-xs uppercase"
                        />
                        <input
                          type="text"
                          placeholder="Zip"
                          value={formData.zip}
                          onChange={(e) => handleInputChange('zip', e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white focus:border-emerald-500 outline-none text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. BUSINESS INFORMATION & ENTITY */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                    <div className="flex items-center space-x-2 text-white font-bold text-sm">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>2. Business Entity & Ownership</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                      Source: Business Loan Application
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Legal Business Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        placeholder={isFieldUnfound('business') ? '[Not Found / Requires Review]' : ''}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">DBA (Doing Business As)</label>
                      <input
                        type="text"
                        value={formData.dba}
                        onChange={(e) => handleInputChange('dba', e.target.value)}
                        placeholder={isFieldUnfound('dba') ? '[Not Found]' : ''}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">
                        Federal Tax ID / EIN <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.federalTaxId}
                        onChange={(e) => handleInputChange('federalTaxId', e.target.value)}
                        placeholder={isFieldUnfound('ein') || isFieldUnfound('tax') ? '[Not Found / Requires Review]' : 'XX-XXXXXXX'}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Legal Entity Structure</label>
                      <select
                        value={formData.entityType}
                        onChange={(e) => handleInputChange('entityType', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="LLC">LLC (Limited Liability Company)</option>
                        <option value="Corporation">Corporation (C-Corp)</option>
                        <option value="S-Corporation">S-Corporation</option>
                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                        <option value="General Partnership">General Partnership</option>
                        <option value="Limited Partnership">Limited Partnership (LP)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">State of Organization</label>
                      <input
                        type="text"
                        value={formData.stateOfOrganization}
                        onChange={(e) => handleInputChange('stateOfOrganization', e.target.value)}
                        placeholder="e.g. IL, DE, TX"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white uppercase focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Industry / Nature of Business</label>
                      <input
                        type="text"
                        value={formData.industry}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                        placeholder="e.g. Medical, Construction, IT"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Ownership Percentage (%)</label>
                      <input
                        type="number"
                        value={formData.ownershipPercentage}
                        onChange={(e) => handleInputChange('ownershipPercentage', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Owner Title</label>
                      <input
                        type="text"
                        value={formData.ownerTitle}
                        onChange={(e) => handleInputChange('ownerTitle', e.target.value)}
                        placeholder="e.g. Managing Member, President, CEO"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Business Start Date / Time in Business</label>
                      <input
                        type="text"
                        value={formData.businessStartDate || formData.timeInBusiness}
                        onChange={(e) => handleInputChange('businessStartDate', e.target.value)}
                        placeholder="e.g. 2019-04-12 or 5 Years"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 mb-1">Business Physical Address</label>
                      <input
                        type="text"
                        value={formData.businessAddress}
                        onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                        placeholder="Business Street Address"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Business City, State, Zip</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <input
                          type="text"
                          placeholder="City"
                          value={formData.businessCity}
                          onChange={(e) => handleInputChange('businessCity', e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white focus:border-emerald-500 outline-none text-xs"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={formData.businessState}
                          onChange={(e) => handleInputChange('businessState', e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white focus:border-emerald-500 outline-none text-xs uppercase"
                        />
                        <input
                          type="text"
                          placeholder="Zip"
                          value={formData.businessZip}
                          onChange={(e) => handleInputChange('businessZip', e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white focus:border-emerald-500 outline-none text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. CONTACT INFORMATION */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                    <div className="flex items-center space-x-2 text-white font-bold text-sm">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>3. Contact Information</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                      Source: Business Loan Application
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Primary Phone <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="(555) 000-0000"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Alt / Mobile Phone</label>
                      <input
                        type="text"
                        value={formData.altPhone}
                        onChange={(e) => handleInputChange('altPhone', e.target.value)}
                        placeholder="Optional"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">
                        Primary Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="applicant@company.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Business Email</label>
                      <input
                        type="email"
                        value={formData.businessEmail}
                        onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                        placeholder="info@company.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. REVENUE, REVENUE VELOCITY & CREDIT */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                    <div className="flex items-center space-x-2 text-white font-bold text-sm">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>4. Revenue & Financial Velocity</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                      Source: Business Loan Application
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Gross Annual Revenue ($)</label>
                      <input
                        type="number"
                        value={formData.annualRevenue}
                        onChange={(e) => handleInputChange('annualRevenue', e.target.value)}
                        placeholder={isFieldUnfound('annual') ? '[Not Found]' : '500000'}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Average Monthly Revenue ($)</label>
                      <input
                        type="number"
                        value={formData.monthlyRevenue}
                        onChange={(e) => handleInputChange('monthlyRevenue', e.target.value)}
                        placeholder="Auto-calculated"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Stated Credit Score / FICO</label>
                      <input
                        type="number"
                        value={formData.creditScore}
                        onChange={(e) => handleInputChange('creditScore', e.target.value)}
                        placeholder="700"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. FUNDING REQUEST & LOAN PRODUCT */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                    <div className="flex items-center space-x-2 text-white font-bold text-sm">
                      <Briefcase className="w-4 h-4 text-emerald-400" />
                      <span>5. Funding Request & Loan Product</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                      Source: Business Loan Application
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Requested Capital Amount ($)</label>
                      <input
                        type="number"
                        value={formData.requestedAmount}
                        onChange={(e) => handleInputChange('requestedAmount', e.target.value)}
                        placeholder="75000"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Target Funding Product</label>
                      <select
                        value={formData.requestedProduct}
                        onChange={(e) => handleInputChange('requestedProduct', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="Revenue Funding">Revenue Funding (Working Capital)</option>
                        <option value="Business Line of Credit">Business Line of Credit</option>
                        <option value="Business Term Loan">Business Term Loan</option>
                        <option value="SBA 7(a) Loan">SBA 7(a) Loan</option>
                        <option value="Equipment Financing">Equipment Financing</option>
                        <option value="Personal Term Loan">Personal Term Loan</option>
                        <option value="0% Business Credit Cards">0% Business Credit Cards</option>
                        <option value="Merchant Cash Advance (MCA)">Merchant Cash Advance (MCA)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Stated Purpose / Use of Funds</label>
                      <input
                        type="text"
                        value={formData.useOfFunds}
                        onChange={(e) => handleInputChange('useOfFunds', e.target.value)}
                        placeholder="e.g. Working Capital, Equipment, Payroll"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. BANKING & EXISTING DEBTS */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                    <div className="flex items-center space-x-2 text-white font-bold text-sm">
                      <Landmark className="w-4 h-4 text-emerald-400" />
                      <span>6. Banking & Existing Financing</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                      Source: Business Loan Application
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Primary Operating Bank</label>
                      <input
                        type="text"
                        value={formData.businessBank}
                        onChange={(e) => handleInputChange('businessBank', e.target.value)}
                        placeholder={isFieldUnfound('bank') ? '[Not Found]' : 'e.g. Chase Bank, Wells Fargo'}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Bank Routing Number</label>
                      <input
                        type="text"
                        value={formData.businessRoutingNumber}
                        onChange={(e) => handleInputChange('businessRoutingNumber', e.target.value)}
                        placeholder={isFieldUnfound('routing') ? '[Not Found]' : '9-Digit Routing'}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Checking Account Number</label>
                      <input
                        type="text"
                        value={formData.businessCheckingAccount}
                        onChange={(e) => handleInputChange('businessCheckingAccount', e.target.value)}
                        placeholder={isFieldUnfound('account') ? '[Not Found]' : 'Account Number'}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Existing Commercial Loans</label>
                      <input
                        type="text"
                        value={formData.existingLoans}
                        onChange={(e) => handleInputChange('existingLoans', e.target.value)}
                        placeholder="e.g. None or $25k SBA EIDL"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Existing MCAs / Daily Debits</label>
                      <input
                        type="text"
                        value={formData.existingMcas}
                        onChange={(e) => handleInputChange('existingMcas', e.target.value)}
                        placeholder="e.g. None or 1 position"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Assigned Lead Underwriter</label>
                      <select
                        value={formData.assignedStaff}
                        onChange={(e) => handleInputChange('assignedStaff', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="Dana">Dana (Operations & Funding)</option>
                        <option value="Luke">Luke (Underwriting & Executive)</option>
                        <option value="Steve">Steve (Sales & Structuring)</option>
                        <option value="Robert">Robert (Operations & Technology)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-upload Application</span>
                </button>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleReset();
                      onClose();
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={step === 'SAVING'}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 active:scale-95 flex items-center space-x-2 disabled:opacity-50"
                  >
                    {step === 'SAVING' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating Client File...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>
                          {duplicateResolution === 'MERGE_EXISTING'
                            ? 'Update Existing Client File'
                            : 'Create Client Master 360 Profile'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
