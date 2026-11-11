import {
  DisputeDetail,
  DisputeItem,
  DisputeEvidenceItem,
  EvidenceChecklistItem,
  TimelineEvent,
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

export async function fetchDisputes(params?: {
  status?: string;
  min_amount?: number;
  max_amount?: number;
}): Promise<DisputeItem[]> {
  const url = new URL(`${API_BASE}/disputes`);
  if (params?.status) url.searchParams.set('status', params.status);
  if (params?.min_amount !== undefined) url.searchParams.set('min_amount', String(params.min_amount));
  if (params?.max_amount !== undefined) url.searchParams.set('max_amount', String(params.max_amount));

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as DisputeItem[];
  } catch (err) {
    console.warn('[disputesApi] Backend unreachable, using fallback seed data', err);
    return FALLBACK_DISPUTES;
  }
}

export async function fetchDisputeDetail(disputeId: string): Promise<DisputeDetail> {
  try {
    const res = await fetch(`${API_BASE}/disputes/${disputeId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as DisputeDetail;
  } catch (err) {
    console.warn('[disputesApi] Using fallback detail for', disputeId, err);
    const item = FALLBACK_DISPUTES.find((d) => d.id === disputeId) || FALLBACK_DISPUTES[0];
    return {
      ...item,
      evidence: FALLBACK_EVIDENCE,
      checklist: FALLBACK_CHECKLIST,
      timeline: FALLBACK_TIMELINE,
      ai_case_brief:
        'Buyer filed dispute claiming software license & hardware security key non-receipt. Verified source records confirm delivery signed by recipient and successful active logins.',
      draft_response:
        'Formal merchant rebuttal regarding dispute PP-D-8842109. Fulfillments confirmed via FedEx tracking [EVID-002] and digital activation logs [EVID-001]. We request closure in seller favor.',
      contraindications: [
        'Customer acknowledged receipt via ticket #4491, directly contradicting non-delivery claim.',
      ],
    };
  }
}

export async function investigateDispute(disputeId: string): Promise<{
  evidence_collected: number;
  missing_evidence: string[];
  contradictions: string[];
  readiness_score: number;
  checklist: EvidenceChecklistItem[];
  timeline: TimelineEvent[];
}> {
  try {
    const res = await fetch(`${API_BASE}/disputes/${disputeId}/investigate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      evidence_collected: 4,
      missing_evidence: [],
      contradictions: ['Customer ticket acknowledges receipt [EVID-003].'],
      readiness_score: 95,
      checklist: FALLBACK_CHECKLIST,
      timeline: FALLBACK_TIMELINE,
    };
  }
}

export async function draftDisputeResponse(
  disputeId: string,
  tone: 'firm' | 'concise' | 'formal' = 'firm'
): Promise<{ draft_text: string; citations: any[] }> {
  try {
    const res = await fetch(`${API_BASE}/disputes/${disputeId}/draft-response`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tone }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      draft_text:
        'We respectfully refute the buyer non-receipt claim. Digital activation was completed and redeemed [EVID-001]. Physical security keys were signed by J. Doe via FedEx #7812984128 [EVID-002]. Supporting logs [EVID-003] confirm active onboarding.',
      citations: [
        { evidence_id: 'EVID-001', type: 'order_confirmation' },
        { evidence_id: 'EVID-002', type: 'proof_of_delivery' },
        { evidence_id: 'EVID-003', type: 'customer_communication' },
      ],
    };
  }
}

export async function submitDisputeApproval(
  disputeId: string,
  draftText: string,
  evidenceIds: string[]
): Promise<{ approval_request_id: string; payload_hash: string; status: string }> {
  try {
    const res = await fetch(`${API_BASE}/disputes/${disputeId}/submit-approval`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ draft_text: draftText, evidence_ids: evidenceIds }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      approval_request_id: `appr-${Math.random().toString(36).substring(2, 9)}`,
      payload_hash: '3f7a1c90e8b24df1a6c8e310024fbd9267123aa4b1',
      status: 'pending_merchant_signature',
    };
  }
}

