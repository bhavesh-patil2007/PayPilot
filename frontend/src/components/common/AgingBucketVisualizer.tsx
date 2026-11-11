import React, { useMemo } from 'react';
import { usePayPilotStore } from '../../store/usePayPilotStore';
import { AgingBucket } from '../../types';
import { CheckCircle2, Clock, AlertTriangle, AlertOctagon, RotateCcw } from 'lucide-react';

export interface AgingBucketVisualizerProps {
  selectedBucket: AgingBucket | 'ALL' | null;
  onSelectBucket: (bucket: AgingBucket | 'ALL') => void;
  className?: string;
}

export const AgingBucketVisualizer: React.FC<AgingBucketVisualizerProps> = ({
  selectedBucket,
  onSelectBucket,
  className = '',
}) => {
  const { udhariCustomers, udhariSummary } = usePayPilotStore();

  // Compute live totals across aging buckets
  const bucketMetrics = useMemo(() => {
    const total = udhariCustomers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);

    const b0_15 = udhariCustomers.filter((c) => c.agingBucket === '0_15_DAYS');
    const b16_30 = udhariCustomers.filter((c) => c.agingBucket === '16_30_DAYS');
    const b31_60 = udhariCustomers.filter((c) => c.agingBucket === '31_60_DAYS');
    const b60_plus = udhariCustomers.filter((c) => c.agingBucket === '60_PLUS_DAYS');

    const amt0_15 = b0_15.reduce((s, c) => s + (c.outstandingBalance || 0), 0);
    const amt16_30 = b16_30.reduce((s, c) => s + (c.outstandingBalance || 0), 0);
    const amt31_60 = b31_60.reduce((s, c) => s + (c.outstandingBalance || 0), 0);
    const amt60_plus = b60_plus.reduce((s, c) => s + (c.outstandingBalance || 0), 0);

    return {
      total,
      bucket0_15: {
        amount: amt0_15,
        count: b0_15.length,
        percentage: total > 0 ? (amt0_15 / total) * 100 : 0,
      },
      bucket16_30: {
        amount: amt16_30,
        count: b16_30.length,
        percentage: total > 0 ? (amt16_30 / total) * 100 : 0,
      },
      bucket31_60: {
        amount: amt31_60,
        count: b31_60.length,
        percentage: total > 0 ? (amt31_60 / total) * 100 : 0,
      },
      bucket60_plus: {
        amount: amt60_plus,
        count: b60_plus.length,
        percentage: total > 0 ? (amt60_plus / total) * 100 : 0,
      },
    };
  }, [udhariCustomers]);

  const cards = [
    {
      id: '0_15_DAYS' as AgingBucket,
      title: '0 - 15 Days (Current)',
      amount: bucketMetrics.bucket0_15.amount,
      count: bucketMetrics.bucket0_15.count,
      pct: bucketMetrics.bucket0_15.percentage,
      icon: CheckCircle2,
      color: 'emerald',
      statusText: 'Low Risk • Active Terms',
      barBg: 'bg-emerald-500',
      borderClass: 'border-emerald-500/30 hover:border-emerald-500/60',
    },
    {
      id: '16_30_DAYS' as AgingBucket,
      title: '16 - 30 Days (Watchlist)',
      amount: bucketMetrics.bucket16_30.amount,
      count: bucketMetrics.bucket16_30.count,
      pct: bucketMetrics.bucket16_30.percentage,
      icon: Clock,
      color: 'amber',
      statusText: 'Watchlist • Due Soon',
      barBg: 'bg-amber-400',
      borderClass: 'border-amber-500/30 hover:border-amber-500/60',
    },
    {
      id: '31_60_DAYS' as AgingBucket,
      title: '31 - 60 Days (Delinquent)',
      amount: bucketMetrics.bucket31_60.amount,
      count: bucketMetrics.bucket31_60.count,
      pct: bucketMetrics.bucket31_60.percentage,
      icon: AlertTriangle,
      color: 'orange',
      statusText: 'Delinquent • Escalated',
      barBg: 'bg-orange-500',
      borderClass: 'border-orange-500/30 hover:border-orange-500/60',
    },
    {
      id: '60_PLUS_DAYS' as AgingBucket,
      title: '60+ Days (Critical / Default)',
      amount: bucketMetrics.bucket60_plus.amount,
      count: bucketMetrics.bucket60_plus.count,
      pct: bucketMetrics.bucket60_plus.percentage,
      icon: AlertOctagon,
      color: 'rose',
      statusText: 'High Risk • Settle Advised',
      barBg: 'bg-rose-500',
      borderClass: 'border-rose-500/40 hover:border-rose-500/70',
    },
  ];

  return (
    <div
      data-testid="aging-bucket-visualizer"
      className={`glass tone-glow rounded-2xl p-5 space-y-4 ${className}`}
    >
      {/* Header & Meta */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
            How old the unpaid invoices are
            <span className="sr-only">Receivables Debt Aging Distribution</span>
            {selectedBucket && selectedBucket !== 'ALL' && (
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-paypal-blue/20 text-paypal-cyan border border-paypal-cyan/30">
                Filtered: {selectedBucket}
              </span>
            )}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Still unpaid Credit:{' '}
            <span className="font-mono font-bold text-stone-900 dark:text-white">
              ${bucketMetrics.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {' '}• Recovered this month:{' '}
            <span className="font-mono text-emerald-400">
              ${udhariSummary.recoveredThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            {' '}• Avg DSO:{' '}
            <span className="font-mono text-stone-600 dark:text-stone-300">{udhariSummary.averageCollectionDays} Days</span>
          </p>
        </div>

        {selectedBucket && selectedBucket !== 'ALL' && (
          <button
            type="button"
            data-testid="reset-bucket-filter"
            onClick={() => onSelectBucket('ALL')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-200/70 dark:bg-stone-800/70 hover:bg-stone-300/80 dark:hover:bg-stone-700/80 text-stone-700 dark:text-stone-200 text-xs font-medium border border-stone-300/70 dark:border-white/10 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-paypal-cyan" />
            <span>Show All Accounts</span>
          </button>
        )}
      </div>

      {/* Segmented Progress Bar */}
      <div
        data-testid="aging-progress-bar"
        className="w-full bg-stone-200/70 dark:bg-stone-800/80 rounded-xl h-3.5 flex overflow-hidden p-0.5 gap-0.5 border border-stone-300/70 dark:border-white/10"
      >
        {cards.map((c) => {
          if (c.pct <= 0) return null;
          const isSelected = selectedBucket === c.id;
          return (
            <div
              key={c.id}
              data-testid={`bar-segment-${c.id}`}
              onClick={() => onSelectBucket(isSelected ? 'ALL' : c.id)}
              style={{ width: `${c.pct}%` }}
              title={`${c.title}: $${c.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${c.pct.toFixed(1)}%)`}
              className={`h-full rounded-sm cursor-pointer transition-all hover:brightness-125 ${c.barBg} ${
                isSelected ? 'ring-2 ring-white brightness-125' : 'opacity-90'
              }`}
            />
          );
        })}
      </div>

      {/* 4 Interactive Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 pt-1">
        {cards.map((card) => {
          const isSelected = selectedBucket === card.id;
          const Icon = card.icon;

          return (
            <div
              key={card.id}
              data-testid={`aging-card-${card.id}`}
              onClick={() => onSelectBucket(isSelected ? 'ALL' : card.id)}
              className={`p-3.5 rounded-xl bg-white/30 dark:bg-stone-900/80 border transition-all cursor-pointer ${card.borderClass} ${
                isSelected ? 'ring-2 ring-paypal-cyan bg-obsidian-800 shadow-glow-cyan' : ''
              }`}
            >
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span className="font-medium text-stone-600 dark:text-stone-300">{card.title}</span>
                <Icon className={`w-4 h-4 ${isSelected ? 'text-paypal-cyan' : 'text-stone-500 dark:text-stone-400'}`} />
              </div>
              <div className="text-xl font-bold font-mono text-stone-900 dark:text-white mt-1.5">
                ${card.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 flex items-center justify-between">
                <span>{card.count} {card.count === 1 ? 'account' : 'accounts'}</span>
                <span className="font-mono">{card.pct.toFixed(1)}%</span>
              </div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-2 pt-2 border-t border-stone-200/50 dark:border-white/10">
                {card.statusText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
