import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, CircleAlert, ExternalLink, Loader2, Search, Shield, XCircle } from 'lucide-react';
import { normalizeApiBaseUrl } from '../services/backendApi';
import { sandboxService } from '../services/sandboxService';
import { clearSupabaseSession, getSupabaseAccessToken, hasSupabaseBrowserConfig, signInWithPassword } from '../services/supabaseSession';
import { SponsorActionsPanel } from '../components/dashboard/SponsorActionsPanel';

const AgStudioRecoveryDashboard = lazy(() => import('../components/dashboard/AgStudioRecoveryDashboard').then((module) => ({ default: module.AgStudioRecoveryDashboard })));

interface SponsorIntegration {
  id: string;
  name: string;
  implemented: boolean;
  configured: boolean;
  h8_status: 'complete' | 'partial' | 'blocked';
  evidence: string;
}

interface ProductSearchResult {
  provider: string;
  query: string;
  fetched_at: string;
  products: Array<Record<string, unknown>>;
}

interface EvidenceSearchResult {
  provider: string;
  query: string;
  fetched_at: string;
  evidence: Array<{ id: string; title: string; snippet: string; source_url?: string; page?: string | number; score?: number }>;
}

const sponsorGuidance: Record<string, string> = {
  paypal: 'Finish a Sandbox invoice/payment and map verified, deduplicated webhook events into a PayPilot case or Digital Twin.',
  'ag-grid': 'Present in recovery, reconciliation, and ledger workflows.',
  'ag-studio': 'AG Studio React evaluates the recovery dashboard; natural-language commands are constrained to read-only filters.',
  apimatic: 'Generate and use a typed PayPal client from an APIMatic contract/Context Plugin, then run adapter checks.',
  astropods: 'Run an authenticated read-only investigator question and save a workspace audit trace; the deployed agent still needs scoped PayPilot tools.',
  bryntum: 'Drag a commitment milestone to preview the reserve breach date; the changes remain a scenario until explicitly applied.',
  channel3: 'Search live catalog products; each result shows Channel3 provenance and fetch time.',
  elastic: 'Upload private PDF/TXT/MD/CSV evidence, index page text and search only within the authenticated user’s workspaces.',
  kernel: 'Retrieve title/text from a user-authorized public HTTPS page on one host and save a reviewable trace; no clicks or form actions.',
  postman: 'Add replay, approval-tampering, and workspace-authorization negative cases; run the collection successfully.',
  render: 'Start a durable, idempotent review workflow and save its run ID; hosted execution requires Render setup.',
  zapier: 'Discover MCP tools, run only configured allowlisted actions after explicit approval, and save result metadata in the audit log.',
};

const statusClasses = (status: SponsorIntegration['h8_status']) => status === 'complete'
  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  : status === 'partial'
    ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
    : 'border-rose-500/30 bg-rose-500/10 text-rose-200';

