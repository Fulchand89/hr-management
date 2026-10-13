import React from 'react';

/**
 * Primitive Skeleton component with animate-pulse
 */
export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-xl ${className}`}
      {...props}
    />
  );
};

/**
 * Text Lines Skeleton
 */
export const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-3 bg-slate-200/80 rounded-md animate-pulse ${
            i === lines - 1 ? 'w-3/5' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
};

/**
 * Stat Metric Card Skeleton
 */
export const SkeletonCard = ({ className = '' }) => {
  return (
    <div
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3 animate-pulse ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-24 bg-slate-200 rounded-md" />
        <div className="w-8 h-8 rounded-xl bg-slate-200" />
      </div>
      <div className="h-7 w-20 bg-slate-200 rounded-lg" />
      <div className="h-3 w-32 bg-slate-200/70 rounded-md" />
    </div>
  );
};

/**
 * Stat Cards Row Skeleton (e.g. 3 or 4 KPI cards)
 */
export const SkeletonStats = ({ count = 4, className = '' }) => {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

/**
 * Table Skeleton with animated rows and columns
 */
export const SkeletonTable = ({ rows = 5, cols = 5, hasHeader = true, className = '' }) => {
  return (
    <div className={`bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden ${className}`}>
      {hasHeader && (
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
          <div className="space-y-1.5">
            <div className="h-4 w-40 bg-slate-200 rounded-md" />
            <div className="h-3 w-56 bg-slate-200/70 rounded-md" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="h-8 w-44 bg-slate-200 rounded-xl" />
            <div className="h-8 w-24 bg-slate-200 rounded-xl" />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="py-3.5 px-4 sm:px-5">
                  <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="animate-pulse">
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="py-4 px-4 sm:px-5">
                    <div
                      className={`h-3.5 bg-slate-200/80 rounded ${
                        c === 0
                          ? 'w-32'
                          : c === cols - 1
                          ? 'w-16 ml-auto'
                          : 'w-24'
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Page Header Skeleton
 */
export const SkeletonPageHeader = ({ className = '' }) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 animate-pulse ${className}`}>
      <div className="space-y-2">
        <div className="h-6 w-48 bg-slate-200 rounded-lg" />
        <div className="h-3 w-64 bg-slate-200/70 rounded-md" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-9 w-24 bg-slate-200 rounded-xl" />
        <div className="h-9 w-28 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
};

/**
 * Full Page Skeleton (Header + 4 Stats + Data Table)
 */
export const PageSkeleton = ({ statsCount = 4, tableRows = 6, tableCols = 5, className = '' }) => {
  return (
    <div className={`space-y-6 max-w-7xl mx-auto font-sans pb-12 animate-in fade-in duration-150 ${className}`}>
      <SkeletonPageHeader />
      {statsCount > 0 && <SkeletonStats count={statsCount} />}
      <SkeletonTable rows={tableRows} cols={tableCols} />
    </div>
  );
};

/**
 * Dashboard Skeleton (Banner + Stats + 2 Columns Layout)
 */
export const DashboardSkeleton = ({ className = '' }) => {
  return (
    <div className={`space-y-6 max-w-7xl mx-auto font-sans pb-12 animate-in fade-in duration-150 ${className}`}>
      {/* Welcome Banner Skeleton */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-md animate-pulse space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-28 bg-slate-700 rounded-full" />
          <div className="h-5 w-24 bg-slate-700 rounded-full" />
        </div>
        <div className="h-8 w-64 bg-slate-700 rounded-xl" />
        <div className="h-3.5 w-96 max-w-full bg-slate-700/80 rounded-md" />
      </div>

      {/* 4 Stats Cards */}
      <SkeletonStats count={4} />

      {/* 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonTable rows={4} cols={4} />
        </div>
        <div>
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4 animate-pulse">
            <div className="h-4 w-32 bg-slate-200 rounded-md" />
            <div className="space-y-2.5">
              <div className="h-14 bg-slate-100 rounded-2xl" />
              <div className="h-14 bg-slate-100 rounded-2xl" />
              <div className="h-14 bg-slate-100 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Profile Page Skeleton
 */
export const ProfileSkeleton = ({ className = '' }) => {
  return (
    <div className={`space-y-6 max-w-5xl mx-auto font-sans pb-12 animate-in fade-in duration-150 ${className}`}>
      <SkeletonPageHeader />
      {/* Hero Profile Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center gap-5 animate-pulse">
        <div className="w-20 h-20 rounded-full bg-slate-200 shrink-0" />
        <div className="space-y-2.5 flex-1 w-full text-center sm:text-left">
          <div className="h-5 w-44 bg-slate-200 rounded-lg mx-auto sm:mx-0" />
          <div className="h-3 w-56 bg-slate-200/70 rounded-md mx-auto sm:mx-0" />
          <div className="flex gap-2 justify-center sm:justify-start">
            <div className="h-6 w-20 bg-slate-200 rounded-full" />
            <div className="h-6 w-24 bg-slate-200 rounded-full" />
          </div>
        </div>
      </div>
      {/* 2 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 animate-pulse">
          <div className="h-4 w-36 bg-slate-200 rounded-md" />
          <div className="space-y-3">
            <div className="h-3.5 bg-slate-100 rounded-md" />
            <div className="h-3.5 bg-slate-100 rounded-md" />
            <div className="h-3.5 bg-slate-100 rounded-md" />
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 animate-pulse">
          <div className="h-4 w-36 bg-slate-200 rounded-md" />
          <div className="space-y-3">
            <div className="h-3.5 bg-slate-100 rounded-md" />
            <div className="h-3.5 bg-slate-100 rounded-md" />
            <div className="h-3.5 bg-slate-100 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
