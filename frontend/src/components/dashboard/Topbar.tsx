import React from 'react';
import { Bell, Sun, Moon } from 'lucide-react';
import { Logo } from './primitives';

export interface TopbarProps {
  userName?: string;
  subtitle?: string;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onOpenNotifications?: () => void;
  className?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  userName = 'Manjiri',
  subtitle = "Here's what needs your attention today.",
  isDark,
  onToggleTheme,
  onOpenNotifications,
  className = '',
}) => {
  return (
    <header className={`flex items-start justify-between gap-4 pb-1 ${className}`}>
      {/* Left Greeting */}
      <div className="flex items-center gap-3">
        <Logo className="lg:hidden" size={28} />
        <div>
          <h1 className="font-display text-[20px] font-bold tracking-tight text-stone-900 dark:text-stone-50">
            Good morning, {userName}
          </h1>
          <p className="mt-0.5 text-[12px] text-stone-500 dark:text-stone-400">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* PayPal Status Badge */}
        <span className="glass-chip hidden items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-medium text-stone-700 dark:text-stone-200 sm:inline-flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Connected to PayPal
        </span>

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="glass-chip flex h-9 w-9 items-center justify-center rounded-full text-stone-600 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4" strokeWidth={1.75} /> : <Moon className="h-4 w-4" strokeWidth={1.75} />}
          </button>
        )}

        {/* Notification Bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          aria-label="Notifications"
          className="glass-chip relative flex h-9 w-9 items-center justify-center rounded-full text-stone-700 dark:text-stone-200 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-500" />
        </button>

        {/* User Avatar */}
        <div className="rounded-full bg-gradient-to-tr from-amber-600 to-orange-400 p-[1.5px] shadow-[0_0_12px_-2px_rgba(217,119,6,0.5)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-900 font-display text-[13px] font-bold text-amber-700 dark:text-amber-400">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Topbar;