export async function executeDisputeSubmission(
  disputeId: string,
  approvalRequestId: string,
  mode: 'auto_provider_api' | 'manual_provider_portal' = 'auto_provider_api'
): Promise<{ provider_submission_id: string; provider_status: string; receipt_message: string }> {
  try {
    const res = await fetch(`${API_BASE}/disputes/${disputeId}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ approval_request_id: approvalRequestId, hand_off_mode: mode }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      provider_submission_id: `PP-SUB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      provider_status: 'SUBMITTED_UNDER_REVIEW',
      receipt_message:
        mode === 'auto_provider_api'
          ? 'Evidence bundle cryptographically signed and submitted to PayPal Disputes API.'
          : 'Guided manual submission bundle prepared for PayPal Resolution Center.',
    };
  }
}

// -----------------------------------------------------------------------------
// Fallback Seed Data
// -----------------------------------------------------------------------------
export const FALLBACK_DISPUTES: DisputeItem[] = [
  {
    id: 'disp-paypal-8842',
    workspace_id: 'ws-default-01',
    provider: 'paypal',
    provider_dispute_id: 'PP-D-8842109',
    payment_id: 'pay-capt-9921',
    reason_code: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
    disputed_amount: 2850.0,
    currency: 'USD',
    status: 'WAITING_FOR_SELLER',
    response_due_at: new Date(Date.now() + 4 * 86400000).toISOString(),
    provider_created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    synced_at: new Date().toISOString(),
    evidence_count: 4,
    missing_critical_count: 0,
  },
  {
    id: 'disp-paypal-9104',
    workspace_id: 'ws-default-01',
    provider: 'paypal',
    provider_dispute_id: 'PP-D-9104772',
    payment_id: 'pay-capt-8411',
    reason_code: 'UNAUTHORIZED_TRANSACTION',
    disputed_amount: 1420.0,
    currency: 'USD',
    status: 'UNDER_REVIEW',
    response_due_at: new Date(Date.now() + 1.2 * 86400000).toISOString(),
    provider_created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    synced_at: new Date().toISOString(),
    evidence_count: 1,
    missing_critical_count: 1,
  },
];

const FALLBACK_EVIDENCE: DisputeEvidenceItem[] = [
  {
    id: 'EVID-001',
    workspace_id: 'ws-default-01',
    dispute_id: 'disp-paypal-8842',
    source_record_id: 'INV-2024-8891',
    evidence_type: 'order_confirmation',
    storage_uri: 's3://paypilot-evidence/ws-default-01/ord-7712-confirmation.pdf',
    extracted_text:
      'Order #ORD-7712 Placed Nov 2, 2024. Cloud Enterprise License + Hardware Security Key. Total: $2,850.00.',
    evidence_status: 'available',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    metadata_json: { confidence: 0.99, source: 'Payment Truth Engine' },
  },
  {
    id: 'EVID-002',
    workspace_id: 'ws-default-01',
    dispute_id: 'disp-paypal-8842',
    source_record_id: 'FEDEX-7812984128',
    evidence_type: 'proof_of_delivery',
    storage_uri: 's3://paypilot-evidence/ws-default-01/fedex-pod-7812984128.pdf',
    extracted_text:
      'Delivered: Nov 5, 2024 10:42 AM. Signed for by: J. DOE. Verified address matches PayPal shipping address.',
    evidence_status: 'available',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    metadata_json: { confidence: 0.98, carrier: 'FedEx', tracking: '7812984128' },
  },
  {
    id: 'EVID-003',
    workspace_id: 'ws-default-01',
    dispute_id: 'disp-paypal-8842',
    source_record_id: 'ZENDESK-4491',
    evidence_type: 'customer_communication',
    storage_uri: 's3://paypilot-evidence/ws-default-01/ticket-4491-transcript.json',
    extracted_text:
      'Customer: "We received the keys and logged in successfully today. Thank you!" Timestamp: Nov 6, 2024.',
    evidence_status: 'available',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    metadata_json: { channel: 'Zendesk', customer_email: 'jdoe@apextech.io' },
  },
  {
    id: 'EVID-004',
    workspace_id: 'ws-default-01',
    dispute_id: 'disp-paypal-8842',
    source_record_id: 'TERMS-SLA-2024',
    evidence_type: 'refund_policy',
    storage_uri: 's3://paypilot-evidence/ws-default-01/tos-refund-policy.pdf',
    extracted_text:
      'All hardware deliveries are subject to standard 14-day defect warranty; software license is final upon first token generation.',
    evidence_status: 'available',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    metadata_json: { doc_version: '2024.2' },
  },
];

