import { useState, useEffect, useCallback } from 'react';
import {
  SupplierInvoiceItem,
  SupplierInvoiceDetail,
} from '../types';
import * as invoicesApi from '../services/vendorInvoicesApi';

export function useInvoices() {
  const [invoices, setInvoices] = useState<SupplierInvoiceItem[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await invoicesApi.fetchInvoices();
      setInvoices(data);
      if (data.length > 0 && !selectedInvoiceId) {
        setSelectedInvoiceId(data[0].id);
      }
    } catch (err) {
      console.error('[useInvoices] Failed to load invoices', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedInvoiceId]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    if (!selectedInvoiceId) {
      setSelectedInvoice(null);
      return;
    }
    let isCancelled = false;
    invoicesApi.fetchInvoiceDetail(selectedInvoiceId).then((detail) => {
      if (!isCancelled) setSelectedInvoice(detail);
    });
    return () => {
      isCancelled = true;
    };
  }, [selectedInvoiceId]);

  const verifyInvoice = async (invoiceId: string) => {
    setIsActionLoading(true);
    try {
      const result = await invoicesApi.verifyInvoice(invoiceId);
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice({
          ...selectedInvoice,
          findings: result.findings,
          risk_status: result.risk_status as any,
        });
      }
      setActionMessage(result.explanation);
      loadInvoices();
    } finally {
      setIsActionLoading(false);
    }
  };

  const verifyBeneficiary = async (vendorId: string, fingerprint: string, notes: string) => {
    setIsActionLoading(true);
    try {
      await invoicesApi.verifyVendorPaymentProfile(vendorId, fingerprint, notes);
      if (selectedInvoice) {
        setSelectedInvoice({
          ...selectedInvoice,
          beneficiary_verified: true,
          risk_status: 'clear',
          findings: selectedInvoice.findings.map((f) =>
            f.finding_type === 'beneficiary_changed' ? { ...f, status: 'verified_safe' } : f
          ),
        });
      }
      setActionMessage('Out-of-band beneficiary verification recorded. Status cleared for payment review.');
      loadInvoices();
    } finally {
      setIsActionLoading(false);
    }
  };

  const approveInvoice = async (invoiceId: string, overrideReason?: string) => {
    setIsActionLoading(true);
    try {
      const result = await invoicesApi.approveInvoicePayment(invoiceId, overrideReason);
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice({
          ...selectedInvoice,
          risk_status: 'approved',
        });
      }
      setActionMessage(`Payment approved! Approval ID #${result.approval_request_id} created with payload binding.`);
      loadInvoices();
    } finally {
      setIsActionLoading(false);
    }
  };

  const uploadInvoice = async (payload: {
    vendor_name: string;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    total_amount: number;
    po_number?: string;
    destination_account?: string;
    destination_routing?: string;
    destination_bank_name?: string;
  }) => {
    setIsActionLoading(true);
    try {
      const created = await invoicesApi.createInvoice(payload);
      setActionMessage(`Invoice #${created.invoice_number} registered. Risk status: ${created.risk_status.toUpperCase()}.`);
      await loadInvoices();
      setSelectedInvoiceId(created.id);
      return created;
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesRisk = riskFilter === 'all' || inv.risk_status === riskFilter;
    const matchesSearch =
      inv.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.po_number && inv.po_number.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRisk && matchesSearch;
  });

  return {
    invoices: filteredInvoices,
    rawInvoices: invoices,
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
    refresh: loadInvoices,
    verifyInvoice,
    verifyBeneficiary,
    approveInvoice,
    uploadInvoice,
    clearActionMessage: () => setActionMessage(null),
  };
}
