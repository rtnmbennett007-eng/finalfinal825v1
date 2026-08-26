import React from 'react';
import { useData } from '../../context/DataContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useData();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        let bg = 'bg-slate-900/95 border-slate-700/80 text-slate-100';
        let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;

        if (toast.type === 'success') {
          bg = 'bg-slate-900/95 border-emerald-500/40 text-slate-100';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        } else if (toast.type === 'error') {
          bg = 'bg-slate-900/95 border-rose-500/40 text-slate-100';
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
        } else if (toast.type === 'warning') {
          bg = 'bg-slate-900/95 border-amber-500/40 text-slate-100';
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ${bg}`}
          >
            <div className="flex items-start space-x-3">
              {icon}
              <div>
                <h4 className="text-sm font-semibold leading-tight">{toast.title}</h4>
                <p className="text-xs mt-1 text-slate-400 leading-normal">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
