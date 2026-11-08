import React from 'react';
import { usePayPilotStore } from '../../store/usePayPilotStore';
import { DollarSign, AlertCircle, Activity, Sparkles } from 'lucide-react';
import { NAV_GROUPS } from './Sidebar';
import { AppRoute } from '../../types';

export interface HeaderProps {
  onToggleStepper?: () => void;
  isStepperOpen?: boolean;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleStepper,
  isStepperOpen = false,
  className = '',
}) => {
  const {
    activeRoute,
    executiveKpis,
    demoActStepper,
    setDemoAct,
    setActiveRoute,
  } = usePayPilotStore();

  // Find current route label & group
  let currentGroup = 'Workspace';
  let currentLabel: string = activeRoute;
  for (const g of NAV_GROUPS) {
    const found = g.items.find((i) => i.id === activeRoute);
    if (found) {
      currentGroup = g.title;
      currentLabel = found.label;
      break;
    }
  }

  const actRoutes: AppRoute[] = [
    'payback-hunter',
    'payment-truth',
    'approvals',
    'commitments',
    'team-sharing',
  ];

  return (
    <header
      data-testid="app-header"
      className={`h-14 border-b border-slate-800 bg-obsidian-900/70 px-6 flex items-center justify-between shrink-0 backdrop-blur-md ${className}`}
    >
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-slate-500 hidden sm:inline">{currentGroup}</span>
        <span className="text-slate-600 hidden sm:inline">/</span>
        <h2 className="text-sm font-semibold text-slate-100 font-mono tracking-wide">
          {currentLabel}
        </h2>
      </div>

      {/* Center: 5-Act Stepper Quick Nav */}
      <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-obsidian-950 border border-slate-800">
        {[1, 2, 3, 4, 5].map((act) => {
          const isCurrent = demoActStepper.currentAct === act;
          return (
            <button
              key={act}
              type="button"
              data-testid={`header-act-btn-${act}`}
              onClick={() => {
                setDemoAct(act as 1 | 2 | 3 | 4 | 5);
                setActiveRoute(actRoutes[act - 1]);
              }}
              className={`text-[10px] px-2.5 py-0.5 rounded font-mono transition ${
                isCurrent
                  ? 'bg-paypal-blue text-white font-bold shadow-glow-paypal'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Act {act}
            </button>
          );
        })}
      </div>

      {/* Right: Live Telemetry & Stepper Trigger */}
      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-slate-300">
          <DollarSign className="w-3.5 h-3.5 text-fintech-green" />
          <span className="text-slate-500 hidden lg:inline">Cash:</span>
          <span className="font-semibold text-white">
            ${(executiveKpis.totalAvailableCash / 1000).toFixed(1)}k
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-300">
          <AlertCircle className="w-3.5 h-3.5 text-paypal-cyan" />
          <span className="text-slate-500 hidden lg:inline">Recoverable:</span>
          <span className="font-semibold text-paypal-cyan">
            ${(executiveKpis.identifiedLostRevenue / 1000).toFixed(1)}k
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-300">
          <Activity className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-slate-500 hidden lg:inline">Runway:</span>
          <span className="font-semibold text-emerald-400">
            {executiveKpis.financialRunwayDays}d
          </span>
        </div>

        {onToggleStepper && (
          <button
            type="button"
            data-testid="toggle-stepper-btn"
            onClick={onToggleStepper}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-sans font-medium transition border ${
              isStepperOpen
                ? 'bg-paypal-blue/20 text-paypal-cyan border-paypal-cyan/40 shadow-glow-paypal'
                : 'bg-obsidian-950 text-slate-300 border-slate-800 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-paypal-cyan" />
            <span className="hidden sm:inline">Demo Stepper</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
