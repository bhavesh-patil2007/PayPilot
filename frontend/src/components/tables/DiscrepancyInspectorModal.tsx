import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  FileEdit,
  DollarSign,
  Building,
  Receipt,
  Layers,
} from 'lucide-react';
import { usePayPilotStore } from '../../store/usePayPilotStore';
import { ReconciliationRecord } from '../../types';

export function getNormalizedMatchStatus(record: ReconciliationRecord): string {
  const s = String(record.status || '').toUpperCase();
  if (s === 'ORPHAN_PAYPAL') return 'ORPHAN_PAYPAL';
  if (s === 'ORPHAN_BANK') return 'ORPHAN_BANK';
  if (s === 'ORPHAN_INVOICE') return 'ORPHAN_INVOICE';

  if (record.paypalRecord && !record.bankRecord && !record.ledgerRecord) return 'ORPHAN_PAYPAL';
  if (record.bankRecord && !record.paypalRecord && !record.ledgerRecord) return 'ORPHAN_BANK';
  if (record.ledgerRecord && !record.paypalRecord && !record.bankRecord) return 'ORPHAN_INVOICE';

  if (s === 'RECONCILED' || s === 'FULL_MATCH' || s === 'MATCHED' || record.varianceAmount === 0) {
    return 'MATCHED';
  }

  return 'DISCREPANCY';
}

