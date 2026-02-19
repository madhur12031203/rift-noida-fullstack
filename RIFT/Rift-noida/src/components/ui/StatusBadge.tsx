"use client";

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    ongoing: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    cancelled: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    matched: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    searching: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    accepted: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };

  const colorClass = statusColors[status.toLowerCase()] || "bg-slate-500/20 text-slate-300 border-slate-500/30";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${colorClass} ${className}`}
    >
      {status}
    </span>
  );
}
