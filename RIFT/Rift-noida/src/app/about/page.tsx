"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="relative z-0 min-h-screen bg-slate-950">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Hero */}
        <header
          className="mb-16 text-center opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}
        >
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl">
            About Fare Compare
          </h1>
          <p className="text-lg text-slate-400">
            Built to help you save on every ride.
          </p>
        </header>

        {/* What we do */}
        <section
          className="mb-14 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.25s", animationFillMode: "forwards" }}
        >
          <h2 className="mb-4 text-xl font-semibold text-slate-100">What we do</h2>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 shadow-xl backdrop-blur-sm">
            <p className="leading-relaxed text-slate-300">
              Fare Compare lets you see estimated fares from Uber, Ola, and Rapido in one place. Enter your pickup and drop locations, hit Compare Prices, and get side-by-side results so you can choose the best option for your trip—without opening multiple apps.
            </p>
          </div>
        </section>

        {/* Developer */}
        <section
          className="mb-14 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
        >
          <h2 className="mb-4 text-xl font-semibold text-slate-100">About the developer</h2>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 shadow-xl backdrop-blur-sm">
            <p className="leading-relaxed text-slate-300">
              This project was built as a practical tool for comparing ride-hailing fares. The stack includes Next.js, TypeScript, Tailwind CSS, and Supabase for authentication—focused on a clean, fast experience so you can compare and book with confidence.
            </p>
          </div>
        </section>

        {/* CTA */}
        <footer
          className="text-center opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.65s", animationFillMode: "forwards" }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-900 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 hover:shadow-emerald-500/30"
          >
            Back to Compare
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </footer>
      </div>
    </main>
  );
}
