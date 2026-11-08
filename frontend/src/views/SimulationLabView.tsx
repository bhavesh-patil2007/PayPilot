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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Cash-Flow Simulation Lab & Time Machine
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-paypal-cyan/20 text-paypal-cyan border border-paypal-cyan/30">
              Scenario Modeling
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic 3D terrain landscape, real-time liquidity recalculation & multi-track scenario forecasting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium border border-slate-700 transition"
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
        <div className="lg:col-span-8 rounded-xl bg-obsidian-900 border border-slate-800 shadow-card-dark p-4 overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-paypal-cyan" />
              <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
                3D Topographical Cash-Flow Landscape
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

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Intersects $15,000 Safety Threshold Plane</span>
            <span className="text-paypal-cyan">Interactive Orbit & Pointer Scan</span>
          </div>
        </div>

        {/* Right: Telemetry HUD Card */}
        <div className="lg:col-span-4 rounded-xl bg-obsidian-900 border border-slate-800 shadow-card-dark p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
                Simulation Telemetry HUD
              </h3>
            </div>

            <div className="mt-4 space-y-4">
              {/* Lowest Dip Metric */}
              <div className="p-3.5 rounded-lg bg-obsidian-950/70 border border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-400 uppercase font-mono">
                  Projected Lowest Cash Dip
                </div>
                <div
                  className="text-2xl font-bold font-mono text-amber-400"
                  data-testid="hud-lowest-dip"
                >
                  ${minimumCashPoint.amount.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Occurs on Day {minimumCashPoint.dayIndex} ({minimumCashPoint.date})
                </div>
              </div>

              {/* Runway Days */}
              <div className="p-3.5 rounded-lg bg-obsidian-950/70 border border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-400 uppercase font-mono">
                  Projected Cash Runway
                </div>
                <div
                  className="text-2xl font-bold font-mono text-emerald-400"
                  data-testid="hud-runway-days"
                >
                  {projectedRunwayDays} Days
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Burn rate: $1,515 / day net
                </div>
              </div>

              {/* Safety Buffer Cushion */}
              <div className="p-3.5 rounded-lg bg-obsidian-950/70 border border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-400 uppercase font-mono">
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
                <div className="text-[11px] text-slate-500 font-mono">
                  Mandatory Floor: ${safetyBufferThreshold.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-paypal-blue/10 border border-paypal-cyan/20 text-[11px] text-paypal-cyan font-mono text-center">
            Active Scenario: <span className="font-bold text-white">{selectedScenario}</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Zone: Interactive Cash Curve with Sliders */}
      <InteractiveCashCurve height={320} showSliders={true} />

      {/* 4. Bottom Zone: Scenario Comparison Engine */}
      <div className="rounded-xl bg-obsidian-900 border border-slate-800 shadow-card-dark p-5 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              Scenario Comparison Engine (Baseline vs. Optimistic vs. Conservative)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            3-Track Sensitivity Analysis
          </span>
        </div>

        {/* 3-Column Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="scenario-cards-grid">
          {/* Card 1: Baseline */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between transition ${
              selectedScenario === 'BASELINE'
                ? 'bg-slate-900/90 border-paypal-cyan shadow-glow-paypal'
                : 'bg-obsidian-950/60 border-slate-800 hover:border-slate-700'
            }`}
            data-testid="scenario-card-baseline"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-white uppercase">Baseline Track</span>
                <span className="text-slate-400">Standard</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                20% Upfront, 15-day collection delay, 30/40/30 milestones.
              </p>

              <div className="mt-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ending Cash:</span>
                  <span className="font-bold text-white">
                    ${comparison.baselineEndingCash.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lowest Dip:</span>
                  <span className="font-bold text-amber-400">
                    ${comparison.baselineLowestDip.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Runway:</span>
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
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
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
                ? 'bg-slate-900/90 border-emerald-500 shadow-sm'
                : 'bg-obsidian-950/60 border-slate-800 hover:border-slate-700'
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
              <p className="text-[11px] text-slate-400 mt-1">
                50% Upfront, 5-day rapid settlement, 50/25/25 milestones.
              </p>

              <div className="mt-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ending Cash:</span>
                  <span className="font-bold text-emerald-400">
                    ${comparison.optimisticEndingCash.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lowest Dip:</span>
                  <span className="font-bold text-emerald-300">
                    ${comparison.optimisticLowestDip.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Runway:</span>
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
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
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
                ? 'bg-slate-900/90 border-amber-500 shadow-sm'
                : 'bg-obsidian-950/60 border-slate-800 hover:border-slate-700'
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
              <p className="text-[11px] text-slate-400 mt-1">
                10% Upfront, 35-day collection delay, 10/40/50 milestones.
              </p>

              <div className="mt-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ending Cash:</span>
                  <span className="font-bold text-amber-400">
                    ${comparison.conservativeEndingCash.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lowest Dip:</span>
                  <span className="font-bold text-rose-400">
                    ${comparison.conservativeLowestDip.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Runway:</span>
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
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              data-testid="btn-apply-conservative"
            >
              {selectedScenario === 'CONSERVATIVE' ? 'Active Track' : 'Apply Conservative'}
            </button>
          </div>
        </div>

        {/* Delta Summary Strip */}
        <div className="p-3.5 rounded-lg bg-obsidian-950/70 border border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs font-mono gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-paypal-cyan" />
            <span className="text-slate-300">
              Sensitivity Spread: Optimistic vs. Conservative variance is{' '}
              <strong className="text-paypal-cyan">
                +${(comparison.optimisticEndingCash - comparison.conservativeEndingCash).toLocaleString()}
              </strong>{' '}
              ending liquidity.
            </span>
          </div>
          <span className="text-slate-500">Continuous Recalculation Engine</span>
        </div>
      </div>
    </div>
  );
}

export default SimulationLabView;
