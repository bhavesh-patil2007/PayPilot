import React, { useState } from 'react';
import { usePayPilotStore } from './store/usePayPilotStore';
import { Layout } from './components/layout/Layout';
import { ExplainabilityDrawer } from './components/common/ExplainabilityDrawer';
import { DemoFlowStepper } from './components/common/DemoFlowStepper';
import { AuthView } from './views/AuthView';
import { AppAuthSession, clearDemoSession, restoreDemoSession, saveDemoSession } from './services/appAuth';
import { clearSupabaseSession } from './services/supabaseSession';
import { LogOut } from 'lucide-react';

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
  const [authSession, setAuthSession] = useState<AppAuthSession | null>(() => restoreDemoSession());

  const handleAuthenticated = (mode: AppAuthSession['mode'], email: string) => {
    if (mode === 'demo') {
      setAuthSession(saveDemoSession(email));
    } else {
      clearDemoSession();
      setAuthSession({ mode, email });
    }
  };

  const handleSignOut = () => {
    clearDemoSession();
    clearSupabaseSession();
    setAuthSession(null);
  };

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

  if (!authSession) {
    return <AuthView onAuthenticated={handleAuthenticated} />;
  }

  return (
    <Layout
      onToggleStepper={() => setIsStepperOpen(!isStepperOpen)}
      isStepperOpen={isStepperOpen}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-stone-900/50 px-4 py-3 text-xs text-stone-300 backdrop-blur-lg">
        <span>
          {authSession.mode === 'demo'
            ? <>Demo workspace · sample data · <span className="text-amber-300">no Supabase session</span></>
            : <>Supabase session · <span className="text-emerald-300">{authSession.email}</span></>}
        </span>
        <button type="button" onClick={handleSignOut} className="inline-flex items-center gap-1.5 text-stone-400 transition hover:text-white">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
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
