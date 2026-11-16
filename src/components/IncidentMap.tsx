import { useMemo } from 'react';
import type { Incident } from '@/types';
import { severityConfig } from '@/lib/utils';
import { MapPin, Navigation } from 'lucide-react';

interface IncidentMapProps {
  incidents: Incident[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// Grid-based map: project lat/lng into a 0-100 coordinate space
// based on the bounding box of all incidents + padding.
const MAP_PADDING = 0.02;

export function IncidentMap({ incidents, selectedId, onSelect }: IncidentMapProps) {
  const { bounds, points } = useMemo(() => {
    if (incidents.length === 0) {
      return {
        bounds: { minLat: 40.73, maxLat: 40.77, minLng: -73.99, maxLng: -73.97 },
        points: [] as Array<Incident & { x: number; y: number }>,
      };
    }
    const lats = incidents.map((i) => i.latitude);
    const lngs = incidents.map((i) => i.longitude);
    const minLat = Math.min(...lats) - MAP_PADDING;
    const maxLat = Math.max(...lats) + MAP_PADDING;
    const minLng = Math.min(...lngs) - MAP_PADDING;
    const maxLng = Math.max(...lngs) + MAP_PADDING;

    const pts = incidents.map((i) => ({
      ...i,
      x: ((i.longitude - minLng) / (maxLng - minLng)) * 100,
      y: (1 - (i.latitude - minLat) / (maxLat - minLat)) * 100,
    }));

    return { bounds: { minLat, maxLat, minLng, maxLng }, points: pts };
  }, [incidents]);

  const activePoints = points.filter((p) => p.status !== 'Resolved');

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Live Incident Map</h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" /> Critical
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-orange-500" /> High
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Medium
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-500" /> Low
          </span>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {/* Map background with grid */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
          {/* Grid lines */}
          <svg className="absolute inset-0 h-full w-full opacity-20" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10%" height="10%" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#334155" strokeWidth="0.5" />
              </pattern>
              <pattern id="gridMajor" width="20%" height="20%" patternUnits="userSpaceOnUse">
                <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#475569" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <rect width="100%" height="100%" fill="url(#gridMajor)" />
          </svg>

          {/* Simulated city zones */}
          <div className="absolute left-[15%] top-[20%] h-[30%] w-[25%] rounded-lg bg-cyan-500/5" />
          <div className="absolute right-[10%] bottom-[15%] h-[35%] w-[30%] rounded-lg bg-blue-500/5" />
          <div className="absolute left-[45%] top-[50%] h-[20%] w-[20%] rounded-lg bg-teal-500/5" />

          {/* Road lines */}
          <svg className="absolute inset-0 h-full w-full opacity-30" preserveAspectRatio="none">
            <line x1="0" y1="35%" x2="100%" y2="40%" stroke="#475569" strokeWidth="2" />
            <line x1="0" y1="65%" x2="100%" y2="60%" stroke="#475569" strokeWidth="2" />
            <line x1="30%" y1="0" x2="35%" y2="100%" stroke="#475569" strokeWidth="2" />
            <line x1="70%" y1="0" x2="65%" y2="100%" stroke="#475569" strokeWidth="2" />
          </svg>

          {/* Crosshair overlay */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan-500/20" />
            <div className="absolute top-1/2 left-0 w-full h-px -translate-y-1/2 bg-cyan-500/20" />
          </div>
        </div>

        {/* Incident markers */}
        {points.map((point) => {
          const config = severityConfig[point.severity];
          const isActive = point.status !== 'Resolved';
          const isSelected = selectedId === point.id;

          return (
            <button
              key={point.id}
              onClick={() => onSelect(point.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              title={point.type}
            >
              {isActive && (
                <span
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full opacity-60"
                  style={{
                    backgroundColor: 'currentColor',
                    width: isSelected ? '32px' : '24px',
                    height: isSelected ? '32px' : '24px',
                  }}
                />
              )}
              <span
                className={`relative flex items-center justify-center rounded-full ring-2 transition-all ${
                  isSelected ? 'h-6 w-6 ring-white/80' : 'h-4 w-4 ring-slate-900/80'
                } ${config.dot}`}
              >
                {isSelected && <MapPin className="h-4 w-4 text-white" />}
              </span>
              {isSelected && (
                <div className="absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-800/95 p-3 text-left shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">{point.type}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${config.border} ${config.bg} ${config.text}`}>
                      {point.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{point.location_name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Status: <span className="text-slate-300">{point.status}</span>
                  </p>
                </div>
              )}
            </button>
          );
        })}

        {/* Map overlay info */}
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-slate-900/80 px-3 py-2 text-xs text-slate-400 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="font-mono text-cyan-400">{activePoints.length}</span> active markers
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-slate-500">
            {bounds.minLat.toFixed(4)}, {bounds.minLng.toFixed(4)} → {bounds.maxLat.toFixed(4)}, {bounds.maxLng.toFixed(4)}
          </div>
        </div>
      </div>
    </div>
  );
}
