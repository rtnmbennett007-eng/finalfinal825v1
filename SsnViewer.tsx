import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface SsnViewerProps {
  ssn: string;
  clientId?: string;
  className?: string;
}

export const SsnViewer: React.FC<SsnViewerProps> = ({ ssn, clientId, className = '' }) => {
  const [show, setShow] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const { currentUser } = useAuth();
  const { auditSsnView, addToast } = useData();

  const formattedSsn = ssn || '123-45-6789';
  const lastFour = formattedSsn.replace(/\D/g, '').slice(-4) || '6789';
  const maskedSsn = `•••-••-${lastFour}`;

  const toggleShow = () => {
    if (!show && clientId && currentUser) {
      // Log view audit
      auditSsnView(clientId, currentUser.name);
    }
    setShow((prev) => !prev);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedSsn);
    setCopied(true);
    addToast('info', 'SSN Copied', 'Full SSN copied to clipboard securely.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`inline-flex items-center space-x-2 bg-slate-900/90 border border-blue-500/30 rounded-lg px-2.5 py-1 text-sm ${className}`}>
      <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
      <span className="font-mono tracking-wider text-blue-200 select-all font-semibold">
        {show ? formattedSsn : maskedSsn}
      </span>
      <div className="flex items-center space-x-1 border-l border-slate-700 pl-2">
        <button
          type="button"
          onClick={toggleShow}
          title={show ? 'Hide SSN' : 'Show Full SSN (All 4 Maple X users authorized)'}
          className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
        >
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy SSN"
          className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
