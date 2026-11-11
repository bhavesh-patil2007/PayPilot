import React, { useState } from 'react';
import { usePayPilotStore } from './store/usePayPilotStore';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ExplainabilityDrawer } from './components/common/ExplainabilityDrawer';
import { DemoFlowStepper } from './components/common/DemoFlowStepper';
import { ThreeCanvasContainer } from './components/3d/ThreeCanvasContainer';
import { AmbientScene } from './components/3d/scenes/AmbientScene';

// 12 Core Views
import {
  CommandCenterView,
  PayBackHunterView,
  PaymentTruthView,
  CommitmentsView,
  DigitalTwinView,
  SimulationLabView,
  SurvivalRadarView,
  UdhariLedgerView,
  CopilotView,
  ApprovalsView,
  TeamSharingView,
  SettingsView,
  SponsorIntegrationsView,
} from './views';

export default function App() {
  const { activeRoute } = usePayPilotStore();
  const [isStepperOpen, setIsStepperOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeRoute) {
      case 'command-center':
        return <CommandCenterView />;
      case 'payback-hunter':
        return <PayBackHunterView />;
      case 'payment-truth':
        return <PaymentTruthView />;
      case 'commitments':
        return <CommitmentsView />;
      case 'digital-twin':
        return <DigitalTwinView />;
      case 'simulation-lab':
        return <SimulationLabView />;
      case 'survival-radar':
        return <SurvivalRadarView />;
      case 'udhari-ledger':
        return <UdhariLedgerView />;
      case 'copilot':
        return <CopilotView />;
      case 'approvals':
        return <ApprovalsView />;
      case 'team-sharing':
        return <TeamSharingView />;
      case 'settings':
        return <SettingsView />;
      case 'sponsor-integrations':
        return <SponsorIntegrationsView />;
      default:
        return <CommandCenterView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-obsidian-950 text-slate-100 font-sans relative">
      {/* 1. Ambient 3D Particle Constellation Background (Non-blocking) */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-25">
        <ThreeCanvasContainer
          controllerFactory={() => new AmbientScene()}
          data={{ particleDensity: 'sparse', opacity: 0.22 }}
          ariaLabel="PayPilot Ambient Background Particle Constellation"
          className="w-full h-full"
        />
      </div>

      {/* 2. Responsive Sidebar Navigation */}
      <Sidebar className="relative z-10" />

      {/* 3. Main Application Workspace Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <Header
          onToggleStepper={() => setIsStepperOpen(!isStepperOpen)}
          isStepperOpen={isStepperOpen}
        />

        <main data-testid="app-view-container" className="flex-1 overflow-y-auto p-6 bg-obsidian-950/70">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* 4. Global Explainability Drawer Slide-Over */}
      <ExplainabilityDrawer />

      {/* 5. 5-Act Hackathon Demo Flow Stepper (Floating Controller) */}
      {isStepperOpen && (
        <DemoFlowStepper
          isFloating={true}
          onClose={() => setIsStepperOpen(false)}
        />
      )}
    </div>
  );
}
