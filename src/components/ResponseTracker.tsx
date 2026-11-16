import type { Incident, IncidentStatus } from '@/types';
import { statusConfig, severityConfig, timeAgo, formatDuration } from '@/lib/utils';
import { Clock, MapPin, ChevronRight, Loader2 } from 'lucide-react';

interface ResponseTrackerProps {
  incidents: Incident[];
  loading: boolean;
  onAdvance: (id: string, status: IncidentStatus) => void;
}

const STATUS_FLOW: IncidentStatus[] = ['Reported', 'Dispatched', 'En Route', 'On Scene', 'Resolved'];

const statusIcons: Record<IncidentStatus, string> = {
  Reported: 'Reported',
  Dispatched: 'Dispatched',
  'En Route': 'En Route',
  'On Scene': 'On Scene',
  Resolved: 'Resolved',
};

export function ResponseTracker({ incidents, loading, onAdvance }: ResponseTrackerProps) {
  const activeIncidents = incidents.filter((i) => i.status !== 'Resolved');
  const resolvedIncidents = incidents.filter((i) => i.status === 'Resolved').slice(0, 3);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
        <h2 className="text-sm font-semibold text-white">Emergency Response Tracker</h2>
        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
          {activeIncidents.length} active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin' }}>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : activeIncidents.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-slate-500">
            No active incidents
          </div>
        ) : (
          <div className="space-y-3">
            {activeIncidents.map((incident) => {
              const sConfig = statusConfig[incident.status];
              const sevConfig = severityConfig[incident.severity];
              const currentStep = STATUS_FLOW.indexOf(incident.status);
              const nextStatus = STATUS_FLOW[currentStep + 1];

              return (
                <div
                  key={incident.id}
                  className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 transition-all hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${sevConfig.dot}`} />
                        <h3 className="text-sm font-semibold text-white">{incident.type}</h3>
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${sevConfig.border} ${sevConfig.bg} ${sevConfig.text}`}>
                          {incident.severity}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="h-3 w-3" />
                        {incident.location_name}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        Reported {timeAgo(incident.created_at)}
                        {incident.dispatched_at && (
                          <span className="ml-1 text-slate-400">
                            · Dispatched {timeAgo(incident.dispatched_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-medium ${sConfig.border} ${sConfig.bg} ${sConfig.color}`}>
                      {statusIcons[incident.status]}
                    </div>
                  </div>

                  {/* Progress steps */}
                  <div className="mt-3 flex items-center gap-1">
                    {STATUS_FLOW.map((status, idx) => {
                      const stepConfig = statusConfig[status];
                      const isPassed = idx <= currentStep;
                      return (
                        <div key={status} className="flex flex-1 items-center">
                          <div
                            className={`h-1.5 flex-1 rounded-full transition-all ${
                              isPassed ? stepConfig.bg.replace('/10', '/60') : 'bg-slate-700/50'
                            }`}
                          />
                          {idx < STATUS_FLOW.length - 1 && (
                            <div
                              className={`h-2 w-2 rounded-full transition-all ${
                                isPassed ? 'bg-cyan-500' : 'bg-slate-700'
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Response time: <span className="font-mono text-slate-300">{formatDuration(incident.dispatched_at, incident.resolved_at)}</span>
                    </span>
                    {nextStatus && (
                      <button
                        onClick={() => onAdvance(incident.id, nextStatus)}
                        className="group flex items-center gap-1 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 transition-all hover:bg-cyan-500/20"
                      >
                        Advance to {nextStatus}
                        <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {resolvedIncidents.length > 0 && (
              <>
                <div className="pt-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Recently Resolved
                </div>
                {resolvedIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/20 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-xs text-slate-400">{incident.type}</span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-500">{incident.location_name}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatDuration(incident.dispatched_at, incident.resolved_at)}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
