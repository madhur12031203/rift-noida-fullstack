"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace("/");
      } else {
        setIsChecking(false);
      }
    });
  }, [router]);

  if (isChecking) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6">
        <div className="text-sm text-slate-400">Loading...</div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-slate-700/50 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-sm">
        <h1 className="text-center text-3xl font-bold text-slate-100">Welcome to Campus Ride</h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          Choose how you want to use the app today.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/login/driver"
            className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-5 transition hover:bg-cyan-500/20"
          >
            <p className="text-lg font-semibold text-cyan-100">Login as Driver</p>
            <p className="mt-1 text-sm text-cyan-200/80">
              Accept nearby passenger requests or publish your own route.
            </p>
          </Link>
          <Link
            href="/login/passenger"
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 transition hover:bg-emerald-500/20"
          >
            <p className="text-lg font-semibold text-emerald-100">Login as Passenger</p>
            <p className="mt-1 text-sm text-emerald-200/80">
              Request rides, book listed trips, and pay through escrow.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
