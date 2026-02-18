// QR Check-In — Modern UI Components
// Copy these into your React components and adjust imports as needed

// ============================================================================
// 1. STATUS BADGE
// ============================================================================

interface StatusBadgeProps {
  status: 'pending' | 'checked-in' | 'error';
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const styles = {
    pending: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    'checked-in': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    error: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  };

  const labels = {
    pending: 'Pending',
    'checked-in': 'Checked In',
    error: 'Error',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === 'checked-in'
            ? 'bg-emerald-500'
            : status === 'error'
            ? 'bg-red-500'
            : 'bg-slate-400'
        }`}
      />
      {labels[status]}
    </span>
  );
}

// Usage:
// <StatusBadge status={attendee.checkedIn ? 'checked-in' : 'pending'} />

// ============================================================================
// 2. EMPTY STATE
// ============================================================================

import { Users, Upload, Plus } from 'lucide-react';

interface EmptyStateProps {
  onAddAttendee: () => void;
  onImportCSV: () => void;
}

export function EmptyState({ onAddAttendee, onImportCSV }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        No attendees yet
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
        Get started by importing your guest list or adding attendees manually.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onImportCSV}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import CSV
        </button>
        <button
          onClick={onAddAttendee}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Attendee
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 3. ATTENDEE ROW WITH HOVER ACTIONS
// ============================================================================

import { useState } from 'react';
import { Pencil, Trash2, Mail, QrCode } from 'lucide-react';

interface AttendeeRowProps {
  attendee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    company?: string;
    checkedIn: boolean;
    checkedInAt?: string;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onResendQR: (id: string) => void;
}

export function AttendeeRow({
  attendee,
  onEdit,
  onDelete,
  onResendQR,
}: AttendeeRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  const initials = `${attendee.firstName[0]}${attendee.lastName[0]}`.toUpperCase();

  return (
    <tr
      className="group border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar + Name */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
            {initials}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {attendee.firstName} {attendee.lastName}
            </p>
            {attendee.company && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {attendee.company}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Email */}
      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
        {attendee.email}
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <StatusBadge status={attendee.checkedIn ? 'checked-in' : 'pending'} />
      </td>

      {/* Timestamp */}
      <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
        {attendee.checkedIn && attendee.checkedInAt
          ? formatRelativeTime(attendee.checkedInAt)
          : '—'}
      </td>

      {/* Actions - hover only */}
      <td className="py-3 px-4">
        <div
          className={`flex items-center justify-end gap-1 transition-opacity duration-150 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={() => onResendQR(attendee.id)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            title="Resend QR"
          >
            <Mail className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(attendee.id)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(attendee.id)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Helper function
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

// ============================================================================
// 4. GLOBAL SEARCH WITH CMD+K
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { Search, Command } from 'lucide-react';

interface SearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function GlobalSearch({ onSearch, placeholder = 'Search attendees...' }: SearchProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Cmd+K handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative flex-1 max-w-md">
      <div
        className={`relative flex items-center transition-all duration-200 ${
          isFocused
            ? 'ring-2 ring-blue-500/20 border-blue-500'
            : 'border-slate-300 dark:border-slate-700'
        } border rounded-lg bg-white dark:bg-slate-900`}
      >
        <Search className="absolute left-3 w-4 h-4 text-slate-400" />
        <input
          id="global-search"
          type="text"
          placeholder={placeholder}
          onChange={(e) => onSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full pl-10 pr-20 py-2 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
        />
        <div className="absolute right-2 flex items-center gap-1">
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700">
            <Command className="w-3 h-3" />
            <span>K</span>
          </kbd>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. ACTIVITY FEED ITEM
// ============================================================================

import { CheckCircle2 } from 'lucide-react';

interface ActivityItemProps {
  activity: {
    id: string;
    type: 'check-in' | 'rsvp' | 'email-sent';
    attendeeName: string;
    timestamp: string;
    avatar?: string;
  };
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const initials = activity.attendeeName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const icons = {
    'check-in': <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    rsvp: <Users className="w-4 h-4 text-blue-500" />,
    'email-sent': <Mail className="w-4 h-4 text-purple-500" />,
  };

  const labels = {
    'check-in': 'checked in',
    rsvp: 'RSVP\'d',
    'email-sent': 'sent QR email',
  };

  return (
    <div className="flex items-start gap-3 py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-400 flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 dark:text-slate-100">
          <span className="font-medium">{activity.attendeeName}</span>{' '}
          <span className="text-slate-500 dark:text-slate-400">
            {labels[activity.type]}
          </span>
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          {formatRelativeTime(activity.timestamp)}
        </p>
      </div>
      <div className="flex-shrink-0">{icons[activity.type]}</div>
    </div>
  );
}

// ============================================================================
// 6. STAT CARD WITH TREND
// ============================================================================

interface StatCardProps {
  label: string;
  value: number;
  previousValue?: number;
  suffix?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({
  label,
  value,
  previousValue,
  suffix = '',
  trend = 'neutral',
}: StatCardProps) {
  const percentage = previousValue
    ? Math.round(((value - previousValue) / previousValue) * 100)
    : 0;

  const trendColors = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-slate-500 dark:text-slate-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          {value.toLocaleString()}
          {suffix && <span className="text-lg text-slate-400 ml-0.5">{suffix}</span>}
        </p>
        {previousValue !== undefined && (
          <span className={`text-sm font-medium ${trendColors[trend]}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {Math.abs(percentage)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 7. CHECK-IN PROGRESS (DONUT CHART)
// ============================================================================

interface CheckInProgressProps {
  checkedIn: number;
  total: number;
}

export function CheckInProgress({ checkedIn, total }: CheckInProgressProps) {
  const percentage = total > 0 ? (checkedIn / total) * 100 : 0;
  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
        Check-in Progress
      </p>
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-100 dark:text-slate-800"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-emerald-500 transition-all duration-500 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {Math.round(percentage)}%
            </span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600 dark:text-slate-400">Checked In</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {checkedIn} of {total}
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
