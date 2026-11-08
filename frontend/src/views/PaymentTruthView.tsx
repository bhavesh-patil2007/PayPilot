import React, { useState } from 'react';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { PaymentTruthTable } from '../components/tables/PaymentTruthTable';
import { ReconciliationKpiCards } from '../components/tables/ReconciliationKpiCards';
import { ThreeCanvasContainer } from '../components/3d/ThreeCanvasContainer';
import { NodeGraphScene } from '../components/3d/scenes/NodeGraphScene';
import { Eye, EyeOff, Layers, Sparkles } from 'lucide-react';

export interface PaymentTruthViewProps {
  className?: string;
}

export const PaymentTruthView: React.FC<PaymentTruthViewProps> = ({ className = '' }) => {
  const { truthGraphData, reconciliationSummary } = usePayPilotStore();
  const [showGraph, setShowGraph] = useState(true);

  return (
    <div data-testid="payment-truth-view" className={`space-y-6 ${className}`}>
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Payment Truth & Money Map
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-paypal-blue/20 text-paypal-cyan border border-paypal-cyan/30">
              3-Way Multi-Source Ledger
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous graph-based reconciliation across PayPal REST API v2 transactions, bank clearing deposits, and accounting invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGraph(!showGraph)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-800 transition"
          >
            {showGraph ? <EyeOff className="w-3.5 h-3.5 text-paypal-cyan" /> : <Eye className="w-3.5 h-3.5 text-paypal-cyan" />}
            <span>{showGraph ? 'Hide 3D Graph' : 'Show 3D Graph'}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <ReconciliationKpiCards />

      {/* 3. 3D Interactive Force Graph Scene */}
      {showGraph && (
        <div className="p-4 rounded-2xl bg-obsidian-900 border border-slate-800 shadow-card-dark relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-paypal-cyan animate-pulse" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider">
                Multi-Source Relationship Graph
              </h3>
            </div>
            {/* Graph Node Legend */}
            <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-paypal-blue" /> PayPal Txn
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Bank Deposit
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" /> Invoice
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Discrepancy
              </span>
            </div>
          </div>

          <div className="h-[320px] w-full relative">
            <ThreeCanvasContainer
              controllerFactory={() => new NodeGraphScene()}
              data={truthGraphData}
              ariaLabel="Payment Truth 3D Force-Directed Node Graph"
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* 4. Payment Truth AG Grid Table (internally embeds DiscrepancyInspectorModal) */}
      <PaymentTruthTable />
    </div>
  );
};

export default PaymentTruthView;
