"use client";

type Toast = {
  id: number;
  message: string;
  tone?: "success" | "info" | "error";
};

type ToastStackProps = {
  toasts: Toast[];
};

export default function ToastStack({ toasts }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[70] flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-xl border px-4 py-3 text-sm backdrop-blur ${
            toast.tone === "error"
              ? "border-rose-500/40 bg-rose-500/15 text-rose-100"
              : toast.tone === "success"
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-100"
                : "border-cyan-500/40 bg-cyan-500/15 text-cyan-100"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
