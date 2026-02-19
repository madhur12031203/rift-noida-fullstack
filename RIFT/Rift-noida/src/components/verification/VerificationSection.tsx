"use client";

import { useEffect, useState } from "react";
import { getMyVerifications, uploadVerification } from "@/lib/supabase/verification";
import type { DocumentType, UserVerificationRow } from "@/types";

const DOCUMENT_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: "college_id", label: "College ID" },
  { value: "aadhaar", label: "Aadhaar" },
  { value: "driving_license", label: "Driving License" },
];

export default function VerificationSection() {
  const [verifications, setVerifications] = useState<UserVerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType>("college_id");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    loadVerifications();
  }, []);

  async function loadVerifications() {
    try {
      const data = await getMyVerifications();
      setVerifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      await uploadVerification(file, selectedType);
      await loadVerifications();
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const verificationByType = Object.fromEntries(
    verifications.map((v) => [v.document_type, v])
  );
  const selectedVerification = verificationByType[selectedType];
  const canUploadSelected =
    !selectedVerification || selectedVerification.status === "rejected";

  return (
    <div className="rounded-2xl border border-slate-200/10 bg-white/5 p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-100">Verify your identity</h3>
      <p className="mb-4 text-xs text-slate-400">
        This verification is manually reviewed to improve safety and trust.
      </p>

      {/* Status per document type */}
      {verifications.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {verifications.map((v) => (
            <div key={v.id} className="flex items-center gap-1.5">
              <StatusBadge status={v.status} />
              <span className="text-xs text-slate-400">
                {v.document_type.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Upload form - when selected type can be uploaded */}
      {canUploadSelected && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Document type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DocumentType)}
              className="w-full rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100"
              disabled={uploading}
            >
              {DOCUMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Upload image or PDF
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-700 file:px-4 file:py-2 file:text-sm file:text-slate-200"
              disabled={uploading}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Submit"}
          </button>
        </form>
      )}

      {selectedVerification?.status === "pending" && !canUploadSelected && (
        <p className="text-xs text-slate-400">
          Your {selectedType.replace("_", " ")} is under review. You will not be able to upload again until it is reviewed.
        </p>
      )}

      {loading && <p className="text-xs text-slate-400">Loading...</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-300">
        <span>✅</span> Verified
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-2.5 py-1 text-xs font-medium text-rose-300">
        <span>❌</span> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-300">
      <span>🟡</span> Pending review
    </span>
  );
}
