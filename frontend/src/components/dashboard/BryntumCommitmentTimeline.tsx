import React, { useMemo, useState } from 'react';
import { BryntumGantt } from '@bryntum/gantt-react';
import type { BryntumGanttProps } from '@bryntum/gantt-react';
import '@bryntum/gantt/stockholm-dark.css';
import type { CommitmentItem } from '../../types';

interface Props {
  commitments: CommitmentItem[];
  availableCash: number;
  reserve: number;
}

const asDate = (value: string) => new Date(`${value}T12:00:00`);
const dateString = (value: Date) => value.toISOString().slice(0, 10);

export const BryntumCommitmentTimeline: React.FC<Props> = ({ commitments, availableCash, reserve }) => {
  const [shiftedDates, setShiftedDates] = useState<Record<string, string>>({});
  const originalDates = useMemo(() => Object.fromEntries(commitments.map((item) => [item.id, item.dueDate])), [commitments]);

  const tasks = useMemo(() => commitments.map((item) => {
    const due = asDate(shiftedDates[item.id] ?? item.dueDate);
    const start = new Date(due);
    start.setDate(start.getDate() - 1);
    return {
      id: item.id,
      name: `${item.counterparty} · $${item.pendingBalance.toLocaleString()} due`,
      startDate: dateString(start),
      endDate: dateString(due),
      duration: 1,
      percentDone: 0,
      expanded: true,
    };
  }), [commitments, shiftedDates]);

  const dateWindow = useMemo(() => {
    const dueDates = commitments.map((item) => asDate(shiftedDates[item.id] ?? item.dueDate).getTime());
    const now = Date.now();
    const first = dueDates.length ? Math.min(...dueDates) : now;
    const last = dueDates.length ? Math.max(...dueDates) : now;
    return {
      startDate: new Date(first - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(last + 30 * 24 * 60 * 60 * 1000),
    };
  }, [commitments, shiftedDates]);

  const ganttProps: BryntumGanttProps = {
    startDate: dateWindow.startDate,
    endDate: dateWindow.endDate,
    viewPreset: 'weekAndDayLetter',
    columns: [
      { type: 'name', field: 'name', text: 'Payment milestone', width: 340 },
      { type: 'startdate', field: 'startDate', text: 'Start', width: 105 },
      { type: 'enddate', field: 'endDate', text: 'Due date', width: 105 },
    ],
    tasks,
    taskDragFeature: true,
    taskEditFeature: false,
    onTaskDrop: ({ taskRecords }) => {
      setShiftedDates((current) => {
        const next = { ...current };
        taskRecords.forEach((task) => {
          const original = originalDates[String(task.id)];
          if (original && task.endDate instanceof Date) next[String(task.id)] = dateString(task.endDate);
        });
        return next;
      });
    },
  };

  const datedOutflows = commitments
    .map((item) => ({ amount: item.pendingBalance, date: asDate(shiftedDates[item.id] ?? item.dueDate) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  let projected = availableCash;
  let lowest = projected;
  let breachDate: string | null = null;
  for (const outflow of datedOutflows) {
    projected -= outflow.amount;
    if (projected < lowest) lowest = projected;
    if (!breachDate && projected < reserve) breachDate = dateString(outflow.date);
  }
  const changed = Object.keys(shiftedDates).length > 0;

  return (
    <section className="rounded-2xl border border-indigo-400/20 bg-white/[0.04] p-4" data-testid="bryntum-commitment-timeline">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Commitment and payment timeline</h2>
          <p className="mt-1 text-xs text-slate-400">Move an unpaid milestone to preview how timing changes the reserve outlook. Changes are a local scenario only.</p>
        </div>
        {changed && <button type="button" onClick={() => setShiftedDates({})} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300">Reset preview</button>}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-800" style={{ height: 360 }}>
        <BryntumGantt {...ganttProps} />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-950/60 p-3"><div className="text-[10px] uppercase text-slate-500">Lowest scheduled cash</div><div className={`mt-1 text-sm font-semibold ${lowest < reserve ? 'text-rose-300' : 'text-emerald-300'}`}>${lowest.toLocaleString()}</div></div>
        <div className="rounded-lg bg-slate-950/60 p-3"><div className="text-[10px] uppercase text-slate-500">Reserve threshold</div><div className="mt-1 text-sm font-semibold text-white">${reserve.toLocaleString()}</div></div>
        <div className="rounded-lg bg-slate-950/60 p-3"><div className="text-[10px] uppercase text-slate-500">First reserve breach</div><div className="mt-1 text-sm font-semibold text-white">{breachDate ?? 'None in scheduled commitments'}</div></div>
      </div>
      {changed && <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-100">Preview only: the original commitment dates and payment state have not changed.</p>}
    </section>
  );
};
