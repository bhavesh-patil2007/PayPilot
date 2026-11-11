import React from 'react';
import { ArrowUp } from 'lucide-react';
import { Panel, PanelHeader, RingGauge } from './primitives';

export interface BusinessHealthProps {
  score?: number;
  rating?: string;
}

export const BusinessHealth: React.FC<BusinessHealthProps> = ({
  score = 92,
  rating = 'Excellent',
}) => {
  const metrics = [
    { label: 'Cash Flow', delta: '18%', fill: 78, color: 'bg-emerald-500', textTrend: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Receivables', delta: '12%', fill: 62, color: 'bg-amber-600', textTrend: 'text-amber-600 dark:text-amber-400' },
    { label: 'Reserve', delta: '6%', fill: 44, color: 'bg-amber-500', textTrend: 'text-amber-600 dark:text-amber-400' },
  ];

  return (
    <Panel className="flex flex-col justify-between">
      {/* Faint trend line behind the gauge as shown in design */}
      <svg
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
        className="pointer-events-none absolute right-0 top-8 h-28 w-3/4 opacity-40 dark:opacity-30"
        aria-hidden="true"
      >
        <path
          d="M0 70 C 40 68, 60 60, 90 55 S 140 45, 160 25 S 190 10, 200 8"
          fill="none"
          stroke="#10B981"
          strokeWidth="1.5"
          strokeOpacity="0.8"
        />
        <path
          d="M0 70 C 40 68, 60 60, 90 55 S 140 45, 160 25 S 190 10, 200 8 L 200 80 L 0 80 Z"
          fill="url(#health-glow)"
        />
        <defs>
          <linearGradient id="health-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <PanelHeader title="Business Health" />

      {/* Circular Gauge */}
      <div className="relative flex justify-center py-3">
        <RingGauge value={score} size={106} stroke={7} strokeColor="#10B981">
          <span className="font-display text-[30px] font-bold leading-none text-stone-900 dark:text-white">
            {score}
          </span>
          <span className="mt-1 text-[11px] font-medium text-stone-500 dark:text-stone-400">
            {rating}
          </span>
        </RingGauge>
      </div>

      {/* Metric Breakdown Bars */}
      <ul className="relative mt-auto space-y-2.5 border-t border-stone-200/40 dark:border-white/10 pt-3">
        {metrics.map((item) => (
          <li key={item.label} className="grid grid-cols-[1fr_64px_auto] items-center gap-3">
            <span className="text-[11.5px] font-medium text-stone-700 dark:text-stone-300">
              {item.label}
            </span>
            <span className="h-1.5 overflow-hidden rounded-full bg-stone-200/60 dark:bg-stone-800/80">
              <span
                className={`block h-full rounded-full ${item.color} transition-all duration-500`}
                style={{ width: `${item.fill}%` }}
              />
            </span>
            <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${item.textTrend}`}>
              <ArrowUp className="h-3 w-3" />
              {item.delta}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
};
export default BusinessHealth;
