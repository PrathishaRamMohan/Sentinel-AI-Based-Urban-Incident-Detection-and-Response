import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Shield, KeyRound, User, AlertCircle, ArrowLeft, Lock, Radio, Cpu } from 'lucide-react';

export function ControlRoomLogin() {
  const [username, setUsername] = useState('operator');
  const [password, setPassword] = useState('operator123');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { operatorLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/control-room';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await operatorLogin(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoCredentials = () => {
    setUsername('operator@sentinel.gov');
    setPassword('operator123');
    setError(null);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 h-[400px] w-[400px] rounded-full bg-red-500/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Public Portal
          </Link>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-950/40 px-2.5 py-1 text-xs font-medium text-red-400">
            <Radio className="h-3 w-3 animate-pulse" />
            SECURE GRID
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 shadow-lg shadow-cyan-500/20">
              <Shield className="h-7 w-7 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              CONTROL ROOM ACCESS
            </h1>
            <p className="mt-1 text-xs uppercase tracking-widest text-slate-400">
              Emergency Dispatch & AI CCTV System
            </p>
          </div>

          {/* Quick preset badge */}
          <div className="mb-6 rounded-lg border border-slate-700/60 bg-slate-800/50 p-3 text-xs text-slate-300">
            <div className="flex items-center justify-between font-semibold text-cyan-400">
              <span className="flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5" /> Demo Operator Account:
              </span>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="text-xs text-cyan-400 underline transition hover:text-cyan-300"
              >
                Auto-fill
              </button>
            </div>
            <div className="mt-1 font-mono text-slate-400">
              User: <span className="text-slate-200">operator</span> | Pass: <span className="text-slate-200">operator123</span>
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Operator Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. operator or operator@sentinel.gov"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Security Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              {isSubmitting ? 'Authenticating Operator...' : 'Authenticate & Enter Control Room'}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 text-center text-xs text-slate-500">
            SENTINEL Unified Emergency System &bull; 256-Bit Encrypted Link
          </div>
        </div>
      </div>
    </div>
  );
}
