import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MASTER_FUNDING_PRODUCTS,
  PRODUCT_CATEGORIES,
  FundingProductDefinition,
  ProductCategory,
  getProductsGroupedByCategory,
  getProductByIdOrName,
  isOtherProduct,
  formatProductDisplayName,
} from '../../data/productCatalog';
import { useData } from '../../context/DataContext';
import {
  Search,
  ChevronDown,
  Check,
  AlertCircle,
  Briefcase,
  CreditCard,
  User,
  Building,
  Sparkles,
  HelpCircle,
  X,
  ShieldCheck,
  Bot,
  UserCheck,
  Info,
} from 'lucide-react';

export type ProductSourceType = 'AI_FILLED' | 'MANUAL' | 'CALL_VERIFIED' | 'IMPORTED' | string;

export interface ProductSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  otherType?: string;
  onChangeOtherType?: (val: string) => void;
  otherDescription?: string;
  onChangeOtherDescription?: (val: string) => void;
  customProductName?: string;
  onCustomProductNameChange?: (val: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  selectClassName?: string;
  disabled?: boolean;
  includeAllOption?: boolean;
  allOptionLabel?: string;
  showDynamicFieldHints?: boolean;
  showCategoryHeaders?: boolean;
  size?: 'sm' | 'md';
  sourceType?: ProductSourceType;
  placeholder?: string;
  error?: string;
  helperText?: string;
}

const CATEGORY_ICONS: Record<ProductCategory, React.ComponentType<{ className?: string }>> = {
  'Business / Commercial Funding': Briefcase,
  'Credit / Card Funding': CreditCard,
  'Personal Funding': User,
  'Real Estate & Property Funding': Building,
  'Specialty & Alternative Financing': Sparkles,
  'Other / Custom': HelpCircle,
};

