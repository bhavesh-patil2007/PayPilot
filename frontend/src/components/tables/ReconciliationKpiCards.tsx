import React from 'react';
import { Layers, Sparkles, AlertTriangle, HelpCircle } from 'lucide-react';
import { usePayPilotStore } from '../../store/usePayPilotStore';
import { getNormalizedMatchStatus } from './DiscrepancyInspectorModal';

export const ReconciliationKpiCards: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { reconciliationSummary, reconciliationRecords } = usePayPilotStore();

  const orphanCount = reconciliationRecords.filter((r) => {
    const s = getNormalizedMatchStatus(r);
    return s === 'ORPHAN_PAYPAL' || s === 'ORPHAN_BANK' || s === 'ORPHAN_INVOICE';
  }).length;

  return (
    <div
      data-testid="reconciliation-kpi-cards"
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
    >
      {/* 1. Total Volume Reconciled */}
      <div
        data-testid="kpi-total-volume"
        className="glass tone-glow rounded-2xl p-5"
      >
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-medium">
          <span>Total Volume Reconciled</span>
          <Layers className="w-4 h-4 text-fintech-green" />
        </div>
        <div className="text-2xl font-bold text-stone-900 dark:text-white font-mono mt-1">
          ${(reconciliationSummary.totalReconciledVolume / 1000).toFixed(1)}k
        </div>
        <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
          <span>Across multi-source ledger</span>
        </div>
      </div>

      {/* 2. Matched Precision Rate */}
      <div
        data-testid="kpi-matched-precision"
        className="glass tone-glow rounded-2xl p-5"
      >
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-medium">
          <span>Matched Precision Rate</span>
          <Sparkles className="w-4 h-4 text-paypal-cyan" />
        </div>
        <div className="text-2xl font-bold text-paypal-cyan font-mono mt-1">
          {reconciliationSummary.autoMatchPrecisionPct}%
        </div>
        <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
          AI confidence threshold &gt;= 95%
        </div>
      </div>

      {/* 3. Active Discrepancies */}
      <div
        data-testid="kpi-active-discrepancies"
        className="glass tone-glow rounded-2xl p-5"
      >
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-medium">
          <span>Active Discrepancies</span>
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        </div>
        <div className="text-2xl font-bold text-rose-400 font-mono mt-1">
          ${reconciliationSummary.totalDiscrepancyAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
          {reconciliationSummary.unresolvedCount} records flagged for review
        </div>
      </div>

      {/* 4. Unmatched Orphans */}
      <div
        data-testid="kpi-unmatched-orphans"
        className="glass tone-glow rounded-2xl p-5"
      >
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-medium">
          <span>Unmatched Orphans</span>
          <HelpCircle className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
          {orphanCount} records
        </div>
        <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
          Missing bank feed or invoice counterpart
        </div>
      </div>
    </div>
  );
};
