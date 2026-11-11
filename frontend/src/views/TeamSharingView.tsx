import React, { useState } from 'react';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { HashSignedReport, TeamMember, TeamUserRole } from '../types';
import { formatSignatureBadge, pureJsSha256 } from '../services/hashService';
import {
  Share2,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  Trash2,
  FileText,
  Download,
  Users,
  Key,
  Calendar,
  Clock,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export const TeamSharingView: React.FC = () => {
  const {
    teamMembers,
    sharedReports,
    generateSignedReport,
    revokeSharedReport,
    executiveKpis,
  } = usePayPilotStore();

  const [reportTitle, setReportTitle] = useState('Recovery Audit Proof Report');
  const [reportType, setReportType] = useState<HashSignedReport['reportType']>('RECOVERY_AUDIT_PROOF');
  const [targetRole, setTargetRole] = useState<TeamUserRole>('EXTERNAL_ACCOUNTANT');
  const [expiryWindow, setExpiryWindow] = useState<'24_HOURS' | '7_DAYS' | '30_DAYS'>('7_DAYS');
  const [copiedReportId, setCopiedReportId] = useState<string | null>(null);
  const [verifiedReportId, setVerifiedReportId] = useState<string | null>(null);
  const [tamperedReportId, setTamperedReportId] = useState<string | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) return;
    generateSignedReport(reportTitle, reportType);
  };

  const handleCopyLink = (report: HashSignedReport) => {
    const url = `${report.scopedShareUrl}&role=${targetRole.toLowerCase()}&expiry=${expiryWindow.toLowerCase()}`;
    navigator.clipboard?.writeText(url);
    setCopiedReportId(report.id);
    setTimeout(() => setCopiedReportId(null), 2000);
  };

  const handleVerifyIntegrity = (report: HashSignedReport) => {
    // Strictly verify cryptographic SHA-256 against canonical JSON payload
    if (!report.canonicalJsonPayload || !report.sha256ProofHash) {
      setTamperedReportId(report.id);
      setVerifiedReportId(null);
      setTimeout(() => setTamperedReportId(null), 4000);
      return;
    }

    const computedHash = pureJsSha256(report.canonicalJsonPayload);
    const isValid = computedHash.toLowerCase() === report.sha256ProofHash.toLowerCase();

    if (isValid) {
      setVerifiedReportId(report.id);
      setTamperedReportId(null);
      setTimeout(() => setVerifiedReportId(null), 4000);
    } else {
      setTamperedReportId(report.id);
      setVerifiedReportId(null);
      setTimeout(() => setTamperedReportId(null), 4000);
    }
  };

  const handleDownloadJson = (report: HashSignedReport) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(report.canonicalJsonPayload);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${report.id}-signed-package.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div data-testid="team-sharing-view" className="space-y-6">
      {/* 1. Header */}
      <div className="glass tone-glow rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white flex items-center gap-2.5">
            Share a report safely
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-paypal-blue/20 text-paypal-cyan border border-paypal-cyan/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-paypal-cyan" />
              Tamper-proof link
            </span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Create a report link that expires, and that others can check has not been changed.
          </p>
        </div>
      </div>

      {/* 2. Top Grid: Generator Form + Active Proofs Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Scoped Expiring Link & Report Generator */}
        <div className="lg:col-span-5 glass tone-glow rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-200/50 dark:border-white/10">
            <Share2 className="w-4 h-4 text-paypal-cyan" />
            <h3 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider font-mono">
              Create a signed report
              <span className="sr-only">Generate Signed Audit Report</span>
            </h3>
          </div>

          <form onSubmit={handleGenerate} className="space-y-3.5 text-xs">
            {/* Title */}
            <div>
              <label className="text-stone-500 dark:text-stone-400 text-[11px] font-mono block mb-1">Report Title</label>
              <input
                type="text"
                data-testid="share-report-title-input"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 text-xs text-white focus:outline-none focus:border-paypal-cyan"
                placeholder="e.g. Q4 Recovery Audit Proof"
              />
            </div>

            {/* Report Type */}
            <div>
              <label className="text-stone-500 dark:text-stone-400 text-[11px] font-mono block mb-1">Audit Package Type</label>
              <select
                data-testid="share-report-type-select"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 text-xs text-stone-700 dark:text-stone-200 focus:outline-none focus:border-paypal-cyan font-mono"
              >
                <option value="RECOVERY_AUDIT_PROOF">Recovery Audit Proof ($18.4k Identified)</option>
                <option value="PAYMENT_TRUTH_PACK">Payment Truth Pack (3-Way Reconciliation)</option>
                <option value="90DAY_CASH_FLOW_FORECAST">90-Day Cash-Flow Forecast (Runway Model)</option>
              </select>
            </div>

            {/* Role Scope */}
            <div>
              <label className="text-stone-500 dark:text-stone-400 text-[11px] font-mono block mb-1">Recipient Access Scope</label>
              <select
                data-testid="share-role-select"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 text-xs text-stone-700 dark:text-stone-200 focus:outline-none focus:border-paypal-cyan font-mono"
              >
                <option value="EXTERNAL_ACCOUNTANT">External Accountant (Read-Only Ledgers)</option>
                <option value="AUDITOR">Auditor (Cryptographic Hashes & Raw Payloads)</option>
                <option value="FINANCE_MANAGER">Finance Manager (Operations View)</option>
              </select>
            </div>

            {/* Expiry Window */}
            <div>
              <label className="text-stone-500 dark:text-stone-400 text-[11px] font-mono block mb-1">Link Expiration Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {(['24_HOURS', '7_DAYS', '30_DAYS'] as const).map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    data-testid={`expiry-option-${exp}`}
                    onClick={() => setExpiryWindow(exp)}
                    className={`py-1.5 px-2 rounded-lg text-center font-mono text-[11px] border transition ${
                      expiryWindow === exp
                        ? 'bg-paypal-blue text-white border-paypal-cyan font-bold shadow-glow-paypal'
                        : 'bg-white/50 dark:bg-stone-950/60 text-stone-500 dark:text-stone-400 border-stone-200/60 dark:border-white/10 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    {exp.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              data-testid="generate-signed-report-btn"
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-paypal-blue to-paypal-dark hover:from-paypal-cyan hover:to-paypal-blue text-white font-bold text-xs transition shadow-glow-paypal"
            >
              <ShieldCheck className="w-4 h-4 text-paypal-cyan" />
              <span>Generate Cryptographic Signed Report</span>
            </button>
          </form>
        </div>

        {/* Right Column (7 cols): Active Reports & SHA-256 Proof Badges */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass tone-glow rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200/50 dark:border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-paypal-cyan" />
                <h3 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider font-mono">
                  Active Cryptographic Reports ({sharedReports.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">
                FIPS PUB 180-2 SHA-256
              </span>
            </div>

            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {sharedReports.map((report) => {
                const isCopied = copiedReportId === report.id;
                const isVerified = verifiedReportId === report.id;
                const isTampered = tamperedReportId === report.id;

                return (
                  <div
                    key={report.id}
                    data-testid={`shared-report-item-${report.id}`}
                    className={`p-4 rounded-xl border space-y-2.5 transition ${
                      report.revoked
                        ? 'bg-white/50 dark:bg-stone-950/60 border-stone-200/60 dark:border-white/10 opacity-60'
                        : 'bg-white/50 dark:bg-stone-950/60 border-stone-200/60 dark:border-white/10 hover:border-stone-300/70 dark:border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-stone-900 dark:text-white">{report.id}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100/80 dark:bg-stone-900/60 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-white/10">
                            {report.reportType.replace(/_/g, ' ')}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                              report.revoked
                                ? 'bg-rose-950 text-rose-300 border-rose-500/30'
                                : 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            {report.revoked ? 'REVOKED' : 'ACTIVE'}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-stone-700 dark:text-stone-200 mt-1">{report.reportTitle}</h4>
                      </div>

                      <div className="text-right text-[10px] font-mono text-stone-500 dark:text-stone-400">
                        <span>Views: {report.accessCount}</span>
                      </div>
                    </div>

                    {/* SHA-256 Badge */}
                    <div className="p-2.5 rounded-lg bg-white/40 dark:bg-stone-900/50 border border-stone-200/60 dark:border-white/10 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="text-stone-500 dark:text-stone-400 text-[10px] block">Cryptographic Hash Badge:</span>
                        <span
                          data-testid={`report-hash-badge-${report.id}`}
                          className="font-bold text-paypal-cyan text-[11px] truncate"
                        >
                          {report.verificationBadgeLabel || formatSignatureBadge(report.sha256ProofHash)}
                        </span>
                      </div>

                      {/* Verification Status Feedback */}
                      {isVerified && (
                        <span
                          data-testid="verification-confirmed-badge"
                          className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono shrink-0 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-emerald-400" /> Tamper-Evident SHA-256 Match Verified
                        </span>
                      )}

                      {isTampered && (
                        <span
                          data-testid="verification-failed-badge"
                          className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 text-[10px] font-mono shrink-0 flex items-center gap-1"
                        >
                          <ShieldAlert className="w-3 h-3 text-rose-400" /> Cryptographic Integrity Compromised: SHA-256 Hash Mismatch
                        </span>
                      )}
                    </div>

                    {/* Report Meta & Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200/50 dark:border-white/10 text-[11px] font-mono text-stone-500 dark:text-stone-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-stone-500 dark:text-stone-400" />
                          Created: {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 text-stone-500 dark:text-stone-400">
                          <Clock className="w-3 h-3 text-amber-500/60" />
                          Expires: {new Date(report.expiresAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Verify Integrity */}
                        <button
                          type="button"
                          data-testid={`verify-integrity-btn-${report.id}`}
                          onClick={() => handleVerifyIntegrity(report)}
                          className="px-2 py-1 rounded bg-stone-100/80 dark:bg-stone-900/60 hover:bg-stone-200/80 dark:hover:bg-stone-800/80 text-paypal-cyan border border-paypal-cyan/30 text-[11px] flex items-center gap-1 transition"
                          title="Verify SHA-256 against canonical JSON payload"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verify</span>
                        </button>

                        {/* Copy Link */}
                        <button
                          type="button"
                          data-testid={`copy-share-link-btn-${report.id}`}
                          onClick={() => handleCopyLink(report)}
                          disabled={report.revoked}
                          className="px-2 py-1 rounded bg-stone-100/80 dark:bg-stone-900/60 hover:bg-stone-200/80 dark:hover:bg-stone-800/80 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-white/10 text-[11px] flex items-center gap-1 transition disabled:opacity-30"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                        </button>

                        {/* Download JSON */}
                        <button
                          type="button"
                          onClick={() => handleDownloadJson(report)}
                          className="p-1 rounded bg-stone-100/80 dark:bg-stone-900/60 hover:bg-stone-200/80 dark:hover:bg-stone-800/80 text-stone-500 dark:text-stone-400 hover:text-white border border-stone-200/60 dark:border-white/10 transition"
                          title="Download Canonical JSON Package"
                        >
                          <Download className="w-3 h-3" />
                        </button>

                        {/* Revoke */}
                        {!report.revoked && (
                          <button
                            type="button"
                            data-testid={`revoke-report-btn-${report.id}`}
                            onClick={() => revokeSharedReport(report.id)}
                            className="p-1 rounded bg-stone-100/80 dark:bg-stone-900/60 hover:bg-rose-950/60 text-stone-500 dark:text-stone-400 hover:text-rose-400 border border-stone-200/60 dark:border-white/10 transition"
                            title="Revoke Link Access"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {sharedReports.length === 0 && (
                <div className="p-8 text-center text-xs text-stone-500 dark:text-stone-400 bg-white/50 dark:bg-stone-950/60 rounded-xl border border-stone-200/60 dark:border-white/10">
                  No active shared reports. Generate one using the form on the left.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Team Members & Governance Roster */}
      <div className="glass tone-glow rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200/50 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-paypal-cyan" />
            <h3 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider font-mono">
              Who can see what
              <span className="sr-only">Authorized Team Members &amp; Permissions Roster</span>
            </h3>
          </div>
          <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">
            {teamMembers.length} Active Accounts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {teamMembers.map((member) => {
            const roleBadgeColor =
              member.role === 'OWNER'
                ? 'bg-purple-950/60 text-purple-300 border-purple-500/30'
                : member.role === 'EXTERNAL_ACCOUNTANT'
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
                : member.role === 'AUDITOR'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                : 'bg-blue-950/60 text-blue-300 border-blue-500/30';

            return (
              <div
                key={member.id}
                data-testid={`team-member-card-${member.id}`}
                className="p-4 rounded-xl bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-paypal-blue to-purple-600 flex items-center justify-center font-bold text-stone-900 dark:text-white text-xs">
                    {member.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-white">{member.name}</h4>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 truncate block max-w-[150px]">{member.email}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${roleBadgeColor}`}>
                    {member.role.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">
                    Active: {new Date(member.lastActive).toLocaleDateString()}
                  </span>
                </div>

                {/* Permissions Checklist */}
                <div className="pt-2 border-t border-stone-200/50 dark:border-white/10 space-y-1.5 text-[11px] font-mono text-stone-600 dark:text-stone-300">
                  <div className="flex items-center gap-1.5">
                    <span className={member.permissions.canExecutePayPalClaims ? 'text-emerald-400' : 'text-slate-600'}>
                      {member.permissions.canExecutePayPalClaims ? '✓' : '✗'}
                    </span>
                    <span>Execute PayPal Claims</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={member.permissions.canViewRawFinancials ? 'text-emerald-400' : 'text-slate-600'}>
                      {member.permissions.canViewRawFinancials ? '✓' : '✗'}
                    </span>
                    <span>View Raw Financials</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={member.permissions.canExportReports ? 'text-emerald-400' : 'text-slate-600'}>
                      {member.permissions.canExportReports ? '✓' : '✗'}
                    </span>
                    <span>Export Signed Reports</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TeamSharingView;
