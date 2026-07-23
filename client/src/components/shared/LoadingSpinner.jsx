import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Centered spinner for asynchronous loading operations.
 * Supports a full-screen backdrop overlay mode.
 */
const LoadingSpinner = ({ message = 'Loading contents...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {message && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return <div className="flex min-h-[200px] w-full items-center justify-center">{content}</div>;
};

export default LoadingSpinner;
