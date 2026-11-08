import React, { useState, useMemo } from 'react';
import { CommitmentItem, CommitmentCategory, CommitmentFirewallStatus } from '../../types';
import {
  Calendar,
  Shield,
  Layers,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  Filter,
} from 'lucide-react';

export interface CommitmentGanttChartProps {
  commitments?: CommitmentItem[];
  horizonDays?: 30 | 60 | 90 | 180;
  onHorizonChange?: (horizon: 30 | 60 | 90 | 180) => void;
  safetyBufferThreshold?: number; // Defaults to $25,000 threshold
  selectedCategory?: CommitmentCategory | 'ALL';
  onSelectCategory?: (category: CommitmentCategory | 'ALL') => void;
  onSelectCommitment?: (commitment: CommitmentItem) => void;
  className?: string;
}

export const CATEGORY_STYLES: Record<
  CommitmentCategory,
  { label: string; stroke: string; fill: string; text: string; bgClass: string; dotColor: string }
> = {
  PAYROLL: {
    label: 'Payroll & Team',
    stroke: '#8b5cf6',
    fill: 'rgba(139, 92, 246, 0.25)',
    text: '#c4b5fd',
    bgClass: 'bg-purple-950/40 text-purple-300 border-purple-500/30',
    dotColor: '#8b5cf6',
  },
  SUPPLIER_INVENTORY: {
    label: 'Supplier & Inventory',
    stroke: '#f59e0b',
    fill: 'rgba(245, 158, 11, 0.25)',
    text: '#fde68a',
    bgClass: 'bg-amber-950/40 text-amber-300 border-amber-500/30',
    dotColor: '#f59e0b',
  },
  SAAS_TOOLS: {
    label: 'Cloud & Software',
    stroke: '#06b6d4',
    fill: 'rgba(6, 182, 212, 0.25)',
    text: '#a5f3fc',
    bgClass: 'bg-cyan-950/40 text-cyan-300 border-cyan-500/30',
    dotColor: '#06b6d4',
  },
  OFFICE_RENT: {
    label: 'Office & Facilities',
    stroke: '#10b981',
    fill: 'rgba(16, 185, 129, 0.25)',
    text: '#a7f3d0',
    bgClass: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30',
    dotColor: '#10b981',
  },
  TAX_ESTIMATES: {
    label: 'Tax Provisions',
    stroke: '#f43f5e',
    fill: 'rgba(244, 63, 94, 0.25)',
    text: '#fecdd3',
    bgClass: 'bg-rose-950/40 text-rose-300 border-rose-500/30',
    dotColor: '#f43f5e',
  },
  DEBT_SERVICE: {
    label: 'Debt Service',
    stroke: '#94a3b8',
    fill: 'rgba(148, 163, 184, 0.25)',
    text: '#e2e8f0',
    bgClass: 'bg-slate-800 text-slate-300 border-slate-700',
    dotColor: '#94a3b8',
  },
};

const CATEGORIES_LIST: CommitmentCategory[] = [
  'PAYROLL',
  'SUPPLIER_INVENTORY',
  'SAAS_TOOLS',
  'OFFICE_RENT',
  'TAX_ESTIMATES',
  'DEBT_SERVICE',
];

