import React, { ReactNode } from 'react';
import { Header } from './Header';
import { ThreeCanvasContainer } from '../3d/ThreeCanvasContainer';
import { AmbientScene } from '../3d/scenes/AmbientScene';

export interface LayoutProps {
  children: ReactNode;
  onToggleStepper?: () => void;
  isStepperOpen?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  onToggleStepper,
  isStepperOpen,
}) => {
  return (
    <div className="relative min-h-screen overflow-x-hidden isolate bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-50 transition-colors duration-500 font-sans flex flex-col">
      {/* 1. Silky Copper Waves Global Background (-z-20) */}
      <div
        className="pointer-events-none fixed inset-0 w-full min-h-screen bg-[url('/bg-waves.jpg')] bg-cover bg-center bg-fixed opacity-25 dark:opacity-40 dark:invert dark:hue-rotate-180 dark:brightness-75 dark:contrast-125 -z-20 transition-all duration-500"
        aria-hidden="true"
      />

      {/* 2. Soft Contrast Overlay (-z-10) */}
      <div
        className="pointer-events-none fixed inset-0 bg-stone-950/20 opacity-0 dark:opacity-100 transition-opacity duration-500 -z-10"
        aria-hidden="true"
      />

      {/* 3. Ambient 3D Particle Constellation (z-0) */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-25">
        <ThreeCanvasContainer
          controllerFactory={() => new AmbientScene()}
          data={{ particleDensity: 'sparse', opacity: 0.22 }}
          ariaLabel="FinCora AI Ambient Background Particle Constellation"
          className="w-full h-full"
        />
      </div>

      {/* Ambient Copper Glow Orbs */}
      <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-amber-600/20 blur-[100px] z-0" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-amber-600/10 blur-[100px] z-0" />

      {/* Global Top Navbar */}
      <Header
        onToggleStepper={onToggleStepper}
        isStepperOpen={isStepperOpen}
      />

      {/* Main Glass Content Viewport */}
      <main className="relative z-10 flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-transparent">
        <div data-testid="app-view-container" className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
