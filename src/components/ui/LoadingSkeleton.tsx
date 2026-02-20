"use client";

type LoadingSkeletonProps = {
  className?: string;
  lines?: number;
};

export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl border border-slate-200/10 bg-white/5 p-4 ${className}`}>
      <div className="mb-3 h-4 w-3/4 rounded bg-slate-700/50" />
      <div className="mb-2 h-3 w-1/2 rounded bg-slate-700/30" />
      <div className="mt-4 h-10 w-full rounded-xl bg-slate-700/30" />
    </div>
  );
}

export function TextSkeleton({ className = "", lines = 1 }: LoadingSkeletonProps) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`mb-2 h-4 rounded bg-slate-700/50 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function ButtonSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`h-11 w-full animate-pulse rounded-xl bg-slate-700/30 ${className}`} />
  );
}