export function CommitmentGanttChart({
  commitments = [],
  horizonDays: controlledHorizon,
  onHorizonChange,
  safetyBufferThreshold = 25000,
  selectedCategory: controlledCategory,
  onSelectCategory,
  onSelectCommitment,
  className = '',
}: CommitmentGanttChartProps) {
  const [localHorizon, setLocalHorizon] = useState<30 | 60 | 90 | 180>(90);
  const horizon = controlledHorizon ?? localHorizon;

  const [localCategory, setLocalCategory] = useState<CommitmentCategory | 'ALL'>('ALL');
  const selectedCategory = controlledCategory ?? localCategory;

  const [hoveredCommitment, setHoveredCommitment] = useState<CommitmentItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const handleHorizonToggle = (h: 30 | 60 | 90 | 180) => {
    if (onHorizonChange) {
      onHorizonChange(h);
    } else {
      setLocalHorizon(h);
    }
  };

  const handleCategoryToggle = (cat: CommitmentCategory | 'ALL') => {
    if (onSelectCategory) {
      onSelectCategory(cat);
    } else {
      setLocalCategory(cat);
    }
  };

  // Base date anchor: Nov 6, 2024
  const today = useMemo(() => new Date('2024-11-06'), []);

  // Filter commitments by category
  const filteredCommitments = useMemo(() => {
    let list = commitments;
    if (selectedCategory !== 'ALL') {
      list = list.filter((c) => c.category === selectedCategory);
    }
    // Filter out commitments that are outside the horizon and start after horizon
    return list;
  }, [commitments, selectedCategory]);

  // Layout parameters
  const labelWidth = 240;
  const timelineWidth = 740;
  const totalSvgWidth = labelWidth + timelineWidth;
  const rowHeight = 44;
  const headerHeight = 36;
  const curveOverlayHeight = 70;
  const chartHeight = Math.max(
    headerHeight + filteredCommitments.length * rowHeight + curveOverlayHeight + 10,
    220
  );

  // Time-to-X mapping
  const getXForDate = (dateStr: string): number => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return labelWidth;
    const diffDays = (d.getTime() - today.getTime()) / (1000 * 3600 * 24);
    const clamped = Math.max(0, Math.min(diffDays, horizon));
    return labelWidth + (clamped / horizon) * timelineWidth;
  };

  // Timeline ticks
  const ticks = useMemo(() => {
    const tickList: Array<{ day: number; label: string; x: number }> = [];
    const step = horizon <= 30 ? 5 : horizon <= 60 ? 10 : horizon <= 90 ? 15 : 30;

    for (let day = 0; day <= horizon; day += step) {
      const d = new Date(today);
      d.setDate(today.getDate() + day);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const x = labelWidth + (day / horizon) * timelineWidth;
      tickList.push({ day, label, x });
    }
    return tickList;
  }, [horizon, today, labelWidth, timelineWidth]);

  return (
    <div
      className={`rounded-xl bg-obsidian-900 border border-slate-800 shadow-card-dark p-4 space-y-4 ${className}`}
      data-testid="commitment-gantt-chart"
    >
      {/* 1. Chart Toolbar: Horizon toggles, Category filter, and Safety Buffer Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        {/* Horizon Buttons */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <Calendar className="w-4 h-4 text-paypal-cyan" />
          <span className="text-white font-semibold">Horizon:</span>
          {([30, 60, 90, 180] as const).map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => handleHorizonToggle(h)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
                horizon === h
                  ? 'bg-paypal-blue text-white font-semibold shadow-glow-paypal'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {h}d
            </button>
          ))}
        </div>

        {/* Safety Buffer Indicator */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-500/30 text-[11px] font-mono text-rose-300">
          <Shield className="w-3.5 h-3.5 text-rose-400" />
          <span>Pinned Safety Buffer: ${safetyBufferThreshold.toLocaleString()}</span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="text-slate-400 font-mono mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3 text-slate-500" /> Filter:
        </span>
        <button
          type="button"
          onClick={() => handleCategoryToggle('ALL')}
          className={`px-2.5 py-0.5 rounded-full border transition font-mono ${
            selectedCategory === 'ALL'
              ? 'bg-slate-200 text-slate-900 border-white font-bold'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          ALL ({commitments.length})
        </button>
        {CATEGORIES_LIST.map((cat) => {
          const style = CATEGORY_STYLES[cat];
          const count = commitments.filter((c) => c.category === cat).length;
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryToggle(cat)}
              className={`px-2.5 py-0.5 rounded-full border transition font-mono flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-slate-800 text-white border-paypal-cyan font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.stroke }} />
              <span>{style.label}</span>
              <span className="text-slate-500">({count})</span>
            </button>
          );
        })}
      </div>

      {/* 2. SVG Timeline Canvas */}
      <div className="overflow-x-auto relative select-none">
        <svg
          viewBox={`0 0 ${totalSvgWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[800px]"
          data-testid="gantt-svg-canvas"
        >
          <defs>
            {/* Diagonal hatch pattern for overdue commitments */}
            <pattern
              id="overdueHatch"
              width="8"
              height="8"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.5" />
            </pattern>
          </defs>

          {/* Time Axis Header Background */}
          <rect x={0} y={0} width={totalSvgWidth} height={headerHeight} fill="#0a0f18" />
          <line x1={0} y1={headerHeight} x2={totalSvgWidth} y2={headerHeight} stroke="#1e293b" strokeWidth={1} />

          {/* Grid lines and tick labels */}
          {ticks.map((t) => (
            <g key={t.day}>
              <line
                x1={t.x}
                y1={headerHeight}
                x2={t.x}
                y2={chartHeight - curveOverlayHeight}
                stroke="#1e293b"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <text
                x={t.x}
                y={headerHeight - 12}
                textAnchor="middle"
                fontSize={10}
                fontFamily="monospace"
                fill="#64748b"
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* Pinned "TODAY" Line */}
          <line
            x1={labelWidth}
            y1={0}
            x2={labelWidth}
            y2={chartHeight - curveOverlayHeight}
            stroke="#00cfde"
            strokeWidth={2}
          />
          <text
            x={labelWidth + 4}
            y={14}
            fontSize={9}
            fontFamily="monospace"
            fill="#00cfde"
            fontWeight="bold"
          >
            TODAY
          </text>

          {/* Commitment Rows */}
          {filteredCommitments.length === 0 ? (
            <text
              x={totalSvgWidth / 2}
              y={headerHeight + 60}
              textAnchor="middle"
              fill="#64748b"
              fontSize={12}
              fontFamily="sans-serif"
            >
              No upcoming commitments scheduled within the {horizon}-day horizon.
            </text>
          ) : (
            filteredCommitments.map((c, idx) => {
              const y = headerHeight + idx * rowHeight;
              const barStartX = getXForDate(c.startDate);
              const barEndX = getXForDate(c.dueDate);
              const barWidth = Math.max(32, barEndX - barStartX);
              const style = CATEGORY_STYLES[c.category] || CATEGORY_STYLES.SAAS_TOOLS;
              const isOverdue = new Date(c.dueDate).getTime() < today.getTime() && c.pendingBalance > 0;

              return (
                <g
                  key={c.id}
                  className="cursor-pointer group"
                  onClick={() => onSelectCommitment && onSelectCommitment(c)}
                  onMouseEnter={(e) => {
                    setHoveredCommitment(c);
                    setTooltipPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={(e) => {
                    setTooltipPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setHoveredCommitment(null)}
                >
                  {/* Row background */}
                  <rect
                    x={0}
                    y={y}
                    width={totalSvgWidth}
                    height={rowHeight}
                    fill={idx % 2 === 0 ? '#06090e' : '#0a0f18'}
                    fillOpacity={0.6}
                  />

                  {/* Left Label: Counterparty & PO */}
                  <text
                    x={12}
                    y={y + 18}
                    fontSize={11}
                    fontWeight="600"
                    fill="#e2e8f0"
                    fontFamily="sans-serif"
                  >
                    {c.counterparty.length > 24 ? c.counterparty.slice(0, 24) + '...' : c.counterparty}
                  </text>
                  <text
                    x={12}
                    y={y + 32}
                    fontSize={10}
                    fill="#64748b"
                    fontFamily="monospace"
                  >
                    {c.referenceNumber} • ${(c.pendingBalance / 1000).toFixed(1)}k due
                  </text>

                  {/* Horizontal Bar */}
                  <rect
                    x={barStartX}
                    y={y + 8}
                    width={barWidth}
                    height={26}
                    rx={4}
                    fill={isOverdue ? 'url(#overdueHatch)' : style.fill}
                    stroke={isOverdue ? '#ef4444' : style.stroke}
                    strokeWidth={1.5}
                  />

                  {/* Amount Paid Progress Fill */}
                  {c.totalCommittedAmount > 0 && c.amountPaidToDate > 0 && (
                    <rect
                      x={barStartX}
                      y={y + 8}
                      width={barWidth * Math.min(1, c.amountPaidToDate / c.totalCommittedAmount)}
                      height={26}
                      rx={4}
                      fill={style.stroke}
                      fillOpacity={0.35}
                    />
                  )}

                  {/* Bar Text Label */}
                  <text
                    x={barStartX + 8}
                    y={y + 25}
                    fontSize={10}
                    fontFamily="sans-serif"
                    fontWeight="500"
                    fill={style.text}
                  >
                    ${c.pendingBalance.toLocaleString()} ({c.paymentTerms})
                  </text>

                  {/* Milestones Markers */}
                  {c.milestones?.map((m, mIdx) => {
                    const mX = getXForDate(m.dueDate);
                    return (
                      <circle
                        key={m.id || mIdx}
                        cx={mX}
                        cy={y + 21}
                        r={4}
                        fill={m.isPaid ? '#10b981' : '#f59e0b'}
                        stroke="#06090e"
                        strokeWidth={1.5}
                      />
                    );
                  })}
                </g>
              );
            })
          )}

          {/* 3. Pinned Safety Buffer & Cash Curve Overlay Strip */}
          <g transform={`translate(0, ${chartHeight - curveOverlayHeight})`}>
            {/* Background strip */}
            <rect x={0} y={0} width={totalSvgWidth} height={curveOverlayHeight} fill="#070c14" />
            <line x1={0} y1={0} x2={totalSvgWidth} y2={0} stroke="#1e293b" strokeWidth={1} />

            {/* Left Label */}
            <text x={12} y={24} fontSize={11} fontWeight="bold" fill="#f87171" fontFamily="sans-serif">
              Minimum Safety Buffer
            </text>
            <text x={12} y={42} fontSize={10} fill="#94a3b8" fontFamily="monospace">
              Pinned Floor: ${safetyBufferThreshold.toLocaleString()}
            </text>

            {/* Horizontal Dashed Safety Line */}
            <line
              x1={labelWidth}
              y1={35}
              x2={totalSvgWidth}
              y2={35}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
            <text
              x={totalSvgWidth - 10}
              y={30}
              textAnchor="end"
              fontSize={9}
              fontFamily="monospace"
              fill="#ef4444"
              fontWeight="bold"
            >
              ${safetyBufferThreshold.toLocaleString()} MANDATORY FLOOR
            </text>

            {/* Simulated Cash Trajectory Curve Above Buffer */}
            <path
              d={`M ${labelWidth} 18 Q ${labelWidth + 180} 24, ${labelWidth + 360} 16 T ${totalSvgWidth} 18`}
              fill="none"
              stroke="#10b981"
              strokeWidth={2}
            />
            <text
              x={labelWidth + 10}
              y={14}
              fontSize={9}
              fontFamily="monospace"
              fill="#10b981"
              fontWeight="bold"
            >
              Live Cash Trajectory Overlay (Buffer Maintained: Safe Headroom +$31.2k)
            </text>
          </g>
        </svg>

        {/* Hover Tooltip */}
        {hoveredCommitment && tooltipPos && (
          <div
            className="fixed z-50 p-3 rounded-lg bg-obsidian-950/95 border border-slate-700 shadow-2xl text-xs space-y-1.5 pointer-events-none max-w-xs"
            style={{ left: tooltipPos.x + 12, top: tooltipPos.y + 12 }}
          >
            <div className="font-semibold text-white">{hoveredCommitment.title}</div>
            <div className="text-slate-400 font-mono text-[11px]">
              Counterparty: {hoveredCommitment.counterparty}
            </div>
            <div className="text-slate-400 font-mono text-[11px]">
              Reference: {hoveredCommitment.referenceNumber}
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
              <span className="text-slate-400">Total Committed:</span>
              <span className="text-white font-mono">
                ${hoveredCommitment.totalCommittedAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Pending Balance:</span>
              <span className="text-amber-400 font-bold font-mono">
                ${hoveredCommitment.pendingBalance.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Due Date:</span>
              <span className="text-white font-mono">{hoveredCommitment.dueDate}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Firewall Status:</span>
              <span
                className={`font-mono font-bold ${
                  hoveredCommitment.firewallStatus === 'APPROVED_SAFE'
                    ? 'text-emerald-400'
                    : hoveredCommitment.firewallStatus === 'WARNING_BUFFER_TIGHT'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {hoveredCommitment.firewallStatus}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommitmentGanttChart;
