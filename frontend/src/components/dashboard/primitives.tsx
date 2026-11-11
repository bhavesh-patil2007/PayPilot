import React, { useId, type ReactNode } from 'react';

export interface PanelProps {
  className?: string;
  children: ReactNode;
  strong?: boolean;
}

export const Panel: React.FC<PanelProps> = ({
  className = '',
  children,
  strong = false,
}) => {
  return (
    <section
      className={`glass relative overflow-hidden rounded-2xl p-5 ${
        strong ? 'bg-white/60 dark:bg-stone-900/60' : ''
      } ${className}`}
    >
      {/* 1px subtle top sheen */}
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
      {children}
    </section>
  );
};

export interface PanelHeaderProps {
  title: ReactNode;
  action?: string;
  onActionClick?: () => void;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  action,
  onActionClick,
}) => {
  return (
    <div className="flex items-center justify-between pb-3">
      <h2 className="font-display text-[15px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">
        {title}
      </h2>
      {action && (
        <button
          type="button"
          onClick={onActionClick}
          className="group inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-400 transition-colors"
        >
          {action}
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </button>
      )}
    </div>
  );
};

export interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 28 }) => {
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="55%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
      {/* Stylized geometric F / P ribbon mark */}
      <path
        d="M6 6C6 4.89543 6.89543 4 8 4H20C24.4183 4 28 7.58172 28 12C28 16.4183 24.4183 20 20 20H13V26C13 27.1046 12.1046 28 11 28H8C6.89543 28 6 27.1046 6 26V6Z"
        fill={`url(#${id})`}
      />
      <circle cx="17.5" cy="12" r="3.5" fill="var(--background, #0c0a09)" />
      <path
        d="M13 14H19C20.1046 14 21 13.1046 21 12C21 10.8954 20.1046 10 19 10H13V14Z"
        fill={`url(#${id})`}
        opacity="0.8"
      />
    </svg>
  );
};

export interface RingGaugeProps {
  value: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  strokeColor?: string;
}

export const RingGauge: React.FC<RingGaugeProps> = ({
  value,
  size = 96,
  stroke = 7,
  children,
  strokeColor = '#10B981',
}) => {
  const id = useId();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={strokeColor} />
            <stop offset="70%" stopColor={strokeColor} />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-stone-200/60 dark:text-stone-800/80"
        />
        {/* Filled Gauge */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
};
