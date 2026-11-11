import React, { useState, useMemo } from 'react';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { SurvivalRadarChart } from '../components/charts/SurvivalRadarChart';
import { RadarDimensionScore, StressTestScenario } from '../types';
import {
  Radar,
  ShieldAlert,
  AlertTriangle,
  Flame,
  RotateCcw,
  CheckSquare,
  Square,
  ArrowRight,
  TrendingDown,
  Shield,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export function SurvivalRadarView() {
  const {
    survivalRadarState,
    triggerStressTest,
    clearStressTest,
    digitalTwinMetrics,
  } = usePayPilotStore();

  const {
    overallSurvivalIndex,
    dimensions,
    stressScenarios,
    activeStressTestId,
  } = survivalRadarState;

  // Selected or active dimension for inspection
  const [selectedDimensionKey, setSelectedDimensionKey] = useState<string | null>(null);

  // Interactive Checklist State for Defense Playbook [TC-T2-F20-05]
  const [checkedPlaybookItems, setCheckedPlaybookItems] = useState<Record<string, boolean>>({});

  const toggleChecklistItem = (itemText: string) => {
    setCheckedPlaybookItems((prev) => ({
      ...prev,
      [itemText]: !prev[itemText],
    }));
  };

  // Find lowest dimension (primary vulnerability) [TC-T1-F19-05]
  const lowestDimension = useMemo(() => {
    if (!dimensions || dimensions.length === 0) return null;
    return [...dimensions].sort((a, b) => a.score - b.score)[0];
  }, [dimensions]);

  // Active stress test scenario
  const activeScenario = useMemo(() => {
    return stressScenarios.find((s) => s.id === activeStressTestId) || null;
  }, [stressScenarios, activeStressTestId]);

  return (
    <div className="space-y-6" data-testid="survival-radar-view">
      {/* 1. Header with Composite Survival Index & Lowest Dimension Indicator */}
      <div className="glass tone-glow rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white flex items-center gap-2.5">
            How sturdy is the business?
            <span className="sr-only">Business Survival Radar &amp; Stress Lab</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-paypal-cyan/20 text-paypal-cyan border border-paypal-cyan/30">
              Resilience Diagnostics
            </span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Try a late payment or a surprise bill and see if the business still stands.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeStressTestId && (
            <button
              type="button"
              onClick={() => clearStressTest()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-200/70 dark:bg-stone-800/70 hover:bg-stone-300/80 dark:hover:bg-stone-700/80 text-stone-700 dark:text-stone-200 text-xs font-mono font-medium border border-stone-300/70 dark:border-white/10 transition"
              data-testid="btn-reset-stress-test"
            >
              <RotateCcw className="w-3.5 h-3.5 text-paypal-cyan" />
              <span>Reset Stress Lab</span>
            </button>
          )}

          <div className="px-3.5 py-1.5 rounded-lg bg-white/40 dark:bg-stone-900/50 border border-stone-200/60 dark:border-white/10 flex items-center gap-3 font-mono text-xs">
            <span className="text-stone-500 dark:text-stone-400">Survival Index:</span>
            <span
              className={`text-lg font-bold ${
                overallSurvivalIndex >= 75
                  ? 'text-emerald-400'
                  : overallSurvivalIndex >= 50
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
              data-testid="composite-survival-index"
            >
              {overallSurvivalIndex} / 100
            </span>
          </div>
        </div>
      </div>

      {/* Primary Vulnerability Banner */}
      {lowestDimension && (
        <div
          className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between text-xs"
          data-testid="primary-vulnerability-banner"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-amber-300 font-semibold">Primary Vulnerability Identified: </span>
              <span className="text-stone-600 dark:text-stone-300">
                {lowestDimension.name} ({lowestDimension.score}/100) — {lowestDimension.metricValueText}.
              </span>
            </div>
          </div>
          <span className="text-amber-400/80 font-mono text-[11px] shrink-0">
            {lowestDimension.riskFactorSummary}
          </span>
        </div>
      )}

      {/* 2. Main 2-Column Cockpit: Radar & Dimensions (Left 50%) + Stress Lab & Defense Playbook (Right 50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Radar Chart + 6 Dimension Cards (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Radar Chart */}
          <SurvivalRadarChart
            dimensions={dimensions}
            overallSurvivalIndex={overallSurvivalIndex}
            onSelectDimension={(d) => setSelectedDimensionKey(d.key)}
          />

          {/* 6 Dimension Metric Cards */}
          <div className="glass tone-glow rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-stone-900 dark:text-white font-mono uppercase tracking-wider pb-2 border-b border-stone-200/60 dark:border-white/10">
              Resilience Dimension Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="dimension-cards-grid">
              {dimensions.map((dim) => {
                const isSelected = selectedDimensionKey === dim.key;
                const isLowest = lowestDimension?.key === dim.key;
                const delta = dim.score - dim.industryBenchmark;

                return (
                  <div
                    key={dim.key}
                    onClick={() => setSelectedDimensionKey(dim.key)}
                    className={`p-3 rounded-lg border transition cursor-pointer ${
                      isSelected
                        ? 'bg-stone-200/70 dark:bg-stone-800/80 border-paypal-cyan shadow-sm'
                        : isLowest
                        ? 'bg-amber-950/15 border-amber-500/40 hover:bg-stone-200/80 dark:hover:bg-stone-800/40'
                        : 'bg-white/50 dark:bg-stone-950/70 border-stone-200/60 dark:border-white/10 hover:border-stone-300/70 dark:border-white/10'
                    }`}
                    data-testid={`dimension-card-${dim.key}`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-stone-900 dark:text-white">{dim.name}</span>
                      <span
                        className={`font-bold ${
                          dim.score >= 80
                            ? 'text-emerald-400'
                            : dim.score >= 70
                            ? 'text-paypal-cyan'
                            : 'text-amber-400'
                        }`}
                      >
                        {dim.score}/100
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-stone-200/70 dark:bg-stone-800/70 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          dim.score >= 80
                            ? 'bg-emerald-400'
                            : dim.score >= 70
                            ? 'bg-paypal-cyan'
                            : 'bg-amber-400'
                        }`}
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-stone-500 dark:text-stone-400">
                      <span>Bench: {dim.industryBenchmark}</span>
                      <span className={delta >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                        {delta >= 0 ? `+${delta}` : delta} vs SMB
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Stress-Test Execution Lab & Defense Playbook (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Stress-Test Lab Card */}
          <div className="glass tone-glow rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-semibold text-stone-900 dark:text-white font-mono uppercase tracking-wider">
                  Financial Shock Simulation Lab
                </h3>
              </div>
              <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">
                Adversarial Liquidity Stress
              </span>
            </div>

            {/* Active Shock Alert Banner if test is active */}
            {activeScenario && (
              <div
                className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${
                  activeScenario.verdict === 'CRITICAL_INSOLVENCY'
                    ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                    : activeScenario.verdict === 'MODERATE_STRESS'
                    ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                    : 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                }`}
                data-testid="active-shock-banner"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Active Shock: {activeScenario.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-100/80 dark:bg-stone-900/60 border border-current">
                    {activeScenario.verdict}
                  </span>
                </div>
                <p className="text-[11px] opacity-90">{activeScenario.description}</p>
                <div className="flex items-center gap-4 pt-1 border-t border-current/20 text-[11px]">
                  <span>Cash Delta: {activeScenario.immediateCashImpact < 0 ? '-' : ''}${Math.abs(activeScenario.immediateCashImpact).toLocaleString()}</span>
                  <span>Runway: {activeScenario.runwayReductionDays} Days</span>
                  <span>Simulated Index: {activeScenario.simulatedHealthScore}/100</span>
                </div>
              </div>
            )}

            {/* Pre-configured Shock Scenario Cards */}
            <div className="space-y-3" data-testid="stress-scenarios-list">
              {stressScenarios.map((shock) => {
                const isActive = activeStressTestId === shock.id;
                return (
                  <div
                    key={shock.id}
                    className={`p-3.5 rounded-lg border transition ${
                      isActive
                        ? 'bg-stone-100/80 dark:bg-stone-900/60 border-rose-500 shadow-sm'
                        : 'bg-white/50 dark:bg-stone-950/70 border-stone-200/60 dark:border-white/10 hover:border-stone-300/70 dark:border-white/10'
                    }`}
                    data-testid={`shock-card-${shock.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-stone-900 dark:text-white font-mono">
                          {shock.title}
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                          {shock.description}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-200/70 dark:bg-stone-800/70 text-stone-600 dark:text-stone-300 shrink-0">
                        {shock.appliedShock}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-stone-200/60 dark:border-white/10 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-rose-400 font-bold">
                          -${Math.abs(shock.immediateCashImpact).toLocaleString()}
                        </span>
                        <span className="text-amber-400">
                          {shock.runwayReductionDays}d Runway
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => triggerStressTest(shock.id)}
                        className={`px-3 py-1 rounded text-[11px] font-mono font-semibold transition ${
                          isActive
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-stone-200/70 dark:bg-stone-800/70 hover:bg-stone-300/80 dark:hover:bg-stone-700/80 text-stone-700 dark:text-stone-200'
                        }`}
                        data-testid={`btn-simulate-${shock.id}`}
                      >
                        {isActive ? 'Simulating' : 'Simulate Shock'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Defense Playbook Checklist */}
          <div className="glass tone-glow rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-stone-900 dark:text-white font-mono uppercase tracking-wider">
                  Automated Defense Playbook Checklist
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">
                Action Recommendations
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-mono" data-testid="defense-playbook-checklist">
              {(activeScenario?.actionPlaybook || [
                'Accelerate collection of overdue Udhari accounts ($16.8k pending)',
                'Delay non-critical software subscriptions & recurring vendor payables',
                'Increase upfront deposit percentage on new orders to 30%',
                'Submit pending PayPal duplicate fee recovery claim ($18.4k)',
              ]).map((action, idx) => {
                const isChecked = Boolean(checkedPlaybookItems[action]);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleChecklistItem(action)}
                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                      isChecked
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                        : 'bg-white/50 dark:bg-stone-950/70 border-stone-200/60 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:border-stone-300/70 dark:border-white/10'
                    }`}
                    data-testid={`playbook-item-${idx}`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-500 dark:text-stone-400 shrink-0" />
                      )}
                      <span className={isChecked ? 'line-through opacity-80' : ''}>
                        {action}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 shrink-0">
                      {isChecked ? 'Executed' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SurvivalRadarView;
