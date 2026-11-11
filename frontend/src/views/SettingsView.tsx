import React, { useState, useEffect } from 'react';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { sandboxService, SandboxAuditEntry } from '../services/sandboxService';
import {
  Settings,
  ShieldCheck,
  Key,
  Eye,
  EyeOff,
  Activity,
  RefreshCw,
  Server,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Lock,
  Radio,
  Clock,
  Terminal,
  Save,
  Check,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    paypalConfig,
    updatePayPalConfig,
    pingPayPalWebhook,
    resetToDemoState,
  } = usePayPilotStore();

  const [showSecret, setShowSecret] = useState(false);
  const [clientId, setClientId] = useState(paypalConfig.clientId);
  const [clientSecret, setClientSecret] = useState('');
  const [environment, setEnvironment] = useState<'SANDBOX' | 'LIVE'>(paypalConfig.environment);
  const [showLiveWarning, setShowLiveWarning] = useState(false);

  // Latency & Error Rate sliders
  const [simulatedLatency, setSimulatedLatency] = useState(
    paypalConfig.simulatorToggles.simulateApiLatencyMs || 800
  );
  const [networkErrorRate, setNetworkErrorRate] = useState(
    paypalConfig.simulatorToggles.simulateNetworkErrorRatePct || 0
  );
  const [autoCreditReserve, setAutoCreditReserve] = useState(
    paypalConfig.simulatorToggles.autoCreditReserveOnDispute ?? true
  );

  // Backend Endpoints
  const [useLiveBackend, setUseLiveBackend] = useState(false);
  const [fastApiUrl, setFastApiUrl] = useState('http://localhost:8000');
  const [supabaseUrl, setSupabaseUrl] = useState('https://your-project.supabase.co');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  const [backendSaved, setBackendSaved] = useState(false);

  // Webhook Ping Test
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{
    latencyMs: number;
    status: string;
    timestamp: string;
  } | null>(null);

  // Reset Feedback Toast
  const [resetToast, setResetToast] = useState(false);

  // Audit Trail
  const [auditTrail, setAuditTrail] = useState<SandboxAuditEntry[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(true);

  useEffect(() => {
    setAuditTrail(sandboxService.getAuditTrail());
  }, [pingResult, resetToast]);

  const handleToggleEnvironment = (newEnv: 'SANDBOX' | 'LIVE') => {
    if (newEnv === 'LIVE') {
      setShowLiveWarning(true);
    } else {
      setShowLiveWarning(false);
      setEnvironment('SANDBOX');
      updatePayPalConfig({ environment: 'SANDBOX' });
    }
  };

  const handleConfirmLive = () => {
    setEnvironment('LIVE');
    updatePayPalConfig({ environment: 'LIVE' });
    setShowLiveWarning(false);
  };

  const handlePing = async () => {
    setIsPinging(true);
    try {
      const res = await pingPayPalWebhook();
      setPingResult({
        latencyMs: res.latencyMs,
        status: res.status,
        timestamp: new Date().toLocaleTimeString(),
      });
      setAuditTrail(sandboxService.getAuditTrail());
    } catch (err) {
      console.error('Ping failed', err);
    } finally {
      setIsPinging(false);
    }
  };

  const handleLatencyChange = (val: number) => {
    setSimulatedLatency(val);
    updatePayPalConfig({
      simulatorToggles: {
        ...paypalConfig.simulatorToggles,
        simulateApiLatencyMs: val,
      },
    });
    sandboxService.configure({ simulatedLatencyMs: val });
  };

  const handleErrorRateChange = (val: number) => {
    setNetworkErrorRate(val);
    updatePayPalConfig({
      simulatorToggles: {
        ...paypalConfig.simulatorToggles,
        simulateNetworkErrorRatePct: val,
      },
    });
  };

  const handleAutoCreditToggle = (checked: boolean) => {
    setAutoCreditReserve(checked);
    updatePayPalConfig({
      simulatorToggles: {
        ...paypalConfig.simulatorToggles,
        autoCreditReserveOnDispute: checked,
      },
    });
  };

  const handleSaveBackend = () => {
    sandboxService.configure({
      useLiveBackend,
      apiBaseUrl: fastApiUrl,
    });
    setBackendSaved(true);
    setTimeout(() => setBackendSaved(false), 2500);
  };

  const handleJudgeReset = () => {
    const ok = resetToDemoState();
    if (ok) {
      setResetToast(true);
      setAuditTrail([]);
      setTimeout(() => setResetToast(false), 4000);
    }
  };

  return (
    <div data-testid="settings-view" className="space-y-6">
      {/* 1. Header */}
      <div className="glass tone-glow rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white flex items-center gap-2.5">
            Settings and sandbox
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-paypal-blue/20 text-paypal-cyan border border-paypal-cyan/30">
              PayPal connection
            </span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Connect PayPal, tune the demo, or reset the workspace back to the starting numbers.
          </p>
        </div>
      </div>

      {/* Reset Confirmation Banner */}
      {resetToast && (
        <div
          data-testid="reset-confirmation-toast"
          className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-200 flex items-center justify-between animate-in fade-in"
        >
          <div className="flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Demo workspace successfully reset to pristine fixtures ($142,500 cash, 94d runway, 12 recovery cases).</span>
          </div>
          <button
            type="button"
            onClick={() => setResetToast(false)}
            className="text-[10px] uppercase font-mono text-emerald-300 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Live Warning Modal / Card */}
      {showLiveWarning && (
        <div
          data-testid="live-environment-warning"
          className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/60 text-xs space-y-2 text-amber-200"
        >
          <div className="flex items-center gap-2 font-bold font-mono text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>WARNING: Live PayPal Production Rail Selected</span>
          </div>
          <p className="text-[11px] text-amber-200/90 leading-relaxed">
            Switching to LIVE mode routes refund claims, dispute filings, and webhooks against real funds and live PayPal merchant accounts. For hackathon evaluation and demos, SANDBOX is strongly recommended.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleConfirmLive}
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono text-[11px] font-bold"
            >
              Switch to Live Rail
            </button>
            <button
              type="button"
              onClick={() => setShowLiveWarning(false)}
              className="px-3 py-1 rounded-lg bg-stone-200/70 dark:bg-stone-800/70 hover:bg-stone-300/80 dark:hover:bg-stone-700/80 text-stone-600 dark:text-stone-300 font-mono text-[11px]"
            >
              Cancel (Remain in Sandbox)
            </button>
          </div>
        </div>
      )}

      {/* 2. Grid: Cards 1 & 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 1: PayPal Sandbox Credentials */}
        <div className="glass tone-glow rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200/50 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-paypal-cyan" />
              <h3 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider font-mono">
                PayPal Developer Credentials
              </h3>
            </div>
            <span className="text-[10px] font-mono text-fintech-green flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-fintech-green animate-pulse" />
              {paypalConfig.connectionStatus}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Client ID */}
            <div>
              <label className="text-stone-500 dark:text-stone-400 text-[11px] font-mono block mb-1">Sandbox Client ID</label>
              <input
                type="text"
                data-testid="paypal-client-id-input"
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  updatePayPalConfig({ clientId: e.target.value });
                }}
                className="w-full px-3 py-2 rounded-xl bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 font-mono text-xs text-white focus:outline-none focus:border-paypal-cyan"
              />
            </div>

            {/* Secret with toggle */}
            <div>
              <label className="text-stone-500 dark:text-stone-400 text-[11px] font-mono block mb-1">Sandbox Secret Key</label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  data-testid="paypal-secret-input"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 rounded-xl bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 font-mono text-xs text-white focus:outline-none focus:border-paypal-cyan"
                />
                <button
                  type="button"
                  data-testid="toggle-secret-visibility"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400 hover:text-white"
                  title={showSecret ? 'Hide Secret' : 'Show Secret'}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Environment Toggle */}
            <div>
              <label className="text-stone-500 dark:text-stone-400 text-[11px] font-mono block mb-1">Environment Rail</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-testid="env-sandbox-btn"
                  onClick={() => handleToggleEnvironment('SANDBOX')}
                  className={`py-2 px-3 rounded-xl font-mono text-xs border transition flex items-center justify-center gap-1.5 ${
                    environment === 'SANDBOX'
                      ? 'bg-paypal-blue text-white border-paypal-cyan font-bold shadow-glow-paypal'
                      : 'bg-white/50 dark:bg-stone-950/60 text-stone-500 dark:text-stone-400 border-stone-200/60 dark:border-white/10 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>SANDBOX</span>
                </button>
                <button
                  type="button"
                  data-testid="env-live-btn"
                  onClick={() => handleToggleEnvironment('LIVE')}
                  className={`py-2 px-3 rounded-xl font-mono text-xs border transition flex items-center justify-center gap-1.5 ${
                    environment === 'LIVE'
                      ? 'bg-rose-950 text-rose-300 border-rose-500 font-bold'
                      : 'bg-white/50 dark:bg-stone-950/60 text-stone-500 dark:text-stone-400 border-stone-200/60 dark:border-white/10 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>LIVE PRODUCTION</span>
                </button>
              </div>
            </div>

            {/* Webhook ID & URL */}
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div>
                <span className="text-stone-500 dark:text-stone-400 block">Webhook ID</span>
                <span className="text-stone-600 dark:text-stone-300">{paypalConfig.webhookId}</span>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400 block">API Version</span>
                <span className="text-stone-600 dark:text-stone-300">PayPal REST {paypalConfig.apiVersion}</span>
              </div>
            </div>

            {/* Ping Webhook Test Button */}
            <div className="pt-2 border-t border-stone-200/50 dark:border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                data-testid="ping-webhook-btn"
                onClick={handlePing}
                disabled={isPinging}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-200/70 dark:bg-stone-800/70 hover:bg-stone-300/80 dark:hover:bg-stone-700/80 text-stone-700 dark:text-stone-200 text-xs font-mono font-medium transition disabled:opacity-40"
              >
                <Activity className="w-3.5 h-3.5 text-paypal-cyan" />
                <span>{isPinging ? 'Pinging Webhook...' : 'Test Webhook Connection'}</span>
              </button>

              {pingResult && (
                <div
                  data-testid="webhook-latency-badge"
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>200 OK ({pingResult.latencyMs}ms)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Simulator Tuning & Physics Sliders */}
        <div className="glass tone-glow rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200/50 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-paypal-cyan" />
              <h3 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider font-mono">
                Simulator Tuning & Latency Physics
              </h3>
            </div>
            <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">
              Interactive Latency Engine
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Simulated Latency */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-stone-600 dark:text-stone-300 text-xs font-mono">Simulated API Latency</label>
                <span className="text-paypal-cyan font-bold font-mono">{simulatedLatency} ms</span>
              </div>
              <input
                type="range"
                data-testid="simulated-latency-slider"
                min={200}
                max={2000}
                step={50}
                value={simulatedLatency}
                onChange={(e) => handleLatencyChange(Number(e.target.value))}
                className="w-full accent-paypal-cyan bg-stone-200/70 dark:bg-stone-800/70 h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                <span>Fast (200ms)</span>
                <span>Default (800ms)</span>
                <span>High Latency (2000ms)</span>
              </div>
            </div>

            {/* Error Rate */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-stone-600 dark:text-stone-300 text-xs font-mono">Simulated Network Error Rate</label>
                <span className="text-amber-400 font-bold font-mono">{networkErrorRate}%</span>
              </div>
              <input
                type="range"
                data-testid="simulated-error-rate-slider"
                min={0}
                max={20}
                step={1}
                value={networkErrorRate}
                onChange={(e) => handleErrorRateChange(Number(e.target.value))}
                className="w-full accent-amber-400 bg-stone-200/70 dark:bg-stone-800/70 h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                <span>0% (Clean)</span>
                <span>10% (Flaky)</span>
                <span>20% (Stress)</span>
              </div>
            </div>

            {/* Auto-credit reserve toggle */}
            <div className="pt-2 border-t border-stone-200/50 dark:border-white/10 flex items-center justify-between">
              <div>
                <span className="font-semibold text-stone-900 dark:text-white block">Auto-Credit Reserve on Dispute</span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                  Holds disputed fee amount in provisional credit reserve immediately
                </span>
              </div>
              <input
                type="checkbox"
                data-testid="auto-credit-toggle"
                checked={autoCreditReserve}
                onChange={(e) => handleAutoCreditToggle(e.target.checked)}
                className="w-4 h-4 accent-paypal-blue rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Grid: Cards 3 & 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 3: Backend Extensibility (FastAPI & Supabase) */}
        <div className="glass tone-glow rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200/50 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-paypal-cyan" />
              <h3 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider font-mono">
                Backend Extensibility (FastAPI / Supabase)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">
              Future Live Deployment
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Mode Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10">
              <div>
                <span className="font-semibold text-stone-900 dark:text-white block text-xs">Backend Execution Mode</span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                  {useLiveBackend ? 'Routing to live FastAPI server' : 'Standalone Simulated Mock Services (Default)'}
                </span>
              </div>
              <button
                type="button"
                data-testid="backend-mode-toggle"
                onClick={() => setUseLiveBackend(!useLiveBackend)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition border ${
                  useLiveBackend
                    ? 'bg-purple-950 text-purple-300 border-purple-500/50'
                    : 'bg-stone-200/70 dark:bg-stone-800/70 text-stone-600 dark:text-stone-300 border-stone-300/70 dark:border-white/10'
                }`}
              >
                {useLiveBackend ? 'LIVE API' : 'MOCK'}
              </button>
            </div>

            {/* FastAPI Base URL */}
            <div>
              <label className="text-stone-500 dark:text-stone-400 text-[11px] font-mono block mb-1">FastAPI Backend URL</label>
              <input
                type="text"
                data-testid="fastapi-url-input"
                value={fastApiUrl}
                onChange={(e) => setFastApiUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 font-mono text-xs text-white focus:outline-none focus:border-paypal-cyan"
                placeholder="http://localhost:8000"
              />
            </div>

            {/* Supabase URL */}
            <div>
              <label className="text-stone-500 dark:text-stone-400 text-[11px] font-mono block mb-1">Supabase Project URL</label>
              <input
                type="text"
                data-testid="supabase-url-input"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 font-mono text-xs text-white focus:outline-none focus:border-paypal-cyan"
                placeholder="https://xyz.supabase.co"
              />
            </div>

            {/* Save Button */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                data-testid="save-backend-settings-btn"
                onClick={handleSaveBackend}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-200/70 dark:bg-stone-800/70 hover:bg-stone-300/80 dark:hover:bg-stone-700/80 text-stone-700 dark:text-stone-200 text-xs font-mono transition"
              >
                <Save className="w-3.5 h-3.5 text-paypal-cyan" />
                <span>Save Backend Config</span>
              </button>
              {backendSaved && (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Hackathon Judge One-Click Demo Reset */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-obsidian-900 to-obsidian-850 border border-cyan-500/30 shadow-card-dark space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200/50 dark:border-white/10">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-paypal-cyan" />
              <h3 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider font-mono">
                One-Click Hackathon Judge Reset
              </h3>
            </div>
            <span className="text-[10px] font-mono text-paypal-cyan bg-paypal-blue/20 px-2 py-0.5 rounded border border-paypal-cyan/30">
              RE-SEED ENGINE
            </span>
          </div>

          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            Instantly reset mutated Zustand state, purge claim histories, restore pristine $142,500 liquid cash reserves, re-seed all 12 recovery cases, and reset the 5-Act hackathon demo stepper to Act 1.
          </p>

          <div className="p-3 rounded-xl bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 text-[11px] font-mono text-stone-500 dark:text-stone-400 space-y-1">
            <div>• Cash Reserves: Restored to $142,500.00</div>
            <div>• Financial Runway: Restored to 94 Days</div>
            <div>• Recovery Cases: 12 cases ($18,450.00 recoverable)</div>
            <div>• Udhari Credit: Restored to $16,800.00</div>
            <div>• Demo Stepper: Reset to Act 1 (Find)</div>
          </div>

          <button
            type="button"
            data-testid="judge-demo-reset-btn"
            onClick={handleJudgeReset}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-paypal-blue to-paypal-dark hover:from-paypal-cyan hover:to-paypal-blue text-white font-bold text-xs font-mono transition shadow-glow-paypal"
          >
            <RefreshCw className="w-4 h-4 text-paypal-cyan" />
            <span>Reset Demo Workspace (One-Click)</span>
          </button>
        </div>
      </div>

      {/* 4. Card 5: Sandbox REST API Audit Log Viewer */}
      <div className="glass tone-glow rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200/50 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-paypal-cyan" />
            <h3 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider font-mono">
              PayPal Sandbox REST API Audit Trail ({auditTrail.length} Events)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAuditLogs(!showAuditLogs)}
            className="text-[11px] font-mono text-stone-500 dark:text-stone-400 hover:text-white"
          >
            {showAuditLogs ? 'Hide Logs' : 'Show Logs'}
          </button>
        </div>

        {showAuditLogs && (
          <div
            data-testid="audit-trail-container"
            className="max-h-[240px] overflow-y-auto space-y-1.5 font-mono text-[11px]"
          >
            {auditTrail.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 flex items-center justify-between text-stone-600 dark:text-stone-300"
              >
                <div className="flex items-center gap-3">
                  <span className="px-1.5 py-0.2 rounded bg-paypal-blue/30 text-paypal-cyan font-bold text-[10px]">
                    {log.action}
                  </span>
                  <span className="text-stone-500 dark:text-stone-400">{log.endpoint}</span>
                  <span className="text-stone-500 dark:text-stone-400 hidden sm:inline">[{log.targetId}]</span>
                </div>
                <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400 text-[10px]">
                  <span className="text-emerald-400 font-bold">{log.httpStatus} OK</span>
                  <span>{log.latencyMs}ms</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}

            {auditTrail.length === 0 && (
              <div className="p-4 text-center text-xs text-stone-500 dark:text-stone-400 bg-white/50 dark:bg-stone-950/60 rounded-lg">
                No simulated sandbox API calls recorded yet. Execute a claim or ping the webhook to generate audit entries.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
