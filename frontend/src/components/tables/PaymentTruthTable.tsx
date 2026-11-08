import React, { useMemo, useState, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  GridReadyEvent,
  ICellRendererParams,
  GridApi,
} from 'ag-grid-community';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Search,
  Layers,
  Building,
  Receipt,
  Eye,
  GitCommit,
  Maximize2,
} from 'lucide-react';
import { usePayPilotStore } from '../../store/usePayPilotStore';
import { ReconciliationRecord } from '../../types';
import { DiscrepancyInspectorModal, getNormalizedMatchStatus } from './DiscrepancyInspectorModal';

export { getNormalizedMatchStatus };

export interface PaymentTruthTableProps {
  className?: string;
}

export const PaymentTruthTable: React.FC<PaymentTruthTableProps> = ({ className = '' }) => {
  const { reconciliationRecords, setSelectedDiscrepancyId, openExplainability } = usePayPilotStore();
  const gridRef = useRef<AgGridReact<ReconciliationRecord>>(null);
  const gridApiRef = useRef<GridApi<ReconciliationRecord> | null>(null);

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DISCREPANCIES' | 'MATCHED' | 'ORPHANS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Counts for filter chips
  const counts = useMemo(() => {
    let discrepancies = 0;
    let matched = 0;
    let orphans = 0;

    for (const r of reconciliationRecords) {
      const st = getNormalizedMatchStatus(r);
      if (st === 'DISCREPANCY') discrepancies++;
      else if (st === 'MATCHED') matched++;
      else orphans++;
    }

    return {
      all: reconciliationRecords.length,
      discrepancies,
      matched,
      orphans,
    };
  }, [reconciliationRecords]);

  // Filtered row data
  const filteredData = useMemo(() => {
    return reconciliationRecords.filter((r) => {
      const st = getNormalizedMatchStatus(r);
      if (activeFilter === 'DISCREPANCIES' && st !== 'DISCREPANCY') return false;
      if (activeFilter === 'MATCHED' && st !== 'MATCHED') return false;
      if (
        activeFilter === 'ORPHANS' &&
        st !== 'ORPHAN_PAYPAL' &&
        st !== 'ORPHAN_BANK' &&
        st !== 'ORPHAN_INVOICE'
      ) {
        return false;
      }

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const key = (r.reconciliationKey || r.id).toLowerCase();
        const cat = (r.category || '').toLowerCase();
        const payer = (r.paypalRecord?.payerName || '').toLowerCase();
        const bank = (r.bankRecord?.bankName || '').toLowerCase();
        const inv = (r.ledgerRecord?.customerName || '').toLowerCase();
        return (
          key.includes(q) ||
          cat.includes(q) ||
          payer.includes(q) ||
          bank.includes(q) ||
          inv.includes(q)
        );
      }

      return true;
    });
  }, [reconciliationRecords, activeFilter, searchQuery]);

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<ReconciliationRecord>[]>(() => [
    {
      headerName: 'Reconciliation ID',
      field: 'reconciliationKey',
      minWidth: 190,
      flex: 1.2,
      cellRenderer: (params: ICellRendererParams<ReconciliationRecord>) => {
        const data = params.data;
        if (!data) return null;
        return (
          <div className="flex flex-col justify-center h-full py-1">
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-white">
              <GitCommit className="w-3.5 h-3.5 text-paypal-cyan shrink-0" />
              <span className="truncate">{data.reconciliationKey || data.id}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
              <span>{data.date}</span>
              <span>•</span>
              <span className="text-slate-500">{data.id}</span>
            </div>
          </div>
        );
      },
    },
    {
      headerName: 'Match Status',
      minWidth: 160,
      flex: 1,
      valueGetter: (params) => (params.data ? getNormalizedMatchStatus(params.data) : ''),
      cellRenderer: (params: ICellRendererParams<ReconciliationRecord>) => {
        if (!params.data) return null;
        const status = getNormalizedMatchStatus(params.data);
        const configs: Record<string, { label: string; bg: string; icon: React.ElementType }> = {
          MATCHED: { label: 'MATCHED', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
          DISCREPANCY: { label: 'DISCREPANCY', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: AlertTriangle },
          ORPHAN_PAYPAL: { label: 'ORPHAN PAYPAL', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', icon: Layers },
          ORPHAN_BANK: { label: 'ORPHAN BANK', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: Building },
          ORPHAN_INVOICE: { label: 'ORPHAN INVOICE', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: Receipt },
        };
        const cfg = configs[status] || configs.DISCREPANCY;
        const Icon = cfg.icon;
        return (
          <div className="flex items-center h-full">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border ${cfg.bg}`}>
              <Icon className="w-3 h-3 shrink-0" />
              <span>{cfg.label}</span>
            </span>
          </div>
        );
      },
    },
    {
      headerName: 'Confidence',
      field: 'matchScore',
      minWidth: 130,
      flex: 0.9,
      cellRenderer: (params: ICellRendererParams<ReconciliationRecord>) => {
        const score = params.data?.matchScore ?? 0;
        const color =
          score >= 90
            ? 'bg-emerald-400 text-emerald-400'
            : score >= 75
            ? 'bg-amber-400 text-amber-400'
            : 'bg-rose-400 text-rose-400';
        return (
          <div className="flex items-center gap-2 h-full">
            <span className={`font-mono text-xs font-semibold w-8 ${color.split(' ')[1]}`}>
              {score}%
            </span>
            <div className="w-14 h-1.5 rounded-full bg-slate-800 overflow-hidden shrink-0">
              <div
                className={`h-full rounded-full ${color.split(' ')[0]}`}
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      headerName: 'PayPal Txn',
      minWidth: 150,
      flex: 1,
      cellRenderer: (params: ICellRendererParams<ReconciliationRecord>) => {
        const pp = params.data?.paypalRecord;
        if (!pp) {
          return (
            <div className="flex items-center h-full">
              <span className="text-slate-500 text-xs font-mono italic">MANUAL_ENTRY</span>
            </div>
          );
        }
        return (
          <div className="flex flex-col justify-center h-full py-1">
            <span className="font-mono text-xs font-semibold text-slate-200">
              ${pp.grossAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
              {pp.transactionId}
            </span>
          </div>
        );
      },
    },
    {
      headerName: 'Bank Feed',
      minWidth: 150,
      flex: 1,
      cellRenderer: (params: ICellRendererParams<ReconciliationRecord>) => {
        const bk = params.data?.bankRecord;
        if (!bk) {
          return (
            <div className="flex items-center h-full">
              <span className="text-amber-500/80 text-xs font-mono italic">PENDING_CLEARING</span>
            </div>
          );
        }
        return (
          <div className="flex flex-col justify-center h-full py-1">
            <span className="font-mono text-xs font-semibold text-slate-200">
              ${bk.depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
              {bk.bankReferenceId || bk.bankName}
            </span>
          </div>
        );
      },
    },
    {
      headerName: 'Variance',
      field: 'varianceAmount',
      minWidth: 130,
      flex: 0.9,
      cellRenderer: (params: ICellRendererParams<ReconciliationRecord>) => {
        const variance = params.data?.varianceAmount ?? 0;
        const formatted = `$${variance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (variance === 0) {
          return (
            <div className="flex items-center gap-1 text-emerald-400 font-mono text-xs font-medium h-full">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>$0.00</span>
            </div>
          );
        }
        return (
          <div className="flex items-center h-full">
            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>{formatted}</span>
            </span>
          </div>
        );
      },
    },
    {
      headerName: 'Discrepancy Reason',
      field: 'category',
      minWidth: 180,
      flex: 1.2,
      cellRenderer: (params: ICellRendererParams<ReconciliationRecord>) => {
        const data = params.data;
        if (!data) return null;
        const desc = data.discrepancies?.[0]?.ruleName || data.category || 'Standard Settlement';
        const truncated = desc.length > 40 ? `${desc.slice(0, 40)}...` : desc;
        return (
          <div className="flex items-center h-full" title={desc}>
            <span className="text-xs text-slate-300 truncate font-medium">
              {truncated}
            </span>
          </div>
        );
      },
    },
    {
      headerName: 'Actions',
      minWidth: 190,
      flex: 1.3,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<ReconciliationRecord>) => {
        const data = params.data;
        if (!data) return null;

        const handleInspect = (e: React.MouseEvent) => {
          e.stopPropagation();
          setSelectedDiscrepancyId(data.id);
        };

        const handleWhyFlagged = (e: React.MouseEvent) => {
          e.stopPropagation();
          const ruleId = data.explainabilityRuleId || data.discrepancies?.[0]?.ruleId || 'RULE-DUP-FEE-02';
          openExplainability(ruleId, data.id);
        };

        return (
          <div className="flex items-center gap-1.5 h-full">
            <button
              type="button"
              onClick={handleInspect}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-paypal-blue/15 hover:bg-paypal-blue/25 text-paypal-cyan hover:text-white border border-paypal-cyan/30 text-[11px] font-medium transition"
              title="Inspect 3-way multi-source breakdown"
            >
              <Eye className="w-3 h-3" />
              <span>Inspect</span>
            </button>
            <button
              type="button"
              onClick={handleWhyFlagged}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium transition"
              title="Open detection rule explainability drawer"
            >
              <HelpCircle className="w-3 h-3 text-amber-400" />
              <span>Why flagged?</span>
            </button>
          </div>
        );
      },
    },
  ], [setSelectedDiscrepancyId, openExplainability]);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  const onGridReady = useCallback((params: GridReadyEvent<ReconciliationRecord>) => {
    gridApiRef.current = params.api;
    params.api.sizeColumnsToFit();
  }, []);

  const handleFitColumns = () => {
    gridApiRef.current?.sizeColumnsToFit();
  };

  return (
    <div data-testid="payment-truth-table" className={`space-y-3 ${className}`}>
      {/* Table Toolbar: Filter Chips & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filter Chips */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="filter-chip-all"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeFilter === 'ALL'
                ? 'bg-paypal-blue text-white shadow-glow-paypal border border-paypal-cyan/40'
                : 'bg-obsidian-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>All Records</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            data-testid="filter-chip-discrepancies"
            onClick={() => setActiveFilter('DISCREPANCIES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeFilter === 'DISCREPANCIES'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-obsidian-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Discrepancies</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-mono">
              {counts.discrepancies}
            </span>
          </button>

          <button
            type="button"
            data-testid="filter-chip-matched"
            onClick={() => setActiveFilter('MATCHED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeFilter === 'MATCHED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-obsidian-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Matched</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              {counts.matched}
            </span>
          </button>

          <button
            type="button"
            data-testid="filter-chip-orphans"
            onClick={() => setActiveFilter('ORPHANS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeFilter === 'ORPHANS'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-obsidian-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Layers className="w-3 h-3 text-amber-400" />
            <span>Orphans</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
              {counts.orphans}
            </span>
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, payer, bank..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-obsidian-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-paypal-cyan transition w-56 font-sans"
            />
          </div>
          <button
            type="button"
            onClick={handleFitColumns}
            className="p-2 rounded-lg bg-obsidian-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Auto-fit columns"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* AG Grid Container */}
      <div className="ag-theme-quartz-dark w-full h-[520px] rounded-xl overflow-hidden border border-slate-800 shadow-card-dark">
        <AgGridReact<ReconciliationRecord>
          ref={gridRef}
          rowData={filteredData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowHeight={52}
          headerHeight={44}
          animateRows={true}
          onGridReady={onGridReady}
          suppressCellFocus={true}
        />
      </div>

      {/* Deep Discrepancy Inspector Modal */}
      <DiscrepancyInspectorModal />
    </div>
  );
};
