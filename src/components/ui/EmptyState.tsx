import { Users, Upload, Plus, Loader2 } from 'lucide-react';

interface EmptyStateProps {
  onAddAttendee: () => void;
  /** When provided, shows Import CSV button. */
  onImportCSV?: () => void;
  importing?: boolean;
}

export function EmptyState({ onAddAttendee, onImportCSV, importing }: EmptyStateProps) {
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
        {onImportCSV && (
          <button
            onClick={onImportCSV}
            disabled={importing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {importing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {importing ? 'Importing…' : 'Import CSV'}
          </button>
        )}
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
