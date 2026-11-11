import React, { useState, useMemo } from 'react';
import { RadarDimensionScore } from '../../types';
import { Radar, Shield, AlertTriangle, TrendingUp, Info } from 'lucide-react';

export interface SurvivalRadarChartProps {
  dimensions?: RadarDimensionScore[];
  overallSurvivalIndex?: number;
  onSelectDimension?: (dimension: RadarDimensionScore) => void;
  className?: string;
}

export function SurvivalRadarChart({
  dimensions = [],
  overallSurvivalIndex = 84,
  onSelectDimension,
  className = '',
}: SurvivalRadarChartProps) {
  const [hoveredDimension, setHoveredDimension] = useState<RadarDimensionScore | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // SVG Geometry constants
  const size = 480;
  const center = size / 2; // 240
  const maxRadius = 160;

  // Axis count and angles: default to 6 dimensions
  const numAxes = dimensions.length || 6;
  const angleStep = (2 * Math.PI) / numAxes;

  // Angles offset so first dimension points straight up (-PI / 2)
  const getAngle = (i: number) => -Math.PI / 2 + i * angleStep;

  // Coordinate helper
  const getPoint = (score: number, index: number, radiusMax: number = maxRadius) => {
    const clampedScore = Math.max(0, Math.min(100, score));
    const r = (clampedScore / 100) * radiusMax;
    const angle = getAngle(index);
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Concentric grid webs (levels 20, 40, 60, 80, 100)
  const gridLevels = [20, 40, 60, 80, 100];
  const gridPolygons = useMemo(() => {
    return gridLevels.map((lvl) => {
      const pts = Array.from({ length: numAxes }, (_, i) => {
        const pt = getPoint(lvl, i);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      }).join(' ');
      return { level: lvl, points: pts };
    });
  }, [numAxes]);

  // Industry benchmark polygon
  const benchmarkPolygon = useMemo(() => {
    if (dimensions.length === 0) return '';
    return dimensions
      .map((d, i) => {
        const pt = getPoint(d.industryBenchmark || 70, i);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(' ');
  }, [dimensions]);

  // Actual company score polygon
  const companyPolygon = useMemo(() => {
    if (dimensions.length === 0) return '';
    return dimensions
      .map((d, i) => {
        const pt = getPoint(d.score, i);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(' ');
  }, [dimensions]);

  // Actual company vertices
  const companyVertices = useMemo(() => {
    return dimensions.map((d, i) => {
      const pt = getPoint(d.score, i);
      return { ...pt, dimension: d, index: i };
    });
  }, [dimensions]);

  return (
    <div
      className={`glass tone-glow rounded-2xl p-5 flex flex-col items-center relative ${className}`}
      data-testid="survival-radar-chart"
    >
      {/* Legend & Summary Bar */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-white/10 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-paypal-cyan" />
          <span className="text-white font-semibold uppercase tracking-wider">
            6-Axis Resilience Topology
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-paypal-cyan" />
            <span className="text-stone-600 dark:text-stone-300">PayPilot Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-b-2 border-dashed border-slate-400" />
            <span className="text-stone-500 dark:text-stone-400">SMB Benchmark</span>
          </div>
        </div>
      </div>

      {/* SVG Spider Radar */}
      <div className="relative w-full max-w-[480px] aspect-square select-none my-2">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full"
          data-testid="radar-svg"
        >
          <defs>
            {/* Gradient fill for company resilience polygon */}
            <radialGradient id="radarAreaGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06090e" stopOpacity="0.05" />
            </radialGradient>
          </defs>

          {/* Concentric Grid Web Polygons */}
          {gridPolygons.map((g) => (
            <polygon
              key={g.level}
              points={g.points}
              fill={g.level === 100 ? '#06090e' : 'none'}
              fillOpacity={g.level === 100 ? 0.6 : 0}
              stroke="#1e293b"
              strokeWidth={1}
            />
          ))}

          {/* Radial Spokes from Center */}
          {Array.from({ length: numAxes }).map((_, i) => {
            const outerPt = getPoint(100, i);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={outerPt.x}
                y2={outerPt.y}
                stroke="#1e293b"
                strokeWidth={1}
              />
            );
          })}

          {/* Grid Scale Labels */}
          {gridLevels.map((lvl) => {
            const pt = getPoint(lvl, 0);
            return (
              <text
                key={lvl}
                x={pt.x + 4}
                y={pt.y - 2}
                fontSize={8}
                fontFamily="monospace"
                fill="#475569"
              >
                {lvl}
              </text>
            );
          })}

          {/* Benchmark Polygon */}
          {benchmarkPolygon && (
            <polygon
              points={benchmarkPolygon}
              fill="none"
              stroke="#64748b"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          )}

          {/* Company Resilience Polygon */}
          {companyPolygon && (
            <polygon
              points={companyPolygon}
              fill="url(#radarAreaGradient)"
              stroke="#00f2fe"
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
          )}

          {/* Vertex Points & Labels */}
          {companyVertices.map((v) => {
            const isHovered = hoveredDimension?.key === v.dimension.key;
            const outerLabelPt = getPoint(118, v.index);

            return (
              <g
                key={v.dimension.key}
                className="cursor-pointer"
                onClick={() => onSelectDimension?.(v.dimension)}
                onMouseEnter={(e) => {
                  setHoveredDimension(v.dimension);
                  setTooltipPos({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredDimension(null)}
              >
                {/* Vertex Circle */}
                <circle
                  cx={v.x}
                  cy={v.y}
                  r={isHovered ? 6 : 4}
                  fill={v.dimension.score < 75 ? '#f59e0b' : '#00f2fe'}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  className="transition-all duration-150"
                />

                {/* Outer Dimension Label */}
                <text
                  x={outerLabelPt.x}
                  y={outerLabelPt.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={10}
                  fontFamily="sans-serif"
                  fontWeight="600"
                  fill={isHovered ? '#ffffff' : '#94a3b8'}
                  className="transition-colors"
                >
                  {v.dimension.name}
                </text>
                <text
                  x={outerLabelPt.x}
                  y={outerLabelPt.y + 12}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={9}
                  fontFamily="monospace"
                  fill={v.dimension.score < 75 ? '#f59e0b' : '#38bdf8'}
                >
                  {v.dimension.score}/100
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredDimension && tooltipPos && (
          <div
            className="fixed z-50 p-3 rounded-lg bg-white/50 dark:bg-stone-950/95 border border-stone-300/70 dark:border-white/10 shadow-2xl text-xs space-y-1.5 pointer-events-none max-w-xs"
            style={{ left: tooltipPos.x + 12, top: tooltipPos.y + 12 }}
          >
            <div className="font-semibold text-stone-900 dark:text-white">{hoveredDimension.name}</div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-200/60 dark:border-white/10 font-mono">
              <span className="text-stone-500 dark:text-stone-400">Current Score:</span>
              <span className="font-bold text-paypal-cyan">{hoveredDimension.score} / 100</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-stone-500 dark:text-stone-400">Industry Benchmark:</span>
              <span className="text-stone-600 dark:text-stone-300">{hoveredDimension.industryBenchmark} / 100</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-stone-500 dark:text-stone-400">Variance:</span>
              <span
                className={`font-bold ${
                  hoveredDimension.score >= hoveredDimension.industryBenchmark
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {hoveredDimension.score >= hoveredDimension.industryBenchmark ? '+' : ''}
                {hoveredDimension.score - hoveredDimension.industryBenchmark} pts
              </span>
            </div>
            <div className="text-[11px] text-stone-600 dark:text-stone-300 pt-1 border-t border-stone-200/60 dark:border-white/10">
              {hoveredDimension.riskFactorSummary}
            </div>
          </div>
        )}
      </div>

      {/* Composite Survival Index Pill */}
      <div className="w-full mt-2 pt-2 border-t border-stone-200/60 dark:border-white/10 flex items-center justify-between text-xs font-mono">
        <span className="text-stone-500 dark:text-stone-400">Composite Survival Rating:</span>
        <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30">
          {overallSurvivalIndex} / 100 (Resilient Tier)
        </span>
      </div>
    </div>
  );
}

export default SurvivalRadarChart;
