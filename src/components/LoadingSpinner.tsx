interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-2 border-slate-200 dark:border-slate-700 border-t-emerald-500 rounded-full animate-spin`}
      />
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Loading your momentum...</p>
      </div>
    </div>
  );
}
