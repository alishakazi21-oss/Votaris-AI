import React from 'react';
import { AlertCircle, RefreshCw, AlertTriangle, Clock, Inbox } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 1. Loading Skeleton
export const LoadingSkeleton: React.FC<{
  className?: string;
  rows?: number;
  height?: string;
}> = ({ className, rows = 3, height = 'h-10' }) => {
  return (
    <div className={twMerge('space-y-3 w-full animate-pulse', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={clsx('bg-border/40 rounded-lg w-full', height)} />
      ))}
    </div>
  );
};

// 2. Empty State
export const EmptyState: React.FC<{
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}> = ({
  title = 'No Telemetry Available',
  description = 'No data points were matched for the selected timeframe and parameters.',
  action,
  icon: Icon = Inbox,
  className,
}) => {
  return (
    <div
      className={twMerge(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-border bg-base/30 my-4',
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-elevated border border-border flex items-center justify-center text-muted mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-primary">{title}</h4>
      <p className="text-xs text-secondary mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

// 3. Error State with Retry
export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = 'Failed to Load Grid Telemetry',
  message = 'An unexpected network error occurred while querying the forecasting engine.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={twMerge(
        'rounded-xl border border-accent-red/40 bg-accent-red/5 p-6 flex flex-col items-center text-center my-4',
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-accent-red/20 text-accent-red flex items-center justify-center mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-primary">{title}</h4>
      <p className="text-xs text-secondary mt-1 max-w-md font-mono">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-red/20 text-accent-red hover:bg-accent-red/30 border border-accent-red/30 text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};

// 4. API Unavailable Banner
export const ApiUnavailableBanner: React.FC<{
  onSwitchToDemo?: () => void;
  className?: string;
}> = ({ onSwitchToDemo, className }) => {
  return (
    <div
      className={twMerge(
        'flex items-center justify-between gap-3 p-3 rounded-lg border border-accent-amber/40 bg-accent-amber/10 text-xs text-accent-amber',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>
          <strong>Backend Gateway Unreachable:</strong> Running in autonomous simulated Demo Mode with physical dispatch heuristics.
        </span>
      </div>
      {onSwitchToDemo && (
        <button
          type="button"
          onClick={onSwitchToDemo}
          className="px-2.5 py-1 rounded bg-accent-amber/20 hover:bg-accent-amber/30 text-[11px] font-semibold text-primary transition-colors whitespace-nowrap"
        >
          Acknowledge
        </button>
      )}
    </div>
  );
};

// 5. Stale Data Banner
export const StaleDataBanner: React.FC<{
  lastUpdatedText: string;
  onRefresh?: () => void;
  className?: string;
}> = ({ lastUpdatedText, onRefresh, className }) => {
  return (
    <div
      className={twMerge(
        'flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border bg-elevated/70 text-xs text-secondary',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-accent-amber shrink-0" />
        <span>
          Displaying cached snapshot. Last recorded: <strong className="text-primary font-mono">{lastUpdatedText}</strong>
        </span>
      </div>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1 text-[11px] text-accent-cyan hover:underline font-medium"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Refresh Now</span>
        </button>
      )}
    </div>
  );
};
