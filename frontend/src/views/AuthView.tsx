import React, { FormEvent, useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import fincoraLogo from '../assets/fincora-logo.png';
import { AppAuthMode, DEMO_CREDENTIALS, isDemoLogin } from '../services/appAuth';
import { getGoogleOAuthUrl, hasSupabaseBrowserConfig, signInWithPassword } from '../services/supabaseSession';

interface AuthViewProps {
  onAuthenticated: (mode: AppAuthMode, email: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justAutofilled, setJustAutofilled] = useState(false);
  const supabaseConfigured = hasSupabaseBrowserConfig();

  const handleAutofillDemo = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setError('');
    setJustAutofilled(true);
    setTimeout(() => setJustAutofilled(false), 2200);
  };

  const handleGoogleSignIn = () => {
    setError('');
    if (supabaseConfigured) {
      const oauthUrl = getGoogleOAuthUrl();
      if (oauthUrl) {
        window.location.href = oauthUrl;
        return;
      }
    }
    // Seamless local demo fallback
    onAuthenticated('demo', 'google.demo@fincora.ai');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (isDemoLogin(email, password)) {
      onAuthenticated('demo', email.trim().toLowerCase());
      return;
    }

    if (!supabaseConfigured) {
      setError('Supabase credentials are not set. Click the demo account card below to log in instantly.');
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

      <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-stone-900/80 shadow-2xl shadow-black/50 backdrop-blur-2xl md:grid-cols-[1.05fr_0.95fr]">
        {/* Left Side: Brand & Visual Overview */}
        <div className="hidden flex-col justify-between border-r border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-10 md:flex">
          <div>
            <div className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent p-2.5 pr-4 border border-amber-500/30 backdrop-blur-md shadow-lg shadow-amber-500/5">
              <img
                src={fincoraLogo}
                alt="FinCora AI"
                className="h-10 w-auto max-w-[180px] object-contain drop-shadow-[0_4px_10px_rgba(245,158,11,0.3)]"
              />
            </div>
            
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.25em] text-amber-400 font-mono flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Autonomous Financial Defense
            </p>
            <h1 className="mt-4 max-w-sm font-display text-4xl font-semibold leading-tight text-white">
              Your cash flow cockpit is ready.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-stone-400">
              Defend against disputes, shield from supplier invoice fraud, and orchestrate forward liquidity in one unified workspace.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-stone-400 border-t border-white/10 pt-6">
            <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>Zero-trust workspace isolation · Local demo &amp; Supabase Auth.</span>
          </div>
        </div>

        {/* Right Side: Sign-in Form */}
        <div className="p-6 sm:p-10 flex flex-col justify-center">
          {/* Mobile Brand Header */}
          <div className="mb-6 flex items-center gap-3 md:hidden">
            <img src={fincoraLogo} alt="FinCora AI" className="h-9 w-auto object-contain" />
            <div>
              <p className="font-semibold text-white">FinCora AI</p>
              <p className="text-xs text-stone-400 font-mono">Autonomous Defense</p>
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400 font-mono">Welcome back</p>
          <h2 className="mt-1 text-3xl font-semibold text-white font-display">Sign in to FinCora AI</h2>
          <p className="mt-1.5 text-xs leading-5 text-stone-400">
            Use your enterprise Supabase account or continue with instant demo credentials.
          </p>

          {/* Supabase Status Banner */}
          <div
            className={`mt-5 rounded-xl border px-3.5 py-2.5 text-xs flex items-center justify-between ${
              supabaseConfigured
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/25 bg-amber-500/10 text-amber-200'
            }`}
            role="status"
          >
            <span>
              {supabaseConfigured
                ? '✓ Supabase project connected. Live and demo sign-in available.'
                : '⚡ Standalone mode active. Demo sign-in pre-configured.'}
            </span>
            <span className="text-[10px] font-mono uppercase opacity-75">
              {supabaseConfigured ? 'Live' : 'Sandbox'}
            </span>
          </div>

          {/* Sign In With Google Button */}
          <div className="mt-5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.1] hover:border-amber-500/40 px-4 py-2.5 text-xs font-medium text-stone-200 transition-all duration-200 shadow-sm active:scale-[0.99] group"
            >
              {/* Google 4-Color G Icon */}
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="group-hover:text-white transition">Sign in with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative bg-stone-900/90 px-3 text-[10px] font-mono uppercase tracking-wider text-stone-500">
              or continue with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={submit} className="space-y-3.5">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-stone-300">Email</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-10 pr-3 text-xs text-white outline-none transition placeholder:text-stone-600 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-stone-300">Password</span>
              <span className="relative block">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-10 pr-11 text-xs text-white outline-none transition placeholder:text-stone-600 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            {error && (
              <p role="alert" className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs leading-5 text-rose-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-stone-950 transition hover:from-amber-400 hover:to-amber-500 shadow-md shadow-amber-500/20 disabled:cursor-wait disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Interactive One-Click Demo Account Card */}
          <div
            onClick={handleAutofillDemo}
            className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 p-3.5 cursor-pointer transition-all duration-200 group shadow-sm relative overflow-hidden"
            title="Click to autofill demo credentials"
          >
            <div className="flex items-center justify-between text-xs font-medium text-stone-200">
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <KeyRound className="h-3.5 w-3.5" />
                One-Click FinCora AI Demo
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 group-hover:bg-amber-500/30 transition">
                {justAutofilled ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span>Loaded!</span>
                  </>
                ) : (
                  <span>Click to Autofill</span>
                )}
              </span>
            </div>

            <dl className="mt-2.5 grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-1 font-mono text-[11px]">
              <dt className="text-stone-500">Email</dt>
              <dd className="text-amber-200 font-medium">{DEMO_CREDENTIALS.email}</dd>
              <dt className="text-stone-500">Password</dt>
              <dd className="text-amber-200 font-medium">{DEMO_CREDENTIALS.password}</dd>
            </dl>

            <p className="mt-2 text-[10px] leading-4 text-stone-500">
              Clicking anywhere on this box fills credentials instantly and boots the full financial defense suite.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AuthView;
