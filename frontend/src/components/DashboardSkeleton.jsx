import Skeleton from './Skeleton';

/**
 * Layout-matched skeleton for dashboard pages.
 * Replaces bare spinners so users see structure immediately.
 */
export default function DashboardSkeleton({
  variant = 'dashboard',
  statCount = 4,
  tableRows = 6,
  tableCols = 5,
  className = '',
  label = 'Loading…',
}) {
  if (variant === 'table') {
    return (
      <div className={`space-y-6 ${className}`} aria-busy="true" aria-live="polite">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full max-w-md rounded-lg" />
        <Skeleton.Table rows={tableRows} cols={tableCols} />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className={`space-y-6 max-w-3xl ${className}`} aria-busy="true" aria-live="polite">
        <Skeleton className="h-10 w-56" />
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === 'profile') {
    return (
      <div className={className} aria-busy="true" aria-live="polite">
        <Skeleton.Profile />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={`space-y-6 ${className}`} aria-busy="true" aria-live="polite">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton.JobCard key={i} />
          ))}
        </div>
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return (
    <div className={className} aria-busy="true" aria-live="polite">
      <Skeleton.Dashboard statCount={statCount} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
