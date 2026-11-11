export type AppAuthMode = 'demo' | 'supabase';

export interface AppAuthSession {
  mode: AppAuthMode;
  email: string;
}

export const DEMO_CREDENTIALS = {
  email: 'demo@fincora.ai',
  password: 'FinCoraDemo2026!',
} as const;

export const LEGACY_DEMO_CREDENTIALS = {
  email: 'demo@paypilot.local',
  password: 'PayPilotDemo2026!',
} as const;

const DEMO_SESSION_KEY = 'fincora.demo-session';
const LEGACY_DEMO_SESSION_KEY = 'paypilot.demo-session';

export function isDemoLogin(email: string, password: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  return (
    (cleanEmail === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) ||
    (cleanEmail === LEGACY_DEMO_CREDENTIALS.email && password === LEGACY_DEMO_CREDENTIALS.password)
  );
}

export function saveDemoSession(email: string): AppAuthSession {
  const session = { mode: 'demo' as const, email };
  sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function restoreDemoSession(): AppAuthSession | null {
  try {
    const value = sessionStorage.getItem(DEMO_SESSION_KEY) || sessionStorage.getItem(LEGACY_DEMO_SESSION_KEY);
    if (!value) return null;
    const session = JSON.parse(value) as Partial<AppAuthSession>;
    const email = typeof session.email === 'string' ? session.email : null;
    const isKnownEmail =
      email !== null &&
      (email === DEMO_CREDENTIALS.email ||
        email === LEGACY_DEMO_CREDENTIALS.email ||
        email.endsWith('@fincora.ai'));
    return session.mode === 'demo' && isKnownEmail && email
      ? { mode: 'demo', email }
      : null;
  } catch {
    return null;
  }
}

export function clearDemoSession(): void {
  sessionStorage.removeItem(DEMO_SESSION_KEY);
  sessionStorage.removeItem(LEGACY_DEMO_SESSION_KEY);
}
