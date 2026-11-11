import React, { useMemo, useState } from 'react';
import { AgStudio } from 'ag-studio-react';
import { SEED_RECOVERY_CASES } from '../../store/demoSeedData';

type Stage = 'ALL' | 'POTENTIAL_IDENTIFIED' | 'CLAIM_SUBMITTED' | 'PROVIDER_PENDING' | 'VERIFIED_RECOVERED';

const rowData = SEED_RECOVERY_CASES.map((item) => ({
  case_id: item.caseNumber,
  case_type: item.category.replaceAll('_', ' '),
  provider: item.provider,
  status: item.status.replaceAll('_', ' '),
  potential_amount: item.potentialRecoverableAmount,
  verified_recovered: item.actualRecoveredAmount,
  evidence_records: item.explainability.sourceRecords.length,
  detected_at: item.dateDetected,
}));

export const AgStudioRecoveryDashboard: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [stage, setStage] = useState<Stage>('ALL');
  const [notice, setNotice] = useState('');
  const visibleRows = useMemo(() => stage === 'ALL' ? rowData : rowData.filter((row) => row.status.replaceAll(' ', '_') === stage), [stage]);
  const data = useMemo(() => ({ sources: [{ id: 'recovery_cases', data: visibleRows }] }), [visibleRows]);

  const applyGuardedDashboardQuestion = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = prompt.toLowerCase();
    if (normalized.includes('pending') || normalized.includes('provider')) {
      setStage('PROVIDER_PENDING');
      setNotice('Dashboard filtered to provider-pending recovery cases.');
    } else if (normalized.includes('submitted')) {
      setStage('CLAIM_SUBMITTED');
      setNotice('Dashboard filtered to submitted recovery cases.');
    } else if (normalized.includes('recover') || normalized.includes('verified')) {
      setStage('VERIFIED_RECOVERED');
      setNotice('Dashboard filtered to verified recovered cases.');
    } else if (normalized.includes('potential') || normalized.includes('identified')) {
      setStage('POTENTIAL_IDENTIFIED');
      setNotice('Dashboard filtered to potential recovery candidates.');
    } else if (normalized.includes('all') || normalized.includes('everything')) {
      setStage('ALL');
      setNotice('Dashboard reset to all recovery cases.');
    } else {
      setNotice('Try: “show pending recoveries”, “show submitted cases”, “show verified recovered”, or “show all”.');
    }
  };

  return (
    <section className="rounded-2xl border border-emerald-400/20 bg-obsidian-900 p-5 shadow-card-dark" data-testid="ag-studio-recovery-dashboard">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">AG Studio · recovery analytics</div>
          <h2 className="mt-1 text-sm font-semibold text-white">Evidence-backed recovery dashboard</h2>
          <p className="mt-1 text-xs text-slate-400">The Studio receives only the current demo workspace’s recovery rows.</p>
        </div>
        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-200">Guarded local commands</span>
      </div>
      <form onSubmit={applyGuardedDashboardQuestion} className="mb-3 flex gap-2">
        <input value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={160} placeholder="Ask: show pending recoveries" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-obsidian-950 px-3 py-2 text-xs text-white placeholder:text-slate-500" />
        <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white">Apply filter</button>
      </form>
      <p aria-live="polite" className="mb-3 min-h-4 text-[11px] text-emerald-200">{notice || `Showing ${visibleRows.length} recovery rows. Commands only change a status filter; they cannot change financial values or execute actions.`}</p>
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-white" style={{ height: 520 }}>
        <AgStudio data={data} mode="edit" style={{ height: '100%', width: '100%' }} />
      </div>
      <p className="mt-2 text-[10px] text-slate-500">Local AG Studio evaluation build. Production use requires the appropriate AG Studio license; no license key is committed.</p>
    </section>
  );
};
