import { Flame, AlertTriangle, Ambulance, CheckCircle2 } from 'lucide-react';
import type { Incident } from '@/types';

interface StatsBarProps {
  incidents: Incident[];
}

export function StatsBar({ incidents }: StatsBarProps) {
  const active = incidents.filter((i) => i.status !== 'Resolved').length;
  const critical = incidents.filter((i) => i.severity === 'Critical' && i.status !== 'Resolved').length;
  const dispatched = incidents.filter((i) => ['Dispatched', 'En Route', 'On Scene'].includes(i.status)).length;
  const resolved = incidents.filter((i) => i.status === 'Resolved').length;

  const stats = [
    {
      label: 'Active Incidents',
      value: active,
      icon: AlertTriangle,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
    },
    {
      label: 'Critical Alerts',
      value: critical,
      icon: Flame,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
    {
      label: 'Units Dispatched',
      value: dispatched,
      icon: Ambulance,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
    },
    {
      label: 'Resolved Today',
      value: resolved,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 px-6 py-4 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`relative overflow-hidden rounded-xl border ${stat.border} ${stat.bg} p-4 transition-all hover:scale-[1.02] hover:shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  {stat.label}
                </p>
                <p className={`mt-1 text-2xl font-bold tabular-nums ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
