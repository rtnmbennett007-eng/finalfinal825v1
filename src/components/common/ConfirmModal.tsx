import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Delete Record',
  cancelText = 'Cancel',
  isLoading = false,
  type = 'danger',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={() => {
          if (!isLoading) onClose();
        }}
      />

      {/* Dialog Container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
        <div
          className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-[#0b1528] border border-slate-700/80 p-6 text-left shadow-2xl transition-all animate-in zoom-in-95 duration-150 text-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl shrink-0 ${
                type === 'danger'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {type === 'danger' ? (
                <Trash2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-base font-bold text-slate-100 leading-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed whitespace-pre-line">
                {message}
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-slate-500 hover:text-slate-300 p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={async () => {
                await onConfirm();
              }}
              disabled={isLoading}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                type === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
              } disabled:opacity-50`}
            >
              {isLoading ? (
                <span>Processing...</span>
              ) : (
                <>
                  {type === 'danger' && <Trash2 className="w-3.5 h-3.5" />}
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
