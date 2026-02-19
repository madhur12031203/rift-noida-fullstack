"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import RatingStars from "@/components/ui/RatingStars";
import VideoBackground from "@/components/VideoBackground";
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

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadProfile(userId);
    }
  }, [userId]);

  async function loadProfile(targetUserId: string) {
    try {
      const supabase = createClient();
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("id,name,role,wallet_address,rating_avg,rating_count")
        .eq("id", targetUserId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData as UserProfileRow);

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
        .eq("to_user_id", targetUserId)
        .order("created_at", { ascending: false });

      setRatings(ratingsData || []);
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
    return (
      <main className="relative isolate min-h-screen text-white">
        <VideoBackground />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <p className="text-sm text-slate-300">Profile not found</p>
        </div>
      </main>
    );
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
        </div>

        {/* Role Badge */}
        {profile.role && (
          <div className="mb-6 rounded-xl border border-slate-200/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">Role</p>
            <p className="mt-1 text-lg font-semibold capitalize text-slate-100">{profile.role}</p>
          </div>
        )}

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

        {ratings.length === 0 && (
          <div className="rounded-xl border border-slate-200/10 bg-white/5 p-6 text-center">
            <p className="text-sm text-slate-400">No reviews yet</p>
          </div>
        )}
      </div>
    </main>
  );
}
