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
  RefreshCw,
  Layers,
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white flex items-center gap-2.5 font-display">
            Executive Command Center
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-medium">
              Live Operations
            </span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Real-time cash liquidity, autonomous revenue recovery pipeline &amp; global transaction transit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/40 dark:bg-stone-900/50 border border-stone-200/60 dark:border-white/10 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>PayPal Sandbox Active</span>
          </div>
          <button
            type="button"
            onClick={() => resetToDemoState()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/40 hover:bg-white/60 dark:bg-stone-900/50 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-200 text-xs font-medium border border-stone-200/60 dark:border-white/10 hover:border-amber-600/40 dark:hover:border-amber-500/40 transition"
            title="Reset workspace to clean demo fixtures"
            data-testid="judge-reset-btn"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Judge Reset</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Section: Soft Glass Container with Dynamic 3D Globe */}
      <div className="glass tone-glow relative rounded-2xl border border-stone-200/60 dark:border-white/10 shadow-xl overflow-hidden">
        {/* Subtle top sheen */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Left Hero Context */}
          <div className="p-6 lg:p-8 lg:col-span-5 space-y-4 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[11px] font-mono font-medium border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Live Global Tracking
              <span className="sr-only">Global Transaction Telemetry</span>
            </div>
            <h2 className="text-2xl font-bold text-stone-900 dark:text-white tracking-tight leading-snug font-display">
              Active Cash Flow Radar
              <span className="sr-only">Autonomous Capital Protection &amp; Leakage Interceptor</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Continuously scanning active transactions, settlements, and upcoming commitments.
              Elevated particle arcs model monetary transit in real-time across high-volume international payment corridors.
            </p>
            <div className="pt-2 grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-white/40 dark:bg-stone-900/60 border border-stone-200/50 dark:border-white/10">
                <div className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-semibold">Transit Volume</div>
                <div className="text-sm font-bold text-stone-900 dark:text-white mt-0.5">$46,770.00</div>
              </div>
              <div className="p-3 rounded-xl bg-white/40 dark:bg-stone-900/60 border border-stone-200/50 dark:border-white/10">
                <div className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-semibold">Active Corridors</div>
                <div className="text-sm font-bold text-copper-gradient mt-0.5">4 Global Routes</div>
              </div>
            </div>
          </div>

          {/* Right Hero Three.js 3D Globe - Seamlessly Integrated Soft Glass Vessel */}
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

      {/* 3. Executive KPI Matrix Grid (5 Cards) - Clean Flexbox Vertical Stack */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5 w-full" data-testid="executive-kpi-matrix">
        {/* KPI 1: Available Cash */}
        <div className="glass tone-glow relative overflow-hidden rounded-2xl border border-stone-200/60 dark:border-white/10 shadow-lg min-w-0">
          <div className="flex flex-col justify-between h-full p-5 gap-2">
            {/* Top Row: Label + Icon */}
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-medium min-w-0">
              <span className="truncate">Available Cash</span>
              <Wallet className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>

            {/* Middle: Giant Number & Exact Subtext */}
            <div className="min-w-0">
              <div className="text-2xl lg:text-3xl font-bold text-stone-900 dark:text-white font-mono tracking-tight truncate" data-testid="kpi-total-cash">
                ${(executiveKpis.totalAvailableCash / 1000).toFixed(1)}k
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono truncate mt-0.5">
                Exact: ${executiveKpis.totalAvailableCash.toLocaleString()}
              </div>
            </div>

            {/* Bottom: Sub-metrics */}
            <div className="pt-2 border-t border-stone-200/60 dark:border-white/10 flex items-center justify-between text-[11px] min-w-0">
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium truncate">+8.4% MoM</span>
              <span className="text-stone-500 dark:text-stone-400 truncate">PayPal + Bank</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Recoverable Leakage */}
        <div className="glass tone-glow relative overflow-hidden rounded-2xl border border-stone-200/60 dark:border-white/10 shadow-lg min-w-0">
          <div className="flex flex-col justify-between h-full p-5 gap-2">
            {/* Top Row: Label + Icon */}
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-medium min-w-0">
              <span className="truncate">Recoverable Leakage</span>
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            </div>

            {/* Middle: Giant Number & Exact Subtext */}
            <div className="min-w-0">
              <div className="text-2xl lg:text-3xl font-bold text-copper-gradient font-mono tracking-tight truncate" data-testid="kpi-recoverable">
                ${(executiveKpis.identifiedLostRevenue / 1000).toFixed(1)}k
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono truncate mt-0.5">
                Exact: ${executiveKpis.identifiedLostRevenue.toLocaleString()}
              </div>
            </div>

            {/* Bottom: Sub-metrics */}
            <div className="pt-2 border-t border-stone-200/60 dark:border-white/10 flex items-center justify-between text-[11px] min-w-0">
              <span className="text-amber-600 dark:text-amber-400 font-mono font-medium truncate">
                {executiveKpis.activeRecoveryCasesCount} cases ready
              </span>
              <button
                type="button"
                onClick={() => setActiveRoute('payback-hunter')}
                className="text-stone-600 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-300 flex items-center gap-0.5 font-medium transition shrink-0"
              >
                Claim <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* KPI 3: 30-Day Payables */}
        <div className="glass tone-glow relative overflow-hidden rounded-2xl border border-stone-200/60 dark:border-white/10 shadow-lg min-w-0">
          <div className="flex flex-col justify-between h-full p-5 gap-2">
            {/* Top Row: Label + Icon */}
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-medium min-w-0">
              <span className="truncate">30d Payables</span>
              <CalendarClock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            </div>

            {/* Middle: Giant Number & Exact Subtext */}
            <div className="min-w-0">
              <div className="text-2xl lg:text-3xl font-bold text-amber-600 dark:text-amber-400 font-mono tracking-tight truncate" data-testid="kpi-payables">
                ${(executiveKpis.upcoming30DayCommitments / 1000).toFixed(1)}k
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono truncate mt-0.5">
                Exact: ${executiveKpis.upcoming30DayCommitments.toLocaleString()}
              </div>
            </div>

            {/* Bottom: Sub-metrics */}
            <div className="pt-2 border-t border-stone-200/60 dark:border-white/10 flex items-center justify-between text-[11px] min-w-0">
              <span className="text-amber-600/90 dark:text-amber-400/90 font-mono truncate">Buffer $15k Protected</span>
              <button
                type="button"
                onClick={() => setActiveRoute('commitments')}
                className="text-stone-600 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-300 flex items-center gap-0.5 font-medium transition shrink-0"
              >
                Workbench <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* KPI 4: Financial Runway */}
        <div className="glass tone-glow relative overflow-hidden rounded-2xl border border-stone-200/60 dark:border-white/10 shadow-lg min-w-0">
          <div className="flex flex-col justify-between h-full p-5 gap-2">
            {/* Top Row: Label + Icon */}
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-medium min-w-0">
              <span className="truncate">Runway</span>
              <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>

            {/* Middle: Giant Number & Exact Subtext */}
            <div className="min-w-0">
              <div className="text-2xl lg:text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight truncate" data-testid="kpi-runway">
                {executiveKpis.financialRunwayDays}d
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono truncate mt-0.5">
                Net burn: $1,515 / day
              </div>
            </div>

            {/* Bottom: Sub-metrics */}
            <div className="pt-2 border-t border-stone-200/60 dark:border-white/10 flex items-center justify-between text-[11px] min-w-0">
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium shrink-0">Target: &gt;60d</span>
              <span className="text-stone-500 dark:text-stone-400 truncate text-right">Optimal</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Health Score */}
        <div className="glass tone-glow relative overflow-hidden rounded-2xl border border-stone-200/60 dark:border-white/10 shadow-lg min-w-0">
          <div className="flex flex-col justify-between h-full p-5 gap-2">
            {/* Top Row: Label + Icon */}
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-medium min-w-0">
              <span className="truncate">Health Score</span>
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            </div>

            {/* Middle: Giant Number & Progress Bar */}
            <div className="min-w-0">
              <div className="text-2xl lg:text-3xl font-bold text-stone-900 dark:text-white font-mono tracking-tight truncate" data-testid="kpi-health-score">
                {executiveKpis.financialHealthScore}/100
              </div>
              <div className="w-full bg-stone-200/80 dark:bg-stone-800/80 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${executiveKpis.financialHealthScore}%` }}
                />
              </div>
            </div>

            {/* Bottom: Sub-metrics */}
            <div className="pt-2 border-t border-stone-200/60 dark:border-white/10 flex items-center justify-between text-[11px] min-w-0">
              <span className="text-amber-600 dark:text-amber-400 font-mono font-medium truncate">Solvency: High</span>
              <span className="text-stone-500 dark:text-stone-400 truncate text-right">Resilient</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Anomaly Feed Stream & Quick Action Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Anomaly Feed (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl glass border border-stone-200/60 dark:border-white/10 shadow-lg p-5 md:p-6 min-w-0">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200/50 dark:border-white/10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white font-mono uppercase tracking-wider">
                Real-Time Anomaly &amp; Action Stream
              </h3>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-mono font-medium">
              {anomalyFeed.length} active events
            </span>
          </div>

          <div className="mt-4 space-y-3" data-testid="anomaly-feed-stream">
            {anomalyFeed.map((item) => {
              const severityClasses = {
                CRITICAL: 'border-l-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/20',
                WARNING: 'border-l-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20',
                INFO: 'border-l-amber-400 bg-amber-400/10 text-amber-800 dark:text-amber-300 border-amber-400/20',
                SUCCESS: 'border-l-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20',
              }[item.severity] || 'border-l-stone-400 bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800';

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border border-l-4 transition ${severityClasses}`}
                  data-testid={`anomaly-${item.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-stone-900 dark:text-white tracking-tight">
                        {item.title}
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono shrink-0 text-stone-500 dark:text-stone-400">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {item.actionRoute && item.actionLabel && (
                    <div className="mt-2.5 pt-2 border-t border-stone-200/50 dark:border-white/10 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleAnomalyAction(item.actionRoute, item.entityId)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:underline transition"
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
        <div className="lg:col-span-5 rounded-2xl glass border border-stone-200/60 dark:border-white/10 shadow-lg p-5 md:p-6 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-stone-200/50 dark:border-white/10">
              <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white font-mono uppercase tracking-wider">
                Quick Action Direct Portals
              </h3>
            </div>
            <div className="mt-4 space-y-3">
              {/* Hunter */}
              <div
                onClick={() => setActiveRoute('payback-hunter')}
                className="p-3.5 rounded-xl bg-white/40 dark:bg-stone-900/60 border border-stone-200/50 dark:border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer transition group"
                data-testid="quick-action-hunter"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="text-xs font-semibold text-stone-900 dark:text-white">PayBack Hunter</div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">12 duplicate fee cases identified ($18.4k)</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition" />
                </div>
              </div>

              {/* Truth */}
              <div
                onClick={() => setActiveRoute('payment-truth')}
                className="p-3.5 rounded-xl bg-white/40 dark:bg-stone-900/60 border border-stone-200/50 dark:border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer transition group"
                data-testid="quick-action-truth"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="text-xs font-semibold text-stone-900 dark:text-white">Payment Truth Engine</div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">3-way reconciliation across PayPal &amp; Bank feeds</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition" />
                </div>
              </div>

              {/* Commitments */}
              <div
                onClick={() => setActiveRoute('commitments')}
                className="p-3.5 rounded-xl bg-white/40 dark:bg-stone-900/60 border border-stone-200/50 dark:border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer transition group"
                data-testid="quick-action-commitments"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CalendarClock className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="text-xs font-semibold text-stone-900 dark:text-white">Commitment Firewall</div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">Gantt timeline &amp; order evaluation simulator</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition" />
                </div>
              </div>

              {/* Simulation Lab */}
              <div
                onClick={() => setActiveRoute('simulation-lab')}
                className="p-3.5 rounded-xl bg-white/40 dark:bg-stone-900/60 border border-stone-200/50 dark:border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer transition group"
                data-testid="quick-action-simulation"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition" />
                    <div>
                      <div className="text-xs font-semibold text-stone-900 dark:text-white">Simulation Lab</div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">3D Cash landscape &amp; scenario comparison</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-500 transition" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200/50 dark:border-white/10 text-[11px] text-stone-500 dark:text-stone-400 font-mono flex items-center justify-between">
            <span>Hackathon Demo Flow: Act 1 through 5</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">F01-F35 Aligned</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandCenterView;
