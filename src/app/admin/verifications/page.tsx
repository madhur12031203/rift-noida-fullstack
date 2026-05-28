"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import VideoBackground from "@/components/VideoBackground";

type Verification = {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  user_email: string | null;
  user_name: string | null;
};

export default function AdminVerificationsPage() {
  const router = useRouter();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  // Admin access guard: check admin status on page load
  useEffect(() => {
    async function checkAdminAccess() {
      try {
        const res = await fetch("/api/admin/verify");
        const data = await res.json();
        if (!res.ok || !data.isAdmin) {
          setIsAdmin(false);
          return;
        }
        setIsAdmin(true);
        await loadVerifications();
      } catch {
        setIsAdmin(false);
        setError("Failed to verify admin access");
      }
    }
    checkAdminAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadVerifications() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/verifications?status=pending");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        setIsAdmin(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setVerifications(data.verifications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function openPreview(id: string) {
    try {
      const res = await fetch(`/api/admin/verifications/${id}/preview`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load preview");
      setPreviewUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preview");
    }
  }

  async function handleReview(id: string, action: "approve" | "reject") {
    setActioning(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/verifications/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPreviewUrl(null);
      // Refresh list immediately without full reload
      await loadVerifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process review");
    } finally {
      setActioning(null);
    }
  }

  // Access denied screen for non-admins
  if (isAdmin === false) {
    return (
      <main className="relative isolate min-h-screen text-white">
        <VideoBackground />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/10 bg-white/5 p-8 text-center">
            <h1 className="mb-2 text-xl font-bold text-slate-100">Access Denied</h1>
            <p className="mb-6 text-sm text-slate-400">
              You do not have permission to access this page.
            </p>
            <Link
              href="/"
              className="inline-block rounded-xl bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
            >
              Go Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative isolate min-h-screen text-white">
      <VideoBackground />
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
          >
            ← Back
          </Link>
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">
            Verification Requests
          </h1>
          <div className="w-16" />
        </div>

        <p className="mb-6 text-sm text-slate-400">
          Manually review uploaded identity documents
        </p>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {loading || isAdmin === null ? (
          <div className="rounded-2xl border border-slate-200/10 bg-white/5 p-8 text-center">
            <p className="text-sm text-slate-400">Loading...</p>
          </div>
        ) : verifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/10 bg-white/5 p-12 text-center">
            <p className="text-lg font-medium text-slate-200">No pending verifications 🎉</p>
            <p className="mt-2 text-sm text-slate-400">
              All verification requests have been reviewed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {verifications.map((v) => (
              <div
                key={v.id}
                className="rounded-2xl border border-slate-200/10 bg-white/5 p-4 shadow-sm"
              >
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-slate-100">
                      {v.user_email || v.user_name || "Unknown User"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {v.user_email && v.user_name && `${v.user_name} • `}
                      {v.document_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Submitted {new Date(v.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="self-start rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-300">
                    Pending
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openPreview(v.id)}
                    className="min-h-[44px] flex-1 rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 sm:flex-initial"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview(v.id, "approve")}
                    disabled={actioning === v.id}
                    className="min-h-[44px] flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-initial"
                  >
                    {actioning === v.id ? "Processing..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview(v.id, "reject")}
                    disabled={actioning === v.id}
                    className="min-h-[44px] flex-1 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-initial"
                  >
                    {actioning === v.id ? "Processing..." : "Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Document preview modal - supports images and PDFs */}
        {previewUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setPreviewUrl(null)}
          >
            <div
              className="relative max-h-[90vh] max-w-2xl overflow-auto rounded-2xl bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              {/* iframe works for both images and PDFs */}
              <iframe
                src={previewUrl}
                title="Document preview"
                className="h-[80vh] w-full"
              />
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block rounded-xl bg-slate-700 px-4 py-2 text-center text-sm font-medium text-slate-200"
              >
                Open in new tab
              </a>
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="absolute right-2 top-2 rounded-full bg-slate-800 p-2 text-slate-300 hover:bg-slate-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
