"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type AuthFormProps = {
  role: "driver" | "passenger";
  title: string;
  subtitle: string;
  accentClass: string;
};

export default function AuthForm({ role, title, subtitle, accentClass }: AuthFormProps) {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getErrorMessage(err: unknown, fallback: string): string {
    return err instanceof Error ? err.message : fallback;
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?role=${role}`;

      if (isSignUp) {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              full_name: name || email.split("@")[0],
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Create user profile with role
          await supabase.from("users").upsert({
            id: data.user.id,
            name: name || email.split("@")[0],
            role,
          });

          // Check if email confirmation is required
          if (data.session) {
            // Session exists, redirect immediately
            router.push(redirectTo);
          } else {
            // Email confirmation required
            setError("Please check your email to confirm your account before signing in.");
          }
        }
      } else {
        // Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        router.push(redirectTo);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Authentication failed. Please try again."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleAuth() {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?role=${role}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/80 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
      <div className={`mb-4 h-1.5 w-14 rounded-full ${accentClass}`} />
      <h2 className="text-xl font-semibold text-slate-100 sm:text-2xl">{title}</h2>
      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>

      {/* Toggle between Sign Up and Sign In */}
      <div className="mt-6 flex gap-2 rounded-xl border border-slate-600/50 bg-slate-900/50 p-1">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(false);
            setError(null);
          }}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            !isSignUp
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setIsSignUp(true);
            setError(null);
          }}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            isSignUp
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleEmailAuth} className="mt-6 space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-300">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-3 text-sm text-slate-100 placeholder-slate-400 outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
              required={isSignUp}
              disabled={isLoading}
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-3 text-sm text-slate-100 placeholder-slate-400 outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block text-xs font-medium text-slate-300">
              Password
            </label>
            {!isSignUp && (
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    setError("Please enter your email first");
                    return;
                  }
                  try {
                    const supabase = createClient();
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/auth/reset-password`,
                    });
                    if (error) throw error;
                    setError(null);
                    alert("Password reset email sent! Check your inbox.");
                  } catch (err: unknown) {
                    setError(getErrorMessage(err, "Failed to send reset email"));
                  }
                }}
                className="text-xs text-blue-400 transition hover:text-blue-300"
              >
                Forgot password?
              </button>
            )}
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignUp ? "Create a password (min. 6 characters)" : "Enter your password"}
            className="w-full rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-3 text-sm text-slate-100 placeholder-slate-400 outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            required
            minLength={6}
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading
            ? "Processing..."
            : isSignUp
              ? "Create Account"
              : "Sign In"}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-700" />
        <span className="text-xs text-slate-500">OR</span>
        <div className="h-px flex-1 bg-slate-700" />
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleAuth}
        className="w-full rounded-xl border border-slate-600 bg-slate-900/50 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
      >
        <div className="flex items-center justify-center gap-2">
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </div>
      </button>

      {isSignUp && (
        <p className="mt-4 text-center text-xs text-slate-400">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      )}
    </div>
  );
}
