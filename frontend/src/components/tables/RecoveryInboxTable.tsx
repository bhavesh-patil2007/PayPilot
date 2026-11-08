import React, { useState, useMemo, useCallback, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  GridReadyEvent,
  SelectionChangedEvent,
  GridApi,
  IRowNode,
  ICellRendererParams,
} from 'ag-grid-community';
import { usePayPilotStore } from '../../store/usePayPilotStore';
import { RecoveryCase, RecoveryFunnelStage } from '../../types';
import {
  Search,
  CheckCircle2,
  Clock,
  HelpCircle,
  Zap,
  Calendar,
  Loader2,
  X,
} from 'lucide-react';

export interface RecoveryInboxTableProps {
  selectedStageFilter?: RecoveryFunnelStage | null;
  onClearStageFilter?: () => void;
  className?: string;
}

export const RecoveryInboxTable: React.FC<RecoveryInboxTableProps> = ({
  selectedStageFilter,
  onClearStageFilter,
  className = '',
}) => {
  const {
    recoveryCases,
    executeSandboxClaim,
    batchClaimRecoveryCases,
    openExplainability,
  } = usePayPilotStore();

  const [selectedRows, setSelectedRows] = useState<RecoveryCase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [processingCaseId, setProcessingCaseId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const gridApiRef = useRef<GridApi<RecoveryCase> | null>(null);

  // Filtered rows based on stage, search, provider, and category
  const filteredData = useMemo(() => {
    return recoveryCases.filter((c) => {
      if (selectedStageFilter && c.status !== selectedStageFilter) return false;
      if (providerFilter !== 'ALL' && c.provider !== providerFilter) return false;
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (c.title || '').toLowerCase().includes(q);
        const matchCase =
          (c.caseNumber || '').toLowerCase().includes(q) ||
          (c.id || '').toLowerCase().includes(q);
        const matchRule = (c.explainability?.ruleName || '').toLowerCase().includes(q);
        const matchMerchant = ((c as any).merchantOrProvider || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCase && !matchRule && !matchMerchant) return false;
      }
      return true;
    });
  }, [recoveryCases, selectedStageFilter, providerFilter, categoryFilter, searchQuery]);

  // Single Claim Execution Handler
  const handleSingleClaim = useCallback(
    async (caseId: string) => {
      setProcessingCaseId(caseId);
      try {
        await executeSandboxClaim(caseId);
      } catch (err) {
        console.error('Failed to execute sandbox claim:', err);
      } finally {
        setProcessingCaseId(null);
      }
    },
    [executeSandboxClaim]
  );

  // Batch Claim Execution Handler
  const handleBatchClaim = useCallback(async () => {
    const eligibleIds = selectedRows
      .filter((r) => r.status === 'POTENTIAL_IDENTIFIED')
      .map((r) => r.id);
    if (eligibleIds.length === 0) return;

    setIsBatchProcessing(true);
    try {
      await batchClaimRecoveryCases(eligibleIds);
      if (gridApiRef.current) {
        gridApiRef.current.deselectAll();
      }
      setSelectedRows([]);
    } catch (err) {
      console.error('Batch recovery failed:', err);
    } finally {
      setIsBatchProcessing(false);
    }
  }, [selectedRows, batchClaimRecoveryCases]);

  // AG Grid Event Handlers
  const onGridReady = useCallback((params: GridReadyEvent<RecoveryCase>) => {
    gridApiRef.current = params.api;
  }, []);

  const onSelectionChanged = useCallback((event: SelectionChangedEvent<RecoveryCase>) => {
    const nodes = event.api.getSelectedNodes();
    const data = nodes.map((n) => n.data).filter(Boolean) as RecoveryCase[];
    setSelectedRows(data);
  }, []);

  const clearSelection = useCallback(() => {
    if (gridApiRef.current) {
      gridApiRef.current.deselectAll();
    }
    setSelectedRows([]);
  }, []);

  // Column Definitions
  const columnDefs = useMemo<ColDef<RecoveryCase>[]>(() => {
    return [
      {
        headerName: '',
        checkboxSelection: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        width: 48,
        minWidth: 48,
        maxWidth: 48,
        pinned: 'left',
        resizable: false,
        sortable: false,
        filter: false,
      },
      {
        field: 'caseNumber',
        headerName: 'Case ID',
        width: 140,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: ICellRendererParams<RecoveryCase>) => {
          if (!params.data) return null;
          return (
            <div className="flex flex-col justify-center h-full">
              <span className="font-mono font-semibold text-white text-xs">{params.value}</span>
              <span className="font-mono text-[10px] text-slate-400">{params.data.id}</span>
            </div>
          );
        },
      },
      {
        field: 'dateDetected',
        headerName: 'Detected',
        width: 115,
        sortable: true,
        filter: 'agDateColumnFilter',
        cellRenderer: (params: ICellRendererParams<RecoveryCase>) => (
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono h-full">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{params.value}</span>
          </div>
        ),
      },
      {
        field: 'provider',
        headerName: 'Provider',
        width: 120,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: ICellRendererParams<RecoveryCase>) => {
          const provider = params.value;
          let badgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
          if (provider === 'PayPal') badgeClass = 'bg-paypal-blue/20 text-paypal-cyan border-paypal-cyan/30';
          else if (provider === 'Stripe') badgeClass = 'bg-purple-950/60 text-purple-300 border-purple-500/30';
          else if (provider === 'Chase') badgeClass = 'bg-blue-950/60 text-blue-300 border-blue-500/30';
          else if (provider === 'Amex') badgeClass = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30';

          return (
            <div className="flex items-center h-full">
              <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border ${badgeClass}`}>
                {provider}
              </span>
            </div>
          );
        },
      },
      {
        field: 'category',
        headerName: 'Category',
        width: 190,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: ICellRendererParams<RecoveryCase>) => {
          const cat = params.value;
          const labels: Record<string, { label: string; color: string }> = {
            DUPLICATE_PROCESSING_FEE: { label: 'Duplicate Fee', color: 'bg-amber-950/60 text-amber-300 border-amber-500/30' },
            DUPLICATE_PAYMENT: { label: 'Duplicate Payment', color: 'bg-amber-950/60 text-amber-300 border-amber-500/30' },
            UNAPPLIED_REFUND_CREDIT: { label: 'Unapplied Credit', color: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30' },
            FX_SPREAD_LEAKAGE: { label: 'FX Spread Leak', color: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/30' },
            DISPUTE_CHARGEBACK_HOLD: { label: 'Dispute Hold', color: 'bg-rose-950/60 text-rose-300 border-rose-500/30' },
            SUBSCRIPTION_OVERBILLING: { label: 'Sub Overbilling', color: 'bg-orange-950/60 text-orange-300 border-orange-500/30' },
            TIER_MISMATCH_SURCHARGE: { label: 'Tier Mismatch', color: 'bg-sky-950/60 text-sky-300 border-sky-500/30' },
          };
          const mapped = labels[cat] || { label: cat, color: 'bg-slate-800 text-slate-300 border-slate-700' };

          return (
            <div className="flex items-center h-full" title={params.data?.title}>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${mapped.color}`}>
                {mapped.label}
              </span>
            </div>
          );
        },
      },
      {
        field: 'claimAmount',
        headerName: 'Recoverable',
        width: 135,
        sortable: true,
        filter: 'agNumberColumnFilter',
        cellRenderer: (params: ICellRendererParams<RecoveryCase>) => {
          if (params.value === undefined || params.value === null) return null;
          return (
            <div className="flex items-center h-full">
              <span className="font-mono font-bold text-fintech-green text-xs">
                +${params.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          );
        },
      },
      {
        field: 'confidenceScore',
        headerName: 'Confidence',
        width: 135,
        sortable: true,
        filter: 'agNumberColumnFilter',
        cellRenderer: (params: ICellRendererParams<RecoveryCase>) => {
          const score = params.value ?? 0;
          let barColor = 'bg-fintech-green';
          let textColor = 'text-fintech-green';
          if (score < 90) {
            barColor = 'bg-fintech-amber';
            textColor = 'text-amber-400';
          } else if (score < 95) {
            barColor = 'bg-paypal-cyan';
            textColor = 'text-paypal-cyan';
          }

          return (
            <div className="flex items-center gap-2 h-full">
              <div className="w-14 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
              </div>
              <span className={`text-[11px] font-mono font-semibold ${textColor}`}>{score}%</span>
            </div>
          );
        },
      },
      {
        field: 'status',
        headerName: 'Funnel Status',
        width: 165,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: ICellRendererParams<RecoveryCase>) => {
          const status = params.value as RecoveryFunnelStage;
          if (status === 'VERIFIED_RECOVERED') {
            return (
              <div className="flex items-center gap-1.5 h-full">
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-fintech-green/10 text-fintech-green border border-fintech-green/30 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Recovered
                </span>
              </div>
            );
          }
          if (status === 'PROVIDER_PENDING') {
            return (
              <div className="flex items-center gap-1.5 h-full">
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-purple-950/40 text-purple-300 border border-purple-500/30 font-medium">
                  <Clock className="w-3 h-3 text-purple-400" />
                  Under Review
                </span>
              </div>
            );
          }
          if (status === 'CLAIM_SUBMITTED') {
            return (
              <div className="flex items-center gap-1.5 h-full">
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-paypal-blue/20 text-paypal-cyan border border-paypal-blue/40 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-paypal-cyan animate-pulse" />
                  Submitted
                </span>
              </div>
            );
          }
          return (
            <div className="flex items-center gap-1.5 h-full">
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-950/40 text-amber-300 border border-amber-500/30 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Identified
              </span>
            </div>
          );
        },
      },
      {
        headerName: 'Actions',
        pinned: 'right',
        width: 220,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<RecoveryCase>) => {
          if (!params.data) return null;
          const caseItem: RecoveryCase = params.data;
          const isClaimable = caseItem.status === 'POTENTIAL_IDENTIFIED';
          const isThisProcessing = processingCaseId === caseItem.id;

          return (
            <div className="flex items-center gap-2 h-full">
              <button
                type="button"
                onClick={() => openExplainability(caseItem.explainability?.ruleId || 'RULE-DUP-FEE-02', caseItem.id)}
                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                title="Inspect detection formula, linked records, and PayPal API payload"
              >
                <HelpCircle className="w-3 h-3 text-paypal-cyan" />
                <span>Why flagged?</span>
              </button>

              {isClaimable ? (
                <button
                  type="button"
                  onClick={() => handleSingleClaim(caseItem.id)}
                  disabled={isThisProcessing}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-paypal-blue hover:bg-paypal-blue/80 text-white transition shadow-glow-paypal disabled:opacity-50"
                >
                  {isThisProcessing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Filing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 text-paypal-cyan" />
                      <span>Claim</span>
                    </>
                  )}
                </button>
              ) : (
                <span className="text-[10px] font-mono text-slate-500">
                  {caseItem.status === 'VERIFIED_RECOVERED' ? 'Settled' : 'Pending'}
                </span>
              )}
            </div>
          );
        },
      },
    ];
  }, [handleSingleClaim, openExplainability, processingCaseId]);

  const selectedTotalAmount = useMemo(() => {
    return selectedRows.reduce((sum, r) => sum + (r.claimAmount || 0), 0);
  }, [selectedRows]);

  return (
    <div data-testid="recovery-inbox-table" className={`space-y-4 ${className}`}>
      {/* Filtering Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-obsidian-900 border border-slate-800">
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Case ID, Rule, or Discrepancy Title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-obsidian-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-paypal-cyan transition"
            />
          </div>

          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-obsidian-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-paypal-cyan"
          >
            <option value="ALL">All Providers</option>
            <option value="PayPal">PayPal</option>
            <option value="Stripe">Stripe</option>
            <option value="Chase">Chase</option>
            <option value="Amex">Amex</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-obsidian-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-paypal-cyan"
          >
            <option value="ALL">All Categories</option>
            <option value="DUPLICATE_PROCESSING_FEE">Duplicate Processing Fee</option>
            <option value="TIER_MISMATCH_SURCHARGE">Tier Mismatch</option>
            <option value="FX_SPREAD_LEAKAGE">FX Spread Leakage</option>
            <option value="DISPUTE_CHARGEBACK_HOLD">Dispute Hold</option>
            <option value="UNAPPLIED_REFUND_CREDIT">Unapplied Refund Credit</option>
            <option value="SUBSCRIPTION_OVERBILLING">Subscription Overbilling</option>
          </select>
        </div>

        {selectedStageFilter && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-paypal-blue/15 border border-paypal-cyan/30 text-xs text-paypal-cyan">
            <span>
              Stage Filter: <strong>{selectedStageFilter}</strong> ({filteredData.length} cases)
            </span>
            {onClearStageFilter && (
              <button
                type="button"
                onClick={onClearStageFilter}
                className="p-0.5 rounded hover:bg-paypal-blue/30 text-white transition"
                title="Clear stage filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Batch Claim Action Bar (Appears when >= 1 row selected) */}
      {selectedRows.length > 0 && (
        <div
          data-testid="batch-claim-bar"
          className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-obsidian-900 via-obsidian-850 to-obsidian-900 border border-paypal-blue/40 shadow-glow-paypal animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-paypal-blue text-white font-mono text-xs font-bold">
              {selectedRows.length}
            </span>
            <span className="text-xs text-slate-300">Selected for automated recovery:</span>
            <span className="font-mono font-bold text-fintech-green text-sm">
              ${selectedTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearSelection}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={handleBatchClaim}
              disabled={isBatchProcessing}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-paypal-blue to-paypal-dark hover:from-paypal-cyan hover:to-paypal-blue text-white font-semibold text-xs shadow-glow-paypal transition disabled:opacity-50"
            >
              {isBatchProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing Claims...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-paypal-cyan" />
                  <span>Execute Batch Recovery via PayPal Sandbox</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* AG Grid Table Container */}
      <div className="ag-theme-quartz-dark w-full h-[560px] rounded-xl overflow-hidden border border-slate-800 shadow-card-dark bg-obsidian-900">
        <AgGridReact<RecoveryCase>
          rowData={filteredData}
          columnDefs={columnDefs}
          defaultColDef={{
            resizable: true,
            sortable: true,
            filter: true,
            minWidth: 100,
          }}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          isRowSelectable={(node: IRowNode<RecoveryCase>) => node.data?.status === 'POTENTIAL_IDENTIFIED'}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 25, 50, 100]}
          rowHeight={52}
          headerHeight={46}
          animateRows={true}
          onSelectionChanged={onSelectionChanged}
          onGridReady={onGridReady}
        />
      </div>
    </div>
  );
};
