"use client";

import { createClient } from "@/lib/supabase/client";

type RoleLoginCardProps = {
  role: "driver" | "passenger";
  title: string;
  subtitle: string;
  accentClass: string;
};

export default function RoleLoginCard({
  role,
  title,
  subtitle,
  accentClass,
}: RoleLoginCardProps) {
  async function handleSignIn() {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?role=${role}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/80 p-6 shadow-2xl backdrop-blur-sm">
      <div className={`mb-4 h-1.5 w-14 rounded-full ${accentClass}`} />
      <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      <button
        type="button"
        onClick={handleSignIn}
        className="mt-5 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
      >
        Continue with Google
      </button>
    </div>
  );
}

