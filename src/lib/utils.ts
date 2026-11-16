import type { IncidentStatus, Severity, AlertLevel } from '@/types';

export const severityConfig: Record<
  Severity,
  { color: string; bg: string; border: string; dot: string; text: string }
> = {
  Critical: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    dot: 'bg-red-500',
    text: 'text-red-300',
  },
  High: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    dot: 'bg-orange-500',
    text: 'text-orange-300',
  },
  Medium: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
    text: 'text-amber-300',
  },
  Low: {
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    dot: 'bg-sky-500',
    text: 'text-sky-300',
  },
};

export const statusConfig: Record<
  IncidentStatus,
  { color: string; bg: string; border: string; step: number }
> = {
  Reported: {
    color: 'text-slate-300',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    step: 0,
  },
  Dispatched: {
    color: 'text-blue-300',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    step: 1,
  },
  'En Route': {
    color: 'text-cyan-300',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    step: 2,
  },
  'On Scene': {
    color: 'text-teal-300',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    step: 3,
  },
  Resolved: {
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    step: 4,
  },
};

export const alertConfig: Record<
  AlertLevel,
  { color: string; bg: string; border: string; dot: string; text: string }
> = {
  critical: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    dot: 'bg-red-500',
    text: 'text-red-300',
  },
  warning: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
    text: 'text-amber-300',
  },
  info: {
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    dot: 'bg-sky-500',
    text: 'text-sky-300',
  },
};

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDuration(start: string | null, end: string | null): string {
  if (!start) return '--';
  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : Date.now();
  const seconds = Math.floor((endTime - startTime) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
