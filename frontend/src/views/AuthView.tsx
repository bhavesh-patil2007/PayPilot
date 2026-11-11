import React, { FormEvent, useState } from 'react';
import { ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import fincoraLogo from '../assets/fincora-logo.png';
import { AppAuthMode, DEMO_CREDENTIALS } from '../services/appAuth';
import { hasSupabaseBrowserConfig, signInWithPassword } from '../services/supabaseSession';

interface AuthViewProps {
  onAuthenticated: (mode: AppAuthMode, email: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const supabaseConfigured = hasSupabaseBrowserConfig();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (email.trim().toLowerCase() === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
      onAuthenticated('demo', DEMO_CREDENTIALS.email);
      return;
    }

    if (!supabaseConfigured) {
      setError('Supabase is not configured. Use the demo account below or add your project URL and publishable key to frontend/.env.');
      return;
    }

    setSubmitting(true);
    try {
      await signInWithPassword(email.trim(), password);
      onAuthenticated('supabase', email.trim());
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Could not sign in. Check your email and password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-950 px-4 py-10 text-stone-100">
      <div className="pointer-events-none absolute inset-0 bg-[url('/bg-waves.jpg')] bg-cover bg-center opacity-20" />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-amber-600/20 blur-[110px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-orange-700/15 blur-[120px]" />

      <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-stone-900/75 shadow-2xl shadow-black/40 backdrop-blur-2xl md:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden flex-col justify-between border-r border-white/10 bg-white/[0.03] p-10 md:flex">
          <div>
            <img src={fincoraLogo} alt="PayPilot" className="h-12 w-12 rounded-xl object-cover" />
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">Financial clarity, in control</p>
            <h1 className="mt-4 max-w-sm font-display text-4xl font-semibold leading-tight text-white">Your cash flow cockpit is ready.</h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-stone-400">Review recoveries, reconcile payments, and explore cash commitments in one workspace.</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-stone-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Demo access stays local; connected accounts use Supabase Auth.</span>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <img src={fincoraLogo} alt="PayPilot" className="h-10 w-10 rounded-xl object-cover" />
            <div>
              <p className="font-semibold text-white">PayPilot</p>
              <p className="text-xs text-stone-400">Financial Intelligence</p>
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400">Welcome back</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Sign in to PayPilot</h2>
          <p className="mt-2 text-sm leading-6 text-stone-400">Use your Supabase account or enter the always-available demo credentials.</p>

          <div className={`mt-6 rounded-xl border px-4 py-3 text-xs ${supabaseConfigured ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200' : 'border-amber-500/20 bg-amber-500/5 text-amber-100'}`} role="status">
            {supabaseConfigured ? 'Supabase project detected. Both Supabase and demo sign-in are available.' : 'Supabase keys are not set. Demo sign-in works without a Supabase connection.'}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-stone-300">Email</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-stone-600 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium text-stone-300">Password</span>
              <span className="relative block">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-11 text-sm text-white outline-none transition placeholder:text-stone-600 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10"
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-200">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            {error && <p role="alert" className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs leading-5 text-rose-200">{error}</p>}

            <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-400 disabled:cursor-wait disabled:opacity-60">
              {submitting ? 'Signing in…' : 'Sign in'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-stone-600">
            <span className="h-px flex-1 bg-white/10" />
            demo account
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <div className="rounded-xl border border-white/10 bg-black/15 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-stone-200"><KeyRound className="h-3.5 w-3.5 text-amber-400" /> Always available for local demo</div>
            <dl className="mt-3 grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-2 font-mono text-xs">
              <dt className="text-stone-500">Email</dt><dd className="select-all text-stone-200">{DEMO_CREDENTIALS.email}</dd>
              <dt className="text-stone-500">Password</dt><dd className="select-all text-stone-200">{DEMO_CREDENTIALS.password}</dd>
            </dl>
            <p className="mt-3 text-[10px] leading-4 text-stone-500">This shared demo login only opens sample data in this browser. It is not a secure account and does not authorize protected backend integrations.</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AuthView;
