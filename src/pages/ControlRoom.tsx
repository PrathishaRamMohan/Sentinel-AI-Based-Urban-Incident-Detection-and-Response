import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { StatsBar } from '@/components/StatsBar';
import { IncidentMap } from '@/components/IncidentMap';
import { ResponseTracker } from '@/components/ResponseTracker';
import { ReportForm } from '@/components/ReportForm';
import { AlertsFeed } from '@/components/AlertsFeed';
import { CCTVMonitor } from '@/components/CCTVMonitor';
import { useIncidents } from '@/hooks/useIncidents';
import { useAlerts } from '@/hooks/useAlerts';
import type { IncidentStatus } from '@/types';
import type { CctvCamera } from '@/lib/api';
import { ArrowLeft, Video, MapPin, ListFilter, PlusCircle } from 'lucide-react';

export function ControlRoom() {
  const { incidents, loading, addIncident, updateStatus, refetch: refetchIncidents } = useIncidents();
  const { alerts, refetch: refetchAlerts } = useAlerts();
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'surveillance' | 'tracker' | 'manual-report'>('surveillance');

  const handleAdvance = async (id: string, status: IncidentStatus) => {
    try {
      await updateStatus(id, status);
      refetchIncidents();
    } catch {
      // error is surfaced via realtime state
    }
  };

  const handleCctvIncidentCreated = () => {
    refetchIncidents();
    refetchAlerts();
  };

  const handleCameraSelect = (camera: CctvCamera) => {
    // If there is an incident matching this camera, select it
    const match = incidents.find(
      (inc) =>
        inc.location_name.toLowerCase().includes(camera.name.toLowerCase()) ||
        (Math.abs(inc.latitude - camera.latitude) < 0.001 && Math.abs(inc.longitude - camera.longitude) < 0.001)
    );
    if (match) {
      setSelectedIncidentId(match.id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <StatsBar incidents={incidents} />

      {/* Control Room Sub-nav bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/50 px-6 py-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('surveillance')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'surveillance'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            Live Map &amp; CCTV Feeds
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'tracker'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" />
            Response Queue ({incidents.length})
          </button>
          <button
            onClick={() => setActiveTab('manual-report')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'manual-report'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Dispatch Manual Incident
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Auto-Sync 3.0s Active
          </span>
          <button
            onClick={() => {
              refetchIncidents();
              refetchAlerts();
            }}
            className="text-xs text-cyan-400 underline hover:text-cyan-300 transition"
          >
            Force Sync
          </button>
        </div>
      </div>

      <main className="flex-1 p-6">
        {activeTab === 'surveillance' && (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left Column: Leaflet GIS Map + Response mini tracker */}
            <div className="flex flex-col gap-6">
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                    Urban Emergency Geo-Spatial Map
                  </h3>
                  <span className="text-[11px] font-mono text-cyan-400">
                    {incidents.filter((i) => i.status !== 'Resolved').length} Active Pins
                  </span>
                </div>
                <div className="h-[430px] overflow-hidden rounded-lg">
                  <IncidentMap
                    incidents={incidents}
                    selectedId={selectedIncidentId}
                    onSelect={setSelectedIncidentId}
                  />
                </div>
              </div>

              {/* Response Queue Quick view */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
                <ResponseTracker
                  incidents={incidents}
                  loading={loading}
                  onAdvance={handleAdvance}
                />
              </div>
            </div>

            {/* Right Column: CCTV AI Video Surveillance Grid + Live Alerts Feed */}
            <div className="flex flex-col gap-6">
              <CCTVMonitor
                onCameraSelect={handleCameraSelect}
                onIncidentCreated={handleCctvIncidentCreated}
              />
              <div className="flex-1">
                <AlertsFeed alerts={alerts} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tracker' && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
              <h2 className="text-base font-bold text-white mb-4">Complete Dispatch &amp; Response Operation Pipeline</h2>
              <ResponseTracker
                incidents={incidents}
                loading={loading}
                onAdvance={handleAdvance}
              />
            </div>
            <div className="flex flex-col gap-6">
              <AlertsFeed alerts={alerts} />
              <CCTVMonitor onIncidentCreated={handleCctvIncidentCreated} />
            </div>
          </div>
        )}

        {activeTab === 'manual-report' && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
              <h2 className="text-base font-bold text-white mb-4">Manual Incident Dispatch Form</h2>
              <ReportForm onSubmit={async (inc) => {
                await addIncident(inc);
                refetchIncidents();
                refetchAlerts();
                setActiveTab('surveillance');
              }} />
            </div>
            <div className="flex flex-col gap-6">
              <AlertsFeed alerts={alerts} />
              <div className="h-[380px] rounded-xl border border-slate-800 overflow-hidden">
                <IncidentMap incidents={incidents} selectedId={selectedIncidentId} onSelect={setSelectedIncidentId} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer link */}
      <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Exit to Public Citizen Portal
        </Link>
        <div>SENTINEL Command Grid &bull; PostgreSQL PostGIS &bull; YOLO AI Engine</div>
      </div>
    </div>
  );
}
