import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, Radio, Activity, ArrowRight, Phone, User } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(30,58,138,0.15),_transparent_60%)]" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.03]" preserveAspectRatio="none">
          <defs>
            <pattern id="landing-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#landing-grid)" />
        </svg>
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 ring-1 ring-slate-700">
            <Shield className="h-5 w-5 text-cyan-400" strokeWidth={2.2} />
          </div>
          <span className="text-lg font-bold tracking-wider text-white">SENTINEL</span>
        </div>
        <div className="hidden items-center gap-2 text-sm text-slate-400 sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          System Operational
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-12 px-8 py-12 lg:flex-row lg:items-center lg:justify-between lg:gap-20 lg:py-24">
        {/* Left: branding */}
        <div className="max-w-lg">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-4 py-1.5 text-xs font-medium text-slate-400">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            AI-Powered Urban Safety Platform
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Intelligent Urban Incident Detection &amp; Response
          </h1>
          <p className="mt-5 text-base leading-relaxed text-slate-400">
            SENTINEL unifies multi-source incident detection, citizen reporting, and
            emergency response coordination into a single command platform — built
            for cities that need to act fast.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: Radio, label: 'Multi-source detection — sensors, cameras, citizen reports' },
              { icon: AlertTriangle, label: 'Real-time incident mapping and response tracking' },
              { icon: Shield, label: 'Coordinated dispatch with status transparency' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-800">
                    <Icon className="h-4 w-4 text-cyan-400" />
                  </div>
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: access options */}
        <div className="w-full max-w-md space-y-4">
          {/* Citizen access */}
          <Link
            to="/citizen/login"
            className="group block rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-all hover:border-cyan-500/40 hover:bg-slate-900/80"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-500/20">
                    <User className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">Citizen</h2>
                    <p className="text-xs text-slate-500">Report an incident</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                  Witnessed an emergency? Report it quickly with your location
                  and help responders reach the scene.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-slate-600 transition-all group-hover:translate-x-1 group-hover:text-cyan-400" />
            </div>
          </Link>

          {/* Control room access */}
          <Link
            to="/control-room"
            className="group block rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-all hover:border-slate-600 hover:bg-slate-900/80"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700/40 ring-1 ring-slate-600/30">
                    <Shield className="h-5 w-5 text-slate-300" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">Control Room</h2>
                    <p className="text-xs text-slate-500">Admin / Helpline access</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                  Operator dashboard for monitoring active incidents, dispatching
                  responders, and managing emergency response.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-slate-600 transition-all group-hover:translate-x-1 group-hover:text-slate-300" />
            </div>
          </Link>

          {/* Emergency line */}
          <div className="flex items-center gap-3 rounded-2xl border border-red-900/30 bg-red-950/20 px-5 py-4">
            <Phone className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-300">Emergency Hotline</p>
              <p className="text-xs text-slate-500">Call 112 for immediate assistance</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-8 py-6 text-center text-xs text-slate-600">
        SENTINEL © 2026 — Urban Incident Detection &amp; Response System
      </footer>
    </div>
  );
}