const CATEGORY_COLORS: Record<ProductCategory, { text: string; bg: string; border: string }> = {
  'Business / Commercial Funding': {
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  'Credit / Card Funding': {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  'Personal Funding': {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  'Real Estate & Property Funding': {
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
  'Specialty & Alternative Financing': {
    text: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
  },
  'Other / Custom': {
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
  },
};

export const ProductSelect: React.FC<ProductSelectProps> = ({
  id,
  value,
  onChange,
  otherType = '',
  onChangeOtherType,
  otherDescription = '',
  onChangeOtherDescription,
  customProductName = '',
  onCustomProductNameChange,
  label,
  required = false,
  className = '',
  selectClassName = '',
  disabled = false,
  includeAllOption = false,
  allOptionLabel = 'All Funding Products',
  showDynamicFieldHints = false,
  showCategoryHeaders = true,
  size = 'md',
  sourceType,
  placeholder = 'Select Funding Product...',
  error,
  helperText,
}) => {
  const { products: contextProducts } = useData ? useData() : { products: [] };
  const productsList =
    contextProducts && contextProducts.length > 0 ? contextProducts : MASTER_FUNDING_PRODUCTS;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync custom product name handlers
  const currentOtherType = otherType || customProductName || '';
  const handleOtherTypeChange = (val: string) => {
    if (onChangeOtherType) onChangeOtherType(val);
    if (onCustomProductNameChange) onCustomProductNameChange(val);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
      setSelectedCategoryFilter('ALL');
    }
  }, [isOpen]);

  const selectedDef = useMemo(() => {
    return getProductByIdOrName(value, productsList);
  }, [value, productsList]);

  const isOther = isOtherProduct(value) || selectedDef?.id === 'other';

  // Filtered products based on search term & category filter
  const filteredGroupedProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const result: Record<ProductCategory, FundingProductDefinition[]> = {
      'Business / Commercial Funding': [],
      'Credit / Card Funding': [],
      'Personal Funding': [],
      'Real Estate & Property Funding': [],
      'Specialty & Alternative Financing': [],
      'Other / Custom': [],
    };

    for (const prod of productsList) {
      if (!prod.isActive) continue;

      if (selectedCategoryFilter !== 'ALL' && prod.category !== selectedCategoryFilter) {
        continue;
      }

      if (term) {
        const nameMatch = prod.name.toLowerCase().includes(term);
        const descMatch = (prod.description || '').toLowerCase().includes(term);
        const catMatch = prod.category.toLowerCase().includes(term);
        const termMatch = (prod.typicalTerm || '').toLowerCase().includes(term);
        const idMatch = prod.id.toLowerCase().includes(term);

        if (!nameMatch && !descMatch && !catMatch && !termMatch && !idMatch) {
          continue;
        }
      }

      if (result[prod.category]) {
        result[prod.category].push(prod);
      } else {
        result['Other / Custom'].push(prod);
      }
    }

    return result;
  }, [productsList, searchTerm, selectedCategoryFilter]);

  const totalFilteredCount = useMemo(() => {
    return Object.values(filteredGroupedProducts).reduce((sum, list) => sum + list.length, 0);
  }, [filteredGroupedProducts]);

  const handleSelectProduct = (prod: FundingProductDefinition | null) => {
    if (!prod) {
      if (includeAllOption) {
        onChange('ALL');
      }
      setIsOpen(false);
      return;
    }

    onChange(prod.name);
    setIsOpen(false);
  };

  const getSourceBadge = () => {
    if (!sourceType) return null;
    if (sourceType === 'CALL_VERIFIED') {
      return (
        <span
          title="Call Verified by Operations Staff"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold"
        >
          <ShieldCheck className="w-2.5 h-2.5" />
          CALL VERIFIED
        </span>
      );
    }
    if (sourceType === 'AI_FILLED') {
      return (
        <span
          title="Extracted via Document AI Intelligence"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-mono font-bold"
        >
          <Bot className="w-2.5 h-2.5" />
          AI FILLED
        </span>
      );
    }
    if (sourceType === 'MANUAL') {
      return (
        <span
          title="Entered / Overridden by Staff"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] font-mono font-bold"
        >
          <UserCheck className="w-2.5 h-2.5" />
          MANUAL
        </span>
      );
    }
    return null;
  };

  const isValueAll = value === 'ALL' || value === 'all';
  const displayLabel = isValueAll
    ? allOptionLabel
    : formatProductDisplayName(value, currentOtherType, productsList);

  const selectedCategory = selectedDef?.category;
  const categoryStyle = selectedCategory ? CATEGORY_COLORS[selectedCategory] : null;
  const CategoryIcon = selectedCategory ? CATEGORY_ICONS[selectedCategory] : Briefcase;

  const padClass = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs';

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
      {/* Label and Source Bar */}
      {(label || sourceType) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label
              htmlFor={id}
              className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wide cursor-pointer"
              onClick={() => !disabled && setIsOpen(!isOpen)}
            >
              {label} {required && <span className="text-rose-400">*</span>}
            </label>
          )}
          <div className="flex items-center gap-2">
            {getSourceBadge()}
            {selectedDef && selectedDef.typicalTerm && !isValueAll && (
              <span className="text-[10px] text-amber-400 font-mono hidden sm:inline">
                Term: {selectedDef.typicalTerm}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Trigger Button */}
      <div className="relative">
        <button
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-2 bg-slate-950 border text-left rounded-xl transition-all ${
            disabled ? 'opacity-50 cursor-not-allowed border-slate-800' : 'cursor-pointer hover:border-blue-500/60'
          } ${
            isOpen ? 'border-amber-500 ring-2 ring-amber-500/20' : error ? 'border-rose-500' : 'border-slate-800'
          } ${padClass} ${selectClassName}`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isValueAll ? (
              <div className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
            ) : selectedCategory ? (
              <div
                className={`p-1 rounded-md shrink-0 ${categoryStyle?.bg || 'bg-blue-500/10'} ${
                  categoryStyle?.border || 'border-blue-500/30'
                } border`}
              >
                <CategoryIcon className={`w-3 h-3 ${categoryStyle?.text || 'text-blue-400'}`} />
              </div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
            )}

            <div className="min-w-0 flex-1 truncate">
              <span
                className={`font-medium block truncate ${
                  value ? 'text-slate-100' : 'text-slate-500'
                }`}
              >
                {value ? displayLabel : placeholder}
              </span>
              {selectedDef && !isValueAll && (
                <span className="text-[10px] text-slate-400 block truncate">
                  {selectedDef.category} • {selectedDef.typicalTerm}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 text-slate-400">
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-400' : ''}`} />
          </div>
        </button>

        {/* Dropdown Popover */}
        {isOpen && (
          <div
            className="absolute z-50 left-0 right-0 mt-1.5 bg-[#091326] border border-blue-900/80 rounded-2xl shadow-2xl shadow-slate-950/80 overflow-hidden flex flex-col max-h-[380px] animate-fadeIn"
            style={{ minWidth: '280px' }}
          >
            {/* Search Bar */}
            <div className="p-2.5 border-b border-blue-900/60 bg-[#070e1c] flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search 42+ products, categories, terms..."
                className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Quick Filter Pills */}
            <div className="flex items-center gap-1 p-2 border-b border-blue-900/40 bg-[#060c18] overflow-x-auto no-scrollbar text-[10px]">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('ALL')}
                className={`px-2 py-0.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                  selectedCategoryFilter === 'ALL'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({productsList.length})
              </button>
              {PRODUCT_CATEGORIES.map((cat) => {
                const count = productsList.filter((p) => p.category === cat && p.isActive).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                      selectedCategoryFilter === cat
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.split(' ')[0]} ({count})
                  </button>
                );
              })}
            </div>

            {/* Products List */}
            <div className="overflow-y-auto p-1.5 divide-y divide-blue-950/60 max-h-[260px]">
              {/* Optional "All Products" Item for Filters */}
              {includeAllOption && !searchTerm && (
                <div className="pb-1">
                  <button
                    type="button"
                    onClick={() => handleSelectProduct(null)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                      isValueAll ? 'bg-blue-600/30 text-blue-300 font-bold border border-blue-500/40' : 'hover:bg-blue-950/40 text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-semibold">{allOptionLabel}</span>
                    {isValueAll && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                </div>
              )}

              {totalFilteredCount === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  <p>No products match "{searchTerm}"</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategoryFilter('ALL');
                    }}
                    className="mt-2 text-amber-400 underline font-semibold text-[11px]"
                  >
                    Clear search filter
                  </button>
                </div>
              ) : (
                Object.entries(filteredGroupedProducts).map(([category, prods]) => {
                  if (prods.length === 0) return null;
                  const catStyle = CATEGORY_COLORS[category as ProductCategory];
                  const Icon = CATEGORY_ICONS[category as ProductCategory] || Briefcase;

                  return (
                    <div key={category} className="py-1.5">
                      {showCategoryHeaders && (
                        <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold tracking-wider uppercase text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Icon className={`w-3 h-3 ${catStyle?.text || 'text-slate-400'}`} />
                            {category}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">
                            {prods.length}
                          </span>
                        </div>
                      )}

                      <div className="space-y-0.5 mt-0.5">
                        {prods.map((prod) => {
                          const isSelected =
                            value === prod.name ||
                            value === prod.id ||
                            selectedDef?.id === prod.id;

                          return (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => handleSelectProduct(prod)}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer group ${
                                isSelected
                                  ? 'bg-blue-600/30 text-white border border-blue-500/50 shadow-inner'
                                  : 'hover:bg-blue-900/30 text-slate-200'
                              }`}
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold group-hover:text-amber-300 transition-colors">
                                    {prod.name}
                                  </span>
                                  {prod.id === 'other' && (
                                    <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-mono">
                                      Custom
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-2">
                                  <span className="font-mono text-amber-400/90">
                                    {prod.typicalTerm}
                                  </span>
                                  <span>•</span>
                                  <span className="truncate">{prod.description}</span>
                                </div>
                              </div>

                              {isSelected && (
                                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* When "Other / Custom" is selected, show custom Product Type and Description inputs */}
      {isOther && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 animate-fadeIn mt-2">
          <div className="flex items-center space-x-1.5 text-amber-300 text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Custom / Other Product Specifications</span>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-amber-200 uppercase mb-1">
              Product Type / Name *
            </label>
            <input
              type="text"
              required={required || isOther}
              disabled={disabled}
              value={currentOtherType}
              onChange={(e) => handleOtherTypeChange(e.target.value)}
              placeholder="e.g. Mezzanine Convertible Note, 1031 Exchange Bridge, Private Debt Facility"
              className="w-full bg-slate-950 border border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-amber-200 uppercase mb-1">
              Structure Details & Repayment Parameters (Optional)
            </label>
            <textarea
              rows={2}
              disabled={disabled}
              value={otherDescription}
              onChange={(e) => onChangeOtherDescription && onChangeOtherDescription(e.target.value)}
              placeholder="Provide repayment schedule, interest rates, collateral requirements, or bespoke lender terms..."
              className="w-full bg-slate-950 border border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      )}

      {/* Dynamic Field & Underwriting Hints */}
      {showDynamicFieldHints && selectedDef && !isOther && selectedDef.requiredFields && selectedDef.requiredFields.length > 0 && (
        <div className="p-2.5 bg-blue-950/40 border border-blue-800/40 rounded-xl flex items-start space-x-2 text-[11px] text-slate-300">
          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-blue-300 block">{selectedDef.name} Requirements:</span>
            <span className="text-slate-400 block text-[10px] leading-relaxed">
              {selectedDef.description}
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedDef.requiredFields.map((field) => (
                <span
                  key={field}
                  className="px-1.5 py-0.5 bg-blue-900/60 border border-blue-700/50 text-[9px] font-mono text-blue-200 rounded"
                >
                  {field.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-[11px] text-rose-400 font-medium">{error}</p>}
      {helperText && !error && <p className="text-[10px] text-slate-400">{helperText}</p>}
    </div>
  );
};

