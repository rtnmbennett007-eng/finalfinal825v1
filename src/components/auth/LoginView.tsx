import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Shield,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  KeyRound,
  HelpCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your Maple X Financial email address.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email.trim(), password.trim());
      if (!res.success) {
        setErrorMessage(res.error || 'Authentication failed. Please check your credentials.');
      } else if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050b18] text-slate-100 p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Ambient background glow effects */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent pointer-events-none" />

      <div className="w-full max-w-xl z-10 space-y-6">
        {/* Maple X Financial Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-b from-[#16274c] to-[#0a1428] border border-amber-400/40 shadow-xl shadow-amber-500/10 mb-2">
            <Shield className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
            MAPLE <span className="text-amber-400">X</span> FINANCIAL
          </h1>
          <p className="text-xs sm:text-sm text-blue-200/80 uppercase tracking-wider font-semibold">
            Internal Operations & Underwriting Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0c1832] border border-blue-900/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 backdrop-blur-xl relative">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-blue-900/60">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                Staff Authentication
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Authorized Maple X personnel only
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
              PORTAL ACCESS 2026
            </span>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@maplexfinancial.com"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#060c1a] border border-blue-900 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-11 py-2.5 bg-[#060c1a] border border-blue-900 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-xl text-sm font-extrabold transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 stroke-[2.5]" />
                  <span>Sign In to Maple X Portal</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security & Support Footer */}
        <div className="text-center text-xs text-slate-400 space-y-1">
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>End-to-End Encrypted Session</span>
            <span>•</span>
            <span>Audit Logging Active</span>
          </div>
          <p className="text-[10px] text-slate-400">
            © 2026 Maple X Financial. Confidential & Proprietary Internal System.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1c38] border border-blue-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                Staff Password Reset
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                All four authorized internal staff accounts have the initial default password:
              </p>
              <div className="p-3 bg-[#060c1a] rounded-xl border border-amber-500/30 text-center font-mono text-amber-400 text-sm font-bold">
                Admin2026!
              </div>
              <p>
                Authorized team members:
              </p>
              <ul className="space-y-1 pl-4 list-disc text-slate-400">
                <li><strong className="text-slate-200">Robert:</strong> robert@maplexfinancial.com</li>
                <li><strong className="text-slate-200">Steve:</strong> steve@maplexfinancial.com</li>
                <li><strong className="text-slate-200">Luke Cowan:</strong> luke.cowan@maplexfinancial.com</li>
                <li><strong className="text-slate-200">Dana Javier:</strong> dana.javier@maplexfinancial.com</li>
              </ul>
              <p className="text-slate-400 text-[11px]">
                Once signed in, you can update your password and profile directly from your profile settings in the header.
              </p>
            </div>

            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