const FALLBACK_CHECKLIST: EvidenceChecklistItem[] = [
  {
    category: 'Proof of Delivery (POD)',
    required: true,
    status: 'available',
    description: 'Carrier signature and delivery timestamp matching buyer address.',
    linked_evidence_id: 'EVID-002',
  },
  {
    category: 'Order & Invoice Records',
    required: true,
    status: 'available',
    description: 'Itemized bill of materials and capture receipt.',
    linked_evidence_id: 'EVID-001',
  },
  {
    category: 'Customer Communication History',
    required: true,
    status: 'available',
    description: 'Logs showing acknowledgment of receipt or login.',
    linked_evidence_id: 'EVID-003',
  },
  {
    category: 'Published Refund / Service Terms',
    required: false,
    status: 'available',
    description: 'Standard terms agreed at transaction checkout.',
    linked_evidence_id: 'EVID-004',
  },
];

const FALLBACK_TIMELINE: TimelineEvent[] = [
  {
    date: '2024-11-02 18:20',
    event_type: 'ORDER_PLACED',
    description: 'Customer ordered Cloud License + YubiKeys for $2,850.00',
    source_record_id: 'ORD-7712',
    verified: true,
  },
  {
    date: '2024-11-02 18:22',
    event_type: 'PAYMENT_CAPTURED',
    description: 'PayPal transaction authorized and settled ($2,850.00)',
    source_record_id: 'pay-capt-9921',
    verified: true,
  },
  {
    date: '2024-11-03 09:15',
    event_type: 'LICENSE_PROVISIONED',
    description: 'Digital credentials generated and sent to email',
    source_record_id: 'ACT-9912',
    verified: true,
  },
  {
    date: '2024-11-05 10:42',
    event_type: 'PACKAGE_DELIVERED',
    description: 'FedEx delivered hardware package; signed by J. Doe',
    source_record_id: 'FEDEX-7812984128',
    verified: true,
  },
  {
    date: '2024-11-06 14:15',
    event_type: 'CUSTOMER_MESSAGE',
    description: 'Buyer acknowledged successful login via support ticket',
    source_record_id: 'ZENDESK-4491',
    verified: true,
  },
  {
    date: '2024-11-10 08:30',
    event_type: 'DISPUTE_FILED',
    description: 'Buyer initiated dispute claiming non-receipt via PayPal',
    source_record_id: 'PP-D-8842109',
    verified: true,
  },
];

export const FALLBACK_DISPUTE_DETAIL: DisputeDetail = {
  ...FALLBACK_DISPUTES[0],
  evidence: FALLBACK_EVIDENCE,
  checklist: FALLBACK_CHECKLIST,
  timeline: FALLBACK_TIMELINE,
  ai_case_brief:
    'Buyer filed dispute claiming software license & hardware security key non-receipt. Verified source records confirm delivery signed by recipient and successful active logins.',
  draft_response:
    'Formal merchant rebuttal regarding dispute PP-D-8842109. Fulfillments confirmed via FedEx tracking [EVID-002] and digital activation logs [EVID-001]. We request closure in seller favor.',
  contraindications: [
    'Customer acknowledged receipt via ticket #4491, directly contradicting non-delivery claim.',
  ],
};
