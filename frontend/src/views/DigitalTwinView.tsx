import React, { useMemo } from 'react';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { ThreeCanvasContainer } from '../components/3d/ThreeCanvasContainer';
import { DigitalTwinScene } from '../components/3d/scenes/DigitalTwinScene';
import {
  Sparkles,
  Clock,
  Wallet,
  Activity,
  Layers,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  Info,
  Calendar,
} from 'lucide-react';

export function DigitalTwinView() {
  const {
    digitalTwinMetrics,
    timeScrubberOffsetDays,
    setTimeScrubberOffset,
    executiveKpis,
  } = usePayPilotStore();

  const {
    liquidity,
    liabilities,
    workingCapital,
    quickRatio,
    currentRatio,
    dailyBurnRate,
    netDailyCashFlow,
    runwayDays,
    healthScore,
    dynamicPulseState,
    orbColorHex,
  } = digitalTwinMetrics;

  // Calendar date corresponding to scrub offset
  const scrubbedDate = useMemo(() => {
    const baseDate = new Date('2024-11-06');
    baseDate.setDate(baseDate.getDate() + timeScrubberOffsetDays);
    return baseDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [timeScrubberOffsetDays]);

  const PRESETS: Array<{ label: string; days: number }> = [
    { label: 'Today (Day 0)', days: 0 },
    { label: 'Day +30', days: 30 },
    { label: 'Day +60', days: 60 },
    { label: 'Day +90', days: 90 },
    { label: 'Day +180', days: 180 },
  ];

  return (
    <div className="space-y-6" data-testid="digital-twin-view">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Financial Digital Twin
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-950/40 text-purple-300 border border-purple-500/30">
              Autonomous Organism
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Time-aware autonomous model mapping multi-account cash velocity, burn decay, and liquidity strain.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-ping"
              style={{ backgroundColor: orbColorHex || '#10b981' }}
            />
            <span className="text-slate-400">Pulse State:</span>
            <span className="font-bold text-white">{dynamicPulseState}</span>
          </div>
        </div>
      </div>

      {/* 2. Central Visual: 3D Pulsating Celestial Orb + Orbital Particle Rings */}
      <div className="relative rounded-2xl bg-gradient-to-br from-obsidian-900 via-obsidian-850 to-obsidian-900 border border-slate-800 shadow-card-dark overflow-hidden p-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
              Autonomous Liquidity Core & Concentric Orbital Rings
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> PayPal
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Bank Checking
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> Reserve Savings
            </span>
          </div>
        </div>

        <div className="h-[360px] relative w-full overflow-hidden mt-2">
          <ThreeCanvasContainer
            controllerFactory={() => new DigitalTwinScene()}
            data={digitalTwinMetrics}
            ariaLabel="Financial Digital Twin 3D Pulsating Orb"
            className="w-full h-full"
          />
        </div>

        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Pulsation frequency: lerping with solvency speed</span>
          <span className="text-purple-300">Orbital velocity scales with capital distribution</span>
        </div>
      </div>

      {/* 3. Middle Section: Time Scrubbing Control Bar (Day 0 to +180) */}
      <div className="rounded-xl bg-obsidian-900 border border-slate-800 shadow-card-dark p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-paypal-cyan" />
            <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
              Time Scrubbing Controller (Day 0 to Day +180)
            </h3>
          </div>
          <div className="text-xs font-mono text-paypal-cyan font-bold" data-testid="scrubbed-date">
            Day +{timeScrubberOffsetDays} ({scrubbedDate})
          </div>
        </div>

        {/* Visual Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="180"
            step="1"
            value={timeScrubberOffsetDays}
            onChange={(e) => setTimeScrubberOffset(Number(e.target.value))}
            className="w-full accent-paypal-cyan bg-slate-800 h-2.5 rounded-lg cursor-pointer"
            data-testid="time-scrubber-slider"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Day 0 (Nov 6, 2024)</span>
            <span>Day +45</span>
            <span>Day +90 (Quarter Close)</span>
            <span>Day +135</span>
            <span>Day +180 (6 Months)</span>
          </div>
        </div>

        {/* Jump Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-slate-400 font-mono mr-2">Quick Jumps:</span>
          {PRESETS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => setTimeScrubberOffset(p.days)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition border ${
                timeScrubberOffsetDays === p.days
                  ? 'bg-paypal-blue text-white border-paypal-cyan font-bold shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              data-testid={`preset-day-${p.days}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Lower Section: Balance Sheet & Liquidity Matrix */}
      <div className="space-y-4">
        {/* 4 Executive Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="digital-twin-kpis">
          {/* Health Score */}
          <div className="p-4 rounded-xl bg-obsidian-900 border border-slate-800/90 shadow-card-dark">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Dynamic Health Score</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono text-white" data-testid="twin-health-score">
                {healthScore} / 100
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${healthScore}%`,
                    backgroundColor: orbColorHex || '#10b981',
                  }}
                />
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
              Status: {dynamicPulseState}
            </div>
          </div>

          {/* Working Capital */}
          <div className="p-4 rounded-xl bg-obsidian-900 border border-slate-800/90 shadow-card-dark">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Working Capital</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono text-emerald-400" data-testid="twin-working-capital">
                ${workingCapital.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Current Assets - Liabilities
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
              Positive Liquidity Cushion
            </div>
          </div>

          {/* Quick Ratio */}
          <div className="p-4 rounded-xl bg-obsidian-900 border border-slate-800/90 shadow-card-dark">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Quick Ratio</span>
              <Activity className="w-4 h-4 text-paypal-cyan" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono text-paypal-cyan" data-testid="twin-quick-ratio">
                {quickRatio.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                (Cash + Liquid AR) / AP
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
              Benchmark: &gt; 1.0 (Optimal: 1.82)
            </div>
          </div>

          {/* Daily Burn Rate & Runway */}
          <div className="p-4 rounded-xl bg-obsidian-900 border border-slate-800/90 shadow-card-dark">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Runway & Burn</span>
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono text-amber-400" data-testid="twin-runway">
                {runwayDays} Days
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Burn: ${dailyBurnRate.toLocaleString()} / day
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
              Net delta: +${netDailyCashFlow}/day
            </div>
          </div>
        </div>

        {/* 2-Column Deep Dive Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Cash Reservoirs Breakdown */}
          <div className="p-5 rounded-xl bg-obsidian-900 border border-slate-800 shadow-card-dark space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-xs font-semibold uppercase text-white font-mono tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Cash Reservoirs & Liquid Receivables
              </h4>
              <span className="text-xs font-mono font-bold text-white">
                Total: ${(liquidity.totalLiquidCash / 1000).toFixed(1)}k
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-obsidian-950/70 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">PayPal Available Balance</span>
                <span className="font-bold text-paypal-cyan">
                  ${liquidity.paypalAvailableBalance.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-obsidian-950/70 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">PayPal Pending / Escrow Hold</span>
                <span className="font-bold text-amber-400">
                  ${liquidity.paypalPendingHoldBalance.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-obsidian-950/70 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Chase Operating Checking</span>
                <span className="font-bold text-emerald-400">
                  ${liquidity.bankOperatingChecking.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-obsidian-950/70 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Emergency Reserve Savings</span>
                <span className="font-bold text-purple-400">
                  ${liquidity.emergencyReserveSavings.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-obsidian-950/70 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Liquid AR (Receivables Due 30d)</span>
                <span className="font-bold text-white">
                  ${liquidity.receivablesDueNext30Days.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: 30-Day Forward Obligations */}
          <div className="p-5 rounded-xl bg-obsidian-900 border border-slate-800 shadow-card-dark space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-xs font-semibold uppercase text-white font-mono tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                30-Day Forward Obligations & Burn
              </h4>
              <span className="text-xs font-mono font-bold text-amber-400">
                AP: ${(liabilities.accountsPayableNext30Days / 1000).toFixed(1)}k
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-obsidian-950/70 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Accounts Payable (Next 30 Days)</span>
                <span className="font-bold text-amber-400">
                  ${liabilities.accountsPayableNext30Days.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-obsidian-950/70 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Committed Supplier Obligations</span>
                <span className="font-bold text-slate-200">
                  ${liabilities.committedSupplierObligations.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-obsidian-950/70 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Scheduled Tax Provisions</span>
                <span className="font-bold text-rose-400">
                  ${liabilities.scheduledTaxProvisions.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-obsidian-950/70 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Recurring Software & SaaS Burn</span>
                <span className="font-bold text-slate-200">
                  ${liabilities.recurringSoftwareBurn.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-obsidian-950/70 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Total 30-Day Obligation Load</span>
                <span className="font-bold text-white">
                  ${(
                    liabilities.accountsPayableNext30Days +
                    liabilities.committedSupplierObligations +
                    liabilities.scheduledTaxProvisions +
                    liabilities.recurringSoftwareBurn
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DigitalTwinView;
