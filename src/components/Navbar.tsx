"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type User = {
  email?: string;
  user_metadata?: { full_name?: string };
};

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      if (data.user) {
        try {
          const res = await fetch("/api/admin/verify");
          const json = await res.json();
          setIsAdmin(json.isAdmin === true);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        try {
          const res = await fetch("/api/admin/verify");
          const json = await res.json();
          setIsAdmin(json.isAdmin === true);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getInitial = () => {
    if (!user) return "?";
    const name = user.user_metadata?.full_name as string | undefined;
    if (name?.trim()) return name.trim()[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return "U";
  };

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav className="relative z-10 border-b border-slate-700/50 bg-slate-900/80 px-4 py-3 shadow-lg backdrop-blur-sm sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
          </div>
          <span className="text-xl font-bold text-slate-100">Campus Ride</span>
        </Link>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-slate-700/50" />
          ) : user ? (
            <div className="relative flex items-center gap-3" ref={menuRef}>
              <Link href="/about" className="hidden text-sm font-medium text-slate-400 transition hover:text-slate-200 sm:block">
                About
              </Link>
              {isAdmin && (
                <Link href="/admin/verifications" className="hidden text-sm font-medium text-amber-400 transition hover:text-amber-300 sm:block">
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/30"
                title={user.email ?? "User"}
                aria-label="User menu"
                aria-expanded={menuOpen}
              >
                {getInitial()}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 min-w-[160px] rounded-xl border border-slate-700/50 bg-slate-900/95 py-1 shadow-xl backdrop-blur-sm">
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-200 transition hover:bg-slate-800 hover:text-white"
                  >
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void handleSignOut();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-200 transition hover:bg-slate-800 hover:text-white"
                  >
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-4 text-sm font-medium text-slate-400">
              <Link href="/login/driver" className="transition hover:text-cyan-300">
                Driver
              </Link>
              <Link href="/login/passenger" className="transition hover:text-emerald-400">
                Passenger
              </Link>
              <Link href="/about" className="transition hover:text-slate-200">
                About
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
