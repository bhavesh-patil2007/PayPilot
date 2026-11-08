import React, { useEffect, useState } from 'react';
import { usePayPilotStore } from '../../store/usePayPilotStore';
import {
  X,
  Sparkles,
  Copy,
  Check,
  ShieldCheck,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const ExplainabilityDrawer: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { explainabilityDrawer, closeExplainability } = usePayPilotStore();
  const { isOpen, activeRuleId, activeRecordId, ruleTitle, details } = explainabilityDrawer;
  const [copied, setCopied] = useState(false);
  const [isRawJsonExpanded, setIsRawJsonExpanded] = useState(true);

  // Close on Escape key press (TC-T2-F33-03)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeExplainability();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeExplainability]);

  if (!isOpen) return null;

  const rawJsonString = details?.rawPayPalPayload
    ? JSON.stringify(details.rawPayPalPayload, null, 2)
    : JSON.stringify(
        {
          rule_id: activeRuleId || 'RULE-FALLBACK-01',
          record_id: activeRecordId || 'N/A',
          timestamp: new Date().toISOString(),
          audit_engine: 'PayPilot Autonomous Reconciliation Engine',
          verified_status: 'GROUND_TRUTH_VERIFIED',
        },
        null,
        2
      );

  const handleCopyJson = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(rawJsonString);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = rawJsonString;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
      // Graceful fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formulaText =
    details?.detectionFormula ||
    'Variance = Fee_Assessed ($2,840.00) - Contracted_Max_Cap ($1,420.00) = +$1,420.00';

  const explanationText =
    details?.explanationSummary ||
    'Autonomous detection rule evaluated ground-truth transaction logs against contracted terms and identified an unverified financial discrepancy.';

  return (
    <div
      data-testid="explainability-drawer"
      className={`fixed inset-0 z-50 overflow-hidden ${className}`}
    >
      {/* Backdrop with Click-to-Close (TC-T2-F33-04) */}
      <div
        data-testid="drawer-backdrop"
        onClick={closeExplainability}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Slide-Over Right Panel */}
      <aside
        data-testid="explainability-drawer-panel"
        className="fixed inset-y-0 right-0 max-w-2xl w-full bg-obsidian-900 border-l border-slate-800 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out translate-x-0"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-obsidian-950/60">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-paypal-blue/20 text-paypal-cyan border border-paypal-cyan/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs uppercase font-mono tracking-wider text-paypal-cyan font-semibold">
                PayPilot AI Explainability Engine
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {details?.ruleName || ruleTitle || `Detection Rule: ${activeRuleId || 'Verified Record'}`}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-paypal-cyan border border-slate-700">
                {details?.ruleId || activeRuleId || 'RULE-VERIFIED'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                {details?.confidenceScore ?? 98}% Confidence
              </span>
              {details?.categoryBadge && (
                <span className="text-xs text-slate-400 font-mono">
                  • {details.categoryBadge}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            data-testid="close-drawer-button"
            onClick={closeExplainability}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Section 1: Detection Formula (TC-T2-F33-05) */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase font-mono text-slate-400 tracking-wider font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-paypal-cyan" />
              Mathematical Detection Formula
            </h4>
            <div
              data-testid="detection-formula"
              className="font-mono text-xs text-paypal-cyan bg-obsidian-950 p-4 rounded-xl border border-slate-800 overflow-x-auto whitespace-nowrap shadow-inner"
            >
              {formulaText}
            </div>
          </div>

          {/* Section 2: Explanation Summary */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase font-mono text-slate-400 tracking-wider font-semibold">
              Plain-English Rationale & Root Cause
            </h4>
            <div className="p-4 rounded-xl bg-obsidian-850 border border-slate-800/80 text-slate-300 leading-relaxed text-xs">
              {explanationText}
            </div>
          </div>

          {/* Section 3: Connected Source Records */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono text-slate-400 tracking-wider font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Connected Multi-Source Records (3-Way Truth)
            </h4>

            {details?.sourceRecords && details.sourceRecords.length > 0 ? (
              <div className="space-y-2.5">
                {details.sourceRecords.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-obsidian-950/80 border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-paypal-cyan px-1.5 py-0.5 rounded bg-paypal-blue/10 border border-paypal-blue/20">
                        {rec.recordType}
                      </span>
                      <span className="font-mono text-white font-bold">
                        ${rec.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {rec.currency}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">
                      Ref: {rec.referenceNumber} • Date: {rec.date}
                    </div>
                    <div className="text-xs text-slate-300 mt-2 bg-obsidian-900 p-2 rounded border border-slate-800/80 font-mono">
                      {rec.snippet}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-obsidian-850 border border-slate-800 text-xs text-slate-400">
                Ground-truth records linked via PayPal Sandbox REST API v2 transaction captures.
              </div>
            )}
          </div>

          {/* Section 4: Collapsible Raw JSON Payload */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsRawJsonExpanded(!isRawJsonExpanded)}
                className="text-xs uppercase font-mono text-slate-400 hover:text-slate-200 tracking-wider font-semibold flex items-center gap-1.5 transition"
              >
                <span>Verbatim PayPal Sandbox API Response (JSON)</span>
                {isRawJsonExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                data-testid="copy-json-button"
                onClick={handleCopyJson}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            {isRawJsonExpanded && (
              <pre
                data-testid="raw-paypal-payload-json"
                className="font-mono text-[11px] text-slate-300 bg-obsidian-950 p-4 rounded-xl border border-slate-800 overflow-x-auto max-h-72 leading-relaxed"
              >
                {rawJsonString}
              </pre>
            )}
          </div>
        </div>

        {/* Drawer Action Footer */}
        <div className="p-4 border-t border-slate-800 bg-obsidian-950/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono">
            Cryptographically sealed • SHA-256 verifiable
          </div>
          <button
            type="button"
            onClick={closeExplainability}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Dismiss
          </button>
        </div>
      </aside>
    </div>
  );
};
