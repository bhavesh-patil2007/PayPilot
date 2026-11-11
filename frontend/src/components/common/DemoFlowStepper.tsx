import React, { useState } from 'react';
import { usePayPilotStore } from '../../store/usePayPilotStore';
import { AppRoute } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  X,
  ExternalLink,
  ShieldAlert,
  GitCompare,
  CheckCircle2,
  CalendarClock,
  Share2,
  Maximize2,
  Minimize2,
  Zap,
} from 'lucide-react';

export interface DemoFlowStepperProps {
  className?: string;
  isFloating?: boolean;
  onClose?: () => void;
}

export interface ActDefinition {
  act: 1 | 2 | 3 | 4 | 5;
  name: string;
  route: AppRoute;
  icon: React.ElementType;
  headline: string;
  narrative: string;
  keyHighlight: string;
  quickActionLabel: string;
  quickActionRoute: AppRoute;
}

export const ACT_DEFINITIONS: ActDefinition[] = [
  {
    act: 1,
    name: 'Find',
    route: 'payback-hunter',
    icon: ShieldAlert,
    headline: 'Act 1: Autonomous Leakage Detection',
    narrative: 'PayBack Hunter looks through your payments and finds $18,450.00 in fees you can claim back.',
    keyHighlight: 'Case REC-101: $1,420.00 Duplicate Processing Fee on Black Friday Batch #9812.',
    quickActionLabel: 'Inspect Case REC-101 Formula',
    quickActionRoute: 'payback-hunter',
  },
  {
    act: 2,
    name: 'Prove',
    route: 'payment-truth',
    icon: GitCompare,
    headline: 'Act 2: Deterministic 3-Way Reconciliation',
    narrative: 'Payment Truth lines up PayPal, your bank, and your invoices so you can see where they disagree.',
    keyHighlight: 'Record REC-TRUTH-101: $1,420.00 variance isolated between PayPal and Bank statement.',
    quickActionLabel: 'Inspect 3-Way Discrepancy',
    quickActionRoute: 'payment-truth',
  },
  {
    act: 3,
    name: 'Recover',
    route: 'approvals',
    icon: CheckCircle2,
    headline: 'Act 3: Governed Execution via PayPal Sandbox',
    narrative: 'You read the exact request that would go to PayPal, then approve a practice refund yourself.',
    keyHighlight: 'Approval APR-9941: Liquid cash immediately increments from $142,500 to $143,920.',
    quickActionLabel: 'Review Governed Approval',
    quickActionRoute: 'approvals',
  },
  {
    act: 4,
    name: 'Protect',
    route: 'commitments',
    icon: CalendarClock,
    headline: 'Act 4: Digital Twin & Commitment Firewall',
    narrative: 'Money you recover shows up in your cash picture. New orders are checked against your safety cushion.',
    keyHighlight: 'A $35,000 order triggers buffer alert; tuning deposit slider to 40% preserves 95-day runway.',
    quickActionLabel: 'Test Order in Commitments',
    quickActionRoute: 'commitments',
  },
  {
    act: 5,
    name: 'Share',
    route: 'team-sharing',
    icon: Share2,
    headline: 'Act 5: Cryptographic Tamper-Proof Sharing',
    narrative: 'Create a report others can verify has not been changed, and share a link that expires.',
    keyHighlight: 'Cryptographic Proof Badge: sha256:d68ce70c... with 48-hour scoped access.',
    quickActionLabel: 'Generate Signed Audit Pack',
    quickActionRoute: 'team-sharing',
  },
];

