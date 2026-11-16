import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Shield, ArrowLeft, MapPin, Loader2, CheckCircle2, Camera, Send,
  Navigation, AlertTriangle, Car, HeartPulse, Flame, MoreHorizontal,
  LogOut, X, Clock, Radio,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api, type CitizenReportResponse } from '@/lib/api';

// Fix default Leaflet marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const INCIDENT_TYPES = [
  { label: 'Road Accident', icon: Car },
  { label: 'Possible Physical Altercation', icon: AlertTriangle },
  { label: 'Medical Emergency', icon: HeartPulse },
  { label: 'Fire', icon: Flame },
  { label: 'Other', icon: MoreHorizontal },
];

type LocationState = 'idle' | 'requesting' | 'granted' | 'denied';

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

export function CitizenReport() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<CitizenReportResponse | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7589, -73.9851]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requestLocation = useCallback(() => {
    setLocationState('requesting');
    setError(null);

    if (!navigator.geolocation) {
      setLocationState('denied');
      setError('Geolocation is not supported by your browser. Use the map to pin your location.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setMapCenter([lat, lng]);
        setLocationState('granted');
      },
      () => {
        setLocationState('denied');
        setError('Location permission denied. Precise location is required for emergency routing. Please use the map to pin your location manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setMapCenter([lat, lng]);
    if (locationState === 'idle') {
      setLocationState('granted');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentType) {
      setError('Please select an incident type');
      return;
    }
    if (latitude === null || longitude === null) {
      setError('Location is required. Please grant location permission or pin your location on the map.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (files.length > 0) {
        setSuccess(await api.submitCitizenReportWithEvidence(incidentType, latitude, longitude, description || undefined, files));
      } else {
        setSuccess(await api.submitCitizenReport({
          incident_type: incidentType,
          description: description || undefined,
          latitude,
          longitude,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-8">
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/60 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Incident Reported Successfully</h1>
            <p className="mt-2 text-sm text-slate-400">Help is being located</p>

            <div className="mt-6 space-y-3 rounded-xl border border-slate-800 bg-slate-800/40 p-5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Incident ID</span>
                <span className="font-mono text-sm text-cyan-400">{success.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Type</span>
                <span className="text-sm font-medium text-white">{success.incident_type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Location</span>
                <span className="font-mono text-sm text-slate-300">
                  {success.latitude.toFixed(4)}, {success.longitude.toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Time</span>
                <span className="text-sm text-slate-300">
                  {new Date(success.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Status</span>
                <span className="rounded-full bg-cyan-500/10 px-3 py-0.5 text-xs font-medium text-cyan-300 ring-1 ring-cyan-500/20">
                  Detected
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
              <Radio className="h-4 w-4 animate-pulse text-cyan-400" />
              Help is being located...
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => {
                  setSuccess(null);
                  setIncidentType('');
                  setDescription('');
                  setFiles([]);
                  setLocationState('idle');
                }}
                className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
              >
                Report Another
              </button>
              <Link
                to="/"
                className="flex-1 rounded-lg bg-cyan-500 py-2.5 text-center text-sm font-semibold text-slate-950 transition-all hover:bg-cyan-400"
              >
                Done
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20">
            <Shield className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-wider text-white">SENTINEL</span>
            <span className="ml-2 text-xs text-slate-500">Citizen Report</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-slate-400">
              {user.full_name || user.email}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-white">Report an Emergency</h1>
        <p className="mt-1 text-sm text-slate-400">
          Provide the details below so responders can reach the scene quickly.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Incident type */}
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-300">
              Incident Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {INCIDENT_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = incidentType === t.label;
                return (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setIncidentType(t.label)}
                    className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Location <span className="text-red-400">*</span>
            </label>

            {/* Permission request banner */}
            {locationState === 'idle' && (
              <div className="mb-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-start gap-3">
                  <Navigation className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-300">
                      Sentinel needs your location to send help to the correct location.
                    </p>
                    <button
                      type="button"
                      onClick={requestLocation}
                      className="mt-3 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-all hover:bg-cyan-400"
                    >
                      Share My Location
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Requesting */}
            {locationState === 'requesting' && (
              <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                <span className="text-sm text-slate-300">Detecting your location...</span>
              </div>
            )}

            {/* Granted */}
            {locationState === 'granted' && latitude !== null && longitude !== null && (
              <div className="mb-3 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <div className="flex-1">
                  <p className="text-sm text-emerald-300">Location acquired</p>
                  <p className="font-mono text-xs text-slate-400">
                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={requestLocation}
                  className="text-xs text-slate-400 transition-colors hover:text-white"
                >
                  Refresh
                </button>
              </div>
            )}

            {/* Denied */}
            {locationState === 'denied' && (
              <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-300">Location permission denied</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Precise location is required for emergency routing. Use the map below
                      to pin your location manually.
                    </p>
                    <button
                      type="button"
                      onClick={requestLocation}
                      className="mt-2 text-xs font-medium text-cyan-400 transition-colors hover:text-cyan-300"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Leaflet map */}
            <div className="overflow-hidden rounded-xl border border-slate-800">
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '300px', width: '100%' }}
                scrollWheelZoom
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapClickHandler onClick={handleMapClick} />
                <RecenterMap center={mapCenter} />
                {latitude !== null && longitude !== null && (
                  <Marker position={[latitude, longitude]} />
                )}
              </MapContainer>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3 w-3" />
              {latitude !== null && longitude !== null
                ? `Pinned at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                : 'Click on the map to pin your location'}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you see, any hazards, number of people involved..."
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-cyan-500"
            />
          </div>

          {/* Evidence upload */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Photo / Video Evidence (optional)
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-900/40 py-4 text-sm text-slate-400 transition-colors hover:border-cyan-500/50 hover:text-cyan-300"
            >
              <Camera className="h-4 w-4" />
              {files.length === 0 ? 'Click to add photos or videos' : `Add more (${files.length} selected)`}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            {files.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1.5">
                    <span className="text-xs text-slate-300">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-slate-500 transition-colors hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !incidentType || latitude === null}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Submitting Emergency Report...</>
            ) : (
              <><Send className="h-4 w-4" /> Submit Emergency Report</>
            )}
          </button>

          <p className="text-center text-xs text-slate-500">
            <Clock className="mr-1 inline h-3 w-3" />
            Your report will be sent immediately to the SENTINEL response system
          </p>
        </form>
      </div>
    </div>
  );
}
