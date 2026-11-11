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
  Puzzle,
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
        badgeColor: 'bg-paypal-blue/20 text-paypal-cyan border-paypal-cyan/30',
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
        badgeColor: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
      },
      {
        id: 'payment-truth',
        label: 'Payment Truth',
        icon: GitCompare,
        badge: (s) => `${s.reconciliationSummary.unresolvedCount} flag`,
        badgeColor: 'bg-rose-950/60 text-rose-300 border-rose-500/30',
      },
      {
        id: 'udhari-ledger',
        label: 'Udhari Ledger',
        icon: BookOpen,
        badge: () => '$16.8k',
        badgeColor: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30',
      },
    ],
  },
  {
    title: 'Projections & Resilience',
    items: [
      {
        id: 'commitments',
        label: 'Commitments',
        icon: CalendarClock,
        badge: () => '$43.2k',
        badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
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
        badgeColor: 'bg-purple-950/60 text-purple-300 border-purple-500/30',
      },
      { id: 'team-sharing', label: 'Team & Sharing', icon: Share2 },
      { id: 'sponsor-integrations', label: 'Sponsor Integrations', icon: Puzzle },
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
      className={`w-64 border-r border-slate-800/80 bg-obsidian-900/95 flex flex-col justify-between shrink-0 select-none ${className}`}
    >
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-paypal-blue to-paypal-cyan flex items-center justify-center font-mono font-bold text-white text-base shadow-glow-paypal">
              P
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                PayPilot
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-paypal-blue/20 text-paypal-cyan border border-paypal-cyan/30">
                  AI
                </span>
              </h1>
              <p className="text-[10px] text-slate-400">PayPal Hackathon Platform</p>
            </div>
          </div>
        </div>

        {/* Grouped Nav Items */}
        <nav className="p-2 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
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
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-paypal-blue/20 text-white border border-paypal-blue/40 shadow-glow-paypal font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-paypal-cyan' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {badgeValue && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                            item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
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
      <div className="p-3 border-t border-slate-800 space-y-2 bg-obsidian-950/50">
        <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-fintech-green animate-pulse" />
            PayPal Sandbox
          </span>
          <span className="text-paypal-cyan font-mono text-[10px]">REST v2</span>
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
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          title="Reset demo data to pristine fixtures"
        >
          <RefreshCw className="w-3.5 h-3.5 text-paypal-cyan" />
          <span>Judge Reset (One-Click)</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
