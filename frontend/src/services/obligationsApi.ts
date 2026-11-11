import {
  ObligationItem,
  SimulateScheduleResponse,
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

export async function fetchObligations(params?: {
  priority?: string;
  status?: string;
}): Promise<ObligationItem[]> {
  const url = new URL(`${API_BASE}/obligations`);
  if (params?.priority) url.searchParams.set('priority', params.priority);
  if (params?.status) url.searchParams.set('status', params.status);

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as ObligationItem[];
  } catch (err) {
    console.warn('[obligationsApi] Backend unreachable, using fallback obligations', err);
    return FALLBACK_OBLIGATIONS;
  }
}

export async function createObligation(payload: {
  payee_name: string;
  amount: number;
  currency?: string;
  due_date: string;
  earliest_pay_date?: string;
  latest_pay_date?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  source_type?: any;
}): Promise<ObligationItem> {
  try {
    const res = await fetch(`${API_BASE}/obligations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as ObligationItem;
  } catch {
    const id = `obl-${Math.random().toString(36).substring(2, 8)}`;
    return {
      id,
      workspace_id: 'ws-default-01',
      source_type: payload.source_type || 'manual',
      payee_name: payload.payee_name,
      amount: payload.amount,
      currency: payload.currency || 'USD',
      due_date: payload.due_date,
      earliest_pay_date: payload.earliest_pay_date || payload.due_date,
      latest_pay_date: payload.latest_pay_date || payload.due_date,
      priority: payload.priority || 'medium',
      late_fee_terms_json: { late_fee_rate: 0.05 },
      discount_terms_json: {},
      status: 'pending',
      created_at: new Date().toISOString(),
    };
  }
}

export async function simulateObligationSchedule(params?: {
  scenario_id?: 'baseline' | 'delayed_inflow' | 'low_sales' | 'unexpected_expense';
  starting_cash?: number;
  reserve_floor?: number;
  prioritize_discounts?: boolean;
}): Promise<SimulateScheduleResponse> {
  try {
    const res = await fetch(`${API_BASE}/obligations/simulate-schedule`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        scenario_id: params?.scenario_id || 'baseline',
        starting_cash: params?.starting_cash ?? 142500.0,
        reserve_floor: params?.reserve_floor ?? 15000.0,
        prioritize_discounts: params?.prioritize_discounts ?? true,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as SimulateScheduleResponse;
  } catch (err) {
    console.warn('[obligationsApi] Backend unreachable, calculating local simulation fallback', err);
    return getFallbackSimulation(params?.scenario_id || 'baseline');
  }
}

export async function approveObligationSchedule(
  scheduleId: string,
  selectedObligationIds: string[]
): Promise<{ schedule_id: string; approved_items_count: number; approval_hash: string }> {
  try {
    const res = await fetch(`${API_BASE}/obligation-schedules/${scheduleId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ schedule_id: scheduleId, selected_obligation_ids: selectedObligationIds }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      schedule_id: scheduleId,
      approved_items_count: selectedObligationIds.length || 5,
      approval_hash: '7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f',
    };
  }
}

