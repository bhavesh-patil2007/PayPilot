import React from 'react';
import { Panel, PanelHeader } from './primitives';

export interface CommitmentTimelineProps {
  onViewForecast?: () => void;
}

export const CommitmentTimeline: React.FC<CommitmentTimelineProps> = ({ onViewForecast }) => {
  const points = [
    { date: 'Today', amount: '₹42,000', current: true },
    { date: 'Thu, 7 Nov', amount: '₹18,000', current: false },
    { date: 'Mon, 11 Nov', amount: '₹63,000', current: false },
    { date: 'Fri, 15 Nov', amount: '₹27,000', current: false },
  ];

  return (
    <Panel className="p-5 flex flex-col justify-between">
      <PanelHeader title="Commitment Timeline" action="View Forecast" onActionClick={onViewForecast} />

      <div className="relative mt-5 mb-2">
        {/* Horizontal rail */}
        <div className="absolute left-[8%] right-[8%] top-[5px] h-[2px] bg-gradient-to-r from-amber-600 via-amber-600/50 to-amber-600/20" />

        <ol className="relative grid grid-cols-4">
          {points.map((pt) => (
            <li key={pt.date} className="flex flex-col items-center text-center">
              {/* Node indicator */}
              <span
                className={`relative z-10 h-3 w-3 rounded-full border-2 border-amber-600 transition-all ${
                  pt.current
                    ? 'bg-amber-600 shadow-[0_0_12px_rgba(217,119,6,0.8)] scale-110'
                    : 'bg-stone-50 dark:bg-stone-900 border-amber-600/60'
                }`}
              />
              <span
                className={`mt-3 text-[11px] ${
                  pt.current
                    ? 'font-semibold text-stone-900 dark:text-stone-50'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                {pt.date}
              </span>
              <span className="mt-1 font-mono text-[13px] font-semibold text-stone-900 dark:text-stone-100">
                {pt.amount}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Panel>
  );
};
export default CommitmentTimeline;
