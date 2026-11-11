import React, { useState } from 'react';
import { usePayPilotStore } from './store/usePayPilotStore';
import { Layout } from './components/layout/Layout';
import { ExplainabilityDrawer } from './components/common/ExplainabilityDrawer';
import { DemoFlowStepper } from './components/common/DemoFlowStepper';

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
  SponsorIntegrationsView,
  SettingsView,
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
      case 'sponsor-integrations':
        return <SponsorIntegrationsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <CommandCenterView />;
    }
  };

  return (
    <Layout
      onToggleStepper={() => setIsStepperOpen(!isStepperOpen)}
      isStepperOpen={isStepperOpen}
    >
      {renderActiveView()}

      <ExplainabilityDrawer />

      {isStepperOpen && (
        <DemoFlowStepper
          isFloating={true}
          onClose={() => setIsStepperOpen(false)}
        />
      )}
    </Layout>
  );
}
