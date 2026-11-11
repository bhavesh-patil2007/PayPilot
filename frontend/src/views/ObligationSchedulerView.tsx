import React, { useState } from 'react';
import { useObligations } from '../hooks/useObligations';
import {
  CalendarClock,
  TrendingDown,
  AlertOctagon,
  CheckCircle2,
  Calendar,
  Sparkles,
  RefreshCw,
  Plus,
  Play,
  Layers,
  ArrowRight,
  Lock,
  DollarSign,
  TrendingUp,
  Tag,
} from 'lucide-react';

export function ObligationSchedulerView() {
  const {
    obligations,
    simulation,
    scenario,
    startingCash,
    reserveFloor,
    prioritizeDiscounts,
    isLoading,
    isSimulating,
    actionMessage,
    setStartingCash,
    setReserveFloor,
    setPrioritizeDiscounts,
    changeScenario,
    runSimulation,
    approveItems,
    executePayment,
    addObligation,
    clearActionMessage,
  } = useObligations();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Add Obligation form state
  const [newPayee, setNewPayee] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('2024-11-20');
  const [newPriority, setNewPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [newSourceType, setNewSourceType] = useState('supplier_invoice');

  const onAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayee || !newAmount) return;
    await addObligation({
      payee_name: newPayee,
      amount: parseFloat(newAmount) || 0,
      due_date: newDueDate,
      priority: newPriority,
      source_type: newSourceType as any,
    });
    setNewPayee('');
    setNewAmount('');
    setIsAddModalOpen(false);
  };

  const handleApproveSelected = async () => {
    await approveItems(selectedIds);
    setSelectedIds([]);
  };

  const toggleSelect = (oblId: string) => {
    setSelectedIds((prev) =>
      prev.includes(oblId) ? prev.filter((id) => id !== oblId) : [...prev, oblId]
    );
  };

  const totalObligationsSum = obligations.reduce((acc, o) => acc + o.amount, 0);

  return (
    <div data-testid="smart-obligation-scheduler-view" className="space-y-6">
      {/* 1. Header & Financial Overview */}
      <div className="glass tone-glow rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white flex items-center gap-2.5 font-display">
            Smart Obligation Scheduler
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              Cash-Aware Twin Engine
            </span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Prioritizes and schedules approved obligations against Digital Twin cash forecasts while enforcing minimum reserve floors.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono uppercase block">Total Commitments</span>
            <span className="text-lg font-bold font-mono text-stone-900 dark:text-white">
              ${totalObligationsSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="h-8 w-px bg-stone-200/60 dark:bg-stone-800" />
          <div className="text-right">
            <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono uppercase block">Reserve Floor</span>
            <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
              ${reserveFloor.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Obligation
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between animate-fadeIn ${
            actionMessage.includes('RESERVE BREACH')
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
          }`}
        >
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

      {/* 2. Simulation Scenario Selector Bar */}
      <div className="glass tone-glow rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase text-stone-500 dark:text-stone-400 mr-2 flex items-center gap-1.5">
            <CalendarClock className="h-4 w-4 text-amber-500" />
            Twin Scenario:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'baseline', label: 'Baseline Forecast' },
              { id: 'delayed_inflow', label: 'Delayed Receivables (Breach Test)' },
              { id: 'low_sales', label: 'Conservative Low Sales' },
              { id: 'unexpected_expense', label: 'Stress Shock' },
            ].map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => changeScenario(sc.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  scenario === sc.id
                    ? 'bg-amber-500 text-white font-bold shadow'
                    : 'bg-stone-100 dark:bg-stone-900/60 border border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:border-amber-500/40'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <label className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300 cursor-pointer">
            <input
              type="checkbox"
              checked={prioritizeDiscounts}
              onChange={(e) => {
                setPrioritizeDiscounts(e.target.checked);
                runSimulation(undefined);
              }}
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            Prioritize Early Discounts
          </label>
          <button
            type="button"
            onClick={() => runSimulation()}
            className="p-1.5 rounded-lg border border-stone-200 dark:border-white/10 text-stone-400 hover:text-white"
            title="Recalculate schedule"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. Daily Cash Forecast vs Reserve Floor Visual Curve */}
      {simulation && (
        <div className="glass tone-glow rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                30-Day Cash Trajectory & Reserve Floor ($15,000 Safety Buffer)
              </span>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {simulation.explanation}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-stone-600 dark:text-stone-300">Projected Cash</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-stone-600 dark:text-stone-300">Reserve Floor</span>
              </div>
            </div>
          </div>

          {/* Simple Sparkline / Bar Graph of daily cash curve */}
          <div className="h-28 w-full flex items-end gap-1.5 pt-4 pb-2 border-b border-stone-200/60 dark:border-white/10 overflow-x-auto">
            {simulation.daily_forecast.slice(0, 24).map((pt, idx) => {
              const maxCash = 160000;
              const heightPct = Math.min(100, Math.max(10, (pt.projected_cash / maxCash) * 100));
              const isBreach = pt.breached;
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-1 group relative min-w-[20px]"
                >
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t transition-all ${
                      isBreach
                        ? 'bg-rose-500/80 hover:bg-rose-500 shadow-rose-500/40 shadow-sm'
                        : 'bg-amber-500/70 hover:bg-amber-500 shadow-amber-500/20 shadow-sm'
                    }`}
                  />
                  <span className="text-[8px] font-mono text-stone-400 rotate-45 origin-left hidden group-hover:block absolute -top-7 bg-stone-900 text-white px-1.5 py-0.5 rounded shadow z-20 whitespace-nowrap">
                    {pt.date.substring(5)}: ${Math.round(pt.projected_cash).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Simulation Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-900/60 border border-stone-200/60 dark:border-white/10">
              <span className="text-[10px] font-mono text-stone-400 block">TOTAL SCHEDULED</span>
              <span className="font-mono text-base font-bold text-stone-900 dark:text-white">
                ${simulation.total_scheduled_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-900/60 border border-stone-200/60 dark:border-white/10">
              <span className="text-[10px] font-mono text-stone-400 block">EARLY DISCOUNTS CAPTURED</span>
              <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                +${simulation.total_discounts_captured.toFixed(2)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-900/60 border border-stone-200/60 dark:border-white/10">
              <span className="text-[10px] font-mono text-stone-400 block">LATE PENALTIES AVOIDED</span>
              <span className="font-mono text-base font-bold text-amber-600 dark:text-amber-400">
                +${simulation.total_late_fees_avoided.toFixed(2)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-900/60 border border-stone-200/60 dark:border-white/10">
              <span className="text-[10px] font-mono text-stone-400 block">RESERVE SAFETY</span>
              <span
                className={`font-mono text-base font-bold ${
                  simulation.reserve_breached
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {simulation.reserve_breached ? 'BREACH DETECTED' : 'PROTECTED'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Unified Obligation Calendar & Proposed Execution Register */}
      <div className="glass tone-glow rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200/60 dark:border-white/10">
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2 font-display">
              <Calendar className="h-4 w-4 text-amber-500" />
              Unified Obligation Register & Scheduled Payments
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Select items to approve for execution or convert to external task reminders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApproveSelected}
              disabled={selectedIds.length === 0 || isSimulating}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5 ${
                selectedIds.length > 0
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve Selected ({selectedIds.length})
            </button>
          </div>
        </div>

        {/* Schedule Items Table */}
        <div className="overflow-x-auto rounded-xl border border-stone-200/60 dark:border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 dark:bg-stone-900/80 text-[10px] font-mono uppercase text-stone-500 dark:text-stone-400">
              <tr>
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    checked={
                      simulation?.items &&
                      simulation.items.length > 0 &&
                      selectedIds.length === simulation.items.length
                    }
                    onChange={(e) => {
                      if (e.target.checked && simulation) {
                        setSelectedIds(simulation.items.map((i) => i.obligation_id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                </th>
                <th className="p-3">Payee / Purpose</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Proposed Date</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Constraint Reasons</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/40 dark:divide-white/5 font-mono text-[11px]">
              {(simulation?.items || []).map((item) => {
                const isChecked = selectedIds.includes(item.obligation_id);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-white/40 dark:hover:bg-white/5 transition ${
                      isChecked ? 'bg-amber-500/10' : ''
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(item.obligation_id)}
                        className="rounded text-amber-500 focus:ring-amber-500"
                      />
                    </td>
                    <td className="p-3 font-sans font-semibold text-stone-900 dark:text-white">
                      {item.payee_name}
                    </td>
                    <td className="p-3 text-stone-500 dark:text-stone-400">{item.due_date}</td>
                    <td className="p-3">
                      <span
                        className={`font-bold ${
                          item.proposed_date !== item.due_date
                            ? 'text-amber-600 dark:text-amber-400 font-semibold'
                            : 'text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {item.proposed_date}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-stone-900 dark:text-white">
                      ${item.proposed_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.priority === 'critical'
                            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                            : item.priority === 'high'
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-stone-600 dark:text-stone-400 text-[11px] max-w-xs">
                      {item.reason_codes.join(' ')}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        <button
                          type="button"
                          onClick={() => executePayment(item.obligation_id, 'provider_direct')}
                          disabled={isSimulating}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition shadow"
                          title="Execute via PayPal Payouts"
                        >
                          Pay Now
                        </button>
                        <button
                          type="button"
                          onClick={() => executePayment(item.obligation_id, 'task_reminder')}
                          disabled={isSimulating}
                          className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5 text-stone-700 dark:text-stone-300 text-[10px] font-medium transition"
                          title="Create clearly labeled reminder task"
                        >
                          Set Reminder
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Obligation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="glass tone-glow rounded-2xl p-6 w-full max-w-md space-y-4 border border-stone-200/60 dark:border-white/10 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-white/10">
              <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2 font-display">
                <Plus className="h-4 w-4 text-amber-500" />
                Add Business Obligation
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={onAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-stone-400 font-mono block mb-1">Payee Name</label>
                <input
                  type="text"
                  placeholder="e.g. AWS Hosting, WeWork Rent, Gusto"
                  value={newPayee}
                  onChange={(e) => setNewPayee(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-400 font-mono block mb-1">Amount ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="2500.00"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-stone-400 font-mono block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-400 font-mono block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white"
                  >
                    <option value="critical">Critical (Rent/Payroll)</option>
                    <option value="high">High (Supplier/Taxes)</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-stone-400 font-mono block mb-1">Category</label>
                  <select
                    value={newSourceType}
                    onChange={(e) => setNewSourceType(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white"
                  >
                    <option value="supplier_invoice">Supplier Invoice</option>
                    <option value="payroll">Payroll</option>
                    <option value="recurring_expense">Rent / Recurring</option>
                    <option value="tax">Tax Remittance</option>
                    <option value="manual">Other / Manual</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-white/10 text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Schedule Obligation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