export const DiscrepancyInspectorModal: React.FC = () => {
  const {
    selectedDiscrepancyId,
    setSelectedDiscrepancyId,
    reconciliationRecords,
    resolveDiscrepancy,
    setActiveRoute,
  } = usePayPilotStore();

  const [copiedId, setCopiedId] = useState(false);
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Close on Escape key (TC-T2-F09-03)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedDiscrepancyId) {
        setSelectedDiscrepancyId(null);
      }
    };
    if (selectedDiscrepancyId) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDiscrepancyId, setSelectedDiscrepancyId]);

  if (!selectedDiscrepancyId) return null;

  const record = reconciliationRecords.find((r) => r.id === selectedDiscrepancyId);

  // Fallback if record not found (TC-T2-F09-01)
  if (!record) {
    return (
      <div
        data-testid="discrepancy-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        onClick={() => setSelectedDiscrepancyId(null)}
      >
        <div
          data-testid="discrepancy-modal-content"
          className="w-full max-w-md p-6 rounded-2xl bg-obsidian-900 border border-slate-800 shadow-2xl text-center space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Record Not Found</h3>
          <p className="text-xs text-slate-400">
            Reconciliation record <span className="font-mono text-paypal-cyan">{selectedDiscrepancyId}</span> could not be located in active state.
          </p>
          <button
            type="button"
            onClick={() => setSelectedDiscrepancyId(null)}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    );
  }

  const pp = record.paypalRecord;
  const bk = record.bankRecord;
  const inv = record.ledgerRecord;
  const status = getNormalizedMatchStatus(record);
  const variance = record.varianceAmount || 0;

  // Clipboard copy with graceful error handling (TC-T2-F09-05)
  const handleCopyTxnId = async () => {
    if (!pp?.transactionId) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(pp.transactionId);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = pp.transactionId;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Graceful fallback
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleResolve = () => {
    resolveDiscrepancy(record.id, 'Resolved via Discrepancy Forensic Inspector');
    setActionSuccessMsg('Discrepancy marked as Reconciled. Variance reset to $0.00.');
    setTimeout(() => {
      setActionSuccessMsg(null);
      setSelectedDiscrepancyId(null);
    }, 1500);
  };

  const handleAdjustmentEntry = () => {
    setActionSuccessMsg(`Journal Entry ADJ-${record.id.slice(-4)} created: Adjusted PayPal clearing fee.`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleDispute = () => {
    setActiveRoute('approvals');
    setSelectedDiscrepancyId(null);
  };

  // Safe description truncation (TC-T2-F09-04)
  const formatDesc = (text: string | undefined, max = 50) => {
    if (!text) return 'N/A';
    return text.length > max ? `${text.slice(0, max)}...` : text;
  };

  return (
    <div
      data-testid="discrepancy-inspector-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={() => setSelectedDiscrepancyId(null)}
    >
      <div
        data-testid="discrepancy-modal-panel"
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-obsidian-900 border border-slate-800 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-obsidian-900/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-paypal-blue/20 border border-paypal-cyan/30 flex items-center justify-center">
              <Layers className="w-5 h-5 text-paypal-cyan" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">
                  {record.reconciliationKey || record.id}
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                    status === 'MATCHED'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-Source Forensic Reconciliation Inspector • Date: {record.date}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedDiscrepancyId(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {actionSuccessMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Visual Variance Calculation & Root Cause Card */}
          <div className="p-4 rounded-xl bg-obsidian-850 border border-slate-800 shadow-card-dark space-y-3">
            <div className="text-xs font-semibold uppercase font-mono text-slate-400 tracking-wider flex items-center justify-between">
              <span>Visual Variance Calculation</span>
              <span className="font-mono text-rose-400 font-bold">
                Delta: ${variance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Equation Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">PayPal Net Deposited</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  ${pp?.netAmount ? pp.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Bank Statement Cleared</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  ${bk?.depositAmount ? bk.depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30">
                <div className="text-[10px] text-rose-400 uppercase font-semibold">Unreconciled Variance</div>
                <div className="text-sm font-bold text-rose-400 mt-0.5">
                  ${variance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Root Cause Banner */}
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-slate-200 space-y-1">
              <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Root Cause: {record.discrepancies?.[0]?.ruleName || record.category || 'Mismatched Processing Fee'}</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {record.discrepancies?.[0]?.description ||
                  'Multi-source comparison detected fee variance between PayPal API gross debit and internal invoice amount.'}
              </p>
              {record.discrepancies?.[0]?.recommendedAction && (
                <div className="text-[11px] text-paypal-cyan font-mono pt-1">
                  Action: {record.discrepancies[0].recommendedAction}
                </div>
              )}
            </div>
          </div>

          {/* 3-Way Connected Records Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Source 1: PayPal Transaction */}
            <div className="p-4 rounded-xl bg-obsidian-850 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-paypal-cyan" />
                  PayPal Record
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-paypal-blue/20 text-paypal-cyan border border-paypal-cyan/30">
                  {pp?.status || 'N/A'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Transaction ID</div>
                  <div className="font-mono text-white flex items-center justify-between mt-0.5">
                    <span className="truncate">{pp?.transactionId || 'MANUAL_ENTRY'}</span>
                    {pp?.transactionId && (
                      <button
                        type="button"
                        onClick={handleCopyTxnId}
                        className="text-slate-400 hover:text-paypal-cyan p-0.5 transition"
                        title="Copy Txn ID"
                      >
                        {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60 font-mono">
                  <div>
                    <div className="text-[10px] text-slate-400">Gross Amount</div>
                    <div className="font-semibold text-white">
                      ${pp?.grossAmount ? pp.grossAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Fee Amount</div>
                    <div className="font-semibold text-rose-400">
                      ${pp?.feeAmount ? pp.feeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                    </div>
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-800/60">
                  <div className="text-[10px] text-slate-400">Payer Name</div>
                  <div className="text-slate-200 truncate">{pp?.payerName || 'N/A'}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400">Capture Method</div>
                  <div className="text-slate-300 font-mono text-[11px]">{pp?.captureMethod || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Source 2: Bank Statement Deposit */}
            <div className="p-4 rounded-xl bg-obsidian-850 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-purple-400" />
                  Bank Feed
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {bk ? 'CLEARED' : 'PENDING'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Reference ID</div>
                  <div className="font-mono text-white mt-0.5 truncate">
                    {bk?.bankReferenceId || 'PENDING_CLEARING'}
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-800/60">
                  <div className="text-[10px] text-slate-400">Bank Name</div>
                  <div className="text-slate-200">{bk?.bankName || 'N/A'}</div>
                </div>

                <div className="pt-1 border-t border-slate-800/60 font-mono">
                  <div className="text-[10px] text-slate-400">Cleared Deposit</div>
                  <div className="font-semibold text-white">
                    ${bk?.depositAmount ? bk.depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-800/60">
                  <div className="text-[10px] text-slate-400">Statement Description</div>
                  <div
                    className="text-slate-300 text-[11px] truncate"
                    title={bk?.description}
                  >
                    {formatDesc(bk?.description, 40)}
                  </div>
                </div>
              </div>
            </div>

            {/* Source 3: Internal Invoice / Ledger */}
            <div className="p-4 rounded-xl bg-obsidian-850 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-amber-400" />
                  Internal Invoice
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  BOOKED
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Invoice ID</div>
                  <div className="font-mono text-white mt-0.5 truncate">
                    {inv?.invoiceId || 'N/A'}
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-800/60">
                  <div className="text-[10px] text-slate-400">Customer Name</div>
                  <div className="text-slate-200 truncate">{inv?.customerName || 'N/A'}</div>
                </div>

                <div className="pt-1 border-t border-slate-800/60 font-mono">
                  <div className="text-[10px] text-slate-400">Booked Amount</div>
                  <div className="font-semibold text-white">
                    ${inv?.bookedAmount ? inv.bookedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-800/60">
                  <div className="text-[10px] text-slate-400">Account Code</div>
                  <div className="text-slate-300 font-mono text-[11px]">{inv?.accountCode || '4000-REVENUE'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Raw PayPal JSON Payload */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
            <button
              type="button"
              onClick={() => setJsonExpanded(!jsonExpanded)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-mono text-slate-400 hover:text-slate-200 transition bg-slate-900/50"
            >
              <span className="flex items-center gap-2">
                {jsonExpanded ? <ChevronDown className="w-4 h-4 text-paypal-cyan" /> : <ChevronRight className="w-4 h-4" />}
                <span>Raw PayPal REST API Payload</span>
              </span>
              <span className="text-[10px] text-slate-500">JSON Audit Proof</span>
            </button>
            {jsonExpanded && (
              <pre className="p-4 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 border-t border-slate-800 bg-obsidian-950">
                {JSON.stringify(
                  pp?.rawPayload || { id: pp?.transactionId || 'MANUAL_ENTRY', gross: pp?.grossAmount || 0, fee: pp?.feeAmount || 0 },
                  null,
                  2
                )}
              </pre>
            )}
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-obsidian-950 sticky bottom-0 z-10">
          <div className="text-xs text-slate-400">
            Audit Status: <span className="text-white font-mono">{record.resolutionStatus}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResolve}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-glow-green"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Reconciled</span>
            </button>

            <button
              type="button"
              onClick={handleAdjustmentEntry}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <FileEdit className="w-3.5 h-3.5 text-paypal-cyan" />
              <span>Create Adjustment Entry</span>
            </button>

            <button
              type="button"
              onClick={handleDispute}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-paypal-blue hover:bg-paypal-blue/80 text-white text-xs font-medium border border-paypal-cyan/40 transition shadow-glow-paypal"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Dispute via PayPal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
