import React from 'react';
import { usePayPilotStore, PayPilotState } from '../../store/usePayPilotStore';
import { AppRoute } from '../../types';
import {
  LayoutDashboard,
  ShieldAlert,
  GitCompare,
  CalendarClock,
  Sparkles,
  TrendingUp,
  Radar,
  BookOpen,
  Bot,
  CheckCircle2,
  Share2,
  Settings,
  RefreshCw,
  FileText,
} from 'lucide-react';

export interface SidebarProps {
  className?: string;
}

export interface NavItemDef {
  id: AppRoute;
  label: string;
  icon: React.ElementType;
  badge?: (state: PayPilotState) => string | number | null;
  badgeColor?: string;
}

export interface NavGroupDef {
  title: string;
  items: NavItemDef[];
}

export const NAV_GROUPS: NavGroupDef[] = [
  {
    title: 'Overview & Operations',
    items: [
      { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
      {
        id: 'copilot',
        label: 'Agent Copilot',
        icon: Bot,
        badge: () => 'AI',
        badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
      },
    ],
  },
  {
    title: 'Defense & Pre-Payment',
    items: [
      {
        id: 'disputes',
        label: 'Dispute Defense',
        icon: ShieldAlert,
        badge: () => '2 cases',
        badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      },
      {
        id: 'vendor-invoices',
        label: 'Invoice Fraud Shield',
        icon: FileText,
        badge: () => 'Hold',
        badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
      },
    ],
  },
  {
    title: 'Recovery & Ground Truth',
    items: [
      {
        id: 'payback-hunter',
        label: 'PayBack Hunter',
        icon: ShieldAlert,
        badge: (s) => `${s.executiveKpis.activeRecoveryCasesCount} cases`,
        badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      },
      {
        id: 'payment-truth',
        label: 'Payment Truth',
        icon: GitCompare,
        badge: (s) => `${s.reconciliationSummary.unresolvedCount} flag`,
        badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
      },
      {
        id: 'udhari-ledger',
        label: 'Udhari Ledger',
        icon: BookOpen,
        badge: () => '$16.8k',
        badgeColor: 'bg-stone-200/60 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border-stone-300/40 dark:border-white/10',
      },
    ],
  },
  {
    title: 'Projections & Resilience',
    items: [
      {
        id: 'obligations',
        label: 'Obligation Scheduler',
        icon: CalendarClock,
        badge: () => 'Twin',
        badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      },
      {
        id: 'commitments',
        label: 'Commitments',
        icon: CalendarClock,
        badge: () => '$43.2k',
        badgeColor: 'bg-stone-200/60 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border-stone-300/40 dark:border-white/10',
      },
      { id: 'digital-twin', label: 'Financial Digital Twin', icon: Sparkles },
      { id: 'simulation-lab', label: 'Simulation Lab', icon: TrendingUp },
      { id: 'survival-radar', label: 'Survival Radar', icon: Radar },
    ],
  },
  {
    title: 'Governance & Tools',
    items: [
      {
        id: 'approvals',
        label: 'Approvals',
        icon: CheckCircle2,
        badge: (s) => `${s.executiveKpis.pendingApprovalsCount} pend`,
        badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      },
      { id: 'team-sharing', label: 'Team & Sharing', icon: Share2 },
      { id: 'settings', label: 'Settings & Sandbox', icon: Settings },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const store = usePayPilotStore();
  const { activeRoute, setActiveRoute, resetToDemoState } = store;

  return (
    <aside
      data-testid="app-sidebar"
      className={`w-60 shrink-0 select-none flex flex-col justify-between pr-3 border-r border-stone-200/60 dark:border-white/10 ${className}`}
    >
      <div className="flex flex-col min-h-0">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 pt-1 border-b border-stone-200/50 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-400 flex items-center justify-center font-display font-bold text-white text-base shadow-[0_0_14px_-2px_rgba(217,119,6,0.6)]">
              F
            </div>
            <div>
              <h1 className="font-display font-bold text-[15px] tracking-tight text-stone-900 dark:text-stone-50 flex items-center gap-1.5">
                FinCora AI
                <span className="sr-only">PayPilot</span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold">
                  AI
                </span>
              </h1>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                <span className="sr-only">PayPal Hackathon Platform</span>
                Autonomous Financial Defense
              </p>
            </div>
          </div>
        </div>

        {/* Grouped Nav Items (all 12 routes visible) */}
        <nav className="mt-3 space-y-3.5 overflow-y-auto pr-1">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="px-2 text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeRoute === item.id;
                  const badgeValue = item.badge ? item.badge(store) : null;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`nav-item-${item.id}`}
                      onClick={() => setActiveRoute(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[12.5px] font-medium transition-all ${
                        isActive
                          ? 'border border-amber-600/30 bg-amber-600/15 font-semibold text-stone-900 shadow-[0_0_15px_-3px_rgba(217,119,6,0.25)] dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-white'
                          : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500'
                          }`}
                          strokeWidth={1.75}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {badgeValue && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                            item.badgeColor ||
                            'bg-stone-200/60 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border-stone-300/40 dark:border-white/10'
                          }`}
                        >
                          {badgeValue}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer: Sandbox Status + One-Click Judge Reset */}
      <div className="pt-3 border-t border-stone-200/60 dark:border-white/10 space-y-2">
        <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-xl bg-white/40 dark:bg-stone-900/40 border border-stone-200/60 dark:border-white/10">
          <span className="text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            PayPal Sandbox
          </span>
          <span className="text-amber-600 dark:text-amber-400 font-mono text-[10px] font-semibold">REST v2</span>
        </div>

        <button
          type="button"
          data-testid="judge-reset-sidebar-btn"
          onClick={() => {
            const ok = resetToDemoState();
            if (ok && typeof window !== 'undefined' && window.alert) {
              window.alert('Workspace reset to pristine demo fixtures ($142,500 cash, 12 cases, 94d runway).');
            }
          }}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/40 hover:bg-white/60 dark:bg-stone-900/40 dark:hover:bg-stone-800/50 text-stone-700 dark:text-stone-200 text-xs font-medium border border-stone-200/60 dark:border-white/10 hover:border-amber-600/40 dark:hover:border-amber-500/40 transition"
          title="Reset demo data to pristine fixtures"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Judge Reset (One-Click)</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
