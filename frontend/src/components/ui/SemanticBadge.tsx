import React from 'react';

export type SemanticStatus = 'safe' | 'risk' | 'warning' | 'neutral';

export interface SemanticBadgeProps {
  status: SemanticStatus;
  /** Optional label override — defaults to the status name capitalised */
  label?: string;
  className?: string;
}

const STATUS_STYLES: Record<SemanticStatus, string> = {
  safe:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  risk:    'bg-rose-500/15    text-rose-400    border-rose-500/30',
  warning: 'bg-amber-500/15   text-amber-400   border-amber-500/30',
  neutral: 'bg-stone-500/15   text-stone-400   border-stone-500/30',
};

const DEFAULT_LABELS: Record<SemanticStatus, string> = {
  safe:    'Safe',
  risk:    'Risk',
  warning: 'Warning',
  neutral: 'Neutral',
};

/**
 * SemanticBadge
 * A pill-shaped status badge with softly tinted, semantically meaningful colours.
 *
 * Usage:
 *   <SemanticBadge status="safe" />
 *   <SemanticBadge status="risk" label="Overdue" />
 */
export const SemanticBadge: React.FC<SemanticBadgeProps> = ({
  status,
  label,
  className = '',
}) => {
  return (
    <span
      className={`
        inline-flex items-center
        px-2 py-0.5
        rounded-full
        text-[11px] font-mono font-semibold
        border
        tracking-wide
        ${STATUS_STYLES[status]}
        ${className}
      `}
    >
      {label ?? DEFAULT_LABELS[status]}
    </span>
  );
};

export default SemanticBadge;
