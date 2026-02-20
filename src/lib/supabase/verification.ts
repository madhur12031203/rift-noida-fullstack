/**
 * Verification helpers: upload, fetch status, and document path utilities.
 * All verification is manual review - no OCR, ML, or external APIs.
 */

import { createClient } from "@/lib/supabase/client";
import type { DocumentType, UserVerificationRow } from "@/types";

const BUCKET = "verification-documents";

/** Get document path for storage: user_id/document_type_timestamp.ext */
export function getDocumentPath(
  userId: string,
  documentType: DocumentType,
  ext: string
): string {
  const timestamp = Date.now();
  return `${userId}/${documentType}_${timestamp}.${ext}`;
}

/** Fetch current user's verifications */
export async function getMyVerifications(): Promise<UserVerificationRow[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_verifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as UserVerificationRow[];
}

/** Upload document and create/update verification record */
export async function uploadVerification(
  file: File,
  documentType: DocumentType
): Promise<UserVerificationRow> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check existing: block re-upload if pending
  const { data: existing } = await supabase
    .from("user_verifications")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("document_type", documentType)
    .single();

  if (existing?.status === "pending") {
    throw new Error("Your document is under review. Please wait for the result.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = getDocumentPath(user.id, documentType, ext);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  const documentUrl = path;

  if (existing?.status === "rejected") {
    const { data: updated, error: updateError } = await supabase
      .from("user_verifications")
      .update({
        document_url: documentUrl,
        status: "pending",
        reviewed_at: null,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updated as UserVerificationRow;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("user_verifications")
    .insert({
      user_id: user.id,
      document_type: documentType,
      document_url: documentUrl,
      status: "pending",
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return inserted as UserVerificationRow;
}
