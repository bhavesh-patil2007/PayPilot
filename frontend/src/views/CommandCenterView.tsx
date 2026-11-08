import React from 'react';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { ThreeCanvasContainer } from '../components/3d/ThreeCanvasContainer';
import { GlobeScene } from '../components/3d/scenes/GlobeScene';
import { MonetaryTransitArc, AppRoute } from '../types';
import {
  Wallet,
  ShieldAlert,
  CalendarClock,
  Activity,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink,
  RefreshCw,
  Layers,
  TrendingDown,
} from 'lucide-react';

export function CommandCenterView() {
  const {
    executiveKpis,
    transitArcs,
    anomalyFeed,
    setActiveRoute,
    setSelectedRecoveryCaseId,
    setSelectedDiscrepancyId,
    openExplainability,
    resetToDemoState,
  } = usePayPilotStore();

  const handleAnomalyAction = (actionRoute?: AppRoute, entityId?: string) => {
    if (!actionRoute) return;
    setActiveRoute(actionRoute);
    if (entityId) {
      if (actionRoute === 'payback-hunter') {
        setSelectedRecoveryCaseId(entityId);
        openExplainability('RULE-FEE-DUP-01', entityId);
      } else if (actionRoute === 'payment-truth') {
        setSelectedDiscrepancyId(entityId);
      }
    }
  };

  return (
    <div className="space-y-6" data-testid="command-center-view">
      {/* 1. Header with live status & controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Executive Command Center
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-paypal-blue/20 text-paypal-cyan border border-paypal-cyan/30">
              Live Operations
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time cash liquidity, autonomous revenue recovery pipeline & global transaction transit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>PayPal Sandbox Active</span>
          </div>
          <button
            type="button"
            onClick={() => resetToDemoState()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            title="Reset workspace to clean demo fixtures"
            data-testid="judge-reset-btn"
          >
            <RefreshCw className="w-3.5 h-3.5 text-paypal-cyan" />
            <span>Judge Reset</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Section: 3D Globe + Global Money Flow Matrix */}
      <div className="relative rounded-2xl bg-gradient-to-br from-obsidian-900 via-obsidian-850 to-obsidian-900 border border-slate-800/90 shadow-card-dark overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Left Hero Context */}
          <div className="p-6 lg:p-8 lg:col-span-5 space-y-4 z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-paypal-blue/20 text-paypal-cyan text-[11px] font-mono font-medium border border-paypal-cyan/30">
              <span className="w-1.5 h-1.5 rounded-full bg-paypal-cyan animate-ping" />
              Global Transaction Telemetry
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
              Autonomous Capital Protection & Leakage Interceptor
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              PayPilot continuously scans PayPal REST captures, bank settlement deposits, and supplier commitments.
              Elevated particle arcs model monetary transit in real-time across high-volume international payment corridors.
            </p>
            <div className="pt-2 grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-obsidian-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase">Transit Volume</div>
                <div className="text-sm font-bold text-white mt-0.5">$46,770.00</div>
              </div>
              <div className="p-2.5 rounded-lg bg-obsidian-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase">Active Corridors</div>
                <div className="text-sm font-bold text-paypal-cyan mt-0.5">4 Global Routes</div>
              </div>
            </div>
          </div>

          {/* Right Hero Three.js 3D Globe */}
          <div className="lg:col-span-7 h-[360px] relative w-full overflow-hidden">
            <ThreeCanvasContainer<MonetaryTransitArc[]>
              controllerFactory={() => new GlobeScene()}
              data={transitArcs}
              ariaLabel="Global Financial Transit 3D Globe"
              className="w-full h-full min-h-[340px]"
            />
          </div>
        </div>
      </div>

      {/* 3. Executive KPI Matrix Grid (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" data-testid="executive-kpi-matrix">
        {/* KPI 1: Total Cash */}
        <div className="p-4 rounded-xl bg-obsidian-900 border border-slate-800/90 shadow-card-dark flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Available Cash</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white font-mono" data-testid="kpi-total-cash">
              ${(executiveKpis.totalAvailableCash / 1000).toFixed(1)}k
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              Exact: ${executiveKpis.totalAvailableCash.toLocaleString()}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-mono">+8.4% MoM</span>
            <span className="text-slate-400">PayPal + Bank</span>
          </div>
        </div>

        {/* KPI 2: Identified Lost Revenue */}
        <div className="p-4 rounded-xl bg-obsidian-900 border border-slate-800/90 shadow-card-dark flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Recoverable Leakage</span>
            <ShieldAlert className="w-4 h-4 text-paypal-cyan" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-paypal-cyan font-mono" data-testid="kpi-recoverable">
              ${(executiveKpis.identifiedLostRevenue / 1000).toFixed(1)}k
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              Exact: ${executiveKpis.identifiedLostRevenue.toLocaleString()}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-paypal-cyan font-mono">{executiveKpis.activeRecoveryCasesCount} cases ready</span>
            <button
              type="button"
              onClick={() => setActiveRoute('payback-hunter')}
              className="text-slate-400 hover:text-white flex items-center gap-0.5 font-medium transition"
            >
              Claim <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 3: 30-Day Payables */}
        <div className="p-4 rounded-xl bg-obsidian-900 border border-slate-800/90 shadow-card-dark flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>30d Payables</span>
            <CalendarClock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-400 font-mono" data-testid="kpi-payables">
              ${(executiveKpis.upcoming30DayCommitments / 1000).toFixed(1)}k
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              Exact: ${executiveKpis.upcoming30DayCommitments.toLocaleString()}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-amber-400/80 font-mono">Buffer $15k Protected</span>
            <button
              type="button"
              onClick={() => setActiveRoute('commitments')}
              className="text-slate-400 hover:text-white flex items-center gap-0.5 font-medium transition"
            >
              Workbench <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 4: Financial Runway */}
        <div className="p-4 rounded-xl bg-obsidian-900 border border-slate-800/90 shadow-card-dark flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Runway</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-400 font-mono" data-testid="kpi-runway">
              {executiveKpis.financialRunwayDays}d
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              Net burn: $1,515 / day
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-mono">Target: &gt;60d</span>
            <span className="text-slate-400">Optimal</span>
          </div>
        </div>

        {/* KPI 5: Health Score */}
        <div className="p-4 rounded-xl bg-obsidian-900 border border-slate-800/90 shadow-card-dark flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Health Score</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white font-mono" data-testid="kpi-health-score">
              {executiveKpis.financialHealthScore}/100
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-paypal-cyan to-emerald-400 h-full rounded-full"
                style={{ width: `${executiveKpis.financialHealthScore}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-purple-400 font-mono">Solvency: High</span>
            <span className="text-slate-400">Resilient</span>
          </div>
        </div>
      </div>

      {/* 4. Anomaly Feed Stream & Quick Action Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Anomaly Feed (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-obsidian-900 border border-slate-800 shadow-card-dark p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                Real-Time Anomaly & Action Stream
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {anomalyFeed.length} active events
            </span>
          </div>

          <div className="mt-4 space-y-3" data-testid="anomaly-feed-stream">
            {anomalyFeed.map((item) => {
              const severityClasses = {
                CRITICAL: 'border-rose-500 bg-rose-950/20 text-rose-300',
                WARNING: 'border-amber-500 bg-amber-950/20 text-amber-300',
                INFO: 'border-cyan-500 bg-cyan-950/20 text-cyan-300',
                SUCCESS: 'border-emerald-500 bg-emerald-950/20 text-emerald-300',
              }[item.severity] || 'border-slate-700 bg-slate-900 text-slate-300';

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-lg border-l-4 border bg-obsidian-950/60 transition ${severityClasses}`}
                  data-testid={`anomaly-${item.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-white tracking-tight">
                        {item.title}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono shrink-0 text-slate-500">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {item.actionRoute && item.actionLabel && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleAnomalyAction(item.actionRoute, item.entityId)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-paypal-cyan hover:text-white transition"
                        data-testid={`anomaly-action-${item.id}`}
                      >
                        {item.actionLabel}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Action Navigation Hub (5 cols) */}
        <div className="lg:col-span-5 rounded-xl bg-obsidian-900 border border-slate-800 shadow-card-dark p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Layers className="w-4 h-4 text-paypal-cyan" />
              <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                Quick Action Direct Portals
              </h3>
            </div>
            <div className="mt-4 space-y-3">
              {/* Hunter */}
              <div
                onClick={() => setActiveRoute('payback-hunter')}
                className="p-3.5 rounded-lg bg-obsidian-950/70 border border-slate-800 hover:border-paypal-cyan/50 hover:bg-slate-800/30 cursor-pointer transition group"
                data-testid="quick-action-hunter"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-paypal-cyan group-hover:scale-110 transition" />
                    <div>
                      <div className="text-xs font-semibold text-white">PayBack Hunter</div>
                      <div className="text-[11px] text-slate-400">12 duplicate fee cases identified ($18.4k)</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-paypal-cyan transition" />
                </div>
              </div>

              {/* Truth */}
              <div
                onClick={() => setActiveRoute('payment-truth')}
                className="p-3.5 rounded-lg bg-obsidian-950/70 border border-slate-800 hover:border-paypal-cyan/50 hover:bg-slate-800/30 cursor-pointer transition group"
                data-testid="quick-action-truth"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="text-xs font-semibold text-white">Payment Truth Engine</div>
                      <div className="text-[11px] text-slate-400">3-way reconciliation across PayPal & Bank feeds</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
                </div>
              </div>

              {/* Commitments */}
              <div
                onClick={() => setActiveRoute('commitments')}
                className="p-3.5 rounded-lg bg-obsidian-950/70 border border-slate-800 hover:border-paypal-cyan/50 hover:bg-slate-800/30 cursor-pointer transition group"
                data-testid="quick-action-commitments"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CalendarClock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="text-xs font-semibold text-white">Commitment Firewall</div>
                      <div className="text-[11px] text-slate-400">Gantt timeline & order evaluation simulator</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                </div>
              </div>

              {/* Simulation Lab */}
              <div
                onClick={() => setActiveRoute('simulation-lab')}
                className="p-3.5 rounded-lg bg-obsidian-950/70 border border-slate-800 hover:border-paypal-cyan/50 hover:bg-slate-800/30 cursor-pointer transition group"
                data-testid="quick-action-simulation"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="text-xs font-semibold text-white">Simulation Lab</div>
                      <div className="text-[11px] text-slate-400">3D Cash landscape & scenario comparison</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Hackathon Demo Flow: Act 1 through 5</span>
            <span className="text-paypal-cyan">F01-F35 Aligned</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandCenterView;
