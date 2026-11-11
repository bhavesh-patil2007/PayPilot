import React from 'react';

export type DataNumberColor = 'brand' | 'safe' | 'risk' | 'warning' | 'neutral' | 'default';

export interface DataNumberProps {
  /** The numeric value to display (number or pre-formatted string) */
  value: string | number;
  /** Optional semantic colour token */
  color?: DataNumberColor;
  /** Optional accessible label for screen readers */
  'aria-label'?: string;
  className?: string;
}

const COLOR_CLASSES: Record<DataNumberColor, string> = {
  brand:   'text-brand',
  safe:    'text-emerald-600 dark:text-emerald-400',
  risk:    'text-rose-600 dark:text-rose-400',
  warning: 'text-amber-600 dark:text-amber-400',
  neutral: 'text-stone-600 dark:text-stone-400',
  default: 'text-stone-900 dark:text-white',
};

/**
 * DataNumber
 * A monospace text wrapper for financial figures.
 * Enforces `font-mono` and applies an optional semantic colour.
 *
 * Usage:
 *   <DataNumber value={142500} color="safe" />
 *   <DataNumber value="$16.8k" color="risk" />
 *   <DataNumber value={executiveKpis.totalAvailableCash} color="brand" />
 */
export const DataNumber: React.FC<DataNumberProps> = ({
  value,
  color = 'default',
  className = '',
  'aria-label': ariaLabel,
}) => {
  return (
    <span
      aria-label={ariaLabel}
      className={`font-mono tabular-nums ${COLOR_CLASSES[color]} ${className}`}
    >
      {value}
    </span>
  );
};

export default DataNumber;
