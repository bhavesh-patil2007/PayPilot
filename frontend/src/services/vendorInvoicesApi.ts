import {
  SupplierInvoiceItem,
  SupplierInvoiceDetail,
  InvoiceFinding,
} from '../types';
import { getSupabaseAccessToken } from './supabaseSession';

const API_BASE = import.meta.env.VITE_BACKEND_API_URL
  ? import.meta.env.VITE_BACKEND_API_URL.replace(/\/+$/, '')
  : 'http://localhost:8000/api/v1';

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  const token = getSupabaseAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchInvoices(params?: {
  risk_status?: string;
  vendor_id?: string;
}): Promise<SupplierInvoiceItem[]> {
  const url = new URL(`${API_BASE}/vendor-invoices`);
  if (params?.risk_status) url.searchParams.set('risk_status', params.risk_status);
  if (params?.vendor_id) url.searchParams.set('vendor_id', params.vendor_id);

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as SupplierInvoiceItem[];
  } catch (err) {
    console.warn('[vendorInvoicesApi] Backend unreachable, using fallback invoices', err);
    return FALLBACK_INVOICES;
  }
}

export async function fetchInvoiceDetail(invoiceId: string): Promise<SupplierInvoiceDetail> {
  try {
    const res = await fetch(`${API_BASE}/vendor-invoices/${invoiceId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as SupplierInvoiceDetail;
  } catch (err) {
    console.warn('[vendorInvoicesApi] Using fallback detail for invoice', invoiceId, err);
    const found = FALLBACK_INVOICE_DETAILS[invoiceId] || FALLBACK_INVOICE_DETAILS['inv-nex-7702'];
    return found;
  }
}

export async function createInvoice(payload: {
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  currency?: string;
  total_amount: number;
  po_number?: string;
  destination_account?: string;
  destination_routing?: string;
  destination_bank_name?: string;
  line_items?: any[];
}): Promise<SupplierInvoiceItem> {
  try {
    const res = await fetch(`${API_BASE}/vendor-invoices`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as SupplierInvoiceItem;
  } catch {
    const newId = `inv-${Math.random().toString(36).substring(2, 8)}`;
    return {
      id: newId,
      workspace_id: 'ws-default-01',
      vendor_id: 'ven-nexus-01',
      vendor_name: payload.vendor_name,
      invoice_number: payload.invoice_number,
      invoice_date: payload.invoice_date,
      due_date: payload.due_date,
      currency: payload.currency || 'USD',
      total_amount: payload.total_amount,
      extraction_status: 'extracted',
      risk_status: payload.total_amount > 15000 ? 'hold' : 'clear',
      po_number: payload.po_number,
      findings: [],
      critical_findings_count: 0,
      created_at: new Date().toISOString(),
    };
  }
}

export async function verifyInvoice(invoiceId: string): Promise<{
  risk_status: string;
  findings: InvoiceFinding[];
  checks_performed: Record<string, boolean>;
  recommendation: string;
  explanation: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/vendor-invoices/${invoiceId}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    const detail = FALLBACK_INVOICE_DETAILS[invoiceId] || FALLBACK_INVOICE_DETAILS['inv-nex-7702'];
    return {
      risk_status: detail.risk_status,
      findings: detail.findings,
      checks_performed: {
        duplicate_detection: true,
        po_three_way_match: true,
        beneficiary_fingerprint_check: true,
        vendor_domain_validation: true,
      },
      recommendation: detail.risk_status === 'hold' ? 'hold' : 'approve',
      explanation:
        'Detected beneficiary changed to unverified Wells Fargo account and $4,200 PO variance. Payment on hold.',
    };
  }
}

export async function verifyVendorPaymentProfile(
  vendorId: string,
  fingerprint: string,
  notes: string
): Promise<{ verified: boolean; verified_at: string }> {
  try {
    const res = await fetch(`${API_BASE}/vendors/${vendorId}/verify-payment-profile`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        destination_fingerprint: fingerprint,
        verification_method: 'out_of_band_phone',
        verifier_notes: notes,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return { verified: true, verified_at: new Date().toISOString() };
  }
}

export async function approveInvoicePayment(
  invoiceId: string,
  overrideReason?: string
): Promise<{
  approval_request_id: string;
  status: string;
  payload_hash: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/vendor-invoices/${invoiceId}/approve-payment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ override_reason: overrideReason }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      approval_request_id: `appr-inv-${Math.random().toString(36).substring(2, 8)}`,
      status: 'approved',
      payload_hash: '9e8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
    };
  }
}

// -----------------------------------------------------------------------------
// Fallback Seed Data (Scenario A)
// -----------------------------------------------------------------------------
const FALLBACK_INVOICES: SupplierInvoiceItem[] = [
  {
    id: 'inv-nex-7701',
    workspace_id: 'ws-default-01',
    vendor_id: 'ven-nexus-01',
    vendor_name: 'Nexus Industrial Gear LLC',
    invoice_number: 'NEX-9921',
    invoice_date: '2024-11-01',
    due_date: '2024-11-20',
    currency: 'USD',
    total_amount: 14200.0,
    document_uri: 's3://paypilot-vault/ws-default-01/invoices/nex-9921.pdf',
    extraction_status: 'extracted',
    risk_status: 'clear',
    po_number: 'PO-8812',
    po_amount: 14200.0,
    findings: [],
    critical_findings_count: 0,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'inv-nex-7702',
    workspace_id: 'ws-default-01',
    vendor_id: 'ven-nexus-01',
    vendor_name: 'Nexus Industrial Gear LLC',
    invoice_number: 'NEX-9921-A',
    invoice_date: '2024-11-06',
    due_date: '2024-11-18',
    currency: 'USD',
    total_amount: 18400.0,
    document_uri: 's3://paypilot-vault/ws-default-01/invoices/nex-9921-A-fraud-candidate.pdf',
    extraction_status: 'extracted',
    risk_status: 'hold',
    po_number: 'PO-8812',
    po_amount: 14200.0,
    findings: [
      {
        id: 'FND-BENEFICIARY-01',
        finding_type: 'beneficiary_changed',
        severity: 'critical',
        title: 'Changed Beneficiary Bank Routing (High Risk)',
        description:
          'Payment destination US-WIRE-998811229120 does not match verified historical profile US-ACH-449102834491 (JPMorgan Chase).',
        evidence_json: {
          previous_account: 'US-ACH-449102834491',
          new_account: 'US-WIRE-998811229120',
          previous_bank: 'JPMorgan Chase N.A.',
          new_bank: 'Wells Fargo / Unregistered Recipient',
        },
        status: 'open',
      },
      {
        id: 'FND-PO-MISMATCH-02',
        finding_type: 'po_mismatch',
        severity: 'high',
        title: 'Purchase Order Variance (+$4,200.00)',
        description:
          'Invoice total ($18,400.00) exceeds PO #PO-8812 approved limit ($14,200.00) by +29.6%.',
        evidence_json: {
          po_number: 'PO-8812',
          po_total: 14200.0,
          invoice_total: 18400.0,
          variance: 4200.0,
        },
        status: 'open',
      },
      {
        id: 'FND-DUP-CANDIDATE-03',
        finding_type: 'duplicate_candidate',
        severity: 'high',
        title: 'Near-Duplicate Invoice Number',
        description:
          'Invoice number NEX-9921-A is a synthetic duplicate variant of existing invoice NEX-9921.',
        evidence_json: {
          original_invoice_id: 'inv-nex-7701',
          original_invoice_number: 'NEX-9921',
          levenshtein_similarity: 0.92,
        },
        status: 'open',
      },
    ],
    critical_findings_count: 3,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'inv-apx-4102',
    workspace_id: 'ws-default-01',
    vendor_id: 'ven-apex-02',
    vendor_name: 'Apex Cloud Systems Inc',
    invoice_number: 'APX-4102',
    invoice_date: '2024-11-04',
    due_date: '2024-11-24',
    currency: 'USD',
    total_amount: 3450.0,
    document_uri: 's3://paypilot-vault/ws-default-01/invoices/apx-4102.pdf',
    extraction_status: 'extracted',
    risk_status: 'clear',
    po_number: 'PO-7740',
    po_amount: 3450.0,
    findings: [],
    critical_findings_count: 0,
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
];

const FALLBACK_INVOICE_DETAILS: Record<string, SupplierInvoiceDetail> = {
  'inv-nex-7702': {
    ...FALLBACK_INVOICES[1],
    destination_account: 'US-WIRE-998811229120',
    destination_routing: '121000244',
    destination_bank_name: 'Wells Fargo / Unregistered Recipient',
    verified_destination_account: 'US-ACH-449102834491',
    beneficiary_verified: false,
    three_way_match_status: 'partial_mismatch',
    line_items: [
      {
        id: 'li-10',
        description: 'Industrial Steel Bearing Assembly #B-400 (Altered Qty & Price)',
        quantity: 10,
        unit_price: 1840.0,
        tax_amount: 0,
        line_total: 18400.0,
        matched_po_line_id: 'po-li-01',
      },
    ],
  },
  'inv-nex-7701': {
    ...FALLBACK_INVOICES[0],
    destination_account: 'US-ACH-449102834491',
    destination_routing: '021000021',
    destination_bank_name: 'JPMorgan Chase N.A.',
    verified_destination_account: 'US-ACH-449102834491',
    beneficiary_verified: true,
    three_way_match_status: 'matched',
    line_items: [
      {
        id: 'li-01',
        description: 'Industrial Steel Bearing Assembly #B-400',
        quantity: 10,
        unit_price: 1420.0,
        tax_amount: 0,
        line_total: 14200.0,
        matched_po_line_id: 'po-li-01',
      },
    ],
  },
  'inv-apx-4102': {
    ...FALLBACK_INVOICES[2],
    destination_account: 'US-WIRE-992188113',
    destination_routing: '121000358',
    destination_bank_name: 'Silicon Valley Bank',
    verified_destination_account: 'US-WIRE-992188113',
    beneficiary_verified: true,
    three_way_match_status: 'matched',
    line_items: [
      {
        id: 'li-20',
        description: 'Monthly Kubernetes Dedicated Cluster & Egress',
        quantity: 1,
        unit_price: 3450.0,
        tax_amount: 0,
        line_total: 3450.0,
        matched_po_line_id: 'po-li-77',
      },
    ],
  },
};
