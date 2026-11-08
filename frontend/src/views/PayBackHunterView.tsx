import React, { useState } from 'react';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { RecoveryInboxTable } from '../components/tables/RecoveryInboxTable';
import { VerifiedRecoveryFunnel } from '../components/common/VerifiedRecoveryFunnel';
import { ThreeCanvasContainer } from '../components/3d/ThreeCanvasContainer';
import { FunnelScene } from '../components/3d/scenes/FunnelScene';
import { RecoveryFunnelStage } from '../types';
import { ShieldAlert, Sparkles, Filter, RefreshCw } from 'lucide-react';

export interface PayBackHunterViewProps {
  className?: string;
}

export const PayBackHunterView: React.FC<PayBackHunterViewProps> = ({ className = '' }) => {
  const { recoveryFunnelMetrics } = usePayPilotStore();
  const [selectedStageFilter, setSelectedStageFilter] = useState<RecoveryFunnelStage | null>(null);

  const handleStageSelect = (stage: RecoveryFunnelStage | null) => {
    setSelectedStageFilter((prev) => (prev === stage ? null : stage));
  };

  return (
    <div data-testid="payback-hunter-view" className={`space-y-6 ${className}`}>
      {/* 1. Header & Metric Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            PayBack Hunter
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-paypal-blue/20 text-paypal-cyan border border-paypal-cyan/30">
              Autonomous Leakage Interceptor
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Algorithmic detection of fee discrepancies, unapplied dispute credits, and cross-border currency leakage across payment processors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Identified Leakage</span>
            <span className="text-lg font-bold font-mono text-white">
              ${recoveryFunnelMetrics.identifiedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Recovered To Date</span>
            <span className="text-lg font-bold font-mono text-fintech-green">
              +${recoveryFunnelMetrics.recoveredAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Funnel Visualizer Split Grid: 3D Scene + Interactive 4-Stage Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: 3D Funnel Vortex Canvas */}
        <div className="lg:col-span-4 rounded-2xl bg-gradient-to-b from-obsidian-900 to-obsidian-850 border border-slate-800 shadow-card-dark p-4 flex flex-col justify-between overflow-hidden relative">
          <div className="flex items-center justify-between z-10 mb-2">
            <span className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-paypal-cyan animate-pulse" />
              3D Pipeline Vortex
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {recoveryFunnelMetrics.conversionRatePct.toFixed(1)}% Conv
            </span>
          </div>
          <div className="h-[250px] w-full relative">
            <ThreeCanvasContainer
              controllerFactory={() => new FunnelScene()}
              data={recoveryFunnelMetrics}
              ariaLabel="3D Recovery Pipeline Funnel"
              className="w-full h-full"
            />
          </div>
          <div className="text-[10px] text-slate-500 text-center font-mono mt-1 z-10">
            Hover stages to inspect volumetric conversion
          </div>
        </div>

        {/* Right: 4-Stage VerifiedRecoveryFunnel */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          <VerifiedRecoveryFunnel
            activeStage={selectedStageFilter}
            onSelectStage={handleStageSelect}
            className="h-full flex flex-col justify-between"
          />
        </div>
      </div>

      {/* Active Stage Filter Banner if active */}
      {selectedStageFilter && (
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-paypal-blue/10 border border-paypal-blue/30 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-paypal-cyan" />
            <span className="text-slate-300">
              Filtering inbox table by stage: <strong className="text-paypal-cyan font-mono">{selectedStageFilter}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedStageFilter(null)}
            className="text-[11px] font-mono text-slate-400 hover:text-white underline transition"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* 3. Recovery Inbox AG Grid Table */}
      <RecoveryInboxTable
        selectedStageFilter={selectedStageFilter}
        onClearStageFilter={() => setSelectedStageFilter(null)}
      />
    </div>
  );
};

export default PayBackHunterView;
