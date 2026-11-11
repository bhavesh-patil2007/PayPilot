import React, { useState, useRef, useEffect } from 'react';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { CopilotEvidenceCitation, CopilotToolAction, AppRoute } from '../types';
import {
  Bot,
  User,
  Send,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Database,
  ArrowRight,
  Clock,
  DollarSign,
  AlertCircle,
  Activity,
  Layers,
} from 'lucide-react';

export const SUGGESTED_QUERIES = [
  'What is our current runway and cash buffer?',
  'How much recoverable revenue is pending across cases?',
  'Which clients have overdue udhari > 30 days?',
  'What happens if customer payment delay increases to 45 days?',
];

export const CopilotView: React.FC = () => {
  const {
    copilotMessages,
    copilotVerifiedContext,
    isCopilotThinking,
    sendCopilotMessage,
    clearCopilotHistory,
    setActiveRoute,
    setSelectedRecoveryCaseId,
    openExplainability,
    updateSimulationParameters,
    executeSandboxClaim,
    executiveKpis,
    udhariSummary,
    recoveryFunnelMetrics,
    paypalConfig,
  } = usePayPilotStore();

  const [inputQuery, setInputQuery] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (typeof chatEndRef.current?.scrollIntoView === 'function') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [copilotMessages, isCopilotThinking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputQuery.trim();
    if (!query || isCopilotThinking) return;

    setInputQuery('');
    await sendCopilotMessage(query);
  };

  const handleSuggestionClick = async (prompt: string) => {
    if (isCopilotThinking) return;
    setInputQuery('');
    await sendCopilotMessage(prompt);
  };

  const handleToolAction = (action: CopilotToolAction) => {
    switch (action.actionType) {
      case 'NAVIGATE':
        if (action.payload?.route) {
          setActiveRoute(action.payload.route as AppRoute);
        }
        if (action.payload?.caseId) {
          setSelectedRecoveryCaseId(action.payload.caseId);
        }
        break;
      case 'OPEN_EXPLAIN':
        openExplainability(action.payload?.ruleId || 'RULE-DUP-FEE-02', action.payload?.recordId);
        break;
      case 'STAGE_CLAIM':
        if (action.payload?.caseId) {
          executeSandboxClaim(action.payload.caseId);
        }
        break;
      case 'RUN_SIMULATION':
        if (action.payload) {
          updateSimulationParameters(action.payload);
          setActiveRoute('simulation-lab');
        }
        break;
      default:
        break;
    }
  };

  const handleCitationClick = (citation: CopilotEvidenceCitation) => {
    if (citation.entityType === 'RECOVERY_CASE') {
      openExplainability('RULE-DUP-FEE-02', citation.recordId);
    } else if (citation.entityType === 'UDHARI_ACCOUNT') {
      setActiveRoute('udhari-ledger');
    } else if (citation.entityType === 'COMMITMENT') {
      setActiveRoute('commitments');
    } else {
      openExplainability('RULE-3WAY-MATCH-01', citation.recordId);
    }
  };

  return (
    <div data-testid="copilot-view" className="space-y-6">
      {/* 1. Header */}
      <div className="glass tone-glow rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white flex items-center gap-2.5">
            Ask about your money
            <span className="sr-only">Grounded Financial Copilot</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-paypal-blue/20 text-paypal-cyan border border-paypal-cyan/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-paypal-cyan" />
              Uses your real numbers
              <span className="sr-only">Verified Store Context Bound</span>
            </span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Ask in plain English. Answers come only from your PayPilot records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="copilot-clear-history-btn"
            onClick={clearCopilotHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/40 dark:bg-stone-900/50 hover:bg-stone-200/80 dark:hover:bg-stone-800/80 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 text-xs font-mono border border-stone-200/60 dark:border-white/10 transition"
            title="Reset conversation to initial greeting"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* 2. Main 12-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Chat Stream, Suggestion Chips, Input */}
        <div className="lg:col-span-8 flex flex-col h-[700px] rounded-2xl bg-white/40 dark:bg-stone-900/90 border border-stone-200/60 dark:border-white/10 shadow-card-dark overflow-hidden">
          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {copilotMessages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id}
                  data-testid={`copilot-message-${msg.id}`}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-paypal-blue to-paypal-cyan flex items-center justify-center shrink-0 shadow-glow-paypal">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                      isUser
                        ? 'bg-paypal-blue text-white rounded-tr-none'
                        : 'bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 text-stone-700 dark:text-stone-200 rounded-tl-none'
                    }`}
                  >
                    {/* Timestamp & Role Tag */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 dark:text-stone-400 pb-1 border-b border-stone-200/60 dark:border-white/10">
                      <span>{isUser ? 'You (Business Owner)' : 'PayPilot Financial Copilot'}</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Message Body */}
                    <div className="text-xs whitespace-pre-wrap leading-relaxed font-sans">
                      {msg.content}
                    </div>

                    {/* Citations List */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-2 border-t border-stone-200/50 dark:border-white/10 space-y-1.5">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500 dark:text-stone-400 block font-semibold">
                          Ground-Truth Evidence Citations:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.citations.map((cite, cIdx) => (
                            <button
                              key={cIdx}
                              type="button"
                              data-testid={`copilot-citation-${cite.recordId}`}
                              onClick={() => handleCitationClick(cite)}
                              className="flex items-center gap-1 px-2 py-1 rounded bg-stone-100/80 dark:bg-stone-900/60 hover:bg-stone-200/80 dark:hover:bg-stone-800/80 text-paypal-cyan border border-paypal-cyan/30 text-[11px] font-mono transition"
                              title={cite.snippet}
                            >
                              <span>[{cite.recordId}]</span>
                              <span className="text-stone-600 dark:text-stone-300 font-sans truncate max-w-[150px]">{cite.title}</span>
                              <ExternalLink className="w-3 h-3 text-paypal-cyan" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interactive Action Buttons */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        {msg.actions.map((act) => (
                          <button
                            key={act.actionId}
                            type="button"
                            onClick={() => handleToolAction(act)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-paypal-blue/30 hover:bg-paypal-blue text-paypal-cyan hover:text-white border border-paypal-cyan/40 text-xs font-semibold transition shadow-glow-paypal"
                          >
                            <span>{act.label}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-stone-200/70 dark:bg-stone-800/70 border border-stone-300/70 dark:border-white/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-stone-600 dark:text-stone-300" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isCopilotThinking && (
              <div data-testid="copilot-thinking-indicator" className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-paypal-blue to-paypal-cyan flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 text-stone-600 dark:text-stone-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-paypal-cyan animate-ping" />
                  <span className="font-mono text-[11px]">Verifying query against immutable ledger truth...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Seeded Suggestion Chips */}
          <div className="px-4 py-2 border-t border-stone-200/50 dark:border-white/10 bg-white/50 dark:bg-stone-950/60">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-mono shrink-0 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-paypal-cyan" /> Suggested:
              </span>
              {SUGGESTED_QUERIES.map((q, qIdx) => (
                <button
                  key={qIdx}
                  type="button"
                  data-testid={`copilot-suggestion-chip-${qIdx}`}
                  onClick={() => handleSuggestionClick(q)}
                  className="px-2.5 py-1 rounded-full bg-stone-100/80 dark:bg-stone-900/60 hover:bg-stone-200/80 dark:hover:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:text-white border border-stone-200/60 dark:border-white/10 text-[11px] whitespace-nowrap transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white/50 dark:bg-stone-950/60 border-t border-stone-200/60 dark:border-white/10 flex items-center gap-2"
          >
            <input
              type="text"
              data-testid="copilot-input-field"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask a verified financial question (e.g. runway, recovery, udhari)..."
              disabled={isCopilotThinking}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/40 dark:bg-stone-900/50 border border-stone-200/60 dark:border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-paypal-cyan transition font-sans"
            />
            <button
              type="submit"
              data-testid="copilot-submit-btn"
              disabled={!inputQuery.trim() || isCopilotThinking}
              className="p-2.5 rounded-xl bg-paypal-blue hover:bg-paypal-dark text-white disabled:opacity-30 disabled:pointer-events-none transition shadow-glow-paypal"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right 4 Cols: Numbers this answer uses */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass tone-glow rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/50 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-fintech-green animate-pulse" />
                <h3 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider font-mono">
                  Numbers this answer uses
                  <span className="sr-only">Verified Context Inspector</span>
                </h3>
              </div>
              <span className="text-[10px] font-mono text-paypal-cyan bg-paypal-blue/20 px-2 py-0.5 rounded border border-paypal-cyan/30">
                LIVE STATE BOUND
              </span>
            </div>

            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              These immutable state slices from the PayPilot Zustand store are bound to every Copilot prompt evaluation:
            </p>

            {/* Context Cards */}
            <div className="space-y-2.5 text-xs font-mono">
              {/* Total Liquid Cash */}
              <div className="p-3 rounded-xl bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase block font-sans">Total Liquid Cash</span>
                  <span className="text-sm font-bold text-stone-900 dark:text-white">
                    ${executiveKpis.totalAvailableCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right text-[10px] text-stone-500 dark:text-stone-400 font-sans">
                  PayPal: $68.4k <br />
                  Bank: $58.1k
                </div>
              </div>

              {/* Runway Days */}
              <div className="p-3 rounded-xl bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase block font-sans">Financial Runway</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {executiveKpis.financialRunwayDays} Days
                  </span>
                </div>
                <div className="text-right text-[10px] text-stone-500 dark:text-stone-400 font-sans">
                  Burn: $1,515/day <br />
                  Buffer: $15,000.00
                </div>
              </div>

              {/* Recoverable Pipeline */}
              <div className="p-3 rounded-xl bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase block font-sans">Recoverable Pipeline</span>
                  <span className="text-sm font-bold text-paypal-cyan">
                    ${recoveryFunnelMetrics.identifiedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right text-[10px] text-stone-500 dark:text-stone-400 font-sans">
                  {recoveryFunnelMetrics.identifiedCount} cases flagged <br />
                  ${recoveryFunnelMetrics.recoveredAmount.toLocaleString()} recovered
                </div>
              </div>

              {/* Overdue Udhari */}
              <div className="p-3 rounded-xl bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase block font-sans">Outstanding Udhari Credit</span>
                  <span className="text-sm font-bold text-amber-400">
                    ${udhariSummary.totalOutstandingCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right text-[10px] text-stone-500 dark:text-stone-400 font-sans">
                  Overdue &gt;30d: <br />
                  ${udhariSummary.overdueAbove30Days.toLocaleString()}
                </div>
              </div>

              {/* Active Discrepancies */}
              <div className="p-3 rounded-xl bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase block font-sans">Reconciliation Mismatches</span>
                  <span className="text-sm font-bold text-rose-400">
                    {executiveKpis.reconciliationDiscrepanciesCount} Items Flagged
                  </span>
                </div>
                <div className="text-right text-[10px] text-stone-500 dark:text-stone-400 font-sans">
                  3-Way Match <br />
                  99.4% Precision
                </div>
              </div>

              {/* PayPal Sandbox Status */}
              <div className="p-3 rounded-xl bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase block font-sans">PayPal Sandbox Rail</span>
                  <span className="text-xs font-bold text-fintech-green flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-fintech-green animate-pulse" />
                    CONNECTED_SANDBOX
                  </span>
                </div>
                <div className="text-right text-[10px] text-stone-500 dark:text-stone-400 font-sans">
                  REST API v2 <br />
                  Latency: 800ms
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-stone-200/50 dark:border-white/10 space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500 dark:text-stone-400 font-semibold block">
                Quick Route Navigation
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveRoute('payback-hunter')}
                  className="px-2.5 py-1.5 rounded-lg bg-white/50 dark:bg-stone-950/60 hover:bg-stone-200/80 dark:hover:bg-stone-800/80 border border-stone-200/60 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:text-white transition flex items-center justify-between"
                >
                  <span>PayBack Hunter</span>
                  <ChevronRight className="w-3 h-3 text-paypal-cyan" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRoute('approvals')}
                  className="px-2.5 py-1.5 rounded-lg bg-white/50 dark:bg-stone-950/60 hover:bg-stone-200/80 dark:hover:bg-stone-800/80 border border-stone-200/60 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:text-white transition flex items-center justify-between"
                >
                  <span>Approvals</span>
                  <ChevronRight className="w-3 h-3 text-purple-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopilotView;
