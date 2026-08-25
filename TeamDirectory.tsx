import React, { useState } from 'react';
import {
  UserSquare2,
  ShieldCheck,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  Crown,
  ChevronDown,
  ChevronUp,
  AtSign,
  Briefcase,
  ListChecks,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export const TeamDirectory: React.FC = () => {
  const { staffList, currentUser, setCurrentUser } = useAuth();
  const { clients, deals } = useData();
  const [expandedResponsibilities, setExpandedResponsibilities] = useState<Record<string, boolean>>({
    'staff-luke': true,
    'staff-dana': true,
    'staff-robert': true,
    'staff-steve': true,
  });

  const toggleExpanded = (id: string) => {
    setExpandedResponsibilities((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#0c1832] border border-blue-900/80 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded uppercase font-mono flex items-center gap-1">
            <Crown className="w-3 h-3 text-amber-400" />
            Company Leadership & Core Operators
          </span>
          <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded uppercase font-mono">
            EQUAL FULL ACCESS
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 mt-2 flex items-center gap-2">
          <UserSquare2 className="w-6 h-6 text-amber-400" />
          Maple X Leadership & Team Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
          The titles describe each person's core responsibilities and company focus. All four leadership members possess <strong className="text-amber-400">identical Full Access</strong> across all portal sections, underwriting pipelines, document vaults, client files, and commission calculations.
        </p>
      </div>

      {/* Staff Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {staffList.map((staff) => {
          const isCurrent = currentUser?.id === staff.id || currentUser?.email?.toLowerCase() === staff.email?.toLowerCase();
          const assignedClients = clients.filter((c) => c.assignedStaff === staff.name || (staff.fullName && c.assignedStaff === staff.fullName)).length;
          const assignedDeals = deals.filter((d) => d.assignedStaff === staff.name || (staff.fullName && d.assignedStaff === staff.fullName)).length;
          const isExpanded = !!expandedResponsibilities[staff.id];
          const responsibilities = staff.responsibilities || [];

          return (
            <div
              key={staff.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'bg-[#0f2142] border-amber-400/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/30'
                  : 'bg-[#0b1528] border-blue-900/60 hover:border-blue-700/80'
              }`}
            >
              <div className="space-y-4">
                {/* Avatar and Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-blue-600/30 text-amber-300 border border-amber-400/40 flex items-center justify-center font-black text-base shadow-md">
                    {staff.name.charAt(0)}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono">
                      FULL ACCESS
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-extrabold uppercase font-mono">
                        Active Session
                      </span>
                    )}
                  </div>
                </div>

                {/* Name, Portal Title & Company Role */}
                <div>
                  <h3 className="text-base font-extrabold text-slate-100 tracking-tight">
                    {staff.name}
                  </h3>
                  <div className="text-xs font-bold text-amber-400 mt-0.5 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{staff.title || (staff as any).portalTitle || 'Core Leadership'}</span>
                  </div>
                  <div className="text-xs text-blue-200/90 font-medium mt-0.5 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-blue-400 shrink-0" />
                    <span>{staff.jobTitle}</span>
                  </div>
                </div>

                {/* Contact & Discord info */}
                <div className="space-y-1 text-xs text-slate-300 font-mono bg-[#060c18] p-3 rounded-xl border border-blue-950/80">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{staff.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{staff.phone}</span>
                  </div>
                  {staff.discordUsername && (
                    <div className="flex items-center gap-1.5 text-indigo-300">
                      <AtSign className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span>@{staff.discordUsername}</span>
                    </div>
                  )}
                </div>

                {/* Assigned Metrics */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                  <div className="bg-[#060c18] p-2 rounded-xl border border-blue-950">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Client Files</span>
                    <strong className="text-slate-100 text-sm">{assignedClients}</strong>
                  </div>
                  <div className="bg-[#060c18] p-2 rounded-xl border border-blue-950">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Deals</span>
                    <strong className="text-slate-100 text-sm">{assignedDeals}</strong>
                  </div>
                </div>

                {/* Responsibilities Accordion */}
                {responsibilities.length > 0 && (
                  <div className="pt-2 border-t border-blue-900/40">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(staff.id)}
                      className="w-full flex items-center justify-between text-[11px] font-bold text-slate-300 hover:text-amber-400 py-1 transition-colors"
                    >
                      <span className="flex items-center gap-1">
                        <ListChecks className="w-3.5 h-3.5 text-amber-400" />
                        Responsibilities ({responsibilities.length})
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1 text-[10px] text-slate-300 leading-snug divide-y divide-blue-950/60">
                        {responsibilities.map((resp, idx) => (
                          <li key={idx} className="pt-1 first:pt-0 flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => setCurrentUser(staff)}
                disabled={isCurrent}
                className={`w-full mt-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-900/40 text-slate-400 border border-blue-800/40 cursor-default'
                    : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-md shadow-amber-500/20'
                }`}
              >
                {isCurrent ? 'Current Session Operator' : `Switch Session to ${staff.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
