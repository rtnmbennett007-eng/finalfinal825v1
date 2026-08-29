import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export type FieldSourceType =
  | 'CALL_VERIFIED'
  | 'MANUAL'
  | 'VERIFICATION_FORM'
  | 'CLIENT_APPLICATION'
  | 'APPLICATION'
  | 'AI_FILLED'
  | 'IMPORTED'
  | 'SYSTEM_CALCULATED'
  | 'NOT_ENTERED'
  | 'UNKNOWN';

export interface ExtractedFieldItem {
  key: string;
  label: string;
  section:
    | 'identity'
    | 'business'
    | 'employment'
    | 'employmentVerification'
    | 'income'
    | 'payroll'
    | 'banking'
    | 'debts'
    | 'housing'
    | 'fundingRequest'
    | 'credit'
    | 'documentChecklist'
    | 'other';
  extractedValue: string | number | boolean;
  confidence: number;
  sourceQuote?: string;
  pageOrLocation?: string;
  sourceType?: FieldSourceType;
  currentVerifiedValue?: string | number | boolean;
  currentAppliedValue?: string | number | boolean;
  isConflictWithVerified?: boolean;
  isAppliedToVerification?: boolean;
  status: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED' | 'OVERRIDDEN';
  userOverrideValue?: string | number | boolean;
}

