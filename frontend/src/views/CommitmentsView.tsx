import React, { useState } from 'react';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { sandboxService } from '../services/sandboxService';
import { assessCommitment } from '../services/backendApi';
import { CommitmentGanttChart } from '../components/charts/CommitmentGanttChart';
import { ThreeCanvasContainer } from '../components/3d/ThreeCanvasContainer';
import { FirewallScene } from '../components/3d/scenes/FirewallScene';
import {
  CommitmentCategory,
  NewCommitmentInput,
  FirewallEvaluationResult,
  CommitmentItem,
} from '../types';
import {
  ShieldAlert,
  CalendarClock,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Filter,
  DollarSign,
  TrendingDown,
  Info,
  Shield,
} from 'lucide-react';

export function CommitmentsView() {
  const {
    commitments,
    executiveKpis,
    minimumSafetyBuffer,
    lastFirewallEvaluation,
    evaluateCommitmentOrder,
    addCommitment,
  } = usePayPilotStore();

  // Workbench Filter States
  const [horizon, setHorizon] = useState<30 | 60 | 90 | 180>(90);
  const [selectedCategory, setSelectedCategory] = useState<CommitmentCategory | 'ALL'>('ALL');

  // Simulator Form State
  const [vendorName, setVendorName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [category, setCategory] = useState<CommitmentCategory>('SUPPLIER_INVENTORY');
  const [paymentTerms, setPaymentTerms] = useState<'DUE_ON_RECEIPT' | 'NET_15' | 'NET_30' | 'NET_60'>('NET_30');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [commitSuccess, setCommitSuccess] = useState<string | null>(null);
  const [backendPreview, setBackendPreview] = useState<{ key: string; result: FirewallEvaluationResult } | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);

  // Parse amount
  const parsedAmount = parseFloat(amountStr) || 0;

  // Compute live order evaluation safely without mutating store during render
  const liveEvaluation: FirewallEvaluationResult | null = React.useMemo(() => {
    if (parsedAmount > 0 && vendorName.trim()) {
      const currentBuffer = executiveKpis.totalAvailableCash - minimumSafetyBuffer;
      const projectedLowest = currentBuffer - parsedAmount;
      const safe = projectedLowest >= 0;
      return {
        status: safe
          ? 'APPROVED_SAFE'
          : projectedLowest >= -5000
          ? 'WARNING_BUFFER_TIGHT'
          : 'CRITICAL_BUFFER_BREACH',
        safe,
        orderAmount: parsedAmount,
        currentBuffer,
        lowestProjectedBuffer: projectedLowest + minimumSafetyBuffer,
        breachDate: safe ? undefined : new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        verdictHeadline: safe ? 'Order Cleared by Commitment Firewall' : 'Commitment Firewall Violation Detected',
        verdictExplanation: safe
          ? `Order of $${parsedAmount.toLocaleString()} preserves $${(projectedLowest + minimumSafetyBuffer).toLocaleString()} safety headroom above the $15,000 threshold.`
          : `Order of $${parsedAmount.toLocaleString()} would deplete liquidity below the mandatory $15,000 buffer (projected dip: $${(projectedLowest + minimumSafetyBuffer).toLocaleString()}).`,
        mitigationOptions: safe ? undefined : [
          'Renegotiate payment terms to NET_45 or NET_60',
          'Request 30% upfront deposit on customer pipeline contracts',
          'Accelerate Udhari collections via PayPal Invoicing',
        ],
      };
    }
    return lastFirewallEvaluation;
  }, [parsedAmount, vendorName, executiveKpis.totalAvailableCash, minimumSafetyBuffer, lastFirewallEvaluation]);

  const apiConfig = sandboxService.getConfig();
  const formKey = `${vendorName.trim()}|${amountStr}|${targetDate}|${executiveKpis.totalAvailableCash}|${minimumSafetyBuffer}`;
  const currentEvaluation = apiConfig.useLiveBackend
    ? (backendPreview?.key === formKey ? backendPreview.result : null)
    : liveEvaluation;

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setCommitSuccess(null);

    if (!vendorName.trim()) {
      setValidationError('Vendor name is required.');
      return;
    }
    if (parsedAmount <= 0) {
      setValidationError('Order amount must be greater than $0.');
      return;
    }

    if (!apiConfig.useLiveBackend) {
      evaluateCommitmentOrder({
        vendorName: vendorName.trim(),
        amount: parsedAmount,
        category,
        paymentTerms,
        targetDate,
      });
      return;
    }

    setIsAssessing(true);
    try {
      const result = await assessCommitment(apiConfig.apiBaseUrl, {
        currency: 'USD',
        starting_cash: executiveKpis.totalAvailableCash,
        starting_cash_source: 'manual_estimate',
        required_reserve: minimumSafetyBuffer,
        cash_flows: [{
          date: targetDate,
          direction: 'outflow',
          amount: parsedAmount,
          label: `${vendorName.trim()} commitment`,
        }],
      });
      const safe = result.status === 'safe';
      const mappedEvaluation: FirewallEvaluationResult = {
        status: result.status === 'safe'
          ? 'APPROVED_SAFE'
          : result.status === 'warning'
            ? 'WARNING_BUFFER_TIGHT'
            : 'CRITICAL_BUFFER_BREACH',
        safe,
        orderAmount: parsedAmount,
        currentBuffer: executiveKpis.totalAvailableCash - minimumSafetyBuffer,
        lowestProjectedBuffer: Number(result.minimum_projected_cash),
        breachDate: result.first_reserve_breach_date ?? undefined,
        verdictHeadline: safe ? 'Backend assessment: within reserve' : 'Backend assessment: reserve breach',
        verdictExplanation: `The ${result.scenario_version} assessment projects a minimum cash balance of $${Number(result.minimum_projected_cash).toLocaleString()} against a $${Number(result.required_reserve).toLocaleString()} reserve. ${result.missing_inputs.join(' ')}`.trim(),
        mitigationOptions: result.recommendations.map((recommendation) =>
          `${recommendation.type.replace(/_/g, ' ')}${recommendation.amount ? `: $${recommendation.amount}` : ''}`
        ),
      };
      setBackendPreview({ key: formKey, result: mappedEvaluation });
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Backend assessment failed.');
    } finally {
      setIsAssessing(false);
    }
  };

  const handleCommitOrder = () => {
    setValidationError(null);
    setCommitSuccess(null);

    if (!vendorName.trim()) {
      setValidationError('Vendor name is required.');
      return;
    }
    if (parsedAmount <= 0) {
      setValidationError('Order amount must be greater than $0.');
      return;
    }

    let evaluation: FirewallEvaluationResult;
    if (apiConfig.useLiveBackend) {
      if (!backendPreview || backendPreview.key !== formKey) {
        setValidationError('Run the backend assessment for these exact inputs before adding this commitment.');
        return;
      }
      evaluation = backendPreview.result;
    } else {
      evaluation = evaluateCommitmentOrder({
        vendorName: vendorName.trim(),
        amount: parsedAmount,
        category,
        paymentTerms,
        targetDate,
      });
    }

    const newCommitment: CommitmentItem = {
      id: `CMT-${Date.now()}`,
      referenceNumber: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      title: `${vendorName.trim()} (${category})`,
      counterparty: vendorName.trim(),
      category,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: targetDate,
      totalCommittedAmount: parsedAmount,
      amountPaidToDate: paymentTerms === 'DUE_ON_RECEIPT' ? parsedAmount : 0,
      pendingBalance: paymentTerms === 'DUE_ON_RECEIPT' ? 0 : parsedAmount,
      paymentTerms,
      milestones: [],
      firewallStatus: evaluation.status,
      firewallVerdict: {
        safe: evaluation.safe,
        lowestProjectedBuffer: evaluation.lowestProjectedBuffer,
        breachDate: evaluation.breachDate,
        explanation: evaluation.verdictExplanation,
      },
      priority: parsedAmount > 15000 ? 'HIGH' : 'MEDIUM',
    };

    addCommitment(newCommitment);
    setCommitSuccess(
      `Order committed! PO #${newCommitment.referenceNumber} for $${parsedAmount.toLocaleString()} added to schedule.`
    );
    setVendorName('');
    setAmountStr('');
  };

  return (
    <div className="space-y-6" data-testid="commitments-view">
      {/* 1. Header Metrics Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Commitment Workbench & Firewall
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-950/40 text-amber-400 border border-amber-500/30">
              Forward Defense
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gantt scheduling, $25,000 minimum safety buffer protection & 3D holographic risk evaluation.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Committed 30d: </span>
            <span className="text-white font-bold">
              ${executiveKpis.upcoming30DayCommitments.toLocaleString()}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Safety Buffer: </span>
            <span className="text-rose-400 font-bold">$25,000.00</span>
          </div>
        </div>
      </div>

      {/* 2. Main Workbench Layout (2 Columns: 65% / 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: CommitmentGanttChart & Ledger (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <CommitmentGanttChart
            commitments={commitments}
            horizonDays={horizon}
            onHorizonChange={setHorizon}
            safetyBufferThreshold={25000}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Commitments Table */}
          <div className="rounded-xl bg-obsidian-900 border border-slate-800 shadow-card-dark p-4">
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider mb-3">
              Active Contract & Payable Ledger
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" data-testid="commitments-table">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase font-mono">
                    <th className="pb-2">PO / Reference</th>
                    <th className="pb-2">Counterparty</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Due Date</th>
                    <th className="pb-2 text-right">Committed</th>
                    <th className="pb-2 text-right">Pending</th>
                    <th className="pb-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {commitments.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-bold text-white">{c.referenceNumber}</td>
                      <td className="py-2.5 text-slate-300">{c.counterparty}</td>
                      <td className="py-2.5 text-slate-400">{c.category}</td>
                      <td className="py-2.5 text-slate-300">{c.dueDate}</td>
                      <td className="py-2.5 text-right text-slate-400">
                        ${c.totalCommittedAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right font-bold text-amber-400">
                        ${c.pendingBalance.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            c.firewallStatus === 'APPROVED_SAFE'
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                              : c.firewallStatus === 'WARNING_BUFFER_TIGHT'
                              ? 'bg-amber-950/40 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-950/40 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {c.firewallStatus === 'APPROVED_SAFE'
                            ? 'PASS'
                            : c.firewallStatus === 'WARNING_BUFFER_TIGHT'
                            ? 'WARN'
                            : 'BLOCK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 3D Animated Shield & Simulator Form (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* 3D Firewall Shield */}
          <div className="rounded-xl bg-obsidian-900 border border-slate-800 shadow-card-dark p-4 overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-paypal-cyan" />
                <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
                  3D Holographic Force-Field
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">WebGL Shader</span>
            </div>

            <div className="h-[260px] relative w-full overflow-hidden mt-2">
              <ThreeCanvasContainer
                controllerFactory={() => new FirewallScene()}
                data={currentEvaluation || (apiConfig.useLiveBackend
                  ? { status: 'WARNING_BUFFER_TIGHT', safe: false }
                  : { status: 'APPROVED_SAFE', safe: true })}
                ariaLabel="Commitment Firewall 3D Animated Shield"
                className="w-full h-full"
              />
            </div>

            {/* Shield Verdict HUD Banner */}
            <div
              className={`mt-2 p-2.5 rounded-lg border text-xs font-mono text-center ${
                currentEvaluation?.status === 'CRITICAL_BUFFER_BREACH'
                  ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                  : currentEvaluation?.status === 'WARNING_BUFFER_TIGHT'
                  ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                  : currentEvaluation
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
              data-testid="firewall-verdict-banner"
            >
              <div className="font-bold">
                {currentEvaluation?.status === 'CRITICAL_BUFFER_BREACH'
                  ? 'BLOCK: Force-Field Collapse'
                  : currentEvaluation?.status === 'WARNING_BUFFER_TIGHT'
                  ? 'WARN: Force-Field Buffer Tight'
                  : currentEvaluation
                    ? 'PASS: Force-Field Buffer Clear'
                    : 'AWAITING ASSESSMENT'}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                {currentEvaluation?.verdictExplanation || (apiConfig.useLiveBackend
                  ? 'Run a backend assessment to calculate the reserve position.'
                  : 'Headroom maintained above safety floor.')}
              </div>
            </div>
          </div>

          {/* Order Evaluation Simulator Form */}
          <div className="rounded-xl bg-obsidian-900 border border-slate-800 shadow-card-dark p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <PlusCircle className="w-4 h-4 text-paypal-cyan" />
              <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
                Order Evaluation Simulator
              </h3>
            </div>

            <form onSubmit={handleSimulate} className="mt-4 space-y-3.5 text-xs">
              {validationError && (
                <div
                  className="p-2.5 rounded bg-rose-950/50 border border-rose-500/40 text-rose-300 text-[11px] flex items-center gap-1.5"
                  data-testid="order-validation-error"
                >
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {commitSuccess && (
                <div
                  className="p-2.5 rounded bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center gap-1.5"
                  data-testid="order-commit-success"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{commitSuccess}</span>
                </div>
              )}

              {/* Vendor */}
              <div>
                <label className="block text-[11px] text-slate-400 font-mono mb-1">
                  Vendor / Counterparty
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Taiwan Semiconductor Corp"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-sans focus:outline-none focus:border-paypal-cyan"
                  data-testid="input-vendor-name"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[11px] text-slate-400 font-mono mb-1">
                  Order Amount ($ USD)
                </label>
                <input
                  type="number"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="e.g. 18500"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-paypal-cyan"
                  data-testid="input-order-amount"
                />
              </div>

              {/* Due Date & Category Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 font-mono mb-1">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:border-paypal-cyan"
                    data-testid="input-target-date"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-mono mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CommitmentCategory)}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-sans text-[11px] focus:outline-none focus:border-paypal-cyan"
                    data-testid="select-category"
                  >
                    <option value="SUPPLIER_INVENTORY">Supplier / Inventory</option>
                    <option value="PAYROLL">Payroll</option>
                    <option value="SAAS_TOOLS">SaaS & Tools</option>
                    <option value="OFFICE_RENT">Office Rent</option>
                    <option value="TAX_ESTIMATES">Tax Estimates</option>
                    <option value="DEBT_SERVICE">Debt Service</option>
                  </select>
                </div>
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-[11px] text-slate-400 font-mono mb-1">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-sans focus:outline-none focus:border-paypal-cyan"
                  data-testid="select-payment-terms"
                >
                  <option value="NET_30">NET_30 (Standard 30 days)</option>
                  <option value="NET_15">NET_15 (15 days)</option>
                  <option value="NET_60">NET_60 (Extended 60 days)</option>
                  <option value="DUE_ON_RECEIPT">DUE_ON_RECEIPT (Immediate)</option>
                </select>
              </div>

              {/* Commit Button */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isAssessing}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-paypal-blue to-paypal-dark hover:from-paypal-blue/90 hover:to-paypal-dark/90 text-white font-semibold shadow-glow-paypal transition"
                  data-testid="btn-assess-order"
                >
                  {isAssessing ? 'Assessing...' : apiConfig.useLiveBackend ? 'Assess with FastAPI' : 'Evaluate Commitment'}
                </button>
                <button
                  type="button"
                  onClick={handleCommitOrder}
                  className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
                  data-testid="btn-commit-order"
                >
                  Add Commitment to Demo Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommitmentsView;
