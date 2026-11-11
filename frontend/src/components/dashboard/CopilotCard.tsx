import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Panel } from './primitives';

export interface CopilotCardProps {
  onOpenDetails?: () => void;
  insightText?: string;
}

export const CopilotCard: React.FC<CopilotCardProps> = ({
  onOpenDetails,
  insightText = 'You may recover ₹1.84L from 2 pending payments. View details?',
}) => {
  return (
    <Panel strong className="tone-glow border border-amber-600/30 dark:border-amber-500/30 flex flex-col justify-between p-5 relative overflow-hidden">
      {/* Subtle floating animated orb on the top right */}
      <div
        className="orb animate-orb pointer-events-none absolute right-4 top-4 h-7 w-7 rounded-full"
        aria-hidden="true"
      />

      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" strokeWidth={2} />
          <h2 className="font-display text-[13px] font-semibold text-stone-900 dark:text-stone-50">
            AI Copilot
          </h2>
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-stone-600 dark:text-stone-300">
          {insightText}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between pt-2 border-t border-stone-200/40 dark:border-white/10">
        <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">
          FinCora Intelligence
        </span>
        <button
          type="button"
          onClick={onOpenDetails}
          aria-label="Open copilot suggestion"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-600 to-orange-400 text-white shadow-[0_4px_14px_-2px_rgba(217,119,6,0.5)] transition-transform hover:scale-105 active:scale-95"
        >
          <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>
    </Panel>
  );
};
export default CopilotCard;
