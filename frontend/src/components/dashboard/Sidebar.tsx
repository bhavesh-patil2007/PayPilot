import React from 'react';
import {
  LayoutDashboard,
  Network,
  CalendarCheck2,
  FlaskConical,
  Bot,
  BarChart3,
  Settings,
  ArrowUp,
} from 'lucide-react';
import { Logo, RingGauge, Panel } from './primitives';

export interface DashboardSidebarProps {
  activeNav?: string;
  onSelectNav?: (navId: string) => void;
  className?: string;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeNav = 'dashboard',
  onSelectNav,
  className = '',
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'money-map', label: 'Money Map', icon: Network },
    { id: 'commitments', label: 'Commitments', icon: CalendarCheck2 },
    { id: 'simulations', label: 'Simulations', icon: FlaskConical },
    { id: 'copilot', label: 'Copilot', icon: Bot },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`flex w-[200px] shrink-0 flex-col justify-between self-stretch pr-2 ${className}`}>
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-2 pb-6 pt-1">
          <Logo size={28} />
          <div>
            <h1 className="font-display text-[18px] font-bold tracking-tight text-stone-900 dark:text-white">
              FinCora AI
            </h1>
            <p className="font-sans text-[9px] text-stone-500 dark:text-stone-400">
              Recover · Protect · Decide
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectNav?.(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[12.5px] font-medium transition-all ${
                  isActive
                    ? 'border border-amber-600/30 bg-amber-600/15 font-semibold text-stone-900 shadow-[0_0_15px_-3px_rgba(217,119,6,0.25)] dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-white'
                    : 'text-stone-600 hover:bg-white/50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-100'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? 'text-amber-600 dark:text-amber-400' : 'opacity-80'
                  }`}
                  strokeWidth={1.75}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Business Health Mini Card (as shown in image) */}
      <Panel strong className="mt-auto p-4 border border-stone-200/50 dark:border-white/10">
        <p className="font-display text-[12px] font-semibold text-stone-900 dark:text-stone-100">
          Business Health
        </p>
        <div className="mt-3 flex items-center gap-3">
          <RingGauge value={92} size={58} stroke={5} strokeColor="#10B981">
            <span className="font-display text-[17px] font-bold text-stone-900 dark:text-white">
              92
            </span>
          </RingGauge>
          <div>
            <p className="text-[12px] font-semibold text-stone-900 dark:text-white">Excellent</p>
            <p className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <ArrowUp className="h-3 w-3" /> +6%
            </p>
          </div>
        </div>
      </Panel>
    </aside>
  );
};
export default DashboardSidebar;
