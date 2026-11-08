import React, { useState, useMemo, useCallback } from 'react';
import { usePayPilotStore } from '../../store/usePayPilotStore';
import { DailyCashProjectionPoint, MilestonePreset } from '../../types';
import {
  TrendingUp,
  AlertTriangle,
  Shield,
  Sliders,
  DollarSign,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';

export interface InteractiveCashCurveProps {
  className?: string;
  height?: number;
  showSliders?: boolean;
  onPointHover?: (point: DailyCashProjectionPoint | null) => void;
}

const MILESTONE_PRESETS: Array<{ id: MilestonePreset; label: string; split: [number, number, number] }> = [
  { id: '30_40_30', label: '30 / 40 / 30', split: [30, 40, 30] },
  { id: '50_50', label: '50 / 50', split: [50, 50, 0] },
  { id: '100_DELIVERY', label: '100% on Delivery', split: [0, 0, 100] },
];

export function InteractiveCashCurve({
  className = '',
  height = 340,
  showSliders = true,
  onPointHover,
}: InteractiveCashCurveProps) {
  const { simulationState, updateSimulationParameters } = usePayPilotStore();
  const {
    parameters,
    safetyBufferThreshold,
    dailyProjections,
    minimumCashPoint,
    projectedRunwayDays,
    isBufferBreached,
  } = simulationState;

  // Hover state
  const [hoveredPoint, setHoveredPoint] = useState<DailyCashProjectionPoint | null>(null);
  const [crosshairX, setCrosshairX] = useState<number | null>(null);

  // SVG Geometry constants
  const svgWidth = 920;
  const svgHeight = height;
  const padding = { top: 28, right: 36, bottom: 48, left: 74 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Calculate Y min and max
  const { minVal, maxVal } = useMemo(() => {
    let min = 0;
    let max = 200000;
    if (dailyProjections && dailyProjections.length > 0) {
      const balances = dailyProjections.map((p) => p.balance);
      const dataMin = Math.min(...balances);
      const dataMax = Math.max(...balances);
      min = Math.min(0, dataMin - 10000);
      max = Math.max(160000, dataMax + 20000);
    }
    return { minVal: min, maxVal: max };
  }, [dailyProjections]);

  // Coordinate transforms
  const getY = useCallback(
    (balance: number): number => {
      const clamped = Math.max(minVal, Math.min(maxVal, balance));
      const ratio = (clamped - minVal) / (maxVal - minVal || 1);
      return padding.top + plotHeight * (1 - ratio);
    },
    [minVal, maxVal, padding.top, plotHeight]
  );

  const getX = useCallback(
    (dayIndex: number): number => {
      const ratio = Math.max(0, Math.min(90, dayIndex)) / 90;
      return padding.left + plotWidth * ratio;
    },
    [padding.left, plotWidth]
  );

  // Safety buffer line Y coordinate
  const bufferY = getY(safetyBufferThreshold);

  // Build SVG Path for Cash Curve
  const { pathD, areaD } = useMemo(() => {
    if (!dailyProjections || dailyProjections.length === 0) {
      return { pathD: '', areaD: '' };
    }

    let d = '';
    const bottomY = getY(minVal);

    dailyProjections.forEach((p, idx) => {
      const x = getX(p.dayIndex);
      const y = getY(p.balance);
      if (idx === 0) {
        d += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      } else {
        d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    });

    const firstX = getX(0);
    const lastX = getX(90);
    const area = `${d} L ${lastX.toFixed(1)} ${bottomY.toFixed(1)} L ${firstX.toFixed(1)} ${bottomY.toFixed(1)} Z`;

    return { pathD: d, areaD: area };
  }, [dailyProjections, getX, getY, minVal]);

  // Minimum cash point coordinates
  const minCashX = getX(minimumCashPoint.dayIndex);
  const minCashY = getY(minimumCashPoint.amount);

  // Horizontal Grid Lines
  const yTicks = useMemo(() => {
    const ticks: Array<{ val: number; y: number; label: string }> = [];
    const step = 50000;
    for (let val = 0; val <= maxVal; val += step) {
      ticks.push({
        val,
        y: getY(val),
        label: `$${(val / 1000).toFixed(0)}k`,
      });
    }
    return ticks;
  }, [maxVal, getY]);

  // X Day Ticks
  const xTicks = useMemo(() => {
    return [0, 15, 30, 45, 60, 75, 90].map((day) => ({
      day,
      x: getX(day),
      label: `Day ${day}`,
    }));
  }, [getX]);

  // Pointer interaction
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * svgWidth;

    if (svgX < padding.left || svgX > padding.left + plotWidth) {
      setHoveredPoint(null);
      setCrosshairX(null);
      onPointHover?.(null);
      return;
    }

    const dayRatio = (svgX - padding.left) / plotWidth;
    const day = Math.round(dayRatio * 90);
    const clampedDay = Math.max(0, Math.min(90, day));
    const point = dailyProjections[clampedDay] || null;

    setHoveredPoint(point);
    setCrosshairX(svgX);
    onPointHover?.(point);
  };

  const handlePointerLeave = () => {
    setHoveredPoint(null);
    setCrosshairX(null);
    onPointHover?.(null);
  };

  return (
    <div
      className={`rounded-xl bg-obsidian-900 border border-slate-800 shadow-card-dark p-5 space-y-5 ${className}`}
      data-testid="interactive-cash-curve"
    >
      {/* 1. Header with live status and runway indicators */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="w-5 h-5 text-paypal-cyan" />
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide font-mono uppercase">
              Dynamic 90-Day Cash Trajectory Curve
            </h3>
            <p className="text-xs text-slate-400">
              Interactive financial simulation model recalculating liquidity, burn velocity, and safety breaches in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
            <span className="text-slate-400">Projected Runway:</span>
            <span className="text-emerald-400 font-bold">{projectedRunwayDays} Days</span>
          </div>
          <div
            className={`px-3 py-1 rounded-lg border flex items-center gap-1.5 ${
              isBufferBreached
                ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isBufferBreached ? 'BUFFER BREACHED' : 'BUFFER INTACT'}</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive SVG Canvas */}
      <div className="relative overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[760px]"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          data-testid="cash-curve-svg"
        >
          <defs>
            {/* Linear gradient under cash curve */}
            <linearGradient id="cashAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#06090e" stopOpacity="0.0" />
            </linearGradient>

            {/* Red alert gradient for safety breach zone */}
            <linearGradient id="safetyBreachGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {/* Plot Background */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            fill="#06090e"
            fillOpacity={0.8}
            rx={6}
          />

          {/* Red Safety Breach Highlight Zone (below $15,000) */}
          <rect
            x={padding.left}
            y={bufferY}
            width={plotWidth}
            height={Math.max(0, padding.top + plotHeight - bufferY)}
            fill="url(#safetyBreachGradient)"
          />

          {/* Y Axis Grid Lines & Labels */}
          {yTicks.map((t) => (
            <g key={t.val}>
              <line
                x1={padding.left}
                y1={t.y}
                x2={padding.left + plotWidth}
                y2={t.y}
                stroke="#1e293b"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <text
                x={padding.left - 12}
                y={t.y + 4}
                textAnchor="end"
                fontSize={10}
                fontFamily="monospace"
                fill="#64748b"
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* X Axis Grid Lines & Labels */}
          {xTicks.map((t) => (
            <g key={t.day}>
              <line
                x1={t.x}
                y1={padding.top}
                x2={t.x}
                y2={padding.top + plotHeight}
                stroke="#1e293b"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <text
                x={t.x}
                y={padding.top + plotHeight + 18}
                textAnchor="middle"
                fontSize={10}
                fontFamily="monospace"
                fill="#64748b"
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* Horizontal Pinned Safety Buffer Threshold Line ($15,000) */}
          <line
            x1={padding.left}
            y1={bufferY}
            x2={padding.left + plotWidth}
            y2={bufferY}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <text
            x={padding.left + plotWidth - 8}
            y={bufferY - 6}
            textAnchor="end"
            fontSize={9}
            fontFamily="monospace"
            fill="#ef4444"
            fontWeight="bold"
          >
            MANDATORY SAFETY BUFFER ($15,000)
          </text>

          {/* Shaded Area under Cash Curve */}
          <path d={areaD} fill="url(#cashAreaGradient)" />

          {/* Continuous Cash Curve Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#00cfde"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Lowest Cash Dip Beacon Marker */}
          <g transform={`translate(${minCashX}, ${minCashY})`}>
            {/* Pulsing outer ring */}
            <circle r={10} fill="none" stroke="#ef4444" strokeWidth={1.5} opacity={0.7} className="animate-ping" />
            <circle r={5} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
            {/* Callout box above marker */}
            <g transform="translate(0, -22)">
              <rect
                x={-90}
                y={-14}
                width={180}
                height={20}
                rx={4}
                fill="#0f172a"
                stroke="#ef4444"
                strokeWidth={1}
              />
              <text
                x={0}
                y={0}
                textAnchor="middle"
                fontSize={9}
                fontFamily="monospace"
                fill="#fca5a5"
                fontWeight="bold"
              >
                Dip: ${minimumCashPoint.amount.toLocaleString()} (Day {minimumCashPoint.dayIndex})
              </text>
            </g>
          </g>

          {/* Interactive Crosshair Tracking */}
          {crosshairX !== null && hoveredPoint && (
            <g>
              <line
                x1={crosshairX}
                y1={padding.top}
                x2={crosshairX}
                y2={padding.top + plotHeight}
                stroke="#00f2fe"
                strokeWidth={1.5}
                strokeDasharray="2 2"
              />
              <circle
                cx={crosshairX}
                cy={getY(hoveredPoint.balance)}
                r={6}
                fill="#00f2fe"
                stroke="#ffffff"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>

        {/* Hover Point Floating Tooltip */}
        {hoveredPoint && crosshairX !== null && (
          <div
            className="absolute top-4 pointer-events-none p-3 rounded-lg bg-obsidian-950/95 border border-slate-700 shadow-2xl text-xs space-y-1 z-30"
            style={{
              left: Math.max(16, Math.min(600, crosshairX - 80)),
            }}
          >
            <div className="flex items-center justify-between gap-4 font-mono">
              <span className="font-bold text-white">Day {hoveredPoint.dayIndex}</span>
              <span className="text-slate-400">{hoveredPoint.date}</span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800 text-[11px] font-mono">
              <span className="text-slate-400">Balance:</span>
              <span className="font-bold text-paypal-cyan">
                ${hoveredPoint.balance.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px] font-mono">
              <span className="text-slate-400">Daily Inflow:</span>
              <span className="text-emerald-400">+${hoveredPoint.inFlow.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px] font-mono">
              <span className="text-slate-400">Daily Outflow:</span>
              <span className="text-rose-400">-${hoveredPoint.outFlow.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px] font-mono">
              <span className="text-slate-400">Status:</span>
              <span
                className={`font-bold ${
                  hoveredPoint.isBreached ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {hoveredPoint.isBreached ? 'BUFFER BREACH' : 'SAFE'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Interactive Levers: 3 Sliders */}
      {showSliders && (
        <div className="pt-3 border-t border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-white uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-paypal-cyan" />
            <span>Financial Levers & Cash Timing Controls</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Slider 1: Upfront Deposit % */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Upfront Deposit %</span>
                <span className="text-paypal-cyan font-bold" data-testid="deposit-val">
                  {parameters.upfrontDepositPct}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={parameters.upfrontDepositPct}
                onChange={(e) =>
                  updateSimulationParameters({ upfrontDepositPct: Number(e.target.value) })
                }
                className="w-full accent-paypal-cyan bg-slate-800 h-2 rounded-lg cursor-pointer"
                data-testid="slider-deposit"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                {[0, 10, 20, 30, 50].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateSimulationParameters({ upfrontDepositPct: val })}
                    className={`hover:text-paypal-cyan transition ${
                      parameters.upfrontDepositPct === val ? 'text-paypal-cyan font-bold' : ''
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 2: Customer Payment Delay */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Client Payment Delay</span>
                <span className="text-amber-400 font-bold" data-testid="delay-val">
                  +{parameters.customerPaymentDelayDays} Days
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={parameters.customerPaymentDelayDays}
                onChange={(e) =>
                  updateSimulationParameters({ customerPaymentDelayDays: Number(e.target.value) })
                }
                className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                data-testid="slider-delay"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                {[0, 15, 30, 45, 60].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => updateSimulationParameters({ customerPaymentDelayDays: days })}
                    className={`hover:text-amber-400 transition ${
                      parameters.customerPaymentDelayDays === days ? 'text-amber-400 font-bold' : ''
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 3: Milestone Split Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Milestone Split Preset</span>
                <span className="text-purple-400 font-bold">
                  {parameters.milestoneSplit.join(' / ')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                {MILESTONE_PRESETS.map((preset) => {
                  const isActive = parameters.milestonePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        updateSimulationParameters({
                          milestoneSplit: preset.split,
                          milestonePreset: preset.id,
                        })
                      }
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-mono transition text-center border ${
                        isActive
                          ? 'bg-purple-950/60 border-purple-500 text-purple-200 font-bold shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      data-testid={`preset-${preset.id}`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InteractiveCashCurve;
