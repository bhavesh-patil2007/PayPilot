import React, { useState, useEffect } from 'react';
import { DashboardSidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MetricCards } from './MetricCards';
import { MoneyMap } from './MoneyMap';
import { BusinessHealth } from './BusinessHealth';
import { CommitmentTimeline } from './CommitmentTimeline';
import { CopilotCard } from './CopilotCard';

export interface FinCoraDashboardProps {
  onNavigate?: (route: string) => void;
  className?: string;
}

export const FinCoraDashboard: React.FC<FinCoraDashboardProps> = ({
  onNavigate,
  className = '',
}) => {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains('dark')
  );

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const handleSelectNav = (navId: string) => {
    setActiveNav(navId);
    if (onNavigate) {
      onNavigate(navId);
    }
  };

  return (
    <div className={`relative min-h-screen overflow-hidden bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-50 transition-colors duration-300 font-sans ${className}`}>
      {/* Ambient background glow orbs */}
      <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-amber-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-amber-600/10 blur-3xl" />

      {/* Main Container */}
      <div className="relative mx-auto flex min-h-screen max-w-[1320px] items-center p-4 sm:p-6 lg:p-8">
        <div className="glass-frame flex w-full gap-6 rounded-[28px] p-4 sm:p-6 shadow-2xl">
          {/* Sidebar */}
          <DashboardSidebar
            activeNav={activeNav}
            onSelectNav={handleSelectNav}
          />

          {/* Main Dashboard Content */}
          <main className="flex min-w-0 flex-1 flex-col gap-4">
            {/* Topbar / Header */}
            <Topbar
              isDark={isDark}
              onToggleTheme={toggleTheme}
            />

            {/* 4 Metric Cards */}
            <MetricCards />

            {/* Middle Row: Money Map + Business Health */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_310px]">
              <MoneyMap />
              <BusinessHealth score={92} rating="Excellent" />
            </div>

            {/* Bottom Row: Commitment Timeline + AI Copilot */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_310px]">
              <CommitmentTimeline />
              <CopilotCard />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
export default FinCoraDashboard;
