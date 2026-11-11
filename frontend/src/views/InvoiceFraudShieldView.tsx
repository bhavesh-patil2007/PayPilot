import React, { useState } from 'react';
import { useInvoices } from '../hooks/useInvoices';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Building,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Lock,
  PhoneCall,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Layers,
} from 'lucide-react';

export function InvoiceFraudShieldView() {
  const {
    invoices,
    rawInvoices,
    selectedInvoiceId,
    selectedInvoice,
    isLoading,
    isActionLoading,
    riskFilter,
    searchQuery,
    actionMessage,
    setRiskFilter,
    setSearchQuery,
    setSelectedInvoiceId,
    refresh,
    verifyInvoice,
    verifyBeneficiary,
    approveInvoice,
    uploadInvoice,
    clearActionMessage,
  } = useInvoices();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [phoneVerifierNotes, setPhoneVerifierNotes] = useState('');

  // Upload Form State
  const [newVendor, setNewVendor] = useState('Nexus Industrial Gear LLC');
  const [newInvNum, setNewInvNum] = useState('NEX-9921-B');
  const [newAmount, setNewAmount] = useState('18400.00');
  const [newPoNum, setNewPoNum] = useState('PO-8812');
  const [newBankAcc, setNewBankAcc] = useState('US-WIRE-998811229120');

  const onUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await uploadInvoice({
      vendor_name: newVendor,
      invoice_number: newInvNum,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      total_amount: parseFloat(newAmount) || 0,
      po_number: newPoNum,
      destination_account: newBankAcc,
      destination_bank_name: 'Wells Fargo / Unverified Account',
      destination_routing: '121000244',
    });
    setIsUploadOpen(false);
  };

  const handleVerifyBeneficiary = async () => {
    if (!selectedInvoice) return;
    const dest = selectedInvoice.destination_account || 'US-WIRE-UNKNOWN';
    await verifyBeneficiary(
      selectedInvoice.vendor_id,
      dest,
      phoneVerifierNotes || 'Confirmed with vendor CFO via established +1-415-555-0199 contact.'
    );
    setPhoneVerifierNotes('');
  };

  const handleApprove = async () => {
    if (!selectedInvoice) return;
    await approveInvoice(selectedInvoice.id, overrideReason || undefined);
    setOverrideReason('');
  };

  // Metrics
  const onHoldCount = rawInvoices.filter((i) => i.risk_status === 'hold').length;
  const totalHeldAmount = rawInvoices
    .filter((i) => i.risk_status === 'hold')
    .reduce((acc, i) => acc + i.total_amount, 0);

  return (
    <div data-testid="invoice-fraud-shield-view" className="space-y-6">
      {/* 1. Header & Metric Overview */}
      <div className="glass tone-glow rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white flex items-center gap-2.5 font-display">
            Vendor & Invoice Fraud Shield
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              Pre-Payment Defense
            </span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Pre-payment verification checking 3-way PO match, duplicate invoices, and unverified beneficiary bank changes.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono uppercase block">Capital On Hold</span>
            <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
              ${totalHeldAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="h-8 w-px bg-stone-200/60 dark:bg-stone-800" />
          <div className="text-right">
            <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono uppercase block">Suspicious Invoices</span>
            <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
              {onHoldCount} Held
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
          >
            <Upload className="h-3.5 w-3.5" />
            Intake Invoice
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button
            type="button"
            onClick={clearActionMessage}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-mono text-xs ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Main Review Queue Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Invoice Review Queue Table (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass tone-glow rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-white/10">
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                Invoice Review Queue ({invoices.length})
              </span>
              <span className="text-[11px] font-mono text-stone-400">Pre-Payment Gate</span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search vendor, invoice, PO..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-stone-100 dark:bg-stone-900/60 border border-stone-200 dark:border-white/10 text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:border-amber-500"
                />
              </div>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-stone-100 dark:bg-stone-900/60 border border-stone-200 dark:border-white/10 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Risk</option>
                <option value="hold">On Hold</option>
                <option value="review_required">Review Required</option>
                <option value="clear">Clear</option>
                <option value="approved">Approved</option>
              </select>
            </div>

            {/* List */}
            <div className="space-y-3 pt-1">
              {invoices.map((inv) => {
                const isSelected = inv.id === selectedInvoiceId;
                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvoiceId(inv.id)}
                    className={`p-4 rounded-xl border transition cursor-pointer relative ${
                      isSelected
                        ? 'border-amber-500/80 bg-amber-500/10 shadow-lg'
                        : 'border-stone-200/70 dark:border-white/10 bg-white/40 dark:bg-stone-900/40 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-stone-900 dark:text-white">
                            {inv.invoice_number}
                          </span>
                          {inv.po_number && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                              {inv.po_number}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-stone-700 dark:text-stone-300 mt-1">
                          {inv.vendor_name}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-sm font-bold text-stone-900 dark:text-white block">
                          ${inv.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] font-mono text-stone-400">
                          Due: {inv.due_date}
                        </span>
                      </div>
                    </div>

                    {/* Risk Status & Findings Badges */}
                    <div className="mt-3 pt-2 border-t border-stone-200/40 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {inv.findings.map((f) => (
                          <span
                            key={f.id}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-medium ${
                              f.severity === 'critical'
                                ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {f.finding_type.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          inv.risk_status === 'hold'
                            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                            : inv.risk_status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {inv.risk_status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Pre-Payment Verification Workspace (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedInvoice ? (
            <div className="glass tone-glow rounded-2xl p-5 space-y-5">
              {/* Workspace Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/60 dark:border-white/10">
                <div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                    Pre-Payment Inspection · {selectedInvoice.invoice_number}
                  </span>
                  <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    {selectedInvoice.vendor_name}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => verifyInvoice(selectedInvoice.id)}
                    disabled={isActionLoading}
                    className="px-3 py-1.5 rounded-xl border border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isActionLoading ? 'animate-spin' : ''}`} />
                    Re-Verify All Rules
                  </button>
                </div>
              </div>

              {/* 3-Way Matching Engine Visualizer */}
              <div className="p-4 rounded-xl bg-white/50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-white/10 space-y-3">
                <span className="text-[11px] font-mono font-bold text-stone-800 dark:text-stone-200 uppercase flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-amber-500" />
                  Three-Way Matching (Invoice vs Purchase Order vs Receipt)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-stone-100 dark:bg-stone-900/80 border border-stone-200/60 dark:border-white/10">
                    <span className="text-[10px] text-stone-400 font-mono block">1. INVOICE AMOUNT</span>
                    <span className="text-base font-bold font-mono text-stone-900 dark:text-white">
                      ${selectedInvoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-1">Inv #{selectedInvoice.invoice_number}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-stone-100 dark:bg-stone-900/80 border border-stone-200/60 dark:border-white/10">
                    <span className="text-[10px] text-stone-400 font-mono block">2. PURCHASE ORDER</span>
                    <span className="text-base font-bold font-mono text-stone-900 dark:text-white">
                      ${(selectedInvoice.po_amount || selectedInvoice.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-1">{selectedInvoice.po_number || 'PO Not Linked'}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-stone-100 dark:bg-stone-900/80 border border-stone-200/60 dark:border-white/10">
                    <span className="text-[10px] text-stone-400 font-mono block">3. VARIANCE CHECK</span>
                    <span
                      className={`text-base font-bold font-mono ${
                        selectedInvoice.po_amount && selectedInvoice.total_amount > selectedInvoice.po_amount
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {selectedInvoice.po_amount && selectedInvoice.total_amount > selectedInvoice.po_amount
                        ? `+$${(selectedInvoice.total_amount - selectedInvoice.po_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                        : '$0.00 (Matched)'}
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-1">
                      {selectedInvoice.three_way_match_status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Beneficiary & Destination Verification Box (CRITICAL SECURITY GUARDRAIL) */}
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  !selectedInvoice.beneficiary_verified
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-emerald-500/10 border-emerald-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase flex items-center gap-1.5 text-stone-900 dark:text-white">
                    <Building className="h-4 w-4 text-amber-500" />
                    Beneficiary Remittance Verification
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      selectedInvoice.beneficiary_verified
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 animate-pulse'
                    }`}
                  >
                    {selectedInvoice.beneficiary_verified ? 'VERIFIED MATCH' : 'CHANGED DESTINATION'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-stone-100 dark:bg-stone-900/70 border border-stone-200/40 dark:border-white/10 space-y-1">
                    <span className="text-[10px] font-mono text-stone-400 block">CURRENT INVOICE REMITTANCE</span>
                    <p className="font-mono font-bold text-stone-900 dark:text-white text-xs">
                      {selectedInvoice.destination_account || 'US-ACH-449102834491'}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      Bank: {selectedInvoice.destination_bank_name || 'Wells Fargo'}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-stone-100 dark:bg-stone-900/70 border border-stone-200/40 dark:border-white/10 space-y-1">
                    <span className="text-[10px] font-mono text-stone-400 block">HISTORICAL VERIFIED PROFILE</span>
                    <p className="font-mono font-bold text-stone-900 dark:text-white text-xs">
                      {selectedInvoice.verified_destination_account || 'US-ACH-449102834491'}
                    </p>
                    <p className="text-[10px] text-stone-400">Bank: JPMorgan Chase N.A. (Verified)</p>
                  </div>
                </div>

                {!selectedInvoice.beneficiary_verified && (
                  <div className="pt-2 border-t border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium leading-relaxed">
                      Mandatory Guardrail: Beneficiary bank account differs from verified history. Out-of-band verification required before payment release.
                    </p>
                    <button
                      type="button"
                      onClick={handleVerifyBeneficiary}
                      disabled={isActionLoading}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
                    >
                      <PhoneCall className="h-3.5 w-3.5" />
                      Verify via Phone
                    </button>
                  </div>
                )}
              </div>

              {/* Explainable Risk Findings */}
              {selectedInvoice.findings.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold text-stone-800 dark:text-stone-200 uppercase block">
                    Explainable Risk Findings ({selectedInvoice.findings.length})
                  </span>
                  <div className="space-y-2.5">
                    {selectedInvoice.findings.map((f) => (
                      <div
                        key={f.id}
                        className="p-3 rounded-xl bg-white/50 dark:bg-stone-900/50 border border-stone-200/60 dark:border-white/10 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                            {f.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              f.severity === 'critical'
                                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {f.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                          {f.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Line Items Table */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-stone-800 dark:text-stone-200 uppercase block">
                  Extracted Bill of Materials (Line Items)
                </span>
                <div className="overflow-x-auto rounded-xl border border-stone-200/60 dark:border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 dark:bg-stone-900/80 text-[10px] font-mono uppercase text-stone-500 dark:text-stone-400">
                      <tr>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 text-right">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200/40 dark:divide-white/5 font-mono text-[11px]">
                      {selectedInvoice.line_items.map((li, idx) => (
                        <tr key={idx} className="hover:bg-white/40 dark:hover:bg-white/5">
                          <td className="p-2.5 font-sans font-medium text-stone-900 dark:text-white">
                            {li.description}
                          </td>
                          <td className="p-2.5 text-right text-stone-600 dark:text-stone-300">
                            {li.quantity}
                          </td>
                          <td className="p-2.5 text-right text-stone-600 dark:text-stone-300">
                            ${li.unit_price.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right font-bold text-stone-900 dark:text-white">
                            ${li.line_total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pre-Payment Approval / Hold Action Bar */}
              <div className="pt-3 border-t border-stone-200/60 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] font-mono text-stone-400 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-500" />
                  Payment hold enforced by Commitment Firewall
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedInvoice) {
                        selectedInvoice.risk_status = 'hold';
                      }
                    }}
                    className="px-4 py-2 rounded-xl border border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5 text-stone-700 dark:text-stone-300 text-xs font-semibold transition"
                  >
                    Place On Hold
                  </button>

                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isActionLoading || (!selectedInvoice.beneficiary_verified && !overrideReason)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-1.5 ${
                      !selectedInvoice.beneficiary_verified && !overrideReason
                        ? 'bg-stone-300 dark:bg-stone-800 text-stone-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve Payment
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass tone-glow rounded-2xl p-12 text-center text-stone-400 text-xs font-mono">
              Select an invoice from the review queue to open inspection.
            </div>
          )}
        </div>
      </div>

      {/* Upload / Register Invoice Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="glass tone-glow rounded-2xl p-6 w-full max-w-lg space-y-4 border border-stone-200/60 dark:border-white/10 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-white/10">
              <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2 font-display">
                <Upload className="h-4 w-4 text-amber-500" />
                Intake Supplier Invoice (Simulator)
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="text-stone-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={onUploadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-stone-400 font-mono block mb-1">Supplier / Vendor Name</label>
                <input
                  type="text"
                  value={newVendor}
                  onChange={(e) => setNewVendor(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-400 font-mono block mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={newInvNum}
                    onChange={(e) => setNewInvNum(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-stone-400 font-mono block mb-1">PO Number (Optional)</label>
                  <input
                    type="text"
                    value={newPoNum}
                    onChange={(e) => setNewPoNum(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-stone-400 font-mono block mb-1">Total Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-stone-400 font-mono block mb-1">
                  Remittance Bank Account (Try altering to trigger fraud shield)
                </label>
                <input
                  type="text"
                  value={newBankAcc}
                  onChange={(e) => setNewBankAcc(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white font-mono text-[11px]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-white/10 text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Register & Scan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
