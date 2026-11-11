export interface BackendHealth {
  status: 'ok' | 'degraded';
  service: string;
  environment: string;
  database_configured: boolean;
  supabase_auth_configured: boolean;
  paypal_sandbox_configured: boolean;
  paypal_webhooks_configured: boolean;
}

export interface CommitmentAssessmentInput {
  currency: string;
  starting_cash: number;
  starting_cash_source: 'owner_verified' | 'connected_balance' | 'manual_estimate';
  required_reserve: number;
  cash_flows: Array<{
    date: string;
    direction: 'inflow' | 'outflow';
    amount: number;
    label: string;
  }>;
}

export interface CommitmentAssessmentResult {
  status: 'safe' | 'warning' | 'breach';
  currency: string;
  peak_funding_requirement: string;
  minimum_projected_cash: string;
  required_reserve: string;
  reserve_gap: string;
  first_reserve_breach_date: string | null;
  scenario_version: string;
  assumptions: string[];
  missing_inputs: string[];
  recommendations: Array<Record<string, string>>;
  projected_cash: Array<{
    date: string;
    label: string;
    direction: string;
    change: string;
    projected_cash: string;
  }>;
}

export function normalizeApiBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
}

export async function getBackendHealth(apiBaseUrl: string): Promise<BackendHealth> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${normalizeApiBaseUrl(apiBaseUrl)}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Backend returned HTTP ${response.status}`);
    return (await response.json()) as BackendHealth;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function assessCommitment(
  apiBaseUrl: string,
  assessment: CommitmentAssessmentInput,
): Promise<CommitmentAssessmentResult> {
  const response = await fetch(`${normalizeApiBaseUrl(apiBaseUrl)}/commitments/assess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(assessment),
  });
  if (!response.ok) throw new Error(`Backend assessment returned HTTP ${response.status}`);
  return (await response.json()) as CommitmentAssessmentResult;
}
