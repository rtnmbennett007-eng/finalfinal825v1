import React from 'react';
import {
  MASTER_FUNDING_PRODUCTS,
  FundingProductDefinition,
  getProductsGroupedByCategory,
  getProductByIdOrName,
  isOtherProduct,
} from '../../data/productCatalog';
import { useData } from '../../context/DataContext';
import { Sparkles, Info, AlertCircle, Layers } from 'lucide-react';

interface ProductSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  otherType?: string;
  onChangeOtherType?: (val: string) => void;
  otherDescription?: string;
  onChangeOtherDescription?: (val: string) => void;
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
}

export const ProductSelect: React.FC<ProductSelectProps> = ({
  id,
  value,
  onChange,
  otherType = '',
  onChangeOtherType,
  otherDescription = '',
  onChangeOtherDescription,
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
}) => {
  const { products: contextProducts } = useData ? useData() : { products: [] };
  const productsList = contextProducts && contextProducts.length > 0 ? contextProducts : MASTER_FUNDING_PRODUCTS;
  const grouped = getProductsGroupedByCategory(productsList);

  const selectedDef = getProductByIdOrName(value, productsList);
  const isOther = isOtherProduct(value);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChange(val);
  };

  const padClass = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wide"
          >
            {label} {required && <span className="text-rose-400">*</span>}
          </label>
          {selectedDef && selectedDef.typicalTerm && (
            <span className="text-[10px] text-amber-400 font-mono">
              Term: {selectedDef.typicalTerm}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <select
          id={id}
          value={value || (includeAllOption ? 'ALL' : 'Revenue Funding')}
          onChange={handleSelectChange}
          disabled={disabled}
          required={required}
          className={`w-full bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-colors ${padClass} ${selectClassName}`}
        >
          {includeAllOption && <option value="ALL">{allOptionLabel}</option>}

          {showCategoryHeaders ? (
            Object.entries(grouped).map(([category, prods]) => {
              const activeProds = prods.filter((p) => p.isActive);
              if (activeProds.length === 0) return null;
              return (
                <optgroup key={category} label={`── ${category.toUpperCase()} ──`} className="bg-slate-900 font-semibold text-amber-300">
                  {activeProds.map((prod) => (
                    <option key={prod.id} value={prod.name} className="bg-slate-950 text-slate-100 font-normal">
                      {prod.name}
                    </option>
                  ))}
                </optgroup>
              );
            })
          ) : (
            productsList
              .filter((p) => p.isActive)
              .map((prod) => (
                <option key={prod.id} value={prod.name}>
                  {prod.name} ({prod.category})
                </option>
              ))
          )}
        </select>
      </div>

      {/* When "Other" is selected, require custom Product Type and Description */}
      {isOther && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 animate-fadeIn">
          <div className="flex items-center space-x-1.5 text-amber-300 text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Custom / Other Product Specifications Required</span>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-amber-200 uppercase mb-1">
              Enter Product Type *
            </label>
            <input
              type="text"
              required={required || isOther}
              value={otherType}
              onChange={(e) => onChangeOtherType && onChangeOtherType(e.target.value)}
              placeholder="e.g. Mezzanine Convertible Note, 1031 Exchange Bridge, Private Debt Facility"
              className="w-full bg-slate-950 border border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-amber-200 uppercase mb-1">
              Product Description / Structure Details
            </label>
            <textarea
              rows={2}
              value={otherDescription}
              onChange={(e) => onChangeOtherDescription && onChangeOtherDescription(e.target.value)}
              placeholder="Provide repayment schedule, rate structure, collateral type, or lender program parameters..."
              className="w-full bg-slate-950 border border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
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
    </div>
  );
};
