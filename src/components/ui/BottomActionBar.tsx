"use client";

type BottomActionBarProps = {
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: "primary" | "success" | "danger";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  children?: React.ReactNode;
  className?: string;
};

export default function BottomActionBar({
  primaryAction,
  secondaryAction,
  children,
  className = "",
}: BottomActionBarProps) {
  const variantClasses = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    success: "bg-emerald-500 text-white hover:bg-emerald-600",
    danger: "bg-rose-500 text-white hover:bg-rose-600",
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/10 bg-slate-950/95 p-4 shadow-lg backdrop-blur-md sm:relative sm:border-t-0 sm:bg-transparent sm:p-0 sm:shadow-none ${className}`}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:justify-end">
        {children}
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
            className="min-h-[44px] rounded-xl border border-slate-600 bg-transparent px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed sm:px-4"
          >
            {secondaryAction.label}
          </button>
        )}
        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            className={`min-h-[44px] flex-1 rounded-xl px-6 py-3 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed sm:flex-initial sm:px-4 ${
              variantClasses[primaryAction.variant || "primary"]
            }`}
          >
            {primaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
