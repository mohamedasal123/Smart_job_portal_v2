/**
 * Skeleton primitive — premium wave shimmer placeholder block.
 *
 * `className` controls size/shape (use Tailwind `h-`/`w-`/`rounded-` classes).
 */
export default function Skeleton({ className = '' }) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={`skeleton-premium rounded-md ${className}`}
    />
  );
}

/**
 * Skeleton.Text — multi-line shimmer block, narrows the last line.
 */
Skeleton.Text = function SkeletonTextComponent({ lines = 3, className = '' }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton.Card — pre-composed card placeholder with image placeholder + 3 text lines.
 */
Skeleton.Card = function SkeletonCardComponent({ className = '' }) {
  return (
    <div className={`bg-surface border border-outline-variant dark:border-gray-800 rounded-xl p-5 flex flex-col gap-4 ${className}`}>
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton.Text lines={3} className="mt-2" />
    </div>
  );
};

/**
 * Skeleton.Table — table placeholder.
 */
Skeleton.Table = function SkeletonTableComponent({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`w-full overflow-hidden border border-outline-variant dark:border-gray-800 rounded-xl bg-surface ${className}`}>
      {/* Table Header */}
      <div className="border-b border-outline-variant dark:border-gray-800 bg-surface-dim p-4 flex gap-4">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={`th-${j}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Table Rows */}
      <div className="divide-y divide-outline-variant dark:divide-gray-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={`tr-${i}`} className="p-4 flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={`td-${i}-${j}`} className="h-3 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton.Avatar — circular avatar placeholder.
 */
Skeleton.Avatar = function SkeletonAvatarComponent({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  }[size] || 'w-12 h-12';

  return (
    <Skeleton className={`rounded-full shrink-0 ${sizeClasses} ${className}`} />
  );
};

/**
 * Skeleton.JobCard — job-specific card skeleton.
 */
Skeleton.JobCard = function SkeletonJobCardComponent({ className = '' }) {
  return (
    <div className={`bg-surface border border-outline-variant dark:border-gray-800 rounded-xl p-6 flex flex-col gap-4 ${className}`}>
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex gap-2 my-1">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton.Text lines={2} />
      <div className="flex items-center justify-between pt-4 border-t border-outline-variant dark:border-gray-800">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
    </div>
  );
};

/**
 * Skeleton.StatCard — stats card skeleton.
 */
Skeleton.StatCard = function SkeletonStatCardComponent({ className = '' }) {
  return (
    <div className={`bg-surface border border-outline-variant dark:border-gray-800 rounded-xl p-5 flex flex-col gap-3 ${className}`}>
      <div className="flex justify-between items-start">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
      </div>
      <Skeleton className="h-8 w-1/2 mt-1" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
};

/**
 * Skeleton.Profile — profile page placeholder.
 */
Skeleton.Profile = function SkeletonProfileComponent({ className = '' }) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-surface border border-outline-variant dark:border-gray-800 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6">
        <Skeleton.Avatar size="xl" />
        <div className="flex-1 w-full space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface border border-outline-variant dark:border-gray-800 rounded-xl p-6 space-y-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton.Text lines={4} />
        </div>
        <div className="bg-surface border border-outline-variant dark:border-gray-800 rounded-xl p-6 space-y-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton.Text lines={4} />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton.Dashboard — full dashboard layout placeholder.
 */
Skeleton.Dashboard = function SkeletonDashboardComponent({ statCount = 4, className = '' }) {
  const statGridClass =
    statCount <= 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : statCount === 3
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`space-y-6 ${className}`} aria-busy="true">
      <Skeleton className="h-10 w-72" />
      <div className={`grid ${statGridClass} gap-4`}>
        {Array.from({ length: statCount }).map((_, i) => (
          <Skeleton.StatCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton.Card /><Skeleton.Card />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton.Card />
        </div>
      </div>
    </div>
  );
};

// Named exports for legacy backward compatibility
export function SkeletonText({ lines = 3, className = '' }) {
  return <Skeleton.Text lines={lines} className={className} />;
}

export function SkeletonCard({ className = '' }) {
  return <Skeleton.Card className={className} />;
}
