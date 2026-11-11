import React, { useState } from 'react';
import { AlertTriangle, ExternalLink, Loader2, RefreshCw, ShieldCheck, Upload } from 'lucide-react';

type ZapierTool = { name: string; description: string; input_schema: Record<string, unknown>; allowlisted: boolean };

interface Props { apiBaseUrl: string; accessToken: string | null }

export const SponsorActionsPanel: React.FC<Props> = ({ apiBaseUrl, accessToken }) => {
  const [question, setQuestion] = useState('Summarize the evidence and status, and suggest the next review step.');
  const [astropodsAnswer, setAstropodsAnswer] = useState('');
  const [kernelUrl, setKernelUrl] = useState('https://');
  const [kernelResult, setKernelResult] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [zapierTools, setZapierTools] = useState<ZapierTool[]>([]);
  const [zapierTool, setZapierTool] = useState('');
  const [zapierArgs, setZapierArgs] = useState('{}');
  const [zapierApproved, setZapierApproved] = useState(false);
  const [caseId, setCaseId] = useState('recovery-review-demo');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  const post = async (path: string, body: unknown) => {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.detail || `Request returned HTTP ${response.status}`);
    return payload;
  };

  const run = async (label: string, task: () => Promise<unknown>) => {
    setBusy(label); setMessage('');
    try { const result = await task(); setMessage(`${label} completed: ${JSON.stringify(result)}`); }
    catch (error) { setMessage(error instanceof Error ? error.message : `${label} failed.`); }
    finally { setBusy(''); }
  };

  const discoverZapier = async () => run('Zapier discovery', async () => {
    const response = await fetch(`${apiBaseUrl}/integrations/zapier/tools`, { headers: { Accept: 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.detail || `Request returned HTTP ${response.status}`);
    const tools: ZapierTool[] = payload.tools || [];
    setZapierTools(tools); setZapierTool(tools.find((tool) => tool.allowlisted)?.name || '');
    return { tools: tools.map(({ name, allowlisted }) => ({ name, allowlisted })) };
  });

  const upload = async () => {
    if (!file || !accessToken) return;
    await run('Elastic evidence upload', async () => {
      const form = new FormData(); form.append('file', file);
      const response = await fetch(`${apiBaseUrl}/integrations/elastic/evidence-upload`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: form });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || `Request returned HTTP ${response.status}`);
      return payload;
    });
  };

  const submitZapier = async () => {
    if (!zapierApproved) return;
    await run('Zapier action', async () => post('/integrations/zapier/actions', { name: zapierTool, arguments: JSON.parse(zapierArgs), approved: true }));
    setZapierApproved(false);
  };

  if (!accessToken) return <section className="rounded-xl border border-slate-800 bg-obsidian-900 p-4 text-xs text-slate-400">Sign in above to use Astropods, KERNEL, private evidence uploads, Render Workflows, or Zapier. Secrets stay on the backend.</section>;

  return <section className="space-y-4 rounded-2xl border border-paypal-cyan/20 bg-obsidian-900 p-5" data-testid="sponsor-actions-panel">
    <div><h2 className="text-sm font-semibold text-white">Run sponsor workflows</h2><p className="mt-1 text-[11px] text-slate-400">Each action is user-triggered, scoped to your active workspace, and recorded in audit history. Browser retrieval and integrations do not execute payments.</p></div>
    <div className="grid gap-3 xl:grid-cols-2">
      <form className="space-y-2 rounded-xl border border-slate-800 bg-obsidian-950 p-3" onSubmit={(event) => { event.preventDefault(); void run('Astropods investigation', async () => { const result = await post('/integrations/astropods/investigate', { question }); setAstropodsAnswer(result.answer || ''); return result; }); }}>
        <h3 className="text-xs font-semibold text-white">Astropods · read-only investigator</h3>
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={1200} className="min-h-20 w-full rounded-lg border border-slate-700 bg-obsidian-900 p-2 text-xs text-white" />
        <button disabled={!!busy} className="rounded-lg bg-paypal-blue px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy === 'Astropods investigation' ? 'Running…' : 'Run investigator'}</button>
        {astropodsAnswer && <p className="whitespace-pre-wrap rounded-lg bg-obsidian-900 p-2 text-xs text-slate-300">{astropodsAnswer}</p>}
      </form>
      <form className="space-y-2 rounded-xl border border-slate-800 bg-obsidian-950 p-3" onSubmit={(event) => { event.preventDefault(); void run('KERNEL public evidence', async () => { const result = await post('/integrations/kernel/evidence', { url: kernelUrl }); setKernelResult(JSON.stringify(result, null, 2)); return { trace_id: result.trace_id, title: result.title, url: result.url }; }); }}>
        <h3 className="text-xs font-semibold text-white">KERNEL · public page evidence</h3>
        <input type="url" required value={kernelUrl} onChange={(event) => setKernelUrl(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-obsidian-900 p-2 text-xs text-white" placeholder="https://public.example.com/page" />
        <p className="text-[10px] text-slate-500">HTTPS only; one public hostname; reads title/text, takes no actions. KERNEL browser use may incur usage charges.</p>
        <button disabled={!!busy} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 disabled:opacity-50">{busy === 'KERNEL public evidence' ? 'Retrieving…' : 'Retrieve for review'}</button>
        {kernelResult && <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-obsidian-900 p-2 text-[10px] text-slate-300">{kernelResult}</pre>}
      </form>
      <div className="space-y-2 rounded-xl border border-slate-800 bg-obsidian-950 p-3">
        <h3 className="text-xs font-semibold text-white">Elastic · private evidence indexing</h3>
        <div className="flex items-center gap-2"><input type="file" accept=".pdf,.txt,.md,.csv" onChange={(event) => setFile(event.target.files?.[0] || null)} className="min-w-0 flex-1 text-[10px] text-slate-300" /><button type="button" disabled={!file || !!busy} onClick={() => void upload()} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Upload className="h-3.5 w-3.5" />Index</button></div>
        <p className="text-[10px] text-slate-500">PDF/TXT/MD/CSV · 8 MB max · original stored in private Supabase bucket; extracted pages indexed with a server-derived workspace ID.</p>
      </div>
      <div className="space-y-2 rounded-xl border border-slate-800 bg-obsidian-950 p-3">
        <h3 className="text-xs font-semibold text-white">Render · idempotent review workflow</h3>
        <div className="flex gap-2"><input value={caseId} onChange={(event) => setCaseId(event.target.value)} maxLength={120} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-obsidian-900 p-2 text-xs text-white" aria-label="Recovery case ID" /><button type="button" disabled={!!busy || !caseId.trim()} onClick={() => { const safeCase = caseId.trim().replace(/[^A-Za-z0-9._:-]/g, '-'); const stableKey = `review-${safeCase.padEnd(10, '0').slice(0, 80)}`; void run('Render workflow', () => post('/integrations/render/recovery-review', { case_id: caseId.trim(), idempotency_key: stableKey })); }} className="rounded-lg bg-paypal-blue px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy === 'Render workflow' ? 'Starting…' : 'Start review job'}</button></div>
        <p className="text-[10px] text-slate-500">Repeated requests for the same case share an idempotency key. The workflow saves a review task only; no financial action.</p>
      </div>
      <div className="space-y-2 rounded-xl border border-slate-800 bg-obsidian-950 p-3 xl:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-semibold text-white">Zapier MCP · approved actions</h3><button type="button" disabled={!!busy} onClick={() => void discoverZapier()} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 disabled:opacity-50"><RefreshCw className="h-3 w-3" />Discover actions</button></div>
        {zapierTools.length > 0 && <>
          <select value={zapierTool} onChange={(event) => { setZapierTool(event.target.value); setZapierApproved(false); }} className="w-full rounded-lg border border-slate-700 bg-obsidian-900 p-2 text-xs text-white"><option value="">Select enabled action</option>{zapierTools.filter((tool) => tool.allowlisted).map((tool) => <option key={tool.name} value={tool.name}>{tool.name} — {tool.description.slice(0, 90)}</option>)}</select>
          <textarea value={zapierArgs} onChange={(event) => { setZapierArgs(event.target.value); setZapierApproved(false); }} className="min-h-20 w-full rounded-lg border border-slate-700 bg-obsidian-900 p-2 font-mono text-[10px] text-white" aria-label="Zapier action arguments JSON" />
          <label className="flex items-center gap-2 text-[10px] text-amber-200"><input type="checkbox" checked={zapierApproved} onChange={(event) => setZapierApproved(event.target.checked)} /><AlertTriangle className="h-3.5 w-3.5" />I reviewed the selected tool and JSON above, and approve this external action.</label>
          <button type="button" disabled={!zapierApproved || !zapierTool || !!busy} onClick={() => void submitZapier()} className="inline-flex items-center gap-1 rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><ShieldCheck className="h-3.5 w-3.5" />Run approved action</button>
        </>}
        <p className="text-[10px] text-slate-500">Only tool names explicitly allowlisted in ZAPIER_MCP_ALLOWED_TOOLS can run. Review the recipient and payload before approval.</p>
      </div>
    </div>
    {message && <div role="status" aria-live="polite" className="break-words rounded-lg border border-slate-700 bg-obsidian-950 p-3 text-[10px] text-slate-300">{busy && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />}{message}</div>}
  </section>;
};