export const SponsorIntegrationsView: React.FC = () => {
  const [integrations, setIntegrations] = useState<SponsorIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState('');
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<ProductSearchResult | null>(null);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);
  const [evidenceQuery, setEvidenceQuery] = useState('');
  const [evidenceResult, setEvidenceResult] = useState<EvidenceSearchResult | null>(null);
  const [evidenceError, setEvidenceError] = useState('');
  const [searchingEvidence, setSearchingEvidence] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(() => getSupabaseAccessToken());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const apiBaseUrl = useMemo(() => normalizeApiBaseUrl(sandboxService.getConfig().apiBaseUrl), []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBaseUrl}/integrations/status`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Integration status returned HTTP ${response.status}`);
        const payload = await response.json();
        setIntegrations(payload.integrations ?? []);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setStatusError(error instanceof Error ? error.message : 'Unable to load integration status.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [apiBaseUrl]);

  const searchProducts = async (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim().length < 2 || searching) return;
    setSearching(true);
    setSearchError('');
    setSearchResult(null);
    try {
      const response = await fetch(`${apiBaseUrl}/integrations/channel3/search?query=${encodeURIComponent(query.trim())}&limit=10`, {
        method: 'POST',
        headers: { Accept: 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || `Channel3 search returned HTTP ${response.status}`);
      }
      setSearchResult(await response.json());
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Channel3 search failed.');
    } finally {
      setSearching(false);
    }
  };

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setSigningIn(true);
    setAuthError('');
    try {
      await signInWithPassword(email, password);
      setAccessToken(getSupabaseAccessToken());
      setPassword('');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Supabase sign-in failed.');
    } finally {
      setSigningIn(false);
    }
  };

  const getText = (product: Record<string, unknown>, ...keys: string[]) => {
    for (const key of keys) {
      const value = product[key];
      if (typeof value === 'string' || typeof value === 'number') return String(value);
    }
    return '';
  };

  const searchEvidence = async (event: React.FormEvent) => {
    event.preventDefault();
    if (evidenceQuery.trim().length < 2 || searchingEvidence) return;
    setSearchingEvidence(true);
    setEvidenceError('');
    setEvidenceResult(null);
    try {
      const response = await fetch(`${apiBaseUrl}/integrations/elastic/evidence-search?query=${encodeURIComponent(evidenceQuery.trim())}`, {
        method: 'POST',
        headers: { Accept: 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || `Elastic search returned HTTP ${response.status}`);
      }
      setEvidenceResult(await response.json());
    } catch (error) {
      setEvidenceError(error instanceof Error ? error.message : 'Evidence search failed.');
    } finally {
      setSearchingEvidence(false);
    }
  };

  return (
    <div data-testid="sponsor-integrations-view" className="space-y-6">
      <header className="border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-paypal-cyan">
          <Activity className="h-4 w-4" /> Vendor workflow evidence
        </div>
        <h1 className="mt-2 text-2xl font-bold text-white">Sponsor Integrations</h1>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-400">
          Live configuration is reported by the backend. A sponsor is marked complete only when its workflow runs; an account, key, or license alone is not proof.
        </p>
      </header>

      <Suspense fallback={<div className="rounded-xl border border-slate-800 bg-obsidian-900 p-4 text-xs text-slate-400">Loading AG Studio recovery dashboard…</div>}>
        <AgStudioRecoveryDashboard />
      </Suspense>

      <section className="rounded-2xl border border-paypal-cyan/20 bg-obsidian-900 p-5 shadow-card-dark">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-paypal-cyan" />
          <h2 className="text-sm font-semibold text-white">Channel3 live product search</h2>
          <span className="rounded border border-paypal-cyan/30 bg-paypal-blue/10 px-2 py-0.5 text-[10px] font-mono text-paypal-cyan">SERVER KEY ONLY</span>
        </div>
        <form onSubmit={searchProducts} className="flex flex-col gap-2 sm:flex-row">
          <input value={query} onChange={(event) => setQuery(event.target.value)} minLength={2} maxLength={240} placeholder="Search a product for purchase analysis" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-obsidian-950 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-paypal-cyan focus:outline-none" />
          <button disabled={searching || query.trim().length < 2} className="inline-flex items-center justify-center gap-2 rounded-lg bg-paypal-blue px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Search
          </button>
        </form>
        <p className="mt-2 text-[10px] text-slate-500">Requires a valid Supabase session and backend CHANNEL3_API_KEY. The key is never sent to this browser.</p>
        {!accessToken ? <form onSubmit={signIn} className="mt-3 grid gap-2 rounded-lg border border-slate-800 bg-obsidian-950 p-3 sm:grid-cols-[1fr_1fr_auto]">
          {!hasSupabaseBrowserConfig() ? <p className="sm:col-span-3 text-xs text-amber-200">Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env to enable secure sign-in.</p> : <>
            <input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Supabase account email" className="rounded-lg border border-slate-700 bg-obsidian-900 px-3 py-2 text-xs text-white placeholder:text-slate-500" />
            <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="rounded-lg border border-slate-700 bg-obsidian-900 px-3 py-2 text-xs text-white placeholder:text-slate-500" />
            <button disabled={signingIn} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 disabled:opacity-50">{signingIn ? 'Signing in…' : 'Sign in'}</button>
          </>}
          {authError && <p role="alert" className="sm:col-span-3 text-xs text-rose-300">{authError}</p>}
        </form> : <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-[10px] text-emerald-200"><span>Supabase session active in memory for this tab.</span><button type="button" onClick={() => { clearSupabaseSession(); setAccessToken(null); }} className="underline">Sign out</button></div>}
        {searchError && <div role="alert" className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"><CircleAlert className="h-4 w-4 shrink-0" />{searchError}</div>}
        {searchResult && (
          <div className="mt-4 space-y-3" data-testid="channel3-search-results">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
              <span>Source: {searchResult.provider} · Query: “{searchResult.query}”</span>
              <span>Fetched: {new Date(searchResult.fetched_at).toLocaleString()}</span>
            </div>
            {searchResult.products.length === 0 ? <p className="rounded-lg bg-obsidian-950 p-3 text-xs text-slate-400">No products returned for this query.</p> : (
              <div className="grid gap-2 md:grid-cols-2">
                {searchResult.products.map((product, index) => {
                  const name = getText(product, 'name', 'title') || `Product ${index + 1}`;
                  const url = getText(product, 'url', 'product_url');
                  const image = getText(product, 'image_url', 'image');
                  const price = getText(product, 'price', 'price_text');
                  return <article key={getText(product, 'id', 'product_id') || index} className="flex gap-3 rounded-xl border border-slate-800 bg-obsidian-950 p-3">
                    {image && <img src={image} alt="" className="h-16 w-16 rounded-lg bg-white/5 object-contain" loading="lazy" />}
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-xs font-semibold text-white">{name}</h3>
                      {price && <p className="mt-1 text-xs font-mono text-emerald-300">{price}</p>}
                      {url && <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[10px] text-paypal-cyan hover:underline">View product <ExternalLink className="h-3 w-3" /></a>}
                    </div>
                  </article>;
                })}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-indigo-500/20 bg-obsidian-900 p-5 shadow-card-dark">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-indigo-300" />
          <h2 className="text-sm font-semibold text-white">Elastic tenant-scoped evidence search</h2>
          <span className="rounded border border-indigo-400/30 bg-indigo-400/10 px-2 py-0.5 text-[10px] font-mono text-indigo-200">WORKSPACE FILTER SERVER-ENFORCED</span>
        </div>
        <form onSubmit={searchEvidence} className="flex flex-col gap-2 sm:flex-row">
          <input value={evidenceQuery} onChange={(event) => setEvidenceQuery(event.target.value)} minLength={2} maxLength={240} placeholder="Search evidence in your authorized workspace" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-obsidian-950 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-indigo-300 focus:outline-none" />
          <button disabled={searchingEvidence || evidenceQuery.trim().length < 2} className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-100 disabled:cursor-not-allowed disabled:opacity-50">
            {searchingEvidence ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Search evidence
          </button>
        </form>
        <p className="mt-2 text-[10px] text-slate-500">Requires Supabase sign-in, DATABASE_URL, ELASTICSEARCH_URL, and an API key with read-only index access. Workspace IDs come from the authenticated user's memberships; they are never accepted from the browser.</p>
        {evidenceError && <div role="alert" className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">{evidenceError}</div>}
        {evidenceResult && <div className="mt-4 space-y-3" data-testid="elastic-evidence-results">
          <div className="flex flex-wrap justify-between gap-2 text-[10px] font-mono text-slate-400"><span>Source: {evidenceResult.provider} · Query: “{evidenceResult.query}”</span><span>Fetched: {new Date(evidenceResult.fetched_at).toLocaleString()}</span></div>
          {evidenceResult.evidence.length === 0 ? <p className="rounded-lg bg-obsidian-950 p-3 text-xs text-slate-400">No evidence found in your authorized workspaces.</p> : evidenceResult.evidence.map((item) => <article key={item.id} className="rounded-lg border border-slate-800 bg-obsidian-950 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-semibold text-white">{item.title}</h3>{item.source_url && <a href={item.source_url} target="_blank" rel="noreferrer" className="text-[10px] text-paypal-cyan hover:underline">Open source ↗</a>}</div>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">{item.snippet}</p>
            <p className="mt-2 text-[9px] font-mono text-slate-500">Evidence ID {item.id}{item.page ? ` · Page ${item.page}` : ''}</p>
          </article>)}
        </div>}
      </section>

      <SponsorActionsPanel apiBaseUrl={apiBaseUrl} accessToken={accessToken} />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {loading && <div className="col-span-full flex items-center gap-2 rounded-xl border border-slate-800 bg-obsidian-900 p-4 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />Loading backend-reported status…</div>}
        {statusError && <div role="alert" className="col-span-full flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200"><CircleAlert className="h-4 w-4" />{statusError}</div>}
        {integrations.map((item) => {
          const h8Accepted = item.h8_status === 'complete';
          const Icon = h8Accepted ? CheckCircle2 : item.h8_status === 'partial' ? Shield : XCircle;
          return <article key={item.id} className="rounded-xl border border-slate-800 bg-obsidian-900 p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-white">{item.name}</h2>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-mono uppercase ${statusClasses(item.h8_status)}`}>
                <Icon className="h-3 w-3" />{h8Accepted ? 'H.8 accepted' : item.h8_status === 'partial' ? 'H.8 partial' : 'H.8 blocked'}
              </span>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-400">{item.evidence}</p>
            <p className="mt-2 text-[9px] font-mono text-slate-500">Adapter: {item.implemented ? 'present' : 'not implemented'} · Credentials: {item.configured ? 'configured' : 'not configured'}</p>
            <p className="mt-3 border-t border-slate-800 pt-2 text-[10px] leading-relaxed text-slate-500">H.8: {sponsorGuidance[item.id] || 'See sponsor integration plan.'}</p>
          </article>;
        })}
      </section>
    </div>
  );
};
