import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCode,
  File as FileIcon,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building,
  DollarSign
} from 'lucide-react';
import { DocumentCategoryType, DocumentItem, DocumentAiExtractionResult } from '../../types';
import { api } from '../../services/api';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName?: string;
  businessName?: string;
  dealId?: string;
  availableDeals?: Array<{ id: string; title: string; product?: string; lenderName?: string }>;
  onDocumentUploaded?: (doc: DocumentItem) => void;
  currentUser?: string;
  presetCategory?: DocumentCategoryType;
  onOpenReviewModal?: (doc: DocumentItem) => void;
}

const SUPPORTED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'csv',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'heic',
  'tif',
  'tiff',
  'txt',
  'rtf',
  'xml',
];

const CATEGORIES: DocumentCategoryType[] = [
  "Driver's License",
  'Bank Statements',
  'Tax Returns',
  'Profit & Loss',
  'Voided Check',
  'Business License',
  'Articles of Incorporation',
  'Business Credit Card Statement',
  'Loan Statement',
  'MCA Statement',
  'Pay Stubs',
  'Other Financial Document',
  'Other',
];

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  clientId,
  clientName,
  businessName,
  dealId: defaultDealId,
  availableDeals = [],
  onDocumentUploaded,
  currentUser = 'Staff Underwriter',
  presetCategory,
  onOpenReviewModal,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [category, setCategory] = useState<DocumentCategoryType>(presetCategory || 'Bank Statements');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [selectedDealId, setSelectedDealId] = useState<string>(defaultDealId || '');
  const [autoAnalyze, setAutoAnalyze] = useState<boolean>(true);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'stored' | 'analyzing' | 'success' | 'ai_failed' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedDoc, setUploadedDoc] = useState<DocumentItem | null>(null);
  const [aiExtraction, setAiExtraction] = useState<DocumentAiExtractionResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync preset category if modal reopens
  React.useEffect(() => {
    if (presetCategory) {
      setCategory(presetCategory);
    }
  }, [presetCategory, isOpen]);

  const resetFormForNextUpload = () => {
    setSelectedFile(null);
    setFileBase64('');
    setRawText('');
    setTitle('');
    setCustomCategory('');
    setUploadStage('idle');
    setUploadProgress(0);
    setErrorMessage(null);
    setUploadedDoc(null);
    setAiExtraction(null);
    setAiError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetFormForNextUpload();
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeBadge = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return { label: 'PDF Document', color: 'bg-red-500/20 text-red-300 border-red-500/30' };
    if (['xls', 'xlsx'].includes(ext)) return { label: 'Excel Spreadsheet', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    if (ext === 'csv') return { label: 'CSV Data Sheet', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' };
    if (['doc', 'docx'].includes(ext)) return { label: 'Word Document', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    if (['jpg', 'jpeg', 'png', 'webp', 'heic', 'tif', 'tiff'].includes(ext)) return { label: 'Image Scan', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    if (['txt', 'rtf', 'xml'].includes(ext)) return { label: 'Text File', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    return { label: 'Document', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return <FileText className="w-8 h-8 text-red-400" />;
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet className="w-8 h-8 text-emerald-400" />;
    if (['doc', 'docx'].includes(ext)) return <FileText className="w-8 h-8 text-blue-400" />;
    if (['jpg', 'jpeg', 'png', 'webp', 'heic', 'tif', 'tiff'].includes(ext)) return <FileImage className="w-8 h-8 text-purple-400" />;
    if (['txt', 'rtf', 'xml'].includes(ext)) return <FileCode className="w-8 h-8 text-slate-400" />;
    return <FileIcon className="w-8 h-8 text-amber-400" />;
  };

  const processSelectedFile = useCallback((file: File) => {
    setErrorMessage(null);

    // 1. Validate file size (max 25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMessage(`File size exceeds 25 MB limit (${formatFileSize(file.size)}). Please choose a smaller file.`);
      return;
    }

    // 2. Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setErrorMessage(`Unsupported file format (.${ext}). Allowed formats: PDF, DOC, DOCX, XLS, XLSX, CSV, JPG, PNG, WEBP, TXT, RTF, XML.`);
      return;
    }

    setSelectedFile(file);

    // Auto-populate document title if empty or clean default
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    if (!title || title.trim() === '') {
      setTitle(cleanTitle);
    }

    // Attempt smart category detection from filename
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('bank') || lowerName.includes('statement') || lowerName.includes('checking')) {
      setCategory('Bank Statements');
    } else if (lowerName.includes('tax') || lowerName.includes('1120') || lowerName.includes('1040') || lowerName.includes('1065')) {
      setCategory('Tax Returns');
    } else if (lowerName.includes('p&l') || lowerName.includes('profit') || lowerName.includes('income statement')) {
      setCategory('Profit & Loss');
    } else if (lowerName.includes('void') || lowerName.includes('check')) {
      setCategory('Voided Check');
    } else if (lowerName.includes('license') && !lowerName.includes('driver')) {
      setCategory('Business License');
    } else if (lowerName.includes('driver') || lowerName.includes('dl') || lowerName.includes('id')) {
      setCategory("Driver's License");
    } else if (lowerName.includes('article') || lowerName.includes('incorporation') || lowerName.includes('formation')) {
      setCategory('Articles of Incorporation');
    } else if (lowerName.includes('credit card') || lowerName.includes('amex') || lowerName.includes('card statement')) {
      setCategory('Business Credit Card Statement');
    } else if (lowerName.includes('loan') || lowerName.includes('mca')) {
      setCategory('Loan Statement');
    } else if (lowerName.includes('pay') || lowerName.includes('stub') || lowerName.includes('payroll')) {
      setCategory('Pay Stubs');
    }

    // Read File as Data URL (Base64)
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFileBase64(result || '');
    };
    reader.readAsDataURL(file);

    // If text/csv/xml/json, also read text
    if (['csv', 'txt', 'rtf', 'xml'].includes(ext)) {
      const textReader = new FileReader();
      textReader.onload = (e) => {
        setRawText((e.target?.result as string) || '');
      };
      textReader.readAsText(file);
    }
  }, [title]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload.');
      return;
    }

    setErrorMessage(null);
    setUploadStage('uploading');
    setUploadProgress(20);

    const finalCategory = category === 'Other' && customCategory.trim() ? customCategory.trim() : category;
    const finalTitle = title.trim() || selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

    try {
      // Progress simulation for responsive UX
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressTimer);
            return 85;
          }
          return prev + 15;
        });
      }, 150);

      // Perform backend upload and AI analysis
      setUploadStage('analyzing');
      const response = await api.uploadAndAnalyzeDocument({
        clientId,
        dealId: selectedDealId || undefined,
        title: finalTitle,
        fileName: selectedFile.name,
        fileSize: formatFileSize(selectedFile.size),
        fileMimeType: selectedFile.type || 'application/octet-stream',
        fileBase64: fileBase64 || undefined,
        rawText: rawText || undefined,
        category: finalCategory as any,
        uploadedBy: currentUser,
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      if (response && response.document) {
        setUploadedDoc(response.document);
        if (onDocumentUploaded) {
          onDocumentUploaded(response.document);
        }

        if (response.extraction) {
          setAiExtraction(response.extraction);
          setUploadStage('success');
        } else if (response.aiError) {
          setAiError(response.aiError);
          setUploadStage('ai_failed');
        } else {
          setUploadStage('success');
        }
      } else {
        // Fallback local save if direct endpoint returned null
        const localDoc: DocumentItem = {
          id: `doc-${Date.now()}`,
          clientId,
          dealId: selectedDealId || undefined,
          category: finalCategory as any,
          title: finalTitle,
          fileName: selectedFile.name,
          fileSize: formatFileSize(selectedFile.size),
          fileBase64: fileBase64 || undefined,
          fileMimeType: selectedFile.type,
          uploadedBy: currentUser,
          uploadedDate: new Date().toISOString(),
          status: 'RECEIVED',
        };
        setUploadedDoc(localDoc);
        if (onDocumentUploaded) {
          onDocumentUploaded(localDoc);
        }
        setUploadStage('success');
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMessage(err.message || 'Failed to upload document. Please try again.');
      setUploadStage('error');
    }
  };

  const handleRetryAi = async () => {
    if (!uploadedDoc) return;
    setUploadStage('analyzing');
    setAiError(null);

    try {
      const res = await api.retryAiDocumentAnalysis(uploadedDoc.id, currentUser);
      if (res && res.extraction) {
        setAiExtraction(res.extraction);
        setUploadedDoc(res.document || uploadedDoc);
        if (onDocumentUploaded) onDocumentUploaded(res.document || uploadedDoc);
        setUploadStage('success');
      } else {
        setAiError('Retry analysis failed. Document remains safely stored.');
        setUploadStage('ai_failed');
      }
    } catch (err: any) {
      setAiError(err.message || 'Retry failed');
      setUploadStage('ai_failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="document-upload-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
    >
      <div
        id="document-upload-modal-card"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Upload Document to Vault</h2>
              <p className="text-xs text-slate-400">
                {businessName || clientName ? `Client: ${businessName || clientName}` : 'Secure Underwriting Repository'}
              </p>
            </div>
          </div>
          <button
            id="close-upload-modal-btn"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Success / Finished Upload View */}
          {(uploadStage === 'success' || uploadStage === 'ai_failed') && uploadedDoc ? (
            <div className="space-y-5 py-2">
              <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white">Document Stored in Vault</h3>
                  <p className="text-xs text-emerald-300 mt-0.5">
                    File <span className="font-semibold text-white font-mono">{uploadedDoc.fileName}</span> ({uploadedDoc.fileSize}) safely saved to client repository.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                      Category: {uploadedDoc.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                      Title: {uploadedDoc.title}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Extraction Status Box */}
              {uploadStage === 'success' && aiExtraction ? (
                <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                      <Sparkles className="w-4 h-4" />
                      AI Document Intelligence Complete
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                      {aiExtraction.extractedFields?.length || 0} Fields Extracted
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{aiExtraction.documentSummary}</p>

                  <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Staged as unverified for worksheet review.</span>
                    {onOpenReviewModal && (
                      <button
                        id="review-extracted-ai-data-btn"
                        onClick={() => {
                          handleClose();
                          onOpenReviewModal(uploadedDoc);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                      >
                        Review Extracted Data
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ) : uploadStage === 'ai_failed' ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      AI Processing Notice
                    </div>
                    <span className="text-xs text-slate-400">File safely saved</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {aiError || 'AI extraction could not complete automatically. You can retry processing or manually review.'}
                  </p>
                  <button
                    id="retry-ai-processing-btn"
                    onClick={handleRetryAi}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs flex items-center gap-1.5 border border-amber-500/30 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry AI Processing
                  </button>
                </div>
              ) : null}

              {/* Multi-upload / Done Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  id="upload-another-doc-btn"
                  onClick={resetFormForNextUpload}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-2 border border-slate-700 transition-colors"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  Upload Another Document
                </button>
                <button
                  id="close-upload-finished-btn"
                  onClick={handleClose}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-amber-500/20"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* File Selection / Drag-and-Drop Area */}
              <div>
                <input
                  ref={fileInputRef}
                  id="document-file-input"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp,.heic,.tif,.tiff,.txt,.rtf,.xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!selectedFile ? (
                  <div
                    id="document-drag-drop-zone"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-amber-400 bg-amber-500/10 scale-[0.99]'
                        : 'border-slate-700 bg-slate-950/50 hover:border-amber-500/50 hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-white">
                      Drag & Drop Document Here or <span className="text-amber-400 underline underline-offset-2">Browse Files</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
                      Supports PDF, Word (DOC/DOCX), Spreadsheets (XLS/XLSX/CSV), Scans (JPG/PNG/WEBP), & Text (TXT/RTF).
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">Maximum file size: 25 MB</p>

                    <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                      {['PDF', 'DOCX', 'XLSX', 'CSV', 'JPG', 'PNG', 'TXT'].map((badge) => (
                        <span
                          key={badge}
                          className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-[10px] font-mono text-slate-400"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Selected File Info Card */
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        {getFileIcon(selectedFile.name)}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white truncate max-w-xs md:max-w-md">
                            {selectedFile.name}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                              getFileTypeBadge(selectedFile.name).color
                            }`}
                          >
                            {getFileTypeBadge(selectedFile.name).label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Size: <span className="font-mono text-slate-300">{formatFileSize(selectedFile.size)}</span> • Ready to upload
                        </p>
                      </div>
                    </div>

                    <button
                      id="remove-selected-file-btn"
                      onClick={() => {
                        setSelectedFile(null);
                        setFileBase64('');
                        setRawText('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800/80 transition-colors"
                      title="Choose a different file"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Form Metadata Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Document Category *</span>
                    <span className="text-[10px] text-slate-500 font-normal">Vault Classification</span>
                  </label>
                  <select
                    id="upload-doc-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DocumentCategoryType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Document Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Document Title</span>
                    <span className="text-[10px] text-slate-500 font-normal">Auto-defaults to filename</span>
                  </label>
                  <input
                    id="upload-doc-title-input"
                    type="text"
                    placeholder="e.g. Chase Bank Statement Jan 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Custom Category if "Other" is selected */}
              {category === 'Other' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-semibold text-slate-300">
                    Specify Custom Document Type *
                  </label>
                  <input
                    id="upload-custom-category-input"
                    type="text"
                    placeholder="e.g. Commercial Lease Agreement, Equipment Invoice"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Deal Association (Optional) */}
              {availableDeals.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Attach to Funding Deal (Optional)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Links to specific deal file</span>
                  </label>
                  <select
                    id="upload-doc-deal-select"
                    value={selectedDealId}
                    onChange={(e) => setSelectedDealId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">General Client Vault (No specific deal)</option>
                    {availableDeals.map((deal) => (
                      <option key={deal.id} value={deal.id}>
                        {deal.title} {deal.product ? `(${deal.product})` : ''} {deal.lenderName ? `• ${deal.lenderName}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* AI Auto-Extraction Checkbox */}
              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="auto-analyze-checkbox"
                  checked={autoAnalyze}
                  onChange={(e) => setAutoAnalyze(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-900"
                />
                <label htmlFor="auto-analyze-checkbox" className="text-xs text-slate-300 cursor-pointer">
                  <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-Extract Underwriting Data with AI
                  </span>
                  <span className="block text-slate-400 text-[11px] mt-0.5">
                    Automatically scans and stages extracted revenue, EIN, banking, and identity metrics as unverified fields in the client worksheet.
                  </span>
                </label>
              </div>

              {/* Upload Progress Bar (when active) */}
              {uploadStage === 'uploading' || uploadStage === 'analyzing' ? (
                <div className="space-y-2 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-400 font-semibold flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      {uploadStage === 'uploading' ? 'Uploading file bytes to secure vault...' : 'AI scanning document and extracting data points...'}
                    </span>
                    <span className="font-mono text-slate-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : null}

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  id="cancel-upload-doc-btn"
                  type="button"
                  onClick={handleClose}
                  disabled={uploadStage === 'uploading' || uploadStage === 'analyzing'}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  id="submit-upload-doc-btn"
                  type="button"
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadStage === 'uploading' || uploadStage === 'analyzing'}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadStage === 'uploading' || uploadStage === 'analyzing' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Upload Document
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
