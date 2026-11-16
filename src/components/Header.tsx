import { useEffect, useState } from 'react';
import { Shield, Activity, Radio, LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { operator, operatorLogout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    operatorLogout();
    navigate('/control-room/login');
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
            <Shield className="h-6 w-6 text-white" strokeWidth={2.2} />
          </div>
          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
          </span>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            SENTINEL CONTROL ROOM
            <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-mono text-cyan-400 border border-cyan-800/40">
              DISPATCH v1.0
            </span>
          </h1>
          <p className="text-xs text-slate-400">Urban Incident Detection &amp; Emergency Dispatch</p>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden items-center gap-2 text-sm text-slate-400 md:flex">
          <Activity className="h-4 w-4 text-emerald-400" />
          <span>PostgreSQL &amp; Realtime Online</span>
        </div>
        <div className="hidden items-center gap-2 text-sm text-slate-400 lg:flex">
          <Radio className="h-4 w-4 text-cyan-400" />
          <span>AI Vision Grid Active</span>
        </div>

        {/* Live Clock */}
        <div className="text-right">
          <div className="text-xs text-slate-400">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <LiveClock />
        </div>

        {/* Operator Badge & Logout */}
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-700 bg-slate-800/70 py-1.5 px-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600/30 text-cyan-300 ring-1 ring-cyan-500/50">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="hidden text-left sm:block">
            <div className="text-xs font-semibold text-white">
              {operator?.full_name || operator?.username || 'Dispatcher'}
            </div>
            <div className="text-[10px] text-cyan-400 font-mono">
              {operator?.email || 'operator@sentinel.gov'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out of Control Room"
            className="ml-1 rounded p-1 text-slate-400 transition hover:bg-slate-700 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function LiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <div className="text-xs font-mono font-bold tabular-nums text-cyan-400">{time} UTC</div>;
}
