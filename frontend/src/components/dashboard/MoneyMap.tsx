import React from 'react';
import { UserRound, ShoppingCart, FileText, CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';
import { Panel, PanelHeader } from './primitives';

export interface MoneyMapProps {
  onViewDetails?: () => void;
}

export const MoneyMap: React.FC<MoneyMapProps> = ({ onViewDetails }) => {
  const steps = [
    { id: 'customer', label: 'Customer', icon: UserRound, status: 'copper' },
    { id: 'order', label: 'Order', icon: ShoppingCart, status: 'default' },
    { id: 'invoice', label: 'Invoice', icon: FileText, status: 'default' },
    { id: 'payment', label: 'Payment', icon: CreditCard, status: 'copper' },
    { id: 'settlement', label: 'Settlement', icon: CheckCircle2, status: 'success' },
  ];

  const legend = [
    { label: 'Healthy', color: 'bg-emerald-500' },
    { label: 'Needs Review', color: 'bg-amber-500' },
    { label: 'At Risk', color: 'bg-rose-500' },
  ];

  return (
    <Panel className="flex flex-col justify-between">
      <PanelHeader title="Money Map" action="View Details" onActionClick={onViewDetails} />

      {/* Horizontal Flowchart */}
      <div className="flex flex-1 items-center justify-between gap-1 overflow-x-auto py-6 px-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isSuccess = step.status === 'success';
          const isCopper = step.status === 'copper';

          return (
            <React.Fragment key={step.id}>
              <div className="flex min-w-[70px] flex-col items-center gap-2.5">
                <div
                  className={`glass-chip flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 hover:scale-105 ${
                    isSuccess
                      ? 'border-emerald-500/50 shadow-[0_0_18px_-4px_rgba(16,185,129,0.4)]'
                      : isCopper
                      ? 'border-amber-600/40 shadow-[0_0_18px_-4px_rgba(217,119,6,0.3)]'
                      : 'border-white/20 dark:border-white/10'
                  }`}
                >
                  {isSuccess ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_14px_rgba(16,185,129,0.6)]">
                      <Icon className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                  ) : (
                    <Icon
                      className={`h-6 w-6 ${
                        isCopper
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-stone-700 dark:text-stone-300'
                      }`}
                      strokeWidth={1.75}
                    />
                  )}
                </div>
                <span className="text-[12px] font-medium text-stone-700 dark:text-stone-300">
                  {step.label}
                </span>
              </div>

              {/* Connecting line with arrow */}
              {idx < steps.length - 1 && (
                <div className="relative mb-6 h-0.5 min-w-[24px] flex-1 bg-gradient-to-r from-amber-600/30 via-amber-600/70 to-amber-600/30">
                  <span className="absolute -right-1 -top-[4px] h-2.5 w-2.5 rotate-45 border-r-2 border-t-2 border-amber-600 dark:border-amber-500" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-5 pt-2 border-t border-stone-200/40 dark:border-white/10">
        {legend.map((item) => (
          <span
            key={item.label}
            className="inline-flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 font-medium"
          >
            <span className={`h-2 w-2 rounded-full ${item.color} shadow-sm`} />
            {item.label}
          </span>
        ))}
      </div>
    </Panel>
  );
};
export default MoneyMap;
