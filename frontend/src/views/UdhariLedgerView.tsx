import React, { useState } from 'react';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { UdhariLedgerTable } from '../components/tables/UdhariLedgerTable';
import { AgingBucketVisualizer } from '../components/common/AgingBucketVisualizer';
import { AgingBucket } from '../types';
import { BookOpen, DollarSign, Clock, CheckCircle2 } from 'lucide-react';

export interface UdhariLedgerViewProps {
  className?: string;
}

export const UdhariLedgerView: React.FC<UdhariLedgerViewProps> = ({ className = '' }) => {
  const { udhariSummary } = usePayPilotStore();
  const [selectedBucket, setSelectedBucket] = useState<AgingBucket | 'ALL'>('ALL');

  return (
    <div data-testid="udhari-ledger-view" className={`space-y-6 ${className}`}>
      {/* 1. Header */}
      <div className="glass tone-glow rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white flex items-center gap-2.5">
            Money customers still owe
            <span className="sr-only">Customer Credit &amp; Aging</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-paypal-blue/20 text-paypal-cyan border border-paypal-cyan/30">
              Who still owes you
            </span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            See unpaid invoices, send a reminder, or offer a small discount so you get paid sooner.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono uppercase block">Still unpaid</span>
            <span className="text-lg font-bold font-mono text-stone-900 dark:text-white">
              ${udhariSummary.totalOutstandingCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="h-8 w-px bg-stone-200/70 dark:bg-stone-800/70" />
          <div className="text-right">
            <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono uppercase block">Collected this month</span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              +${udhariSummary.recoveredThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. How old the unpaid invoices are Bar */}
      <AgingBucketVisualizer
        selectedBucket={selectedBucket}
        onSelectBucket={(bucket) => setSelectedBucket(bucket)}
      />

      {/* 3. Udhari Ledger AG Grid Table with integrated WhatsApp / Invoice / Settlement Modals */}
      <UdhariLedgerTable
        selectedBucket={selectedBucket}
      />
    </div>
  );
};

export default UdhariLedgerView;
