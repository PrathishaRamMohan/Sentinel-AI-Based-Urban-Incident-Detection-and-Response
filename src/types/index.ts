export type IncidentStatus = 'Reported' | 'Dispatched' | 'En Route' | 'On Scene' | 'Resolved';
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type AlertLevel = 'critical' | 'warning' | 'info';

export interface Incident {
  id: string;
  type: string;
  location_name: string;
  latitude: number;
  longitude: number;
  severity: Severity;
  description: string | null;
  status: IncidentStatus;
  dispatched_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  level: AlertLevel;
  source: string | null;
  created_at: string;
}