export interface ExtractedApplicationProfile {
  firstName: string;
  middleName?: string;
  lastName: string;
  fullLegalName?: string;
  ssn?: string;
  dob?: string;
  phone: string;
  email: string;
  businessPhone?: string;
  businessEmail?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  businessName: string;
  legalBusinessName?: string;
  dba?: string;
  federalTaxId: string;
  stateOfOrganization?: string;
  entityType?: string;
  industry?: string;
  businessStartDate?: string;
  businessStartDateUnderCurrentOwnership?: string;
  timeInBusiness?: string;
  ownershipPercentage?: number;
  ownerTitle?: string;
  numberOfEmployees?: number;
  website?: string;
  businessDescription?: string;
  businessAddress?: string;
  businessCity?: string;
  businessState?: string;
  businessZip?: string;
  homeAddressSameAsBusinessAddress?: boolean;
  annualRevenue?: number;
  monthlyRevenue?: number;
  creditScore?: number;
  requestedAmount?: number;
  requestedFundingRange?: string;
  requestedProduct?: string;
  useOfFunds?: string;
  fundingUrgency?: string;
  businessBank?: string;
  businessRoutingNumber?: string;
  businessCheckingAccount?: string;
  existingLoans?: string;
  existingMcas?: string;
  lenderBalances?: string;
  existingDebt?: number;
  application?: {
    business: {
      businessName: string | null;
      legalBusinessName: string | null;
      dba: string | null;
      email: string | null;
      businessEmail: string | null;
      phone: string | null;
      businessPhone: string | null;
      address: string | null;
      businessAddress: string | null;
      city: string | null;
      businessCity: string | null;
      state: string | null;
      businessState: string | null;
      zip: string | null;
      businessZip: string | null;
      industry: string | null;
      businessStartDate: string | null;
      federalTaxId: string | null;
      ein: string | null;
      stateOfOrganization: string | null;
      entityStructure: string | null;
      annualRevenue: number | null;
      requestedFundingRange: string | null;
      requestedAmount: number | null;
      useOfFunds: string | null;
    };
    owner: {
      firstName: string | null;
      lastName: string | null;
      ownerFirstName: string | null;
      ownerLastName: string | null;
      dateOfBirth: string | null;
      ownerDateOfBirth: string | null;
      title: string | null;
      ownerTitle: string | null;
      ownershipPercentage: number | null;
      currentOwnershipStartDate: string | null;
      businessStartDateCurrentOwnership: string | null;
      homeAddressSameAsBusinessAddress: boolean | null;
      ssn: string | null;
      creditScore: number | null;
      personalIncome: number | null;
    };
  };
  source?: string;
  aiFilled?: boolean;
  callVerified?: boolean;
  confidence: number;
  summary: string;
  modelUsed: string;
  extractedFieldsList: ExtractedFieldItem[];
  fieldStatuses: Record<string, { source: string; status: string; confidence: number; isMissing?: boolean }>;
  unfoundFields: string[];
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function validateAndSanitizeApplicationData(appData: any) {
  const business = appData?.business || {};
  const owner = appData?.owner || {};

  const cleanVal = (v: any) => {
    if (v === undefined || v === null) return '';
    const str = String(v).trim();
    return str;
  };

  const isPlaceholder = (val: string) => {
    if (!val) return true;
    const lower = val.toLowerCase().trim();
    return (
      lower === 'applicant' ||
      lower === 'name' ||
      lower === 'applicant name' ||
      lower === 'applicant / name' ||
      lower === 'owner' ||
      lower === 'owner name' ||
      lower === 'borrower' ||
      lower === 'borrower name' ||
      lower === 'principal' ||
      lower === 'principal name' ||
      lower === 'first name' ||
      lower === 'last name' ||
      lower === 'first' ||
      lower === 'last' ||
      lower === 'unknown' ||
      lower === 'n/a' ||
      lower === 'na' ||
      lower === 'none' ||
      lower === 'null' ||
      lower === 'undefined' ||
      lower === 'commercial enterprise llc' ||
      lower === 'commercial borrower llc' ||
      lower === 'business name' ||
      lower === 'company name' ||
      lower === 'legal entity'
    );
  };

  let ownerFirst = cleanVal(owner.firstName || owner.ownerFirstName || '');
  let ownerLast = cleanVal(owner.lastName || owner.ownerLastName || '');

  if (isPlaceholder(ownerFirst)) ownerFirst = '';
  if (isPlaceholder(ownerLast)) ownerLast = '';

  let bName = cleanVal(business.legalBusinessName || business.businessName || '');
  if (isPlaceholder(bName)) bName = '';

  if (bName && ownerFirst && ownerLast) {
    const ownerFullName = `${ownerFirst} ${ownerLast}`.toLowerCase();
    if (bName.toLowerCase() === ownerFullName) {
      if (business.dba && !isPlaceholder(business.dba) && business.dba.toLowerCase() !== ownerFullName) {
        bName = business.dba;
      }
    }
  }

  let ownershipPct: number | null = null;
  const rawPct = owner.ownershipPercentage;
  if (rawPct !== undefined && rawPct !== null && String(rawPct).trim() !== '') {
    const parsedPct = Number(String(rawPct).replace(/[^0-9.]/g, ''));
    if (!isNaN(parsedPct)) ownershipPct = parsedPct;
  }

  let annualRev: number | null = null;
  const rawRev = business.annualRevenue;
  if (rawRev !== undefined && rawRev !== null && String(rawRev).trim() !== '') {
    const parsedRev = Number(String(rawRev).replace(/[^0-9.]/g, ''));
    if (!isNaN(parsedRev)) annualRev = Math.round(parsedRev);
  }

  let cScore: number | null = null;
  const rawScore = owner.creditScore;
  if (rawScore !== undefined && rawScore !== null && String(rawScore).trim() !== '') {
    const parsedScore = Number(String(rawScore).replace(/[^0-9]/g, ''));
    if (!isNaN(parsedScore) && parsedScore >= 300 && parsedScore <= 850) cScore = parsedScore;
  }

  let reqAmount: number | null = null;
  const rawAmt = business.requestedAmount;
  if (rawAmt !== undefined && rawAmt !== null && String(rawAmt).trim() !== '') {
    const parsedAmt = Number(String(rawAmt).replace(/[^0-9.]/g, ''));
    if (!isNaN(parsedAmt)) reqAmount = Math.round(parsedAmt);
  } else if (business.requestedFundingRange) {
    const numbers = String(business.requestedFundingRange).match(/\d+/g);
    if (numbers && numbers.length > 0) {
      const lastNum = Number(numbers[numbers.length - 1]);
      if (String(business.requestedFundingRange).toLowerCase().includes('k')) {
        reqAmount = lastNum * 1000;
      } else {
        reqAmount = lastNum;
      }
    }
  }

  let fedTaxId = cleanVal(business.federalTaxId || business.ein || '');
  if (isPlaceholder(fedTaxId)) fedTaxId = '';

  let homeSame: boolean | null = null;
  const rawHomeSame = owner.homeAddressSameAsBusinessAddress;
  if (typeof rawHomeSame === 'boolean') {
    homeSame = rawHomeSame;
  } else if (typeof rawHomeSame === 'string') {
    const s = rawHomeSame.toLowerCase().trim();
    if (s === 'yes' || s === 'true' || s === 'y') homeSame = true;
    else if (s === 'no' || s === 'false' || s === 'n') homeSame = false;
  }

  let ssnVal = cleanVal(owner.ssn || '');
  if (isPlaceholder(ssnVal)) ssnVal = '';

  return {
    business: {
      businessName: bName || null,
      legalBusinessName: bName || null,
      dba: cleanVal(business.dba) || bName || null,
      email: cleanVal(business.businessEmail || business.email) || null,
      businessEmail: cleanVal(business.businessEmail || business.email) || null,
      phone: cleanVal(business.businessPhone || business.phone) || null,
      businessPhone: cleanVal(business.businessPhone || business.phone) || null,
      address: cleanVal(business.businessAddress || business.address) || null,
      businessAddress: cleanVal(business.businessAddress || business.address) || null,
      city: cleanVal(business.businessCity || business.city) || null,
      businessCity: cleanVal(business.businessCity || business.city) || null,
      state: cleanVal(business.businessState || business.state) || null,
      businessState: cleanVal(business.businessState || business.state) || null,
      zip: cleanVal(business.businessZip || business.zip) || null,
      businessZip: cleanVal(business.businessZip || business.zip) || null,
      industry: cleanVal(business.industry) || null,
      businessStartDate: cleanVal(business.businessStartDate) || null,
      federalTaxId: fedTaxId || null,
      ein: fedTaxId || null,
      stateOfOrganization: cleanVal(business.stateOfOrganization || business.businessState || business.state) || null,
      entityStructure: cleanVal(business.entityStructure) || 'LLC',
      annualRevenue: annualRev,
      requestedFundingRange: cleanVal(business.requestedFundingRange) || null,
      requestedAmount: reqAmount,
      useOfFunds: cleanVal(business.useOfFunds) || null,
    },
    owner: {
      firstName: ownerFirst || null,
      lastName: ownerLast || null,
      ownerFirstName: ownerFirst || null,
      ownerLastName: ownerLast || null,
      dateOfBirth: cleanVal(owner.dateOfBirth || owner.ownerDateOfBirth || owner.dob) || null,
      ownerDateOfBirth: cleanVal(owner.dateOfBirth || owner.ownerDateOfBirth || owner.dob) || null,
      title: cleanVal(owner.title || owner.ownerTitle) || null,
      ownerTitle: cleanVal(owner.title || owner.ownerTitle) || null,
      ownershipPercentage: ownershipPct,
      currentOwnershipStartDate: cleanVal(owner.businessStartDateCurrentOwnership || owner.currentOwnershipStartDate) || null,
      businessStartDateCurrentOwnership: cleanVal(owner.businessStartDateCurrentOwnership || owner.currentOwnershipStartDate) || null,
      homeAddressSameAsBusinessAddress: homeSame,
      ssn: ssnVal || null,
      creditScore: cScore,
      personalIncome: null,
    },
  };
}

async function extractBusinessLoanApplicationData(params: {
  fileName: string;
  fileBase64?: string;
  fileMimeType?: string;
  rawText?: string;
}): Promise<ExtractedApplicationProfile> {
  const { fileName, fileBase64, fileMimeType, rawText } = params;
  const ai = getGeminiClient();

  const defaultSource = 'Business Loan Application';
  const defaultStatus = 'Not Verified';

  let confidence = 0.95;
  let summary = 'Business Loan Application processed.';
  let modelUsed = 'Maple X AI Intelligence';
  const extractedFieldsList: ExtractedFieldItem[] = [];
  const fieldStatuses: Record<string, { source: string; status: string; confidence: number; isMissing?: boolean }> = {};
  const unfoundFields: string[] = [];

  let rawParsedApp: any = null;

  const addExtractedField = (
    key: string,
    label: string,
    section: ExtractedFieldItem['section'],
    value: string | number | boolean | undefined | null,
    fieldConf = 0.95,
    quote = ''
  ) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      extractedFieldsList.push({
        key,
        label,
        section,
        extractedValue: value,
        confidence: fieldConf,
        sourceQuote: quote || String(value),
        sourceType: 'CLIENT_APPLICATION',
        status: 'UNVERIFIED',
      });
      fieldStatuses[key] = {
        source: defaultSource,
        status: defaultStatus,
        confidence: fieldConf,
        isMissing: false,
      };
    } else {
      unfoundFields.push(label);
      fieldStatuses[key] = {
        source: defaultSource,
        status: 'Not Found / Requires Review',
        confidence: 0,
        isMissing: true,
      };
    }
  };

  if (ai && (fileBase64 || rawText || fileName)) {
    const candidateModels = ['gemini-3.6-flash', 'gemini-3.1-pro-preview'];
    let geminiSuccess = false;

    const prompt = `You are extracting structured data from a Business Loan Application.

This document contains separate BUSINESS INFORMATION and OWNER INFORMATION sections.

Never confuse section labels with actual values.

Extract only information explicitly present in the document.
Do not infer or invent information.

Map BUSINESS INFORMATION only to business fields:
- "Name of Business" -> business.legalBusinessName (and business.businessName)
- "Email" (in Business section) -> business.businessEmail
- "Phone" (in Business section) -> business.businessPhone
- "Address" (in Business section) -> business.businessAddress
- "City" (in Business section) -> business.businessCity
- "State" (in Business section) -> business.businessState
- "Postal Code" (in Business section) -> business.businessZip
- "Industry type" -> business.industry
- "Business Start Date" -> business.businessStartDate
- "Federal Tax ID" -> business.federalTaxId
- "State of Incorporation or Organization" -> business.stateOfOrganization
- "Annual Revenue" -> business.annualRevenue (numeric)
- "How much capital do you need?" -> business.requestedFundingRange (e.g. "$5K - $50K") and numeric business.requestedAmount
- "What will the money be used for?" -> business.useOfFunds

Map OWNER INFORMATION only to owner fields:
- "First Name" (in Owner section) -> owner.firstName
- "Last Name" (in Owner section) -> owner.lastName
- "Date of Birth" (in Owner section) -> owner.dateOfBirth
- "Title" (in Owner section) -> owner.title
- "Ownership Percentage" (in Owner section) -> owner.ownershipPercentage (numeric, e.g. 100)
- "Business start date under current ownership" -> owner.businessStartDateCurrentOwnership
- "Is Home Address same as Business Address?" -> owner.homeAddressSameAsBusinessAddress (boolean: true/false)
- "SSN" (in Owner section) -> owner.ssn
- "CREDIT SCORE" (in Owner section) -> owner.creditScore (numeric)

CRITICAL EXTRACTION RULES:
1. The text 'Applicant Name', 'Applicant', 'Name', or similar labels must NEVER be interpreted as the person's first name or last name.
2. If a field is not explicitly present in the document, return null. NEVER guess, invent, or substitute placeholder values like 'Applicant', 'Unknown', 'N/A', or 'Commercial Enterprise LLC'.
3. Do not mark any extracted information as verified.
4. Output STRICT, VALID JSON ONLY (no markdown backticks, no conversational text):

{
  "confidenceScore": 0.98,
  "summary": "Commercial loan application extracted for [Business Name] owned by [Owner Name].",
  "application": {
    "business": {
      "legalBusinessName": string | null,
      "businessName": string | null,
      "dba": string | null,
      "businessEmail": string | null,
      "businessPhone": string | null,
      "businessAddress": string | null,
      "businessCity": string | null,
      "businessState": string | null,
      "businessZip": string | null,
      "industry": string | null,
      "businessStartDate": string | null,
      "federalTaxId": string | null,
      "stateOfOrganization": string | null,
      "entityStructure": string | null,
      "annualRevenue": number | null,
      "requestedFundingRange": string | null,
      "requestedAmount": number | null,
      "useOfFunds": string | null
    },
    "owner": {
      "firstName": string | null,
      "lastName": string | null,
      "dateOfBirth": string | null,
      "title": string | null,
      "ownershipPercentage": number | null,
      "businessStartDateCurrentOwnership": string | null,
      "homeAddressSameAsBusinessAddress": boolean | null,
      "ssn": string | null,
      "creditScore": number | null
    }
  }
}`;

    const contents: any[] = [];
    if (fileBase64 && fileMimeType) {
      contents.push({
        inlineData: {
          mimeType: fileMimeType,
          data: fileBase64.replace(/^data:[^;]+;base64,/, ''),
        },
      });
    }
    contents.push(prompt);
    if (rawText) {
      contents.push(`\nDOCUMENT OCR / RAW TEXT SNIPPET:\n${rawText.slice(0, 10000)}`);
    } else {
      contents.push(`\nDOCUMENT FILENAME: ${fileName}`);
    }

    for (const targetModel of candidateModels) {
      if (geminiSuccess) break;
      try {
        const response = await ai.models.generateContent({
          model: targetModel,
          contents,
        });

        const responseText = response.text || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          confidence = parsed.confidenceScore || 0.96;
          summary = parsed.summary || 'Commercial loan application extracted successfully.';
          modelUsed = targetModel;
          rawParsedApp = parsed.application || parsed;
          geminiSuccess = true;
          break;
        }
      } catch (err) {
        console.info(`Gemini application extraction attempt with ${targetModel} notice:`, err);
      }
    }
  }

  if (!rawParsedApp || (!rawParsedApp.business?.legalBusinessName && !rawParsedApp.owner?.firstName)) {
    const textToSearch = rawText || fileName;

    let businessText = textToSearch;
    let ownerText = textToSearch;

    const ownerSectionMatch = textToSearch.match(/OWNER(?:\s+INFORMATION|\s+DETAILS|\s+SECTION)?([\s\S]*)/i);
    if (ownerSectionMatch) {
      ownerText = ownerSectionMatch[1];
      businessText = textToSearch.substring(0, ownerSectionMatch.index);
    }

    const bNameMatch = businessText.match(/(?:Name of Business|Business Name|Legal Entity|Legal Name|Company Name)\s*[:.]?\s*([A-Za-z0-9\s&,.'-]+?)(?:\r|\n|Email|Phone|Address|Industry|Federal|EIN|Owner|$)/i);
    const bName = bNameMatch ? bNameMatch[1].trim() : '';

    const bEmailMatch = businessText.match(/(?:Business Email|Contact Email|Email)\s*[:.]?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    const bEmail = bEmailMatch ? bEmailMatch[1].trim() : '';

    const bPhoneMatch = businessText.match(/(?:Business Phone|Contact Phone|Phone)\s*[:.]?\s*(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i);
    const bPhone = bPhoneMatch ? bPhoneMatch[1].trim() : '';

    const bAddrMatch = businessText.match(/(?:Business Address|Address)\s*[:.]?\s*([A-Za-z0-9\s,.'#-]+?)(?:\r|\n|City|State|Postal|Zip|Industry|$)/i);
    const bAddr = bAddrMatch ? bAddrMatch[1].trim() : '';

    const bCityMatch = businessText.match(/(?:City)\s*[:.]?\s*([A-Za-z\s.-]+?)(?:\r|\n|State|Postal|Zip|$)/i);
    const bCity = bCityMatch ? bCityMatch[1].trim() : '';

    const bStateMatch = businessText.match(/(?:State of Incorporation or Organization|State)\s*[:.]?\s*([A-Za-z\s]+?)(?:\r|\n|Postal|Zip|EIN|Federal|$)/i);
    const bState = bStateMatch ? bStateMatch[1].trim() : '';

    const bZipMatch = businessText.match(/(?:Postal Code|Zip Code|Zip)\s*[:.]?\s*(\d{5}(?:-\d{4})?)/i);
    const bZip = bZipMatch ? bZipMatch[1].trim() : '';

    const bIndMatch = businessText.match(/(?:Industry type|Industry Type|Industry)\s*[:.]?\s*([A-Za-z0-9\s&,.'-]+?)(?:\r|\n|Business Start|Federal|$)/i);
    const bInd = bIndMatch ? bIndMatch[1].trim() : '';

    const bStartDateMatch = businessText.match(/(?:Business Start Date)\s*[:.]?\s*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i);
    const bStartDate = bStartDateMatch ? bStartDateMatch[1].trim() : '';

    const einMatch = businessText.match(/(?:Federal Tax ID|Tax ID|EIN|Federal ID)\s*[:.]?\s*(\d{2}-?\d{7})/i);
    const fedTaxId = einMatch ? einMatch[1].trim() : '';

    const revMatch = businessText.match(/(?:Annual Revenue|Gross Revenue|Annual Sales|Gross Sales)\s*[:$]?\s*([0-9,]+(?:\.[0-9]{2})?)/i);
    const annualRev = revMatch ? Math.round(parseFloat(revMatch[1].replace(/,/g, ''))) : null;

    const reqMatch = businessText.match(/(?:How much capital do you need\?|Capital Needed|Requested Amount|Funding Amount)\s*[:$]?\s*([A-Za-z0-9$,.\s-]+?)(?:\r|\n|What will|Use of|$)/i);
    const reqRange = reqMatch ? reqMatch[1].trim() : '';

    const fundsMatch = businessText.match(/(?:What will the money be used for\?|Use of Funds|Purpose)\s*[:.]?\s*([A-Za-z0-9\s/&,.'-]+?)(?:\r|\n|Owner|Section|$)/i);
    const useOfFunds = fundsMatch ? fundsMatch[1].trim() : '';

    const oFirstMatch = ownerText.match(/(?:First Name|Owner First Name)\s*[:.]?\s*([A-Za-z.'-]+)/i);
    const oFirst = oFirstMatch ? oFirstMatch[1].trim() : '';

    const oLastMatch = ownerText.match(/(?:Last Name|Owner Last Name)\s*[:.]?\s*([A-Za-z.'-]+)/i);
    const oLast = oLastMatch ? oLastMatch[1].trim() : '';

    const oDobMatch = ownerText.match(/(?:Date of Birth|DOB)\s*[:.]?\s*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i);
    const oDob = oDobMatch ? oDobMatch[1].trim() : '';

    const oTitleMatch = ownerText.match(/(?:Title|Owner Title)\s*[:.]?\s*([A-Za-z\s/.'-]+?)(?:\r|\n|Ownership|$)/i);
    const oTitle = oTitleMatch ? oTitleMatch[1].trim() : '';

    const oPctMatch = ownerText.match(/(?:Ownership Percentage|Ownership %|Ownership)\s*[:.]?\s*([0-9]+)%?/i);
    const oPct = oPctMatch ? Number(oPctMatch[1]) : null;

    const oCurrentOwnerDateMatch = ownerText.match(/(?:Business start date under current ownership|Start date under current ownership)\s*[:.]?\s*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i);
    const oCurrentOwnerDate = oCurrentOwnerDateMatch ? oCurrentOwnerDateMatch[1].trim() : '';

    const oHomeSameMatch = ownerText.match(/(?:Is Home Address same as Business Address\?|Home Address same as Business Address)\s*[:.]?\s*(Yes|No|true|false)/i);
    const oHomeSame = oHomeSameMatch ? oHomeSameMatch[1].toLowerCase() === 'yes' || oHomeSameMatch[1].toLowerCase() === 'true' : null;

    const oSsnMatch = ownerText.match(/(?:SSN|Social Security Number)\s*[:.]?\s*(\d{3}-?\d{2}-?\d{4})/i);
    const oSsn = oSsnMatch ? oSsnMatch[1].trim() : '';

    const oCreditMatch = ownerText.match(/(?:CREDIT SCORE|Credit Score|FICO)\s*[:.]?\s*(\d{3})/i);
    const oCredit = oCreditMatch ? Number(oCreditMatch[1]) : null;

    rawParsedApp = {
      business: {
        legalBusinessName: bName,
        businessName: bName,
        dba: bName,
        businessEmail: bEmail,
        businessPhone: bPhone,
        businessAddress: bAddr,
        businessCity: bCity,
        businessState: bState,
        businessZip: bZip,
        industry: bInd,
        businessStartDate: bStartDate,
        federalTaxId: fedTaxId,
        stateOfOrganization: bState,
        annualRevenue: annualRev,
        requestedFundingRange: reqRange,
        useOfFunds,
      },
      owner: {
        firstName: oFirst,
        lastName: oLast,
        dateOfBirth: oDob,
        title: oTitle,
        ownershipPercentage: oPct,
        businessStartDateCurrentOwnership: oCurrentOwnerDate,
        homeAddressSameAsBusinessAddress: oHomeSame,
        ssn: oSsn,
        creditScore: oCredit,
      },
    };

    summary = `Commercial loan application processed from uploaded file "${fileName}".`;
    modelUsed = 'Maple X Document Intelligence';
  }

  const sanitized = validateAndSanitizeApplicationData(rawParsedApp);
  const biz = sanitized.business;
  const own = sanitized.owner;

  const fullLegalName = [own.firstName, own.lastName].filter(Boolean).join(' ');

  addExtractedField('firstName', 'First Name', 'identity', own.firstName);
  addExtractedField('lastName', 'Last Name', 'identity', own.lastName);
  addExtractedField('fullLegalName', 'Full Legal Name', 'identity', fullLegalName || undefined);
  addExtractedField('ssn', 'Social Security Number (SSN)', 'identity', own.ssn);
  addExtractedField('dob', 'Date of Birth (DOB)', 'identity', own.dateOfBirth);
  addExtractedField('ownerTitle', 'Owner Title', 'identity', own.title);
  addExtractedField('ownershipPercentage', 'Ownership Percentage', 'identity', own.ownershipPercentage !== null ? `${own.ownershipPercentage}%` : undefined);
  addExtractedField('creditScore', 'Stated Credit Score / FICO', 'credit', own.creditScore);

  addExtractedField('phone', 'Primary Phone', 'identity', biz.phone || own.ssn ? biz.phone : undefined);
  addExtractedField('email', 'Primary Email', 'identity', biz.email);
  addExtractedField('businessPhone', 'Business Phone', 'business', biz.businessPhone);
  addExtractedField('businessEmail', 'Business Email', 'business', biz.businessEmail);

  addExtractedField('address', 'Residential Address', 'identity', own.homeAddressSameAsBusinessAddress ? biz.address : undefined);
  addExtractedField('city', 'Residential City', 'identity', own.homeAddressSameAsBusinessAddress ? biz.city : undefined);
  addExtractedField('state', 'Residential State', 'identity', own.homeAddressSameAsBusinessAddress ? biz.state : undefined);
  addExtractedField('zip', 'Residential Zip Code', 'identity', own.homeAddressSameAsBusinessAddress ? biz.zip : undefined);

  addExtractedField('businessName', 'Legal Business Entity Name', 'business', biz.businessName);
  addExtractedField('dba', 'Doing Business As (DBA)', 'business', biz.dba);
  addExtractedField('federalTaxId', 'Federal Tax ID / EIN', 'business', biz.federalTaxId);
  addExtractedField('stateOfOrganization', 'State of Organization', 'business', biz.stateOfOrganization);
  addExtractedField('entityType', 'Legal Entity Structure', 'business', biz.entityStructure);
  addExtractedField('industry', 'Business Industry', 'business', biz.industry);
  addExtractedField('businessStartDate', 'Business Start Date', 'business', biz.businessStartDate);
  addExtractedField('businessStartDateUnderCurrentOwnership', 'Business Start Date Under Current Ownership', 'business', own.businessStartDateCurrentOwnership);

  addExtractedField('businessAddress', 'Business Address', 'business', biz.businessAddress);
  addExtractedField('businessCity', 'Business City', 'business', biz.businessCity);
  addExtractedField('businessState', 'Business State', 'business', biz.businessState);
  addExtractedField('businessZip', 'Business Zip', 'business', biz.businessZip);

  addExtractedField('annualRevenue', 'Gross Annual Revenue', 'income', biz.annualRevenue);
  addExtractedField('monthlyRevenue', 'Average Monthly Revenue', 'income', biz.annualRevenue ? Math.round(biz.annualRevenue / 12) : undefined);

  addExtractedField('requestedAmount', 'Requested Funding Amount', 'fundingRequest', biz.requestedAmount);
  addExtractedField('requestedFundingRange', 'Requested Funding Range', 'fundingRequest', biz.requestedFundingRange);
  addExtractedField('useOfFunds', 'Stated Use of Funds / Purpose', 'fundingRequest', biz.useOfFunds);

  return {
    firstName: own.firstName || '',
    lastName: own.lastName || '',
    fullLegalName: fullLegalName || '',
    ssn: own.ssn || undefined,
    dob: own.dateOfBirth || undefined,
    phone: biz.phone || '',
    email: biz.email || '',
    businessPhone: biz.businessPhone || undefined,
    businessEmail: biz.businessEmail || undefined,

    address: (own.homeAddressSameAsBusinessAddress ? biz.address : '') || '',
    city: (own.homeAddressSameAsBusinessAddress ? biz.city : '') || '',
    state: (own.homeAddressSameAsBusinessAddress ? biz.state : '') || '',
    zip: (own.homeAddressSameAsBusinessAddress ? biz.zip : '') || '',

    businessName: biz.businessName || '',
    legalBusinessName: biz.legalBusinessName || biz.businessName || '',
    dba: biz.dba || undefined,
    federalTaxId: biz.federalTaxId || '',
    stateOfOrganization: biz.stateOfOrganization || '',
    entityType: biz.entityStructure || 'LLC',
    industry: biz.industry || '',
    businessStartDate: biz.businessStartDate || undefined,
    businessStartDateUnderCurrentOwnership: own.businessStartDateCurrentOwnership || undefined,
    timeInBusiness: undefined,
    ownershipPercentage: own.ownershipPercentage !== null ? own.ownershipPercentage : 100,
    ownerTitle: own.title || 'Owner',
    homeAddressSameAsBusinessAddress: own.homeAddressSameAsBusinessAddress !== null ? own.homeAddressSameAsBusinessAddress : undefined,

    businessAddress: biz.businessAddress || undefined,
    businessCity: biz.businessCity || undefined,
    businessState: biz.businessState || undefined,
    businessZip: biz.businessZip || undefined,

    annualRevenue: biz.annualRevenue !== null ? biz.annualRevenue : undefined,
    monthlyRevenue: biz.annualRevenue ? Math.round(biz.annualRevenue / 12) : undefined,
    creditScore: own.creditScore !== null ? own.creditScore : undefined,

    requestedAmount: biz.requestedAmount !== null ? biz.requestedAmount : undefined,
    requestedFundingRange: biz.requestedFundingRange || undefined,
    requestedProduct: 'Revenue Funding',
    useOfFunds: biz.useOfFunds || undefined,
    fundingUrgency: 'Flexible',

    application: sanitized,
    source: 'APPLICATION',
    aiFilled: true,
    callVerified: false,

    confidence,
    summary,
    modelUsed,
    extractedFieldsList,
    fieldStatuses,
    unfoundFields,
  };
}

function checkDuplicateClients(
  extracted: Partial<ExtractedApplicationProfile>,
  existingClients: any[]
): {
  existingClient: any;
  matchScore: number;
  matchReasons: string[];
}[] {
  const matches: { existingClient: any; matchScore: number; matchReasons: string[] }[] = [];

  const cleanEin = (val?: string) => (val || '').replace(/[^0-9]/g, '');
  const cleanPhone = (val?: string) => (val || '').replace(/[^0-9]/g, '');
  const cleanEmail = (val?: string) => (val || '').trim().toLowerCase();
  const cleanName = (val?: string) => (val || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  const extEin = cleanEin(extracted.federalTaxId);
  const extEmail = cleanEmail(extracted.email);
  const extBizEmail = cleanEmail(extracted.businessEmail);
  const extPhone = cleanPhone(extracted.phone);
  const extBizPhone = cleanPhone(extracted.businessPhone);
  const extFullName = cleanName(`${extracted.firstName || ''} ${extracted.lastName || ''}`);
  const extBizName = cleanName(extracted.businessName);

  for (const client of existingClients) {
    const reasons: string[] = [];
    let score = 0;

    const cEin = cleanEin(client.federalTaxId);
    if (extEin && cEin && extEin.length >= 7 && extEin === cEin) {
      reasons.push(`Exact EIN match: ${client.federalTaxId}`);
      score += 75;
    }

    const cEmail = cleanEmail(client.email);
    const cBizEmail = cleanEmail(client.businessEmail);
    if (extEmail && (cEmail === extEmail || cBizEmail === extEmail)) {
      reasons.push(`Exact applicant email match: ${client.email}`);
      score += 55;
    }
    if (extBizEmail && extBizEmail !== extEmail && (cEmail === extBizEmail || cBizEmail === extBizEmail)) {
      reasons.push(`Exact business email match: ${client.businessEmail || client.email}`);
      score += 50;
    }

    const cPhone = cleanPhone(client.phone);
    const cBizPhone = cleanPhone(client.businessPhone);
    if (extPhone && extPhone.length >= 7 && (cPhone === extPhone || cBizPhone === extPhone)) {
      reasons.push(`Matching applicant phone: ${client.phone}`);
      score += 45;
    }
    if (extBizPhone && extBizPhone.length >= 7 && extBizPhone !== extPhone && (cPhone === extBizPhone || cBizPhone === extBizPhone)) {
      reasons.push(`Matching business phone: ${client.businessPhone || client.phone}`);
      score += 40;
    }

    const cBizName = cleanName(client.businessName);
    if (extBizName && cBizName && extBizName.length > 3) {
      if (extBizName === cBizName) {
        reasons.push(`Exact business name match: "${client.businessName}"`);
        score += 60;
      } else if (extBizName.includes(cBizName) || cBizName.includes(extBizName)) {
        reasons.push(`Similar business name: "${client.businessName}"`);
        score += 35;
      }
    }

    const cFullName = cleanName(`${client.firstName || ''} ${client.lastName || ''}`);
    if (extFullName && cFullName && extFullName.length > 3 && extFullName === cFullName) {
      reasons.push(`Exact applicant name match: "${client.firstName} ${client.lastName}"`);
      score += 45;
    }

    if (score >= 40 || reasons.length > 0) {
      matches.push({
        existingClient: client,
        matchScore: Math.min(100, score),
        matchReasons: reasons,
      });
    }
  }

  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

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
