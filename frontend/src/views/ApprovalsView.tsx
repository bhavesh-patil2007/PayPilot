import React, { useState } from 'react';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { ApprovalRequest } from '../types';
import { formatSignatureBadge, pureJsSha256 } from '../services/hashService';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
  Terminal,
  Loader2,
  DollarSign,
  ArrowRight,
  Filter,
  Layers,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export interface SandboxExecutionReceipt {
  txnId: string;
  timestamp: string;
  proofBadge: string;
}

export const ApprovalsView: React.FC = () => {
  const {
    pendingApprovals,
    approveAndExecuteAction,
    rejectApprovalAction,
    executiveKpis,
    openExplainability,
  } = usePayPilotStore();

  const [selectedApprovalId, setSelectedApprovalId] = useState<string>(
    pendingApprovals[0]?.id || ''
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_REVIEW' | 'EXECUTED_SANDBOX' | 'REJECTED'>('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionReceipts, setExecutionReceipts] = useState<Record<string, SandboxExecutionReceipt>>({});
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Filtered approvals
  const filteredApprovals = pendingApprovals.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (riskFilter !== 'ALL' && a.riskRating !== riskFilter) return false;
    return true;
  });

  const selectedApproval =
    pendingApprovals.find((a) => a.id === selectedApprovalId) ||
    filteredApprovals[0] ||
    pendingApprovals[0];

  const getReceiptForAction = (req?: ApprovalRequest): SandboxExecutionReceipt | null => {
    if (!req) return null;
    if (executionReceipts[req.id]) return executionReceipts[req.id];
    if (req.executedProofBadge) {
      return {
        txnId: req.executedTxnId || 'REFUND-CAP-9941',
        timestamp: req.executedTimestamp || req.executedAt || new Date().toISOString(),
        proofBadge: req.executedProofBadge,
      };
    }
    return null;
  };

  const selectedReceipt = getReceiptForAction(selectedApproval);

  const handleCopyIdempotencyKey = (key: string) => {
    navigator.clipboard?.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyJson = (jsonObj: any) => {
    const text = JSON.stringify(jsonObj, null, 2);
    navigator.clipboard?.writeText(text);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleApprove = async () => {
    if (!selectedApproval || isExecuting) return;
    setIsExecuting(true);
    try {
      const res = await approveAndExecuteAction(selectedApproval.id);
      const proofHash = pureJsSha256(
        JSON.stringify({
          approvalId: selectedApproval.id,
          txnId: res.executedTxnId,
          timestamp: res.timestamp,
        })
      );
      const proofBadge = res.proofBadge || formatSignatureBadge(proofHash);
      setExecutionReceipts((prev) => ({
        ...prev,
        [selectedApproval.id]: {
          txnId: res.executedTxnId,
          timestamp: res.timestamp,
          proofBadge,
        },
      }));
    } catch (err) {
      console.error('Approval execution failed', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReject = () => {
    if (!selectedApproval) return;
    rejectApprovalAction(selectedApproval.id, rejectReason || 'Declined by authorized business owner');
    setShowRejectInput(false);
    setRejectReason('');
  };

  const handleApproveAllLowRisk = async () => {
    const lowRiskPending = pendingApprovals.filter(
      (a) => a.riskRating === 'LOW' && a.status === 'PENDING_REVIEW'
    );
    for (const item of lowRiskPending) {
      const res = await approveAndExecuteAction(item.id);
      const proofHash = pureJsSha256(
        JSON.stringify({
          approvalId: item.id,
          txnId: res.executedTxnId,
          timestamp: res.timestamp,
        })
      );
      const proofBadge = res.proofBadge || formatSignatureBadge(proofHash);
      setExecutionReceipts((prev) => ({
        ...prev,
        [item.id]: {
          txnId: res.executedTxnId,
          timestamp: res.timestamp,
          proofBadge,
        },
      }));
    }
  };

  return (
    <div data-testid="approvals-view" className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Governed Action Queue & Approvals
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30">
              Human-in-the-Loop Safeguard
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Zero autonomous disbursements without human owner review. Inspect verbatim PayPal REST API v2 payloads before sandbox execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="approve-low-risk-btn"
            onClick={handleApproveAllLowRisk}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 text-xs font-mono transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Approve All Low Risk</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary & Filter Bar */}
      <div className="p-3 rounded-xl bg-obsidian-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1">
          {(['ALL', 'PENDING_REVIEW', 'EXECUTED_SANDBOX', 'REJECTED'] as const).map((st) => {
            const count = pendingApprovals.filter((a) => (st === 'ALL' ? true : a.status === st)).length;
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                data-testid={`approval-status-filter-${st}`}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-mono text-[11px] transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-paypal-blue text-white font-bold shadow-glow-paypal'
                    : 'text-slate-400 hover:text-slate-200 bg-obsidian-950 border border-slate-800'
                }`}
              >
                <span>{st.replace('_', ' ')}</span>
                <span className="px-1 py-0.2 rounded bg-black/40 text-[10px]">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Risk Filter Chips */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 font-mono uppercase mr-1">Risk:</span>
          {(['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const).map((rk) => (
            <button
              key={rk}
              type="button"
              data-testid={`approval-risk-filter-${rk}`}
              onClick={() => setRiskFilter(rk)}
              className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition ${
                riskFilter === rk
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {rk}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Master-Detail 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Governed Action Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>ACTION QUEUE ({filteredApprovals.length})</span>
            <span>SORT: HIGH RISK FIRST</span>
          </div>

          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredApprovals.map((req) => {
              const isSelected = selectedApproval?.id === req.id;
              const isPending = req.status === 'PENDING_REVIEW';
              const isExecuted = req.status === 'EXECUTED_SANDBOX';
              const isRejected = req.status === 'REJECTED';

              const riskBadgeColor =
                req.riskRating === 'HIGH'
                  ? 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                  : req.riskRating === 'MEDIUM'
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30';

              return (
                <div
                  key={req.id}
                  data-testid={`approval-card-${req.id}`}
                  onClick={() => setSelectedApprovalId(req.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition relative ${
                    isSelected
                      ? 'bg-obsidian-850 border-paypal-cyan shadow-glow-paypal'
                      : 'bg-obsidian-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">{req.requestNumber}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${riskBadgeColor}`}>
                        {req.riskRating} RISK
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-paypal-cyan">
                      ${req.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">{req.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{req.description}</p>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{req.actionType.replace(/_/g, ' ')}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded ${
                        isExecuted
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : isRejected
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  {/* Render proof badge on card if executed */}
                  {getReceiptForAction(req)?.proofBadge && (
                    <div
                      data-testid={`approval-card-receipt-${req.id}`}
                      className="mt-2 pt-1.5 border-t border-slate-800/60 font-mono text-[10px] text-paypal-cyan flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1 text-emerald-400">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Proof:</span>
                      </span>
                      <span className="truncate max-w-[170px]" title={getReceiptForAction(req)!.proofBadge}>
                        {getReceiptForAction(req)!.proofBadge.replace('#PAY-SHA256-', 'SHA-256: ')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredApprovals.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 bg-obsidian-900 rounded-xl border border-slate-800">
                No governed actions matching selected filters.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Selected Action Inspector & Exact Payload */}
        <div className="lg:col-span-7 space-y-4">
          {selectedApproval ? (
            <div className="p-5 rounded-2xl bg-obsidian-900 border border-slate-800 shadow-card-dark space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-paypal-cyan">
                      {selectedApproval.requestNumber}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        selectedApproval.riskRating === 'HIGH'
                          ? 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                          : selectedApproval.riskRating === 'MEDIUM'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {selectedApproval.riskRating} RISK
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Target: {selectedApproval.targetEntityId}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{selectedApproval.title}</h3>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Authorization Value</span>
                  <span className="text-xl font-bold font-mono text-white">
                    ${selectedApproval.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {selectedApproval.currency}
                  </span>
                </div>
              </div>

              {/* Execution Success Banner if executed */}
              {selectedApproval.status === 'EXECUTED_SANDBOX' && (
                <div
                  data-testid={`approval-receipt-banner-${selectedApproval.id}`}
                  className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs space-y-1"
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Executed via PayPal REST API v2 Sandbox</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 flex flex-wrap gap-x-4">
                    <span>Txn ID: {selectedReceipt?.txnId || selectedApproval.executedTxnId || 'REFUND-CAP-9941'}</span>
                    <span>Timestamp: {selectedReceipt?.timestamp || selectedApproval.executedTimestamp || selectedApproval.executedAt || new Date().toISOString()}</span>
                  </div>
                  {selectedReceipt?.proofBadge && (
                    <div className="mt-1 font-mono text-[11px] text-paypal-cyan">
                      Verification Badge: {selectedReceipt.proofBadge}
                    </div>
                  )}
                </div>
              )}

              {/* Before / After Financial State Snapshot Diff */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-paypal-cyan" />
                  Financial Impact Projection Diff
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  {/* Before */}
                  <div className="p-3 rounded-xl bg-obsidian-950 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">
                      Before Approval
                    </span>
                    <div className="text-slate-300">
                      Status: <span className="text-amber-400">{selectedApproval.beforeStateSnapshot?.caseStatus || 'POTENTIAL_IDENTIFIED'}</span>
                    </div>
                    <div className="text-slate-300">
                      Liquid Cash: <span className="text-white">${selectedApproval.beforeStateSnapshot?.availableCash?.toLocaleString() || '$142,500.00'}</span>
                    </div>
                    <div className="text-slate-300">
                      Recovered: <span className="text-slate-400">${selectedApproval.beforeStateSnapshot?.recoveredAmount || '$0.00'}</span>
                    </div>
                  </div>

                  {/* After */}
                  <div className="p-3 rounded-xl bg-obsidian-950 border border-emerald-500/30 space-y-1.5">
                    <span className="text-[10px] text-emerald-400 uppercase font-sans font-bold block">
                      After Sandbox Execution
                    </span>
                    <div className="text-slate-300">
                      Status: <span className="text-emerald-400">{selectedApproval.afterStateSnapshot?.caseStatus || 'VERIFIED_RECOVERED'}</span>
                    </div>
                    <div className="text-slate-300">
                      Liquid Cash: <span className="text-emerald-400 font-bold">+${selectedApproval.amount.toLocaleString()}</span>
                    </div>
                    <div className="text-slate-300">
                      Recovered: <span className="text-emerald-400 font-bold">+${selectedApproval.amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exact Payload Inspection (PayPal REST API blueprint) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-paypal-cyan" />
                    Exact Payload Inspection (PayPal REST v2)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-testid="copy-idempotency-key-btn"
                      onClick={() => handleCopyIdempotencyKey(selectedApproval.paypalApiBlueprint.idempotencyKey)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-1 transition"
                      title="Copy UUID v4 Idempotency Key"
                    >
                      {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey ? 'Copied Key!' : 'Copy Key'}</span>
                    </button>
                    <button
                      type="button"
                      data-testid="copy-payload-json-btn"
                      onClick={() => handleCopyJson(selectedApproval.paypalApiBlueprint)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-1 transition"
                      title="Copy Full Payload JSON"
                    >
                      {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedJson ? 'Copied JSON!' : 'Copy JSON'}</span>
                    </button>
                  </div>
                </div>

                {/* API Method & Endpoint Bar */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-obsidian-950 border border-slate-800 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded bg-paypal-blue text-white font-bold text-[10px]">
                    {selectedApproval.paypalApiBlueprint.httpMethod}
                  </span>
                  <span className="text-slate-300 truncate">
                    {selectedApproval.paypalApiBlueprint.endpointPath}
                  </span>
                </div>

                {/* Idempotency Key Tag */}
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                  <span className="text-slate-500">Idempotency Key (UUID v4):</span>
                  <span className="text-paypal-cyan font-bold truncate">
                    {selectedApproval.paypalApiBlueprint.idempotencyKey}
                  </span>
                </div>

                {/* Formatted JSON Box */}
                <pre
                  data-testid="exact-payload-json-viewer"
                  className="p-4 rounded-xl bg-obsidian-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[240px] leading-relaxed"
                >
                  {JSON.stringify(
                    {
                      headers: selectedApproval.paypalApiBlueprint.headers,
                      body: selectedApproval.paypalApiBlueprint.requestBody,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>

              {/* Execution Actions Bar */}
              {selectedApproval.status === 'PENDING_REVIEW' && (
                <div className="pt-2 border-t border-slate-800/80 space-y-3">
                  {showRejectInput ? (
                    <div className="space-y-2 p-3 rounded-xl bg-rose-950/20 border border-rose-500/30">
                      <span className="text-xs text-rose-300 font-semibold block">
                        Specify rejection rationale:
                      </span>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. Surcharge fee under active vendor review..."
                        className="w-full px-3 py-1.5 rounded-lg bg-obsidian-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-rose-400"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowRejectInput(false)}
                          className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          data-testid="confirm-reject-btn"
                          onClick={handleReject}
                          className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        data-testid="reject-action-btn"
                        onClick={() => setShowRejectInput(true)}
                        className="px-4 py-2 rounded-xl bg-obsidian-950 hover:bg-rose-950/40 text-rose-400 border border-rose-500/40 text-xs font-semibold transition"
                      >
                        Reject Action
                      </button>

                      <button
                        type="button"
                        data-testid="approve-execute-btn"
                        onClick={handleApprove}
                        disabled={isExecuting}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-paypal-blue to-paypal-dark hover:from-paypal-cyan hover:to-paypal-blue text-white font-bold text-xs transition shadow-glow-paypal disabled:opacity-40"
                      >
                        {isExecuting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Simulating PayPal Sandbox API Call (800ms)...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 text-paypal-cyan" />
                            <span>Approve & Execute via PayPal Sandbox</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-obsidian-900 rounded-2xl border border-slate-800">
              Select an action from the queue to inspect payload.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalsView;
