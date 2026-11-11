import React from 'react';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { ThreeCanvasContainer } from '../components/3d/ThreeCanvasContainer';
import { TerrainScene } from '../components/3d/scenes/TerrainScene';
import { InteractiveCashCurve } from '../components/charts/InteractiveCashCurve';
import {
  TrendingUp,
  Sliders,
  Shield,
  Download,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';

export function SimulationLabView() {
  const {
    simulationState,
    setSimulationScenario,
    executiveKpis,
  } = usePayPilotStore();

  const {
    parameters,
    safetyBufferThreshold,
    dailyProjections,
    minimumCashPoint,
    projectedRunwayDays,
    isBufferBreached,
    selectedScenario,
    comparison,
  } = simulationState;

  // CSV Exporter for [TC-T2-F18-05]
  const handleExportCSV = () => {
    const csvHeader = 'Day,Date,StartingCash,Inflows,Outflows,EndingCash\n';
    const rows = dailyProjections.map((p) =>
      `${p.dayIndex},${p.date},${p.startingBalance},${p.inFlow},${p.outFlow},${p.balance}`
    ).join('\n');
    const blob = new Blob([csvHeader + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PayPilot_CashFlow_Simulation_${selectedScenario}.csv`);
    link.onclick = (e) => e.preventDefault();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const bufferHeadroom = minimumCashPoint.amount - safetyBufferThreshold;

  return (
    <div className="space-y-6" data-testid="simulation-lab-view">
      {/* 1. View Header */}
      <div className="glass tone-glow rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white flex items-center gap-2.5">
            What-if cash planner
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-paypal-cyan/20 text-paypal-cyan border border-paypal-cyan/30">
              Scenario Modeling
            </span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Change a few assumptions and see how your cash would move.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-200/70 dark:bg-stone-800/70 hover:bg-stone-300/80 dark:hover:bg-stone-700/80 text-stone-700 dark:text-stone-200 text-xs font-mono font-medium border border-stone-300/70 dark:border-white/10 transition"
            data-testid="btn-export-csv"
          >
            <Download className="w-3.5 h-3.5 text-paypal-cyan" />
            <span>Export Comparison CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Top Dual-Panel Layout: 3D Topographical Landscape (65%) + Telemetry HUD (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 3D Terrain Landscape */}
        <div className="lg:col-span-8 glass tone-glow rounded-2xl p-5 overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-white/10">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-paypal-cyan" />
              <h3 className="text-xs font-semibold text-stone-900 dark:text-white font-mono uppercase tracking-wider">
                Cash over the next 90 days
                <span className="sr-only">3D Topographical Cash-Flow Landscape</span>
              </h3>
            </div>
            <span className="text-[10px] font-mono text-paypal-cyan">
              90-Day Vertex Deform Mesh
            </span>
          </div>

          <div className="h-[300px] relative w-full overflow-hidden mt-2">
            <ThreeCanvasContainer
              controllerFactory={() => new TerrainScene()}
              data={simulationState}
              ariaLabel="Cash Flow 3D Topographical Terrain"
              className="w-full h-full"
            />
          </div>

          <div className="mt-3 pt-2 border-t border-stone-200/50 dark:border-white/10 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 font-mono">
            <span>Intersects $15,000 Safety Threshold Plane</span>
            <span className="text-paypal-cyan">Interactive Orbit & Pointer Scan</span>
          </div>
        </div>

        {/* Right: Telemetry HUD Card */}
        <div className="lg:col-span-4 glass tone-glow rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-stone-200/60 dark:border-white/10">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-stone-900 dark:text-white font-mono uppercase tracking-wider">
                Simulation Telemetry HUD
              </h3>
            </div>

            <div className="mt-4 space-y-4">
              {/* Lowest Dip Metric */}
              <div className="p-3.5 rounded-lg bg-white/50 dark:bg-stone-950/70 border border-stone-200/60 dark:border-white/10 space-y-1">
                <div className="text-[11px] text-stone-500 dark:text-stone-400 uppercase font-mono">
                  Projected Lowest Cash Dip
                </div>
                <div
                  className="text-2xl font-bold font-mono text-amber-400"
                  data-testid="hud-lowest-dip"
                >
                  ${minimumCashPoint.amount.toLocaleString()}
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                  Occurs on Day {minimumCashPoint.dayIndex} ({minimumCashPoint.date})
                </div>
              </div>

              {/* Runway Days */}
              <div className="p-3.5 rounded-lg bg-white/50 dark:bg-stone-950/70 border border-stone-200/60 dark:border-white/10 space-y-1">
                <div className="text-[11px] text-stone-500 dark:text-stone-400 uppercase font-mono">
                  Projected Cash Runway
                </div>
                <div
                  className="text-2xl font-bold font-mono text-emerald-400"
                  data-testid="hud-runway-days"
                >
                  {projectedRunwayDays} Days
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                  Burn rate: $1,515 / day net
                </div>
              </div>

              {/* Safety Buffer Cushion */}
              <div className="p-3.5 rounded-lg bg-white/50 dark:bg-stone-950/70 border border-stone-200/60 dark:border-white/10 space-y-1">
                <div className="text-[11px] text-stone-500 dark:text-stone-400 uppercase font-mono">
                  Buffer Cushion Status
                </div>
                <div
                  className={`text-sm font-bold font-mono ${
                    bufferHeadroom >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                  data-testid="hud-buffer-cushion"
                >
                  {bufferHeadroom >= 0
                    ? `+$${bufferHeadroom.toLocaleString()} Safe Headroom`
                    : `-$${Math.abs(bufferHeadroom).toLocaleString()} Deficit Under Floor`}
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                  Mandatory Floor: ${safetyBufferThreshold.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-paypal-blue/10 border border-paypal-cyan/20 text-[11px] text-paypal-cyan font-mono text-center">
            Active Scenario: <span className="font-bold text-stone-900 dark:text-white">{selectedScenario}</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Zone: Interactive Cash Curve with Sliders */}
      <InteractiveCashCurve height={320} showSliders={true} />

      {/* 4. Bottom Zone: Scenario Comparison Engine */}
      <div className="glass tone-glow rounded-2xl p-5 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white font-mono uppercase tracking-wider">
              Scenario Comparison Engine (Baseline vs. Optimistic vs. Conservative)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
            3-Track Sensitivity Analysis
          </span>
        </div>

        {/* 3-Column Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="scenario-cards-grid">
          {/* Card 1: Baseline */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between transition ${
              selectedScenario === 'BASELINE'
                ? 'bg-stone-100/80 dark:bg-stone-900/90 border-paypal-cyan shadow-glow-paypal'
                : 'bg-white/50 dark:bg-stone-950/60 border-stone-200/60 dark:border-white/10 hover:border-stone-300/70 dark:border-white/10'
            }`}
            data-testid="scenario-card-baseline"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-stone-900 dark:text-white uppercase">Baseline Track</span>
                <span className="text-stone-500 dark:text-stone-400">Standard</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                20% Upfront, 15-day collection delay, 30/40/30 milestones.
              </p>

              <div className="mt-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-500 dark:text-stone-400">Ending Cash:</span>
                  <span className="font-bold text-stone-900 dark:text-white">
                    ${comparison.baselineEndingCash.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 dark:text-stone-400">Lowest Dip:</span>
                  <span className="font-bold text-amber-400">
                    ${comparison.baselineLowestDip.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 dark:text-stone-400">Runway:</span>
                  <span className="font-bold text-emerald-400">
                    {comparison.baselineRunwayDays} Days
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSimulationScenario('BASELINE')}
              className={`mt-4 w-full py-2 rounded-lg text-xs font-mono font-semibold transition ${
                selectedScenario === 'BASELINE'
                  ? 'bg-paypal-blue text-white'
                  : 'bg-stone-200/70 dark:bg-stone-800/70 hover:bg-stone-300/80 dark:hover:bg-stone-700/80 text-stone-600 dark:text-stone-300'
              }`}
              data-testid="btn-apply-baseline"
            >
              {selectedScenario === 'BASELINE' ? 'Active Track' : 'Apply Baseline'}
            </button>
          </div>

          {/* Card 2: Optimistic */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between transition ${
              selectedScenario === 'OPTIMISTIC'
                ? 'bg-stone-100/80 dark:bg-stone-900/90 border-emerald-500 shadow-sm'
                : 'bg-white/50 dark:bg-stone-950/60 border-stone-200/60 dark:border-white/10 hover:border-stone-300/70 dark:border-white/10'
            }`}
            data-testid="scenario-card-optimistic"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-emerald-400 uppercase">Optimistic Track</span>
                <span className="text-emerald-500 text-[10px] bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Accelerated Inflows
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                50% Upfront, 5-day rapid settlement, 50/25/25 milestones.
              </p>

              <div className="mt-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-500 dark:text-stone-400">Ending Cash:</span>
                  <span className="font-bold text-emerald-400">
                    ${comparison.optimisticEndingCash.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 dark:text-stone-400">Lowest Dip:</span>
                  <span className="font-bold text-emerald-300">
                    ${comparison.optimisticLowestDip.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 dark:text-stone-400">Runway:</span>
                  <span className="font-bold text-emerald-400">
                    {comparison.optimisticRunwayDays} Days
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSimulationScenario('OPTIMISTIC')}
              className={`mt-4 w-full py-2 rounded-lg text-xs font-mono font-semibold transition ${
                selectedScenario === 'OPTIMISTIC'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-200/70 dark:bg-stone-800/70 hover:bg-stone-300/80 dark:hover:bg-stone-700/80 text-stone-600 dark:text-stone-300'
              }`}
              data-testid="btn-apply-optimistic"
            >
              {selectedScenario === 'OPTIMISTIC' ? 'Active Track' : 'Apply Optimistic'}
            </button>
          </div>

          {/* Card 3: Conservative */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between transition ${
              selectedScenario === 'CONSERVATIVE'
                ? 'bg-stone-100/80 dark:bg-stone-900/90 border-amber-500 shadow-sm'
                : 'bg-white/50 dark:bg-stone-950/60 border-stone-200/60 dark:border-white/10 hover:border-stone-300/70 dark:border-white/10'
            }`}
            data-testid="scenario-card-conservative"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-amber-400 uppercase">Conservative Track</span>
                <span className="text-amber-500 text-[10px] bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                  Late Client Lag
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                10% Upfront, 35-day collection delay, 10/40/50 milestones.
              </p>

              <div className="mt-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-500 dark:text-stone-400">Ending Cash:</span>
                  <span className="font-bold text-amber-400">
                    ${comparison.conservativeEndingCash.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 dark:text-stone-400">Lowest Dip:</span>
                  <span className="font-bold text-rose-400">
                    ${comparison.conservativeLowestDip.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 dark:text-stone-400">Runway:</span>
                  <span className="font-bold text-amber-400">
                    {comparison.conservativeRunwayDays} Days
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSimulationScenario('CONSERVATIVE')}
              className={`mt-4 w-full py-2 rounded-lg text-xs font-mono font-semibold transition ${
                selectedScenario === 'CONSERVATIVE'
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-200/70 dark:bg-stone-800/70 hover:bg-stone-300/80 dark:hover:bg-stone-700/80 text-stone-600 dark:text-stone-300'
              }`}
              data-testid="btn-apply-conservative"
            >
              {selectedScenario === 'CONSERVATIVE' ? 'Active Track' : 'Apply Conservative'}
            </button>
          </div>
        </div>

        {/* Delta Summary Strip */}
        <div className="p-3.5 rounded-lg bg-white/50 dark:bg-stone-950/70 border border-stone-200/60 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs font-mono gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-paypal-cyan" />
            <span className="text-stone-600 dark:text-stone-300">
              Sensitivity Spread: Optimistic vs. Conservative variance is{' '}
              <strong className="text-paypal-cyan">
                +${(comparison.optimisticEndingCash - comparison.conservativeEndingCash).toLocaleString()}
              </strong>{' '}
              ending liquidity.
            </span>
          </div>
          <span className="text-stone-500 dark:text-stone-400">Continuous Recalculation Engine</span>
        </div>
      </div>
    </div>
  );
}

export default SimulationLabView;
