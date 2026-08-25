import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Save,
  AtSign,
  Hash,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StaffUser } from '../../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile } = useAuth();
  const { addToast } = useData();

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [jobTitle, setJobTitle] = useState(currentUser?.jobTitle || '');
  const [department, setDepartment] = useState(currentUser?.department || 'Operations');
  const [role, setRole] = useState(currentUser?.role || 'INTERNAL_STAFF_ADMIN');
  const [discordUsername, setDiscordUsername] = useState(currentUser?.discordUsername || '');
  const [discordUserId, setDiscordUserId] = useState(currentUser?.discordUserId || '');
  const [notes, setNotes] = useState(currentUser?.notes || '');

  // Password fields
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever modal opens or currentUser updates
  useEffect(() => {
    if (currentUser && isOpen) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setJobTitle(currentUser.jobTitle || '');
      setDepartment(currentUser.department || 'Operations');
      setRole(currentUser.role || 'INTERNAL_STAFF_ADMIN');
      setDiscordUsername(currentUser.discordUsername || '');
      setDiscordUserId(currentUser.discordUserId || '');
      setNotes(currentUser.notes || '');
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const getInitials = (str: string) => {
    if (!str.trim()) return 'MX';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your work email.');
      return;
    }

    // Password validation if changing
    if (isChangingPassword) {
      if (!newPassword.trim()) {
        setError('Please enter your new password.');
        return;
      }
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New password and confirmation do not match.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: Partial<StaffUser> & { currentPassword?: string; newPassword?: string } = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        jobTitle: jobTitle.trim(),
        department: department.trim(),
        role: role as any,
        avatar: '', // Photo removed - initials only
        discordUsername: discordUsername.trim(),
        discordUserId: discordUserId.trim(),
        notes: notes.trim(),
      };

      if (isChangingPassword) {
        payload.currentPassword = currentPassword.trim();
        payload.newPassword = newPassword.trim();
      }

      const res = await updateProfile(payload);
      if (!res.success) {
        setError(res.error || 'Failed to update profile.');
      } else {
        addToast('success', 'Profile Updated', 'Staff details and Discord notification settings saved.');
        setIsChangingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0c1832] border border-blue-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="p-5 bg-[#081124] border-b border-blue-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <User className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Staff Profile & Discord Notifier Settings
              </h2>
              <p className="text-xs text-slate-400">
                Manage your user details, Discord account tag, and security password.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-blue-900/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Initials Badge Display (No Photo) */}
          <div className="p-4 rounded-xl bg-[#081124] border border-blue-900 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/30 to-blue-600/40 text-amber-300 border-2 border-amber-400/50 flex items-center justify-center font-extrabold text-xl shadow-lg shrink-0">
              {getInitials(name)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                  Staff Initials Avatar
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                  Clean Initials Only
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Profile photos have been removed in accordance with security standards. Initials &quot;{getInitials(name)}&quot; will be used across the portal, activity logs, and directory.
              </p>
            </div>
          </div>

          {/* Discord Tagging & Notification Config */}
          <div className="p-4 rounded-xl bg-blue-950/40 border border-indigo-900/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    Discord Account & Notifier Tagging
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Allows the Discord notifier bot to tag you directly on task assignments and reminders.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                  <AtSign className="w-3.5 h-3.5 text-indigo-400" />
                  Discord Username
                </label>
                <input
                  type="text"
                  value={discordUsername}
                  onChange={(e) => setDiscordUsername(e.target.value)}
                  placeholder="e.g. dana_javier or lukecowan"
                  className="w-full px-3.5 py-2 bg-[#060c1a] border border-indigo-900/80 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-400 placeholder-slate-500"
                />
                <span className="text-[10px] text-slate-400 block">
                  Format: username (without @)
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-indigo-400" />
                  Discord User ID (For Direct Mention)
                </label>
                <input
                  type="text"
                  value={discordUserId}
                  onChange={(e) => setDiscordUserId(e.target.value)}
                  placeholder="e.g. 184512345678901234"
                  className="w-full px-3.5 py-2 bg-[#060c1a] border border-indigo-900/80 rounded-xl text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-400 placeholder-slate-500"
                />
                <span className="text-[10px] text-slate-400 block">
                  Right click your name in Discord &rarr; Copy User ID
                </span>
              </div>
            </div>
          </div>

          {/* Personal Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#060c1a] border border-blue-900 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#060c1a] border border-blue-900 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                Direct Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 000-0000"
                className="w-full px-3.5 py-2.5 bg-[#060c1a] border border-blue-900 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Underwriter"
                className="w-full px-3.5 py-2.5 bg-[#060c1a] border border-blue-900 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#060c1a] border border-blue-900 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="Operations">Operations</option>
                <option value="Underwriting">Underwriting</option>
                <option value="Sales & Structuring">Sales & Structuring</option>
                <option value="Executive Operations">Executive Operations</option>
                <option value="Funding Coordination">Funding Coordination</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Internal System Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#060c1a] border border-amber-500/40 rounded-xl text-xs sm:text-sm text-amber-300 font-bold focus:outline-none focus:border-amber-400"
              >
                <option value="INTERNAL_STAFF_ADMIN">Internal Staff Admin (Full Authority)</option>
                <option value="UNDERWRITER">Senior Underwriter</option>
                <option value="OPERATIONS">Operations Specialist</option>
                <option value="STRATEGIST">Senior Financial Strategist</option>
                <option value="CUSTOM">Custom Role</option>
              </select>
            </div>
          </div>

          {/* Notes / Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 block">
              Staff Notes & Internal Bio
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Internal operational notes or specialization..."
              className="w-full px-3.5 py-2 bg-[#060c1a] border border-blue-900 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Change Password Collapsible Section */}
          <div className="p-4 rounded-xl bg-[#081124] border border-blue-900/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">
                  Security & Password Update
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
              >
                {isChangingPassword ? 'Cancel Password Change' : 'Change Password'}
              </button>
            </div>

            {isChangingPassword && (
              <div className="space-y-3 pt-3 border-t border-blue-900/60 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Current Password (Optional if Admin)
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password..."
                      className="w-full pl-3 pr-10 py-2 bg-[#060c1a] border border-blue-900 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-3 pr-10 py-2 bg-[#060c1a] border border-blue-900 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full px-3 py-2 bg-[#060c1a] border border-blue-900 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 bg-[#081124] border-t border-blue-900 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-slate-300 border border-blue-800 rounded-xl text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
