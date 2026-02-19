"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensureUserProfile } from "@/lib/supabase/rideshare";
import RatingStars from "@/components/ui/RatingStars";
import VideoBackground from "@/components/VideoBackground";
import VerificationSection from "@/components/verification/VerificationSection";
import type { UserProfileRow } from "@/types";

type RatingRow = {
  id: string;
  rating: number;
  comment: string | null;
  from_user_id: string;
  created_at: string;
  from_user: {
    name: string | null;
  } | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [verifications, setVerifications] = useState<{ status: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authUser, setAuthUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      setAuthUser(data.user);
      loadProfile(data.user.id);
    });
  }, [router]);

  async function loadProfile(userId: string) {
    try {
      const supabase = createClient();
      const userProfile = await ensureUserProfile();
      setProfile(userProfile);

      // Fetch ratings received by this user
      const { data: ratingsData } = await supabase
        .from("ratings")
        .select(
          `
          id,
          rating,
          comment,
          from_user_id,
          created_at,
          from_user:users!ratings_from_user_id_fkey(name)
        `
        )
        .eq("to_user_id", userId)
        .order("created_at", { ascending: false });

      type RawRating = {
        id: string;
        rating: number;
        comment: string | null;
        from_user_id: string;
        created_at: string;
        from_user: { name: string | null }[] | { name: string | null } | null;
      };
      const normalizedRatings: RatingRow[] = (ratingsData as RawRating[] | null | undefined ?? []).map((row) => ({
        id: row.id,
        rating: row.rating,
        comment: row.comment,
        from_user_id: row.from_user_id,
        created_at: row.created_at,
        from_user: Array.isArray(row.from_user)
          ? (row.from_user[0] ?? null)
          : row.from_user,
      }));
      setRatings(normalizedRatings);

      const { data: verificationsData } = await supabase
        .from("user_verifications")
        .select("status")
        .eq("user_id", userId);
      setVerifications(verificationsData || []);
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusLabel = () => {
    const count = profile?.rating_count ?? 0;
    if (count === 0) return "Newcomer";
    if (count < 5) return "Getting Started";
    if (count < 20) return "Experienced";
    return "Trusted Member";
  };

  const govtIdVerified = verifications.some((v) => v.status === "verified");

  const getProfileCompletion = () => {
    let completed = 0;
    const total = 6;

    if (profile?.name) completed++;
    if (profile?.role) completed++;
    if (profile?.wallet_address) completed++;
    if (authUser?.email) completed++;
    if (profile?.rating_count && profile.rating_count > 0) completed++;
    if (govtIdVerified) completed++;

    return { completed, total };
  };

  const completion = getProfileCompletion();

  if (isLoading) {
    return (
      <main className="relative isolate min-h-screen text-white">
        <VideoBackground />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <p className="text-sm text-slate-300">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <main className="relative isolate min-h-screen text-white">
      <VideoBackground />
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-slate-600 bg-slate-800/50 p-2 text-slate-300 transition hover:bg-slate-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">Profile</h1>
          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* User Info Section */}
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-slate-200/10 bg-white/5 p-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-slate-700/50 text-2xl font-bold text-slate-300">
            {profile.name ? profile.name[0].toUpperCase() : "U"}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-100">{profile.name || "User"}</h2>
            <p className="mt-1 text-sm text-slate-400">{getStatusLabel()}</p>
            <div className="mt-2 flex items-center gap-2">
              <RatingStars rating={profile.rating_avg ?? 0} size="sm" showValue />
              <span className="text-xs text-slate-400">
                ({profile.rating_count ?? 0} {profile.rating_count === 1 ? "review" : "reviews"})
              </span>
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl border border-slate-600 bg-slate-800/50 p-2 text-slate-300 transition hover:bg-slate-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Complete Your Profile Section */}
        {completion.completed < completion.total && (
          <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-100">Complete your profile</h3>
            <p className="mb-3 text-xs text-slate-400">
              This helps build trust, encouraging members to travel with you.
            </p>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs text-slate-300">
                {completion.completed} out of {completion.total} complete
              </span>
            </div>
            <div className="mb-3 flex gap-1">
              {Array.from({ length: completion.total }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded ${
                    i < completion.completed ? "bg-blue-500" : "bg-slate-700/50"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              className="text-xs font-medium text-blue-400 transition hover:text-blue-300"
            >
              Add profile picture
            </button>
          </div>
        )}

        {/* Edit Personal Details */}
        <div className="mb-6">
          <button
            type="button"
            className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
          >
            Edit personal details
          </button>
        </div>

        {/* Govt ID Verified Badge */}
        {govtIdVerified && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-emerald-300">Govt ID Verified</p>
          </div>
        )}

        {/* Verify Your Profile */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-slate-100">Verify your profile</h3>
          <VerificationSection />
          <div className="mt-3 space-y-3">

            {/* Confirm Email - separate from ID verification */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/10 bg-white/5 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-100">Confirm email</p>
                {authUser?.email && (
                  <p className="text-xs text-slate-400">{authUser.email}</p>
                )}
              </div>
            </div>

            {/* Phone Verification */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/10 bg-white/5 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-100">Phone Number Verification</p>
                <p className="text-xs text-slate-400">Not verified</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {ratings.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-100">
              Reviews ({ratings.length})
            </h3>
            <div className="space-y-3">
              {ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="rounded-xl border border-slate-200/10 bg-white/5 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700/50 text-xs font-semibold text-slate-300">
                        {rating.from_user?.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <span className="text-sm font-medium text-slate-100">
                        {rating.from_user?.name || "Anonymous"}
                      </span>
                    </div>
                    <RatingStars rating={rating.rating} size="sm" />
                  </div>
                  {rating.comment && (
                    <p className="mt-2 text-sm text-slate-300">{rating.comment}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">
                    {new Date(rating.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Role Badge */}
        {profile.role && (
          <div className="mb-6 rounded-xl border border-slate-200/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">Role</p>
            <p className="mt-1 text-lg font-semibold capitalize text-slate-100">{profile.role}</p>
          </div>
        )}
      </div>
    </main>
  );
}