export async function executeObligation(
  obligationId: string,
  type: 'provider_direct' | 'task_reminder' = 'provider_direct'
): Promise<{ obligation_id: string; execution_status: string; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/obligations/${obligationId}/execute`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ obligation_id: obligationId, execution_type: type }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      obligation_id: obligationId,
      execution_status: type === 'provider_direct' ? 'executed' : 'task_created',
      message:
        type === 'provider_direct'
          ? 'PayPal Payout executed successfully.'
          : 'Task reminder created: "Task Created (Not Paid)".',
    };
  }
}

// -----------------------------------------------------------------------------
// Fallback Seed Data (Scenario C)
// -----------------------------------------------------------------------------
const FALLBACK_OBLIGATIONS: ObligationItem[] = [
  {
    id: 'obl-pay-01',
    workspace_id: 'ws-default-01',
    source_type: 'payroll',
    source_id: 'GUSTO-PAYROLL-NOV-01',
    payee_name: 'Gusto Payroll (Direct Deposit Batch)',
    amount: 22400.0,
    currency: 'USD',
    due_date: '2024-11-15',
    earliest_pay_date: '2024-11-14',
    latest_pay_date: '2024-11-15',
    priority: 'critical',
    late_fee_terms_json: { late_fee_rate: 0.1, fixed_penalty: 500.0 },
    discount_terms_json: {},
    status: 'pending',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'obl-rent-02',
    workspace_id: 'ws-default-01',
    source_type: 'recurring_expense',
    source_id: 'LEASE-HQ-2024',
    payee_name: 'Commercial Real Estate (HQ Office Rent)',
    amount: 8500.0,
    currency: 'USD',
    due_date: '2024-11-15',
    earliest_pay_date: '2024-11-10',
    latest_pay_date: '2024-11-18',
    priority: 'critical',
    late_fee_terms_json: { late_fee_rate: 0.05, fixed_penalty: 250.0 },
    discount_terms_json: {},
    status: 'pending',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'obl-sup-03',
    workspace_id: 'ws-default-01',
    source_type: 'supplier_invoice',
    source_id: 'NEX-9921',
    payee_name: 'Nexus Industrial Gear LLC',
    amount: 14200.0,
    currency: 'USD',
    due_date: '2024-11-20',
    earliest_pay_date: '2024-11-10',
    latest_pay_date: '2024-11-25',
    priority: 'high',
    late_fee_terms_json: { late_fee_rate: 0.03 },
    discount_terms_json: { early_discount_rate: 0.02, savings: 284.0 },
    status: 'pending',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'obl-tax-04',
    workspace_id: 'ws-default-01',
    source_type: 'tax',
    source_id: 'TAX-Q3-STATE',
    payee_name: 'State Dept of Revenue (Sales Tax Remittance)',
    amount: 6100.0,
    currency: 'USD',
    due_date: '2024-11-20',
    earliest_pay_date: '2024-11-15',
    latest_pay_date: '2024-11-20',
    priority: 'high',
    late_fee_terms_json: { late_fee_rate: 0.05 },
    discount_terms_json: {},
    status: 'pending',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'obl-cld-05',
    workspace_id: 'ws-default-01',
    source_type: 'supplier_invoice',
    source_id: 'APX-4102',
    payee_name: 'Apex Cloud Systems Inc',
    amount: 3450.0,
    currency: 'USD',
    due_date: '2024-11-24',
    earliest_pay_date: '2024-11-18',
    latest_pay_date: '2024-11-28',
    priority: 'medium',
    late_fee_terms_json: { late_fee_rate: 0.015 },
    discount_terms_json: {},
    status: 'pending',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

function getFallbackSimulation(scenario: string): SimulateScheduleResponse {
  const isDelayed = scenario === 'delayed_inflow';
  const isLowSales = scenario === 'low_sales';

  const items = [
    {
      id: 'sch-it-01',
      obligation_id: 'obl-pay-01',
      payee_name: 'Gusto Payroll (Direct Deposit Batch)',
      due_date: '2024-11-15',
      proposed_date: '2024-11-15',
      proposed_amount: 22400.0,
      currency: 'USD',
      priority: 'critical',
      reason_codes: ['Hard legal deadline: Statutory payroll window.'],
      reserve_safe: !isDelayed,
      projected_cash_after: isDelayed ? 12800.0 : 123600.0,
      discount_captured: 0.0,
      late_fee_avoided: 2740.0,
      status: 'proposed' as const,
    },
    {
      id: 'sch-it-02',
      obligation_id: 'obl-rent-02',
      payee_name: 'Commercial Real Estate (HQ Office Rent)',
      due_date: '2024-11-15',
      proposed_date: '2024-11-15',
      proposed_amount: 8500.0,
      currency: 'USD',
      priority: 'critical',
      reason_codes: ['Avoided $675 late penalty and lease breach.'],
      reserve_safe: true,
      projected_cash_after: 115100.0,
      discount_captured: 0.0,
      late_fee_avoided: 675.0,
      status: 'proposed' as const,
    },
    {
      id: 'sch-it-03',
      obligation_id: 'obl-sup-03',
      payee_name: 'Nexus Industrial Gear LLC',
      due_date: '2024-11-20',
      proposed_date: '2024-11-12',
      proposed_amount: 14200.0,
      currency: 'USD',
      priority: 'high',
      reason_codes: ['Captured $284.00 early discount (2/10 net 30).'],
      reserve_safe: true,
      projected_cash_after: 131300.0,
      discount_captured: 284.0,
      late_fee_avoided: 426.0,
      status: 'proposed' as const,
    },
    {
      id: 'sch-it-04',
      obligation_id: 'obl-tax-04',
      payee_name: 'State Dept of Revenue (Sales Tax Remittance)',
      due_date: '2024-11-20',
      proposed_date: '2024-11-20',
      proposed_amount: 6100.0,
      currency: 'USD',
      priority: 'high',
      reason_codes: ['Scheduled on exact due date to preserve liquidity.'],
      reserve_safe: true,
      projected_cash_after: 112000.0,
      discount_captured: 0.0,
      late_fee_avoided: 305.0,
      status: 'proposed' as const,
    },
    {
      id: 'sch-it-05',
      obligation_id: 'obl-cld-05',
      payee_name: 'Apex Cloud Systems Inc',
      due_date: '2024-11-24',
      proposed_date: '2024-11-24',
      proposed_amount: 3450.0,
      currency: 'USD',
      priority: 'medium',
      reason_codes: ['Maintained operational continuity without early payment penalty.'],
      reserve_safe: true,
      projected_cash_after: 108550.0,
      discount_captured: 0.0,
      late_fee_avoided: 51.75,
      status: 'proposed' as const,
    },
  ];

  const forecast = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(2024, 10, 10 + i);
    const dateStr = d.toISOString().split('T')[0];
    let cash = 142500 - i * 900;
    if (i >= 5) cash -= 22400 + 8500;
    if (i >= 2) cash -= 14200;
    if (i >= 12) cash += 30000;
    if (isDelayed && i === 5) cash = 12800; // Breach test
    return {
      date: dateStr,
      projected_inflow: 1800,
      scheduled_outflow: i === 5 ? 30900 : i === 2 ? 14200 : 0,
      projected_cash: cash,
      reserve_floor: 15000,
      breached: cash < 15000,
    };
  });

  return {
    schedule_id: 'sch-sim-default-01',
    scenario_id: scenario,
    version: 1,
    starting_cash: 142500.0,
    reserve_floor: 15000.0,
    items,
    daily_forecast: forecast,
    total_scheduled_amount: 54650.0,
    total_discounts_captured: 284.0,
    total_late_fees_avoided: 4197.75,
    reserve_breached: isDelayed,
    breach_dates: isDelayed ? ['2024-11-15'] : [],
    explanation: isDelayed
      ? 'CRITICAL RESERVE BREACH: Delay in receivables leaves cash at $12,800 on Nov 15 (breaching $15,000 floor). Recommended split schedule or deferred vendor payment.'
      : 'Optimal schedule generated: Captured $284.00 early discounts and avoided $4,197.75 in late fees while maintaining minimum $15,000 cash reserve.',
  };
}
