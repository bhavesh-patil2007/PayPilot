import React, { useMemo, useState, useCallback, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  GridReadyEvent,
  SelectionChangedEvent,
  ICellRendererParams,
  GridApi,
} from 'ag-grid-community';
import { usePayPilotStore } from '../../store/usePayPilotStore';
import { UdhariCustomer, AgingBucket } from '../../types';
import {
  MessageSquare,
  Receipt,
  Percent,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Mail,
  Phone,
  X,
  Copy,
  Check,
  Send,
  Zap,
} from 'lucide-react';

export interface UdhariLedgerTableProps {
  selectedBucket?: AgingBucket | 'ALL' | null;
  onOpenWhatsAppModal?: (customer: UdhariCustomer) => void;
  onOpenPayPalInvoiceModal?: (customer: UdhariCustomer) => void;
  onOpenSettlementModal?: (customer: UdhariCustomer) => void;
  className?: string;
}

export const UdhariLedgerTable: React.FC<UdhariLedgerTableProps> = ({
  selectedBucket = 'ALL',
  onOpenWhatsAppModal,
  onOpenPayPalInvoiceModal,
  onOpenSettlementModal,
  className = '',
}) => {
  const { udhariCustomers, sendUdhariReminder, recordUdhariSettlement } = usePayPilotStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<UdhariCustomer[]>([]);
  const gridApiRef = useRef<GridApi<UdhariCustomer> | null>(null);

  // Internal Modal States
  const [activeCustomerForWhatsApp, setActiveCustomerForWhatsApp] = useState<UdhariCustomer | null>(null);
  const [activeCustomerForInvoice, setActiveCustomerForInvoice] = useState<UdhariCustomer | null>(null);
  const [activeCustomerForSettlement, setActiveCustomerForSettlement] = useState<UdhariCustomer | null>(null);

  // WhatsApp modal tone & custom text
  const [whatsappTone, setWhatsappTone] = useState<'FRIENDLY' | 'STANDARD' | 'FIRM'>('FRIENDLY');
  const [whatsappMsgText, setWhatsappMsgText] = useState('');

  // Settlement discount rate (default 5%)
  const [discountPct, setDiscountPct] = useState<number>(5);

  // Toast message
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Filter rows reactively based on selectedBucket and searchQuery
  const filteredRows = useMemo(() => {
    return udhariCustomers.filter((cust) => {
      // 1. Bucket match
      const bucketMatch =
        !selectedBucket || selectedBucket === 'ALL' || cust.agingBucket === selectedBucket;

      // 2. Search query match
      const q = searchQuery.toLowerCase().trim();
      const searchMatch =
        !q ||
        (cust.customerName || '').toLowerCase().includes(q) ||
        (cust.businessName || '').toLowerCase().includes(q) ||
        (cust.customerCode || '').toLowerCase().includes(q) ||
        (cust.contactEmail || '').toLowerCase().includes(q) ||
        (cust.contactPhone || '').toLowerCase().includes(q) ||
        ((cust as any).fullName || '').toLowerCase().includes(q);

      return bucketMatch && searchMatch;
    });
  }, [udhariCustomers, selectedBucket, searchQuery]);

  const onGridReady = useCallback((params: GridReadyEvent<UdhariCustomer>) => {
    gridApiRef.current = params.api;
  }, []);

  const onSelectionChanged = useCallback((event: SelectionChangedEvent<UdhariCustomer>) => {
    const nodes = event.api.getSelectedNodes();
    const rows = nodes.map((n) => n.data).filter(Boolean) as UdhariCustomer[];
    setSelectedRows(rows);
  }, []);

  // WhatsApp Trigger Handler
  const handleTriggerWhatsApp = useCallback(
    (customer: UdhariCustomer) => {
      if (onOpenWhatsAppModal) {
        onOpenWhatsAppModal(customer);
      } else {
        setActiveCustomerForWhatsApp(customer);
        const defaultMsg = `Hi ${customer.customerName}, friendly reminder from PayPilot for ${customer.businessName}: your outstanding balance of $${customer.outstandingBalance.toFixed(2)} is due. Please settle via PayPal: https://paypal.me/paypilot/${Math.round(customer.outstandingBalance)}`;
        setWhatsappMsgText(defaultMsg);
      }
    },
    [onOpenWhatsAppModal]
  );

  // Invoice Trigger Handler
  const handleTriggerInvoice = useCallback(
    (customer: UdhariCustomer) => {
      if (onOpenPayPalInvoiceModal) {
        onOpenPayPalInvoiceModal(customer);
      } else {
        setActiveCustomerForInvoice(customer);
      }
    },
    [onOpenPayPalInvoiceModal]
  );

  // Settlement Trigger Handler
  const handleTriggerSettlement = useCallback(
    (customer: UdhariCustomer) => {
      if (onOpenSettlementModal) {
        onOpenSettlementModal(customer);
      } else {
        setActiveCustomerForSettlement(customer);
        setDiscountPct(5);
      }
    },
    [onOpenSettlementModal]
  );

  // Column Definitions
  const columnDefs = useMemo<ColDef<UdhariCustomer>[]>(() => [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      width: 48,
      minWidth: 48,
      maxWidth: 48,
      pinned: 'left',
      resizable: false,
      sortable: false,
      filter: false,
    },
    {
      headerName: 'Customer',
      field: 'customerName',
      width: 210,
      flex: 1.3,
      cellRenderer: (params: ICellRendererParams<UdhariCustomer>) => {
        const data = params.data;
        if (!data) return null;
        const initials = data.customerName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <div className="flex items-center gap-2.5 h-full py-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-paypal-blue/40 to-paypal-cyan/30 border border-paypal-cyan/40 text-paypal-cyan font-mono text-xs font-bold flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-stone-900 dark:text-white tracking-tight truncate">
                {data.customerName}
              </div>
              <span className="inline-block text-[10px] font-mono text-stone-500 dark:text-stone-400 bg-stone-200/70 dark:bg-stone-800/80 px-1.5 py-0.2 rounded border border-stone-300/70 dark:border-white/10">
                {data.customerCode}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      headerName: 'Business & Contact',
      field: 'businessName',
      width: 230,
      flex: 1.4,
      cellRenderer: (params: ICellRendererParams<UdhariCustomer>) => {
        const data = params.data;
        if (!data) return null;
        return (
          <div className="flex flex-col justify-center h-full py-1">
            <div className="text-xs font-medium text-stone-700 dark:text-stone-200 truncate">{data.businessName}</div>
            <div className="flex items-center gap-2 text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
              <span className="flex items-center gap-1 truncate" title={data.contactEmail}>
                <Mail className="w-3 h-3 text-stone-500 dark:text-stone-400 shrink-0" />
                <span className="truncate">{data.contactEmail}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 shrink-0" title={data.contactPhone}>
                <Phone className="w-3 h-3 text-stone-500 dark:text-stone-400 shrink-0" />
                <span>{data.contactPhone}</span>
              </span>
            </div>
          </div>
        );
      },
    },
    {
      headerName: 'Still unpaid ($)',
      field: 'outstandingBalance',
      width: 180,
      flex: 1.2,
      cellRenderer: (params: ICellRendererParams<UdhariCustomer>) => {
        const data = params.data;
        if (!data) return null;
        const balance = data.outstandingBalance ?? 0;
        const limit = data.creditLimit || 1;
        const utilPct = Math.min(100, Math.round((balance / limit) * 100));
        const barColor = utilPct > 80 ? 'bg-rose-500' : utilPct > 50 ? 'bg-amber-400' : 'bg-emerald-500';

        return (
          <div className="flex flex-col justify-center h-full py-1 font-mono">
            <div className="text-xs font-bold text-stone-900 dark:text-white">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="w-full bg-stone-200/70 dark:bg-stone-800/70 rounded-full h-1.5 mt-1 overflow-hidden">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${utilPct}%` }} />
            </div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 flex justify-between font-sans">
              <span>Limit: ${limit.toLocaleString()}</span>
              <span>{utilPct}%</span>
            </div>
          </div>
        );
      },
    },
    {
      headerName: 'Aging Status',
      field: 'agingBucket',
      width: 180,
      flex: 1.2,
      cellRenderer: (params: ICellRendererParams<UdhariCustomer>) => {
        const data = params.data;
        if (!data) return null;

        let badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        let label = '0-15d (Current)';
        let Icon = CheckCircle;

        if (data.agingBucket === '16_30_DAYS') {
          badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
          label = '16-30d (Watchlist)';
          Icon = Clock;
        } else if (data.agingBucket === '31_60_DAYS') {
          badgeClass = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
          label = '31-60d (Delinquent)';
          Icon = AlertTriangle;
        } else if (data.agingBucket === '60_PLUS_DAYS') {
          badgeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse';
          label = '60+d (Critical)';
          Icon = AlertOctagon;
        }

        return (
          <div className="flex flex-col justify-center h-full py-1">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border ${badgeClass} w-fit`}>
              <Icon className="w-3 h-3 shrink-0" />
              <span>{label}</span>
            </span>
            <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 font-mono">
              {data.daysOverdue === 0 ? 'Current on terms' : `${data.daysOverdue} days overdue`}
            </span>
          </div>
        );
      },
    },
    {
      headerName: 'Risk & Trust',
      field: 'trustScore',
      width: 150,
      flex: 1,
      cellRenderer: (params: ICellRendererParams<UdhariCustomer>) => {
        const data = params.data;
        if (!data) return null;

        const scoreColor = data.trustScore >= 80 ? 'text-emerald-400' : data.trustScore >= 60 ? 'text-amber-400' : 'text-rose-400';
        const tierBadge =
          data.riskTier === 'LOW'
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : data.riskTier === 'MEDIUM'
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            : 'bg-rose-500/20 text-rose-400 border-rose-500/30';

        return (
          <div className="flex items-center gap-2 h-full">
            <div className="flex flex-col">
              <span className={`font-mono text-xs font-bold ${scoreColor}`}>
                {data.trustScore}/100
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400">Trust Score</span>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${tierBadge}`}>
              {data.riskTier}
            </span>
          </div>
        );
      },
    },
    {
      headerName: 'Last Contact',
      field: 'lastReminderDate',
      width: 170,
      flex: 1.1,
      cellRenderer: (params: ICellRendererParams<UdhariCustomer>) => {
        const data = params.data;
        if (!data) return null;

        return (
          <div className="flex flex-col justify-center h-full py-1">
            <div className="text-xs text-stone-600 dark:text-stone-300 font-mono">
              {data.lastReminderDate || 'No reminder yet'}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
              {data.lastReminderChannel && (
                <span className="px-1 rounded bg-stone-200/70 dark:bg-stone-800/70 text-stone-600 dark:text-stone-300 border border-stone-300/70 dark:border-white/10">
                  {data.lastReminderChannel}
                </span>
              )}
              <span>{data.remindersCount} sent</span>
            </div>
          </div>
        );
      },
    },
    {
      headerName: 'Collection Actions',
      pinned: 'right',
      width: 290,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<UdhariCustomer>) => {
        const data = params.data;
        if (!data) return null;

        return (
          <div className="flex items-center gap-1.5 h-full">
            <button
              type="button"
              onClick={() => handleTriggerWhatsApp(data)}
              title="Send WhatsApp Reminder"
              className="px-2 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center gap-1 transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => handleTriggerInvoice(data)}
              title="Generate PayPal Invoice"
              className="px-2 py-1.5 rounded-lg bg-paypal-blue/20 hover:bg-paypal-blue/30 text-paypal-cyan border border-paypal-cyan/30 text-xs font-medium flex items-center gap-1 transition"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Invoice</span>
            </button>
            <button
              type="button"
              onClick={() => handleTriggerSettlement(data)}
              title="Offer Settlement Discount"
              className="px-2 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium flex items-center gap-1 transition"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Settle</span>
            </button>
          </div>
        );
      },
    },
  ], [handleTriggerWhatsApp, handleTriggerInvoice, handleTriggerSettlement]);

  const selectedTotal = useMemo(() => {
    return selectedRows.reduce((acc, row) => acc + (row.outstandingBalance || 0), 0);
  }, [selectedRows]);

  const handleBatchWhatsApp = () => {
    selectedRows.forEach((row) => {
      sendUdhariReminder(row.id, 'WHATSAPP');
    });
    showToast(`Batch WhatsApp reminders dispatched to ${selectedRows.length} customers.`);
    gridApiRef.current?.deselectAll();
    setSelectedRows([]);
  };

  // WhatsApp Send from Modal
  const handleSendWhatsAppFromModal = () => {
    if (!activeCustomerForWhatsApp) return;
    const res = sendUdhariReminder(activeCustomerForWhatsApp.id, 'WHATSAPP');
    showToast(res.message);
    setActiveCustomerForWhatsApp(null);
  };

  // PayPal Invoice Dispatch from Modal
  const handleDispatchInvoiceFromModal = () => {
    if (!activeCustomerForInvoice) return;
    sendUdhariReminder(activeCustomerForInvoice.id, 'PAYPAL_INVOICE');
    showToast(`PayPal Invoice dispatched via Sandbox REST v2 to ${activeCustomerForInvoice.customerName}.`);
    setActiveCustomerForInvoice(null);
  };

  // Record Settlement from Modal
  const handleExecuteSettlementFromModal = () => {
    if (!activeCustomerForSettlement) return;
    const originalBal = activeCustomerForSettlement.outstandingBalance;
    const discountAmt = (originalBal * discountPct) / 100;
    const netToPay = originalBal - discountAmt;
    recordUdhariSettlement(activeCustomerForSettlement.id, originalBal, 'PAYPAL');
    showToast(`Settlement of $${netToPay.toFixed(2)} recorded via PayPal. Liquid cash updated.`);
    setActiveCustomerForSettlement(null);
  };

  const copyInvoiceLink = async (link: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div data-testid="udhari-ledger-table" className={`space-y-3 ${className}`}>
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Search & Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-stone-500 dark:text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search debtor name, business, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/40 dark:bg-stone-900/50 border border-stone-200/60 dark:border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-stone-700 dark:text-stone-200 placeholder-slate-500 focus:outline-none focus:border-paypal-cyan"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-mono">
          <span>
            Showing <strong className="text-white">{filteredRows.length}</strong> of {udhariCustomers.length} accounts
          </span>
        </div>
      </div>

      {/* AG Grid Container */}
      <div className="ag-theme-quartz-dark w-full h-[540px] rounded-xl overflow-hidden border border-stone-200/60 dark:border-white/10 shadow-card-dark bg-white/40 dark:bg-stone-900/50">
        <AgGridReact<UdhariCustomer>
          rowData={filteredRows}
          columnDefs={columnDefs}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            minWidth: 100,
          }}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 20, 50]}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          rowHeight={56}
          headerHeight={44}
          animateRows={true}
          onGridReady={onGridReady}
          onSelectionChanged={onSelectionChanged}
        />
      </div>

      {/* Floating Batch Selection Bar */}
      {selectedRows.length > 0 && (
        <div
          data-testid="udhari-batch-bar"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/40 dark:bg-stone-900/50 border border-paypal-cyan/50 shadow-glow-paypal px-5 py-3 rounded-xl flex items-center gap-4 text-xs animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="text-white font-medium">
            <span className="font-mono text-paypal-cyan font-bold">{selectedRows.length}</span> accounts selected • Total:{' '}
            <span className="font-mono text-emerald-400 font-bold">
              ${selectedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBatchWhatsApp}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition"
            >
              Batch WhatsApp Reminders
            </button>
            <button
              type="button"
              onClick={() => {
                gridApiRef.current?.deselectAll();
                setSelectedRows([]);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-stone-200/70 dark:bg-stone-800/70 hover:bg-stone-300/80 dark:hover:bg-stone-700/80 text-stone-600 dark:text-stone-300 transition"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Modal 1: WhatsApp Reminder Workflow */}
      {activeCustomerForWhatsApp && (
        <div
          data-testid="whatsapp-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setActiveCustomerForWhatsApp(null)}
        >
          <div
            className="w-full max-w-lg p-6 rounded-2xl bg-white/40 dark:bg-stone-900/50 border border-stone-200/60 dark:border-white/10 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">Send WhatsApp Reminder</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    To: {activeCustomerForWhatsApp.customerName} ({activeCustomerForWhatsApp.contactPhone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCustomerForWhatsApp(null)}
                className="text-stone-500 dark:text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-stone-200/60 dark:border-white/10 text-xs space-y-1 font-mono">
              <div className="text-stone-500 dark:text-stone-400">
                Outstanding Balance:{' '}
                <strong className="text-white">${activeCustomerForWhatsApp.outstandingBalance.toFixed(2)}</strong>
              </div>
              <div className="text-stone-500 dark:text-stone-400">
                Overdue:{' '}
                <span className="text-amber-400">{activeCustomerForWhatsApp.daysOverdue} days</span>
              </div>
            </div>

            {/* Tone selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-stone-600 dark:text-stone-300 font-medium">Message Tone:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['FRIENDLY', 'STANDARD', 'FIRM'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setWhatsappTone(t);
                      const base =
                        t === 'FRIENDLY'
                          ? `Hi ${activeCustomerForWhatsApp.customerName}, friendly reminder for ${activeCustomerForWhatsApp.businessName}: $${activeCustomerForWhatsApp.outstandingBalance.toFixed(2)} is due.`
                          : t === 'STANDARD'
                          ? `Dear ${activeCustomerForWhatsApp.customerName}, payment of $${activeCustomerForWhatsApp.outstandingBalance.toFixed(2)} for ${activeCustomerForWhatsApp.businessName} is ${activeCustomerForWhatsApp.daysOverdue} days overdue. Please settle via PayPal.`
                          : `URGENT: ${activeCustomerForWhatsApp.customerName}, your account is ${activeCustomerForWhatsApp.daysOverdue} days overdue. Please settle $${activeCustomerForWhatsApp.outstandingBalance.toFixed(2)} immediately.`;
                      setWhatsappMsgText(
                        `${base} Settle link: https://paypal.me/paypilot/${Math.round(activeCustomerForWhatsApp.outstandingBalance)}`
                      );
                    }}
                    className={`py-1.5 text-xs rounded-lg font-medium transition border ${
                      whatsappTone === t
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-stone-100/80 dark:bg-stone-900/60 text-stone-500 dark:text-stone-400 border-stone-200/60 dark:border-white/10'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable message preview */}
            <div className="space-y-1">
              <label className="text-xs text-stone-600 dark:text-stone-300 font-medium">Message Body:</label>
              <textarea
                value={whatsappMsgText}
                onChange={(e) => setWhatsappMsgText(e.target.value)}
                rows={4}
                className="w-full p-2.5 rounded-lg bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 text-xs text-stone-700 dark:text-stone-200 focus:outline-none focus:border-paypal-cyan font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/60 dark:border-white/10">
              <button
                type="button"
                onClick={() => setActiveCustomerForWhatsApp(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-stone-500 dark:text-stone-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendWhatsAppFromModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-glow-green"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send WhatsApp Reminder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: PayPal Invoice Workflow */}
      {activeCustomerForInvoice && (
        <div
          data-testid="invoice-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setActiveCustomerForInvoice(null)}
        >
          <div
            className="w-full max-w-lg p-6 rounded-2xl bg-white/40 dark:bg-stone-900/50 border border-stone-200/60 dark:border-white/10 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-paypal-blue/20 text-paypal-cyan border border-paypal-cyan/30">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">Generate PayPal Invoice</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Bill To: {activeCustomerForInvoice.businessName} ({activeCustomerForInvoice.contactEmail})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCustomerForInvoice(null)}
                className="text-stone-500 dark:text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">Invoice Number:</span>
                <span className="text-white font-bold">INV-2024-CUST-{activeCustomerForInvoice.customerCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">Invoice Amount:</span>
                <span className="text-emerald-400 font-bold">${activeCustomerForInvoice.outstandingBalance.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">Terms:</span>
                <span className="text-stone-600 dark:text-stone-300">Due Upon Receipt</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs text-stone-600 dark:text-stone-300 font-medium">Checkout Payment URL:</div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-stone-200/60 dark:border-white/10">
                <span className="text-xs font-mono text-paypal-cyan truncate flex-1">
                  https://www.sandbox.paypal.com/invoice/p/#INV2-{activeCustomerForInvoice.customerCode}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyInvoiceLink(`https://www.sandbox.paypal.com/invoice/p/#INV2-${activeCustomerForInvoice.customerCode}`)
                  }
                  className="p-1 rounded bg-stone-200/70 dark:bg-stone-800/70 hover:bg-stone-300/80 dark:hover:bg-stone-700/80 text-stone-600 dark:text-stone-300 transition"
                  title="Copy link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/60 dark:border-white/10">
              <button
                type="button"
                onClick={() => setActiveCustomerForInvoice(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-stone-500 dark:text-stone-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatchInvoiceFromModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-paypal-blue hover:bg-paypal-blue/80 text-white font-medium text-xs transition shadow-glow-paypal"
              >
                <Zap className="w-3.5 h-3.5 text-paypal-cyan" />
                <span>Dispatch via PayPal Sandbox REST v2</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Offer Settlement Discount Workflow */}
      {activeCustomerForSettlement && (
        <div
          data-testid="settlement-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setActiveCustomerForSettlement(null)}
        >
          <div
            className="w-full max-w-lg p-6 rounded-2xl bg-white/40 dark:bg-stone-900/50 border border-stone-200/60 dark:border-white/10 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">Offer Immediate Settlement Discount</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Accelerate liquidity from {activeCustomerForSettlement.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCustomerForSettlement(null)}
                className="text-stone-500 dark:text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-stone-600 dark:text-stone-300 font-medium">Select Settlement Incentive Tier:</label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDiscountPct(pct)}
                    className={`p-2 rounded-xl text-center border transition ${
                      discountPct === pct
                        ? 'bg-purple-950/60 text-purple-300 border-purple-500 ring-2 ring-purple-500/30'
                        : 'bg-white/50 dark:bg-stone-950/60 text-stone-500 dark:text-stone-400 border-stone-200/60 dark:border-white/10 hover:border-stone-300/70 dark:border-white/10'
                    }`}
                  >
                    <div className="text-sm font-bold font-mono">{pct}% OFF</div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                      -${((activeCustomerForSettlement.outstandingBalance * pct) / 100).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated Breakdown */}
            <div className="p-4 rounded-xl bg-white/50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-white/10 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">Original Balance:</span>
                <span className="text-white">${activeCustomerForSettlement.outstandingBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-purple-400">
                <span>Discount Incentive ({discountPct}%):</span>
                <span>-${((activeCustomerForSettlement.outstandingBalance * discountPct) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-200/60 dark:border-white/10 text-sm font-bold text-fintech-green">
                <span>Net Settlement Cash Collected:</span>
                <span>
                  $
                  {(
                    activeCustomerForSettlement.outstandingBalance *
                    (1 - discountPct / 100)
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/60 dark:border-white/10">
              <button
                type="button"
                onClick={() => setActiveCustomerForSettlement(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-stone-500 dark:text-stone-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSettlementFromModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-paypal-blue hover:from-purple-500 hover:to-paypal-cyan text-white font-medium text-xs transition shadow-glow-purple"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Record Immediate Settlement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
