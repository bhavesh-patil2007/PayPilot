export type AppAuthMode = 'demo' | 'supabase';

export interface AppAuthSession {
  mode: AppAuthMode;
  email: string;
}

export const DEMO_CREDENTIALS = {
  email: 'demo@paypilot.local',
  password: 'PayPilotDemo2026!',
} as const;

const DEMO_SESSION_KEY = 'paypilot.demo-session';

export function saveDemoSession(email: string): AppAuthSession {
  const session = { mode: 'demo' as const, email };
  sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function restoreDemoSession(): AppAuthSession | null {
  try {
    const value = sessionStorage.getItem(DEMO_SESSION_KEY);
    if (!value) return null;
    const session = JSON.parse(value) as Partial<AppAuthSession>;
    return session.mode === 'demo' && session.email === DEMO_CREDENTIALS.email
      ? { mode: 'demo', email: session.email }
      : null;
  } catch {
    return null;
  }
}

export function clearDemoSession(): void {
  sessionStorage.removeItem(DEMO_SESSION_KEY);
}
