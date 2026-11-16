import { useState } from 'react';
import type { Severity } from '@/types';
import { severityConfig } from '@/lib/utils';
import { Plus, Loader2, CheckCircle2, X, Flame, Car, HeartPulse, AlertTriangle, Building, Zap, Droplets } from 'lucide-react';

interface ReportFormProps {
  onSubmit: (data: {
    type: string;
    location_name: string;
    latitude: number;
    longitude: number;
    severity: string;
    description: string;
  }) => Promise<unknown>;
}

const INCIDENT_TYPES = [
  { label: 'Fire', icon: Flame },
  { label: 'Traffic Accident', icon: Car },
  { label: 'Medical Emergency', icon: HeartPulse },
  { label: 'Crime in Progress', icon: AlertTriangle },
  { label: 'Structural Damage', icon: Building },
  { label: 'Power Outage', icon: Zap },
  { label: 'Gas Leak', icon: Droplets },
  { label: 'Other', icon: Plus },
];

const SEVERITIES: Severity[] = ['Critical', 'High', 'Medium', 'Low'];

// Mock coordinates centered on a fictional city grid
const MOCK_LOCATIONS = [
  { name: 'Downtown Sector Grid 3', lat: 40.7480, lng: -73.9880 },
  { name: 'Riverside Plaza', lat: 40.7589, lng: -73.9851 },
  { name: 'Central Station', lat: 40.7527, lng: -73.9773 },
  { name: 'Highway 9 Interchange', lat: 40.7505, lng: -73.9934 },
  { name: 'Liberty Park North Gate', lat: 40.7462, lng: -73.9900 },
  { name: 'Oak Street Bridge', lat: 40.7400, lng: -73.9800 },
  { name: 'Industrial District Block 12', lat: 40.7300, lng: -73.9700 },
  { name: 'Market Square', lat: 40.7550, lng: -73.9840 },
];

export function ReportForm({ onSubmit }: ReportFormProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('');
  const [locationName, setLocationName] = useState('');
  const [severity, setSeverity] = useState<Severity>('Medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !locationName) return;
    setSubmitting(true);
    setError(null);

    const mockLoc = MOCK_LOCATIONS.find((l) => l.name === locationName);
    const lat = mockLoc?.lat ?? 40.74 + (Math.random() - 0.5) * 0.04;
    const lng = mockLoc?.lng ?? -73.98 + (Math.random() - 0.5) * 0.04;

    try {
      await onSubmit({
        type,
        location_name: locationName,
        latitude: lat,
        longitude: lng,
        severity,
        description,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
        resetForm();
      }, 1800);
    } catch {
      setError('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setType('');
    setLocationName('');
    setSeverity('Medium');
    setDescription('');
    setError(null);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="group flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/10"
      >
        <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
        Report New Incident
      </button>
    );
  }

  if (success) {
    return (
      <div className="flex w-full flex-col items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        <p className="mt-2 text-sm font-semibold text-emerald-300">Incident Reported</p>
        <p className="mt-0.5 text-xs text-slate-400">Response units have been notified</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">New Incident Report</h3>
        <button
          onClick={() => { setOpen(false); resetForm(); }}
          className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Incident type */}
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
            Incident Type
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {INCIDENT_TYPES.map((t) => {
              const Icon = t.icon;
              const isSelected = type === t.label;
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setType(t.label)}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition-all ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                      : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
            Location
          </label>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Enter address or area name"
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-cyan-500"
            required
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {MOCK_LOCATIONS.slice(0, 4).map((loc) => (
              <button
                key={loc.name}
                type="button"
                onClick={() => setLocationName(loc.name)}
                className="rounded-md border border-slate-700 bg-slate-800/40 px-2 py-1 text-[11px] text-slate-400 transition-colors hover:border-cyan-500/50 hover:text-cyan-300"
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
            Severity Level
          </label>
          <div className="grid grid-cols-4 gap-2">
            {SEVERITIES.map((sev) => {
              const config = severityConfig[sev];
              const isSelected = severity === sev;
              return (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverity(sev)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                    isSelected
                      ? `${config.border} ${config.bg} ${config.text}`
                      : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {sev}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide additional details about the incident..."
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-cyan-500"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting || !type || !locationName}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); resetForm(); }}
            className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
