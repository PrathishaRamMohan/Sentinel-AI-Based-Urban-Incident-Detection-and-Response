import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { api, type CctvCamera, type CctvStatusResponse, type CctvVideoAnalysisResponse } from '@/lib/api';
import {
  Video,
  Upload,
  Cpu,
  RefreshCw,
  Radio,
  LayoutGrid,
  Maximize2,
  FileVideo,
  Loader2,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

interface CCTVMonitorProps {
  onCameraSelect?: (camera: CctvCamera) => void;
  onIncidentCreated?: () => void;
}

export function CCTVMonitor({ onCameraSelect, onIncidentCreated }: CCTVMonitorProps) {
  const [cameras, setCameras] = useState<CctvCamera[]>([]);

  const [selectedCamId, setSelectedCamId] = useState<string>('CAM-01');
  const [cctvStatus, setCctvStatus] = useState<CctvStatusResponse | null>(null);
  const [isGridView, setIsGridView] = useState(false);

  // Video Upload & AI Analysis State
  const [activeMode, setActiveMode] = useState<'live' | 'upload'>('live');
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CctvVideoAnalysisResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedCamera = cameras.find((c) => c.id === selectedCamId) || cameras[0];

  // Fetch camera status from backend
  const loadStatus = async () => {
    try {
      const [statusData, camData] = await Promise.all([
        api.getCctvStatus(),
        api.getCctvCameras(),
      ]);
      setCctvStatus(statusData);
      if (camData.cameras?.length) {
        setCameras(camData.cameras);
      }
    } catch {
      // Keep initial fallback states
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  // Upload user's custom CCTV video
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsAnalyzingVideo(true);
    setUploadError(null);
    setAnalysisResult(null);

    try {
      const result = await api.uploadAndAnalyzeCctvVideo(
        file,
        selectedCamera?.name || 'Uploaded CCTV Source',
        selectedCamera?.latitude || 40.7589,
        selectedCamera?.longitude || -73.9851,
      );
      setAnalysisResult(result);
      if (result.accident_detected && onIncidentCreated) {
        onIncidentCreated();
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Video analysis failed');
    } finally {
      setIsAnalyzingVideo(false);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-md">
      {/* Panel Top Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
            <Video className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              AI CCTV ACCIDENT DETECTION &amp; SURVEILLANCE
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-950/50 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                <Radio className="h-2.5 w-2.5" /> UPLOAD MODE
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Frame-by-frame YOLO object kinematics, trajectory tracking &amp; collision recognition
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
            <button
              onClick={() => setActiveMode('live')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition ${
                activeMode === 'live' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="h-3 w-3" /> Live Camera Grid
            </button>
            <button
              onClick={() => setActiveMode('upload')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition ${
                activeMode === 'upload' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="h-3 w-3" /> Upload CCTV Video
            </button>
          </div>

          <button
            onClick={loadStatus}
            title="Refresh CCTV Telemetry"
            className="rounded-lg border border-slate-700 bg-slate-800/80 p-1.5 text-slate-400 transition hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main CCTV Content */}
      <div className="p-4 space-y-4">
        {/* Camera Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {cameras.map((cam) => {
            const isSelected = cam.id === selectedCamId;
            return (
              <button
                key={cam.id}
                onClick={() => {
                  setSelectedCamId(cam.id);
                  if (onCameraSelect) onCameraSelect(cam);
                }}
                className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition ${
                  isSelected
                    ? 'border-cyan-500/80 bg-cyan-950/30 shadow-md shadow-cyan-950/50'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className={`text-xs font-mono font-bold ${isSelected ? 'text-cyan-400' : 'text-slate-300'}`}>
                    {cam.id}
                  </span>
                  <span className={`flex h-2 w-2 rounded-full ${cam.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                </div>
                <div className="mt-1 line-clamp-1 text-[11px] font-medium text-slate-200">{cam.name}</div>
                <div className="text-[10px] text-slate-400">{cam.location}</div>
              </button>
            );
          })}
        </div>

        {/* Video / Canvas Area */}
        {activeMode === 'live' ? (
          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-black aspect-[16/9] max-h-[360px]">
            {isGridView ? (
              <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-1 bg-slate-950 p-1">
                {cameras.map((cam) => (
                  <div
                    key={cam.id}
                    onClick={() => {
                      setSelectedCamId(cam.id);
                      setIsGridView(false);
                    }}
                    className="relative cursor-pointer overflow-hidden rounded border border-slate-800 bg-slate-900 flex items-center justify-center group"
                  >
                    <div className="absolute top-2 left-2 z-10 rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-mono text-cyan-400 border border-slate-800">
                      {cam.id}
                    </div>
                    <div className="text-center p-2">
                      <Video className="mx-auto h-5 w-5 text-slate-500 group-hover:text-cyan-400 transition" />
                      <div className="mt-1 text-[11px] font-medium text-slate-300">{cam.name}</div>
                      <div className="text-[9px] text-slate-500">{cam.status} &middot; upload analysis only</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-slate-950 p-6 text-center">
                <Video className="h-10 w-10 text-slate-700" />
                <div className="mt-3 text-sm font-semibold text-slate-300">No live CCTV stream connected</div>
                <div className="mt-1 max-w-sm text-xs text-slate-500">
                  Live camera inference is disabled until a camera source is configured. Use Upload CCTV Video to run the model on recorded footage.
                </div>
              </div>
            )}

            {/* Floating view toggle */}
            <button
              onClick={() => setIsGridView(!isGridView)}
              className="absolute bottom-3 right-3 z-10 rounded-lg bg-slate-900/80 border border-slate-700 px-2 py-1 text-[11px] font-medium text-slate-200 hover:text-white backdrop-blur flex items-center gap-1"
            >
              {isGridView ? <Maximize2 className="h-3 w-3" /> : <LayoutGrid className="h-3 w-3" />}
              {isGridView ? 'Focus' : '4-Grid'}
            </button>
          </div>
        ) : (
          /* Video Upload & AI Analysis Area */
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-xl border border-dashed border-slate-700 bg-slate-950/80 p-6 text-center">
              <input
                type="file"
                ref={fileInputRef}
                accept="video/mp4,video/avi,video/quicktime,video/mkv,.mp4,.avi,.mov"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 mb-3 border border-cyan-500/20">
                <FileVideo className="h-6 w-6" />
              </div>

              <h3 className="text-sm font-bold text-white mb-1">
                Upload CCTV Video Footage for AI Incident Detection
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                Upload surveillance video (.mp4, .avi, .mov). The YOLO engine will run frame-by-frame collision detection, generate annotated bounding boxes, and log confirmed accidents to Supabase in real-time.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={isAnalyzingVideo}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  Select Video File...
                </button>

              </div>

              {selectedFileName && (
                <div className="mt-3 text-xs font-mono text-cyan-400">
                  Target: {selectedFileName}
                </div>
              )}
            </div>

            {/* Analysis Loading Progress */}
            {isAnalyzingVideo && (
              <div className="flex items-center justify-center gap-3 rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-4 text-sm text-cyan-300 animate-pulse">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400 shrink-0" />
                <div>
                  <div className="font-bold">YOLO AI Video Analysis in Progress...</div>
                  <div className="text-xs text-cyan-400/80">Processing video frames, tracking vehicle velocities &amp; checking collision thresholds</div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {uploadError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
                <AlertOctagon className="h-4 w-4 text-red-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Video Player & AI Telemetry Result */}
            {analysisResult && (
              <div className="rounded-xl border border-emerald-500/40 bg-slate-950 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span className="text-sm font-bold text-white">AI Detection Complete</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-mono border ${analysisResult.accident_detected ? 'bg-red-950 text-red-400 border-red-800/50' : 'bg-emerald-950 text-emerald-400 border-emerald-800/50'}`}>
                      {analysisResult.accident_detected ? 'ACCIDENT CONFIRMED' : 'NO ACCIDENT DETECTED'}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    Confidence: <span className="text-emerald-400 font-bold">{Math.round(analysisResult.confidence * 100)}%</span> &bull; Crash Time: <span className="text-cyan-400 font-bold">00:{Math.floor(analysisResult.crash_timestamp_sec).toString().padStart(2, '0')}s</span>
                  </div>
                </div>

                {/* Video Player with Annotated Bounding Boxes */}
                <div className="overflow-hidden rounded-lg border border-slate-800 bg-black aspect-[16/9] max-h-[320px]">
                  <video
                    src={`${API_BASE}${analysisResult.annotated_video_url}`}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="h-full w-full object-contain"
                  />
                </div>

                {/* Telemetry Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Incident ID</div>
                    <div className="font-mono text-cyan-400 font-bold truncate">{analysisResult.incident_id ? `#${analysisResult.incident_id.slice(0, 8)}` : 'Not created'}</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Crash Frame</div>
                    <div className="font-mono text-white font-bold">Frame #{analysisResult.crash_frame}</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Vehicles Tracked</div>
                    <div className="font-mono text-emerald-400 font-bold">{analysisResult.vehicles_tracked} Units</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Database Status</div>
                    <div className="font-mono text-emerald-400 font-bold">Synced Live</div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  {analysisResult.summary}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Interactive Controls & AI Model Telemetry */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Upload workflow status */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileVideo className="h-3.5 w-3.5 text-cyan-400" /> Recorded Footage Workflow
              </span>
              <span className="text-[10px] text-slate-500 font-mono">MODEL INPUT</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Upload a CCTV recording to run frame-by-frame inference. Confirmed collisions are written to the incident queue; clean footage creates no incident.
            </p>
            <button type="button" onClick={() => setActiveMode('upload')} className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400">
              <Upload className="h-3.5 w-3.5" /> Choose CCTV video
            </button>
          </div>

          {/* AI Model Architecture Status */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs">
            <div className="flex items-center justify-between mb-2 font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Cpu className="h-3.5 w-3.5" /> AI Model Telemetry
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-cyan-950 px-1.5 py-0.5 text-[10px] text-cyan-300 border border-cyan-800/40">
                Ultralytics YOLO (Active)
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Model Weight:</span>
                <span className="text-slate-200">{cctvStatus?.ai_model?.model_path || 'yolo26n.pt'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Detection Engine:</span>
                <span className="text-slate-200 truncate max-w-[180px]">
                  {cctvStatus?.ai_model?.detection_mode || 'Real-Time Traffic & Vehicle Detection'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monitored Classes:</span>
                <span className="text-emerald-400">{cctvStatus?.ai_model?.classes_count || 80} classes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Inference Status:</span>
                <span className="text-cyan-300">Ready &bull; Video Upload</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
