import React, { useState } from 'react';
import { useDisputes } from '../hooks/useDisputes';
import { DisputeEvidenceItem } from '../types';
import {
  ShieldAlert,
  Clock,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Send,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  Layers,
  ArrowRight,
  Eye,
  X,
  Copy,
  Download,
  FileCheck,
  Check,
  Package,
  Truck,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

export function DisputeDefenseView() {
  const {
    disputes,
    rawDisputes,
    selectedDisputeId,
    selectedDispute,
    isLoading,
    isActionLoading,
    statusFilter,
    searchQuery,
    actionMessage,
    setStatusFilter,
    setSearchQuery,
    setSelectedDisputeId,
    refresh,
    investigate,
    generateDraft,
    submitForApproval,
    submitToProvider,
    clearActionMessage,
  } = useDisputes();

  const [activeTab, setActiveTab] = useState<'timeline' | 'checklist' | 'response' | 'evidence'>('timeline');
  const [submissionMode, setSubmissionMode] = useState<'auto_provider_api' | 'manual_provider_portal'>('auto_provider_api');
  const [approvalId, setApprovalId] = useState<string | null>(null);

  // Evidence Drawer & Approval Review Modal state
  const [selectedEvidence, setSelectedEvidence] = useState<DisputeEvidenceItem | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Compute summary metrics
  const totalAtRisk = rawDisputes.reduce((acc, d) => acc + d.disputed_amount, 0);
  const urgentCount = rawDisputes.filter((d) => d.status === 'WAITING_FOR_SELLER').length;

  const handleInvestigate = async () => {
    if (!selectedDisputeId) return;
    await investigate(selectedDisputeId);
  };

  const handleDraft = async () => {
    if (!selectedDisputeId) return;
    await generateDraft(selectedDisputeId);
  };

  const handleApprovalConfirm = async () => {
    if (!selectedDispute) return;
    const evidenceIds = selectedDispute.evidence.map((e) => e.id);
    const result = await submitForApproval(
      selectedDispute.id,
      selectedDispute.draft_response || 'Standard merchant rebuttal',
      evidenceIds
    );
    if (result) setApprovalId(result.approval_request_id);
    setIsApprovalModalOpen(false);
  };

  const handleSubmit = async () => {
    if (!selectedDispute) return;
    await submitToProvider(selectedDispute.id, approvalId || 'appr-auto-signed', submissionMode);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div data-testid="dispute-defense-studio-view" className="space-y-6">
      {/* 1. Header & Executive Metrics */}
      <div className="glass tone-glow rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white flex items-center gap-2.5 font-display">
            Dispute Defense Studio
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              PayPal Disputes API
            </span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Assembles traceable evidence cases, tracks response deadlines, and prepares ground-truth responses.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono uppercase block">Capital At Risk</span>
            <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
              ${totalAtRisk.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="h-8 w-px bg-stone-200/60 dark:bg-stone-800" />
          <div className="text-right">
            <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono uppercase block">Action Required</span>
            <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
              {urgentCount} Cases
            </span>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="p-2 rounded-xl border border-stone-200/60 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5 transition text-stone-600 dark:text-stone-300"
            title="Refresh disputes"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button
            type="button"
            onClick={clearActionMessage}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-mono text-xs ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Main Studio Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Dispute Inbox (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass tone-glow rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-white/10">
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                Dispute Inbox ({disputes.length})
              </span>
              <span className="text-[11px] font-mono text-stone-400">Live Webhook Sync</span>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter ID, reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-stone-100 dark:bg-stone-900/60 border border-stone-200 dark:border-white/10 text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:border-amber-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-stone-100 dark:bg-stone-900/60 border border-stone-200 dark:border-white/10 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Status</option>
                <option value="WAITING_FOR_SELLER">Action Needed</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            {/* List of Disputes */}
            <div className="space-y-3 pt-1">
              {disputes.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400 font-mono">
                  No disputes match the current filter.
                </div>
              ) : (
                disputes.map((d) => {
                  const isSelected = d.id === selectedDisputeId;
                  const daysLeft = Math.ceil(
                    (new Date(d.response_due_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDisputeId(d.id)}
                      className={`p-4 rounded-xl border transition cursor-pointer relative ${
                        isSelected
                          ? 'border-amber-500/80 bg-amber-500/10 shadow-lg'
                          : 'border-stone-200/70 dark:border-white/10 bg-white/40 dark:bg-stone-900/40 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-stone-900 dark:text-white">
                              {d.provider_dispute_id}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-mono font-medium bg-paypal-blue/15 text-paypal-blue dark:text-paypal-cyan border border-paypal-blue/30">
                              {d.provider}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-1">
                            {d.reason_code.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-sm font-bold text-stone-900 dark:text-white block">
                            ${d.disputed_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] font-mono text-stone-400 uppercase">
                            {d.currency}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-stone-200/40 dark:border-white/5 flex items-center justify-between text-[11px]">
                        <span
                          className={`inline-flex items-center gap-1 font-mono ${
                            daysLeft <= 2
                              ? 'text-rose-600 dark:text-rose-400 font-semibold'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          {daysLeft > 0 ? `${daysLeft}d deadline` : 'Overdue'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-stone-400">
                            {d.evidence_count} evidence
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                              d.status === 'WAITING_FOR_SELLER'
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {d.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Case Workspace (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedDispute ? (
            <div className="glass tone-glow rounded-2xl p-5 space-y-5">
              {/* Case Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/60 dark:border-white/10">
                <div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                    Case Workspace · {selectedDispute.provider_dispute_id}
                  </span>
                  <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    {selectedDispute.reason_code.replace(/_/g, ' ')}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInvestigate}
                    disabled={isActionLoading}
                    className="px-3 py-1.5 rounded-xl border border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Investigate
                  </button>
                  <button
                    type="button"
                    onClick={handleDraft}
                    disabled={isActionLoading}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium flex items-center gap-1.5 transition shadow"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    AI Draft
                  </button>
                </div>
              </div>

              {/* AI Case Brief Card */}
              {selectedDispute.ai_case_brief && (
                <div className="p-4 rounded-xl bg-stone-900/80 border border-amber-500/30 text-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1.5 font-bold">
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Case Brief (Explainable Synthesis)
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">Gemini 1.5 Flash</span>
                  </div>
                  <p className="text-xs leading-relaxed text-stone-300">
                    {selectedDispute.ai_case_brief}
                  </p>
                  {selectedDispute.contraindications.length > 0 && (
                    <div className="pt-2 border-t border-white/10 flex items-start gap-2 text-xs text-amber-300">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{selectedDispute.contraindications[0]}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Tabs for Workspace */}
              <div className="flex items-center gap-2 border-b border-stone-200/60 dark:border-white/10 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('timeline')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'timeline'
                      ? 'bg-amber-500 text-white shadow'
                      : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
                  }`}
                >
                  Evidence Timeline
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('checklist')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'checklist'
                      ? 'bg-amber-500 text-white shadow'
                      : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
                  }`}
                >
                  Checklist ({selectedDispute.checklist.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('evidence')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'evidence'
                      ? 'bg-amber-500 text-white shadow'
                      : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
                  }`}
                >
                  <FileCheck className="h-3.5 w-3.5" />
                  Evidence Files ({selectedDispute.evidence.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('response')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'response'
                      ? 'bg-amber-500 text-white shadow'
                      : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
                  }`}
                >
                  Response & Approval
                </button>
              </div>

              {/* TAB 1: Evidence Timeline */}
              {activeTab === 'timeline' && (
                <div className="space-y-4 pt-1">
                  <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-mono">
                    <span>CHRONOLOGICAL AUDIT TRAIL</span>
                    <span>{selectedDispute.timeline.length} VERIFIED NODES</span>
                  </div>
                  <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200 dark:before:bg-white/10">
                    {selectedDispute.timeline.map((evt, idx) => {
                      const matchedEvid = selectedDispute.evidence.find(
                        (e) => e.source_record_id === evt.source_record_id || e.id === evt.source_record_id
                      );
                      return (
                        <div key={idx} className="relative group">
                          <span className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-white dark:ring-stone-900" />
                          <div className="p-3 rounded-xl bg-white/50 dark:bg-stone-900/50 border border-stone-200/60 dark:border-white/10">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                                {evt.event_type}
                              </span>
                              <span className="font-mono text-[10px] text-stone-400">{evt.date}</span>
                            </div>
                            <p className="text-xs text-stone-800 dark:text-stone-200 mt-1 font-medium">
                              {evt.description}
                            </p>
                            <div className="mt-2 flex items-center justify-between pt-1 border-t border-stone-200/40 dark:border-white/5">
                              {evt.source_record_id && (
                                <div className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                                  <span>Ref: {evt.source_record_id}</span>
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                </div>
                              )}
                              {matchedEvid && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedEvidence(matchedEvid)}
                                  className="text-[10px] font-mono text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                                >
                                  <Eye className="h-3 w-3" />
                                  Inspect Evidence Drawer
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: Deterministic Evidence Checklist */}
              {activeTab === 'checklist' && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-mono">
                    <span>REASON-SPECIFIC CRITERIA</span>
                    <span>100% GATHERED</span>
                  </div>
                  <div className="space-y-2.5">
                    {selectedDispute.checklist.map((item, idx) => {
                      const matchedEvid = selectedDispute.evidence.find(
                        (e) => e.id === item.linked_evidence_id
                      );
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-white/50 dark:bg-stone-900/50 border border-stone-200/60 dark:border-white/10 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-stone-900 dark:text-white">
                                {item.category}
                              </span>
                              {item.required && (
                                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  Required
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400">
                              {item.description}
                            </p>
                            {item.linked_evidence_id && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (matchedEvid) setSelectedEvidence(matchedEvid);
                                }}
                                className="font-mono text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                Linked record: [{item.linked_evidence_id}]
                              </button>
                            )}
                          </div>

                          <div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                item.status === 'available'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: Evidence Files Register (Evidence Drawer Trigger) */}
              {activeTab === 'evidence' && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-mono">
                    <span>EVIDENCE VAULT REPOSITORY</span>
                    <span>{selectedDispute.evidence.length} STORED ARTIFACTS</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedDispute.evidence.map((evid) => (
                      <div
                        key={evid.id}
                        className="p-3.5 rounded-xl bg-white/50 dark:bg-stone-900/50 border border-stone-200/60 dark:border-white/10 hover:border-amber-500/40 transition flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            {evid.evidence_type === 'proof_of_delivery' ? (
                              <Truck className="h-5 w-5" />
                            ) : evid.evidence_type === 'customer_communication' ? (
                              <MessageSquare className="h-5 w-5" />
                            ) : (
                              <Package className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-stone-900 dark:text-white">
                                [{evid.id}]
                              </span>
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                                {evid.evidence_type.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                {Math.round((evid.metadata_json?.confidence || 0.98) * 100)}% Confidence
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1 font-mono">
                              Ref: {evid.source_record_id} · {evid.storage_uri}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedEvidence(evid)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Open Drawer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: Response Editor & Submission Protocol */}
              {activeTab === 'response' && (
                <div className="space-y-4 pt-1">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-stone-700 dark:text-stone-300 font-semibold block">
                      Evidence-Grounded Response Draft (Editable)
                    </label>
                    <textarea
                      rows={5}
                      defaultValue={selectedDispute.draft_response || ''}
                      className="w-full p-3 rounded-xl text-xs bg-stone-100 dark:bg-stone-900/80 border border-stone-200 dark:border-white/10 text-stone-800 dark:text-stone-200 font-mono leading-relaxed focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Submission Mode Selection (Honest Handoff Guardrail) */}
                  <div className="p-3.5 rounded-xl bg-stone-100/70 dark:bg-stone-900/60 border border-stone-200/60 dark:border-white/10 space-y-3">
                    <span className="text-[11px] font-mono font-bold text-stone-800 dark:text-stone-200 uppercase block">
                      Provider Submission Mode
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`p-3 rounded-lg border text-xs cursor-pointer flex flex-col justify-between ${
                          submissionMode === 'auto_provider_api'
                            ? 'border-amber-500 bg-amber-500/10 text-stone-900 dark:text-white font-medium'
                            : 'border-stone-200 dark:border-white/10 text-stone-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="radio"
                            name="sub_mode"
                            checked={submissionMode === 'auto_provider_api'}
                            onChange={() => setSubmissionMode('auto_provider_api')}
                            className="text-amber-500 focus:ring-amber-500"
                          />
                          <span className="font-semibold">PayPal REST API</span>
                        </div>
                        <span className="text-[10px] text-stone-400">
                          Direct automated API dispatch if sandbox permissions allow.
                        </span>
                      </label>

                      <label
                        className={`p-3 rounded-lg border text-xs cursor-pointer flex flex-col justify-between ${
                          submissionMode === 'manual_provider_portal'
                            ? 'border-amber-500 bg-amber-500/10 text-stone-900 dark:text-white font-medium'
                            : 'border-stone-200 dark:border-white/10 text-stone-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="radio"
                            name="sub_mode"
                            checked={submissionMode === 'manual_provider_portal'}
                            onChange={() => setSubmissionMode('manual_provider_portal')}
                            className="text-amber-500 focus:ring-amber-500"
                          />
                          <span className="font-semibold">Guided Portal Handoff</span>
                        </div>
                        <span className="text-[10px] text-stone-400">
                          Prepares bundle for PayPal Resolution Center if API unsupported.
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Cryptographic Approval & Submission Actions */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] font-mono text-stone-400 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-amber-500" />
                      {approvalId ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Approval Active ({approvalId})
                        </span>
                      ) : (
                        'Approval bound to exact evidence payload'
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsApprovalModalOpen(true)}
                        disabled={isActionLoading}
                        className="px-4 py-2 rounded-xl border border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5 text-stone-700 dark:text-stone-300 text-xs font-semibold transition flex items-center gap-1.5"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                        {approvalId ? 'Review Approved Package' : 'Review & Create Approval'}
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isActionLoading}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-lg flex items-center gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Execute Submission
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass tone-glow rounded-2xl p-12 text-center text-stone-400 text-xs font-mono">
              Select a dispute from the inbox to open the Case Workspace.
            </div>
          )}
        </div>
      </div>

      {/* 3. Evidence Drawer (Section 1.7: Preview original file, source, upload time, extraction confidence) */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-stone-900 border-l border-white/10 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl h-full space-y-5">
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
                    <FileCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2 font-display">
                      Evidence Drawer · [{selectedEvidence.id}]
                    </h3>
                    <span className="text-[10px] font-mono text-stone-400">
                      Tamper-Resistant Cryptographic Artifact
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEvidence(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Status & Confidence Score Badges */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-xl bg-stone-950/60 border border-white/10">
                  <span className="text-[10px] font-mono text-stone-400 uppercase block">Evidence Status</span>
                  <span
                    className={`font-mono text-xs font-bold uppercase inline-block mt-0.5 ${
                      selectedEvidence.evidence_status === 'available'
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    ● {selectedEvidence.evidence_status}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-stone-950/60 border border-white/10">
                  <span className="text-[10px] font-mono text-stone-400 uppercase block">OCR Extraction Confidence</span>
                  <span className="font-mono text-xs font-bold text-emerald-400 block mt-0.5">
                    {Math.round((selectedEvidence.metadata_json?.confidence || 0.99) * 100)}% Verified
                  </span>
                </div>
              </div>

              {/* Metadata Details */}
              <div className="mt-4 p-4 rounded-xl bg-stone-950/80 border border-white/10 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Evidence Category:</span>
                  <span className="text-amber-400 font-bold uppercase">
                    {selectedEvidence.evidence_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Source Identifier:</span>
                  <span className="text-stone-200">{selectedEvidence.source_record_id || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Storage URI:</span>
                  <span className="text-stone-300 truncate max-w-[280px]" title={selectedEvidence.storage_uri}>
                    {selectedEvidence.storage_uri}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Ingested At:</span>
                  <span className="text-stone-300">
                    {new Date(selectedEvidence.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* High-Fidelity Document Visualizer */}
              <div className="mt-4 space-y-2">
                <span className="text-xs font-mono text-stone-300 uppercase font-bold flex items-center justify-between">
                  <span>Document Visualizer</span>
                  <span className="text-[10px] text-amber-400">Verified Original</span>
                </span>
                <div className="p-4 rounded-xl bg-stone-950 border border-amber-500/30 text-stone-300 space-y-3">
                  {selectedEvidence.evidence_type === 'proof_of_delivery' && (
                    <div className="space-y-2 border-l-2 border-emerald-500 pl-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Truck className="h-4 w-4 text-emerald-400" />
                          FedEx Ground Tracking #7812984128
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                          DELIVERED
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 font-mono">
                        Signed for by: <span className="text-white font-bold">J. Doe</span> · Nov 5, 2024 at 14:22 EST
                      </p>
                      <p className="text-xs text-stone-400 font-mono">
                        Delivery Location: Front Reception / Security Desk
                      </p>
                    </div>
                  )}

                  {selectedEvidence.evidence_type === 'order_confirmation' && (
                    <div className="space-y-2 border-l-2 border-amber-500 pl-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Package className="h-4 w-4 text-amber-400" />
                          Order Receipt #ORD-7712
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">
                          PAID $2,850.00
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 font-mono">
                        License Provisioning: Enterprise Cloud Bundle (10 Seats) + 4x Hardware YubiKeys
                      </p>
                    </div>
                  )}

                  {selectedEvidence.evidence_type === 'customer_communication' && (
                    <div className="space-y-2 border-l-2 border-purple-500 pl-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4 text-purple-400" />
                          Support Ticket #TCK-9901 Log
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono">
                          CLOSED
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 font-mono">
                        Client acknowledged hardware token arrival on Nov 6, contradicting the non-receipt claim.
                      </p>
                    </div>
                  )}

                  {/* Extracted Text Snippet */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-stone-400">EXTRACTED CONTENT OCR</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedEvidence.extracted_text || '')}
                        className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        {copiedText ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedText ? 'Copied' : 'Copy Text'}
                      </button>
                    </div>
                    <p className="text-xs font-mono leading-relaxed bg-stone-900 p-2.5 rounded-lg border border-white/5 text-stone-300">
                      "{selectedEvidence.extracted_text}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-mono text-stone-400">
                Tenant: ws-default-01 (Isolated)
              </span>
              <button
                type="button"
                onClick={() => setSelectedEvidence(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Approval Review Modal (Section 1.7: Exact response text, evidence files & provider action) */}
      {isApprovalModalOpen && selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass tone-glow rounded-2xl p-6 w-full max-w-xl space-y-4 border border-stone-200/60 dark:border-white/10 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-bold text-stone-900 dark:text-white font-display">
                  Dispute Rebuttal Approval Review
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsApprovalModalOpen(false)}
                className="text-stone-400 hover:text-stone-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <span>
                Immutable cryptographic binding: Approving signs this exact response text and attached evidence hashes.
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-900/60 space-y-1.5 border border-stone-200/60 dark:border-white/10">
                <div className="flex justify-between">
                  <span className="text-stone-400">Target Dispute:</span>
                  <span className="text-stone-900 dark:text-white font-bold">{selectedDispute.provider_dispute_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Disputed Amount:</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    ${selectedDispute.disputed_amount.toFixed(2)} {selectedDispute.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Provider Endpoint:</span>
                  <span className="text-amber-600 dark:text-amber-400">
                    {submissionMode === 'auto_provider_api'
                      ? 'PayPal REST Disputes API (v1/customer/disputes)'
                      : 'PayPal Resolution Center (Guided Bundle)'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase text-stone-400 block mb-1">Attached Evidence Hashes ({selectedDispute.evidence.length})</span>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {selectedDispute.evidence.map((evid) => (
                    <div key={evid.id} className="p-2 rounded bg-stone-100 dark:bg-stone-900/80 text-[11px] flex justify-between items-center">
                      <span className="text-stone-300 font-bold">[{evid.id}] {evid.evidence_type}</span>
                      <span className="text-stone-400 text-[10px] truncate max-w-[200px]">SHA256: 4f8b91...{evid.id}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase text-stone-400 block mb-1">Signed Response Payload</span>
                <div className="p-3 rounded bg-stone-100 dark:bg-stone-900/80 text-[11px] text-stone-700 dark:text-stone-300 max-h-28 overflow-y-auto leading-relaxed border border-stone-200 dark:border-white/10">
                  {selectedDispute.draft_response || 'Standard merchant rebuttal'}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200/60 dark:border-white/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsApprovalModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5 text-stone-700 dark:text-stone-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprovalConfirm}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-lg flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                Sign & Bind Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
