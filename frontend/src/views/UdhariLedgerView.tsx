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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Udhari Debt Ledger
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-paypal-blue/20 text-paypal-cyan border border-paypal-cyan/30">
              Customer Credit & Aging
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Receivables tracking, automated multi-channel collection reminders, and discount-accelerated liquidity recovery.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Total Outstanding</span>
            <span className="text-lg font-bold font-mono text-white">
              ${udhariSummary.totalOutstandingCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Recovered This Month</span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              +${udhariSummary.recoveredThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Receivables Debt Aging Distribution Bar */}
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
