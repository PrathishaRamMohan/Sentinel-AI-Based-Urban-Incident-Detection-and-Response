import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface CitizenReportPayload {
  incident_type: string;
  description?: string;
  latitude: number;
  longitude: number;
}

export interface CitizenReportResponse {
  id: string;
  user_id: string | null;
  incident_id: string | null;
  incident_type: string;
  description: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface IncidentResponse {
  id: string;
  type: string;
  incident_type: string | null;
  location_name: string;
  latitude: number;
  longitude: number;
  severity: string;
  description: string | null;
  status: string;
  source: string;
  confidence: number;
  dispatched_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    phone: string | null;
    created_at: string;
  };
}

export interface HealthResponse {
  status: string;
  service: string;
  database: string;
}

export interface CctvCamera {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  status: string;
  fps: number;
  ai_enabled: boolean;
  active_vehicles: number;
}

export interface CctvStatusResponse {
  cctv_service_active: boolean;
  total_cameras_monitored: number;
  ai_model: {
    functional: boolean;
    model_path: string;
    is_custom_trained: boolean;
    classes_count: number;
    target_classes: string[];
    detection_mode: string;
  };
  inference_engine: string;
  supported_codecs: string[];
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(resp: Response): Promise<T> {
  if (!resp.ok) {
    let message = `Request failed (${resp.status})`;
    try {
      const body = await resp.json();
      if (body.detail) {
        message = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      // non-JSON error body
    }
    throw new Error(message);
  }
  return resp.json() as Promise<T>;
}

export interface CctvVideoAnalysisResponse {
  status: string;
  accident_detected: boolean;
  incident_id?: string;
  alert_id?: string;
  crash_timestamp_sec: number;
  crash_frame: number;
  confidence: number;
  total_frames: number;
  vehicles_tracked: number;
  annotated_video_url: string;
  original_video_url?: string;
  camera_name: string;
  summary: string;
}

export const api = {
  async register(email: string, password: string, full_name?: string, phone?: string): Promise<AuthResponse> {
    const resp = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name, phone }),
    });
    return handleResponse<AuthResponse>(resp);
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const resp = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<AuthResponse>(resp);
  },

  async submitCitizenReport(payload: CitizenReportPayload): Promise<CitizenReportResponse> {
    const resp = await fetch(`${API_BASE}/api/v1/citizen-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify(payload),
    });
    return handleResponse<CitizenReportResponse>(resp);
  },

  async submitCitizenReportWithEvidence(
    incidentType: string,
    latitude: number,
    longitude: number,
    description: string | undefined,
    files: File[],
  ): Promise<CitizenReportResponse> {
    const formData = new FormData();
    formData.append('incident_type', incidentType);
    formData.append('latitude', String(latitude));
    formData.append('longitude', String(longitude));
    if (description) formData.append('description', description);
    for (const file of files) {
      formData.append('files', file);
    }
    const resp = await fetch(`${API_BASE}/api/v1/citizen-reports/with-evidence`, {
      method: 'POST',
      headers: { ...(await authHeaders()) },
      body: formData,
    });
    return handleResponse<CitizenReportResponse>(resp);
  },

  async getIncident(id: string): Promise<IncidentResponse> {
    const resp = await fetch(`${API_BASE}/api/v1/incidents/${id}`, {
      headers: { ...(await authHeaders()) },
    });
    return handleResponse<IncidentResponse>(resp);
  },

  async listIncidents(): Promise<{ incidents: IncidentResponse[]; total: number }> {
    const resp = await fetch(`${API_BASE}/api/v1/incidents`, {
      headers: { ...(await authHeaders()) },
    });
    return handleResponse(resp);
  },

  async checkHealth(): Promise<HealthResponse> {
    const resp = await fetch(`${API_BASE}/api/v1/health`);
    return handleResponse<HealthResponse>(resp);
  },

  async getCctvStatus(): Promise<CctvStatusResponse> {
    const resp = await fetch(`${API_BASE}/api/v1/cctv/status`);
    return handleResponse<CctvStatusResponse>(resp);
  },

  async getCctvCameras(): Promise<{ cameras: CctvCamera[]; total: number }> {
    const resp = await fetch(`${API_BASE}/api/v1/cctv/cameras`);
    return handleResponse<{ cameras: CctvCamera[]; total: number }>(resp);
  },

  async simulateCctvDetection(cameraId: string, severity: string = 'Critical', description?: string): Promise<{
    status: string;
    incident_id: string;
    camera_id: string;
    camera_name: string;
    message: string;
  }> {
    const resp = await fetch(`${API_BASE}/api/v1/cctv/simulate-detection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ camera_id: cameraId, severity, description }),
    });
    return handleResponse(resp);
  },

  async uploadAndAnalyzeCctvVideo(
    videoFile: File,
    cameraName: string = 'Downtown Surveillance Node',
    latitude: number = 40.7589,
    longitude: number = -73.9851,
  ): Promise<CctvVideoAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', videoFile);
    formData.append('camera_name', cameraName);
    formData.append('latitude', String(latitude));
    formData.append('longitude', String(longitude));

    const resp = await fetch(`${API_BASE}/api/v1/cctv/upload-video`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<CctvVideoAnalysisResponse>(resp);
  },

  async analyzeSampleCctvVideo(
    cameraName: string = 'CAM-01: Downtown Intersection',
    latitude: number = 40.7589,
    longitude: number = -73.9851,
  ): Promise<CctvVideoAnalysisResponse> {
    const params = new URLSearchParams({
      camera_name: cameraName,
      latitude: String(latitude),
      longitude: String(longitude),
    });
    const resp = await fetch(`${API_BASE}/api/v1/cctv/analyze-sample?${params.toString()}`, {
      method: 'POST',
    });
    return handleResponse<CctvVideoAnalysisResponse>(resp);
  },
};
