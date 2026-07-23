import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Clean card display for network or runtime errors, with optional retry callback.
 */
const ErrorState = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading content.',
  onRetry,
}) => {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center animate-in fade-in-50 duration-300">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20 text-destructive shadow-sm">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-foreground">
        {title}
      </h3>
      {message && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {message}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
        >
          <RefreshCw className="h-4.5 w-4.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