export const DemoFlowStepper: React.FC<DemoFlowStepperProps> = ({
  className = '',
  isFloating = false,
  onClose,
}) => {
  const {
    demoActStepper,
    setDemoAct,
    setActiveRoute,
    resetToDemoState,
    openExplainability,
    setSelectedDiscrepancyId,
  } = usePayPilotStore();

  const [isMinimized, setIsMinimized] = useState(false);

  const currentAct = demoActStepper.currentAct;
  const currentDef = ACT_DEFINITIONS.find((d) => d.act === currentAct) || ACT_DEFINITIONS[0];

  const handleActChange = (act: 1 | 2 | 3 | 4 | 5) => {
    setDemoAct(act);
    const def = ACT_DEFINITIONS.find((d) => d.act === act);
    if (def) {
      setActiveRoute(def.route);
    }
  };

  const handleNext = () => {
    if (currentAct < 5) {
      handleActChange((currentAct + 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const handlePrev = () => {
    if (currentAct > 1) {
      handleActChange((currentAct - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const handleQuickAction = () => {
    setActiveRoute(currentDef.quickActionRoute);
    if (currentAct === 1) {
      openExplainability('RULE-DUP-FEE-02', 'REC-101');
    } else if (currentAct === 2) {
      setSelectedDiscrepancyId('REC-TRUTH-101');
    }
  };

  const containerClasses = isFloating
    ? 'fixed bottom-6 right-6 z-40 max-w-lg w-full shadow-2xl rounded-2xl bg-white/40 dark:bg-stone-900/50 border border-paypal-cyan/40 shadow-glow-paypal animate-in fade-in slide-in-from-bottom-4'
    : 'w-full glass tone-glow rounded-2xl';

  if (isMinimized) {
    return (
      <div
        data-testid="demo-stepper-minimized"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 p-2.5 rounded-xl bg-white/40 dark:bg-stone-900/50 border border-paypal-cyan/50 shadow-glow-paypal text-xs text-white cursor-pointer"
        onClick={() => setIsMinimized(false)}
      >
        <Sparkles className="w-4 h-4 text-paypal-cyan" />
        <span className="font-mono font-bold">Act {currentAct}: {currentDef.name}</span>
        <Maximize2 className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 hover:text-white ml-1" />
      </div>
    );
  }

  return (
    <div data-testid="demo-flow-stepper" className={`${containerClasses} ${className}`}>
      {/* Header & Act Stepper Bar */}
      <div className="p-4 border-b border-stone-200/60 dark:border-white/10 flex items-center justify-between bg-white/50 dark:bg-stone-950/70 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-paypal-blue/20 text-paypal-cyan border border-paypal-cyan/30 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider font-mono">
              3-Minute Hackathon Demo Narrative
            </h4>
            <span className="text-[10px] text-stone-500 dark:text-stone-400">Step through PayPilot end-to-end</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="minimize-stepper-btn"
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded text-stone-500 dark:text-stone-400 hover:text-white hover:bg-stone-200/80 dark:hover:bg-stone-800/80 transition"
            title="Minimize Stepper"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              type="button"
              data-testid="close-stepper-btn"
              onClick={onClose}
              className="p-1 rounded text-stone-500 dark:text-stone-400 hover:text-white hover:bg-stone-200/80 dark:hover:bg-stone-800/80 transition"
              title="Close Stepper"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 5-Segment Progress Buttons */}
      <div className="px-4 pt-3 pb-2 grid grid-cols-5 gap-1.5 border-b border-stone-200/50 dark:border-white/10">
        {ACT_DEFINITIONS.map((def) => {
          const isActive = def.act === currentAct;
          const isDone = def.act < currentAct;
          return (
            <button
              key={def.act}
              type="button"
              data-testid={`demo-act-btn-${def.act}`}
              onClick={() => handleActChange(def.act)}
              className={`py-1.5 px-2 rounded-lg text-center transition flex flex-col items-center gap-0.5 border ${
                isActive
                  ? 'bg-paypal-blue text-white border-paypal-cyan shadow-glow-paypal font-bold'
                  : isDone
                  ? 'bg-stone-200/70 dark:bg-stone-800/80 text-emerald-400 border-stone-300/70 dark:border-white/10 font-medium'
                  : 'bg-white/50 dark:bg-stone-950/60 text-stone-500 dark:text-stone-400 border-stone-200/60 dark:border-white/10 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <span className="text-[10px] font-mono leading-none">Act {def.act}</span>
              <span className="text-[11px] leading-tight truncate w-full">{def.name}</span>
            </button>
          );
        })}
      </div>

      {/* Narration Body Card */}
      <div className="p-4 space-y-3">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-paypal-cyan font-bold">
            {currentDef.headline}
          </span>
          <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
            {currentDef.narrative}
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 text-xs font-mono text-stone-700 dark:text-stone-200 flex items-center justify-between">
          <span className="text-stone-500 dark:text-stone-400 text-[11px]">Proof Moment:</span>
          <span className="font-semibold text-paypal-cyan text-[11px] text-right truncate ml-2">
            {currentDef.keyHighlight}
          </span>
        </div>

        <button
          type="button"
          data-testid="demo-quick-action-btn"
          onClick={handleQuickAction}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-paypal-blue to-paypal-dark hover:from-paypal-cyan hover:to-paypal-blue text-white font-semibold text-xs transition shadow-glow-paypal"
        >
          <Zap className="w-3.5 h-3.5 text-paypal-cyan" />
          <span>{currentDef.quickActionLabel}</span>
        </button>
      </div>

      {/* Stepper Footer Navigation Controls */}
      <div className="p-3 bg-white/50 dark:bg-stone-950/80 rounded-b-2xl border-t border-stone-200/60 dark:border-white/10 flex items-center justify-between">
        <button
          type="button"
          data-testid="judge-reset-stepper-btn"
          onClick={() => resetToDemoState()}
          className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 hover:text-paypal-cyan font-mono transition"
          title="Reset entire demo workspace"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Judge Reset</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="demo-prev-act-btn"
            onClick={handlePrev}
            disabled={currentAct === 1}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-200/70 dark:bg-stone-800/70 hover:bg-stone-300/80 dark:hover:bg-stone-700/80 text-stone-600 dark:text-stone-300 text-xs disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <button
            type="button"
            data-testid="demo-next-act-btn"
            onClick={handleNext}
            disabled={currentAct === 5}
            className="flex items-center gap-1 px-3 py-1 rounded bg-stone-200/70 dark:bg-stone-800/70 hover:bg-stone-300/80 dark:hover:bg-stone-700/80 text-white text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <span>Next Act</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoFlowStepper;
