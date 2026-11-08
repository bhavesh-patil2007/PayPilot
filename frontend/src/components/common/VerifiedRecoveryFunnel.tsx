import React from 'react';
import { usePayPilotStore } from '../../store/usePayPilotStore';
import { RecoveryFunnelStage } from '../../types';
import {
  Search,
  Send,
  Clock,
  CheckCircle2,
  ChevronRight,
  Layers,
} from 'lucide-react';

export interface VerifiedRecoveryFunnelProps {
  activeStage?: RecoveryFunnelStage | null;
  onSelectStage?: (stage: RecoveryFunnelStage | null) => void;
  className?: string;
}

interface FunnelStageCardConfig {
  id: RecoveryFunnelStage;
  label: string;
  count: number;
  amount: number;
  icon: React.ElementType;
  colorBorder: string;
  colorBg: string;
  colorText: string;
  colorBadge: string;
  colorRing: string;
  description: string;
}

export const VerifiedRecoveryFunnel: React.FC<VerifiedRecoveryFunnelProps> = ({
  activeStage = null,
  onSelectStage,
  className = '',
}) => {
  const { recoveryFunnelMetrics } = usePayPilotStore();

  const stages: FunnelStageCardConfig[] = [
    {
      id: 'POTENTIAL_IDENTIFIED',
      label: 'Potential Identified',
      count: recoveryFunnelMetrics.identifiedCount,
      amount: recoveryFunnelMetrics.identifiedAmount,
      icon: Search,
      colorBorder: 'border-amber-500/40',
      colorBg: 'bg-amber-950/20 hover:bg-amber-950/30',
      colorText: 'text-amber-400',
      colorBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      colorRing: 'ring-amber-400',
      description: 'Algorithmic fee & refund anomalies flagged',
    },
    {
      id: 'CLAIM_SUBMITTED',
      label: 'Claim Submitted',
      count: recoveryFunnelMetrics.submittedCount,
      amount: recoveryFunnelMetrics.submittedAmount,
      icon: Send,
      colorBorder: 'border-paypal-blue/40',
      colorBg: 'bg-paypal-blue/10 hover:bg-paypal-blue/20',
      colorText: 'text-paypal-cyan',
      colorBadge: 'bg-paypal-blue/20 text-paypal-cyan border-paypal-cyan/30',
      colorRing: 'ring-paypal-cyan',
      description: 'Disputes & refund claims filed with PayPal',
    },
    {
      id: 'PROVIDER_PENDING',
      label: 'Provider Pending',
      count: recoveryFunnelMetrics.pendingCount,
      amount: recoveryFunnelMetrics.pendingAmount,
      icon: Clock,
      colorBorder: 'border-purple-500/40',
      colorBg: 'bg-purple-950/20 hover:bg-purple-950/30',
      colorText: 'text-purple-400',
      colorBadge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      colorRing: 'ring-purple-400',
      description: 'Under secondary merchant operations review',
    },
    {
      id: 'VERIFIED_RECOVERED',
      label: 'Verified Recovered',
      count: recoveryFunnelMetrics.recoveredCount,
      amount: recoveryFunnelMetrics.recoveredAmount,
      icon: CheckCircle2,
      colorBorder: 'border-emerald-500/40',
      colorBg: 'bg-emerald-950/20 hover:bg-emerald-950/30',
      colorText: 'text-fintech-green',
      colorBadge: 'bg-emerald-500/20 text-fintech-green border-emerald-500/30',
      colorRing: 'ring-fintech-green',
      description: 'Funds cleared and settled into liquid cash',
    },
  ];

  // Inter-stage conversion calculations
  const conv1to2 =
    recoveryFunnelMetrics.identifiedAmount > 0
      ? Math.round((recoveryFunnelMetrics.submittedAmount / recoveryFunnelMetrics.identifiedAmount) * 1000) / 10
      : 0;
  const conv2to3 =
    recoveryFunnelMetrics.submittedAmount > 0
      ? Math.round((recoveryFunnelMetrics.pendingAmount / recoveryFunnelMetrics.submittedAmount) * 1000) / 10
      : 0;
  const conv3to4 =
    recoveryFunnelMetrics.pendingAmount > 0
      ? Math.round((recoveryFunnelMetrics.recoveredAmount / recoveryFunnelMetrics.pendingAmount) * 1000) / 10
      : 0;

  const handleStageClick = (stageId: RecoveryFunnelStage) => {
    if (!onSelectStage) return;
    if (activeStage === stageId) {
      onSelectStage(null);
    } else {
      onSelectStage(stageId);
    }
  };

  return (
    <div
      data-testid="verified-recovery-funnel"
      className={`p-5 rounded-2xl bg-obsidian-900 border border-slate-800 shadow-card-dark space-y-4 ${className}`}
    >
      {/* Funnel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-paypal-blue/20 border border-paypal-cyan/30 flex items-center justify-center text-paypal-cyan">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              Verified Recovery Funnel
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                Live Pipeline
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Click any stage card to filter the Recovery Inbox table below
            </p>
          </div>
        </div>

        {/* Global Pipeline Conversion KPI */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Total Conversion</div>
            <div className="text-base font-bold font-mono text-fintech-green">
              {recoveryFunnelMetrics.conversionRatePct.toFixed(1)}%
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Recovered / Identified</div>
            <div className="text-xs font-mono font-semibold text-white">
              ${recoveryFunnelMetrics.recoveredAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${recoveryFunnelMetrics.identifiedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Interactive Funnel Stages */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = activeStage === stage.id;

          return (
            <button
              key={stage.id}
              type="button"
              data-testid={`funnel-stage-${stage.id}`}
              onClick={() => handleStageClick(stage.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden group ${
                stage.colorBorder
              } ${stage.colorBg} ${
                isActive
                  ? `ring-2 ${stage.colorRing} shadow-glow-paypal bg-obsidian-800/90 scale-[1.02]`
                  : 'hover:border-slate-600'
              }`}
            >
              {/* Active Indicator Top Bar */}
              {isActive && (
                <div className={`absolute top-0 left-0 right-0 h-1 ${stage.colorText} bg-current`} />
              )}

              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] uppercase font-mono tracking-wider font-semibold ${stage.colorText}`}>
                  Step {idx + 1}
                </span>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${stage.colorBadge}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="text-xs font-medium text-slate-300">{stage.label}</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                ${stage.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px]">
                <span className="text-slate-400">
                  <strong className="text-white font-mono">{stage.count}</strong> cases
                </span>
                {isActive ? (
                  <span className="text-[10px] text-paypal-cyan font-mono font-bold animate-pulse">
                    FILTER APPLIED
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-300 font-mono transition">
                    Filter ➔
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Inter-stage conversion visual bar */}
      <div className="hidden md:flex items-center justify-between px-6 py-2 rounded-lg bg-obsidian-950/60 border border-slate-800/60 text-[11px] text-slate-400 font-mono">
        <span className="flex items-center gap-1.5">
          <span>Identified</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-paypal-cyan font-bold">{conv1to2}% Claimed</span>
        </span>
        <ChevronRight className="w-3 h-3 text-slate-700" />
        <span className="flex items-center gap-1.5">
          <span>Submitted</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-purple-400 font-bold">{conv2to3}% Under Review</span>
        </span>
        <ChevronRight className="w-3 h-3 text-slate-700" />
        <span className="flex items-center gap-1.5">
          <span>Pending</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-fintech-green font-bold">{conv3to4}% Settled</span>
        </span>
      </div>
    </div>
  );
};
