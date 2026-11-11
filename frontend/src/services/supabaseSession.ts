const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
let accessToken: string | null = null;

export function hasSupabaseBrowserConfig(): boolean {
  return Boolean(supabaseUrl && publishableKey);
}

export function getSupabaseAccessToken(): string | null {
  return accessToken;
}

export function clearSupabaseSession(): void {
  accessToken = null;
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  if (!supabaseUrl || !publishableKey) throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env, then restart Vite.');
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: publishableKey },
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || typeof payload.access_token !== 'string') {
    throw new Error(payload.msg || payload.message || 'Supabase sign-in failed. Check the account and password.');
  }
  accessToken = payload.access_token;
}
