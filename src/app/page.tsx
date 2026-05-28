"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BestDealCard from "@/components/BestDealCard";
import ChatWidget from "@/components/ChatWidget";
import LocationForm from "@/components/LocationForm";
import ResultCard from "@/components/ResultCard";
import VideoBackground from "@/components/VideoBackground";
import WalletPanel from "@/components/WalletPanel";
import CoreRideSharePanel from "@/components/rideshare/CoreRideSharePanel";
import { createClient } from "@/lib/supabase/client";
import type { FareResult, LocationInput } from "@/types";

type CompareApiResponse = {
  results: FareResult[];
};

export default function Home() {
  const router = useRouter();
  const [results, setResults] = useState<FareResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const appAddress = process.env.NEXT_PUBLIC_RIDE_ESCROW_APP_ADDRESS ?? "";

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      setIsSignedIn(Boolean(data.user));
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session?.user));
    });

    return () => subscription.unsubscribe();
  }, []);

  const bestDeal =
    results.length > 0
      ? results.reduce((min, result) => (result.price < min.price ? result : min))
      : null;

  async function handleCompare(data: LocationInput) {
    setIsLoading(true);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json: CompareApiResponse = await res.json();

      if (!res.ok) {
        console.error("Compare API failed:", res.status, json);
        return;
      }

      if (json.results?.length) {
        setResults(json.results);

        const cheapest = json.results.reduce((min: FareResult, result: FareResult) =>
          result.price < min.price ? result : min
        );
        setSelectedProvider(cheapest.provider);
      }
    } catch (error) {
      console.error("Compare failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isAuthLoading) {
    return (
      <main className="relative isolate min-h-screen text-white">
        <VideoBackground />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
          <div className="w-full rounded-2xl border border-slate-200/10 bg-white/5 p-8 text-center backdrop-blur-sm">
            <p className="text-sm text-slate-300">Loading your campus ride dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    router.replace("/login");
    return (
      <main className="relative isolate min-h-screen text-white">
        <VideoBackground />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
          <div className="w-full rounded-2xl border border-slate-200/10 bg-white/5 p-8 text-center backdrop-blur-sm">
            <p className="text-sm text-slate-300">Redirecting to login...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative isolate min-h-screen text-white">
      <VideoBackground />
      <ChatWidget />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header Section */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">Campus Ride</h1>
          <p className="mt-1 text-sm text-slate-400 sm:text-base">
            Book rides, compare fares, and manage your trips
          </p>
        </header>

        {/* Wallet Panel */}
        <div className="mb-6">
          <WalletPanel onAddressChange={setWalletAddress} />
        </div>

        {/* Core Realtime Ride Booking: Passenger books → Driver sees instantly */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-100 sm:text-xl">
            Realtime Ride Booking
          </h2>
          <CoreRideSharePanel walletAddress={walletAddress} appAddress={appAddress} />
        </div>

        {/* Fare Comparison Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-100 sm:text-xl">Compare Fares</h2>
          <div className="mb-6">
            <LocationForm onSubmit={handleCompare} isLoading={isLoading} />
          </div>

          {bestDeal && (
            <div className="mb-6">
              <BestDealCard result={bestDeal} />
            </div>
          )}

          {results.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((result) => (
                <ResultCard
                  key={result.provider}
                  result={result}
                  isBestDeal={bestDeal?.provider === result.provider}
                  isSelected={selectedProvider === result.provider}
                  onSelect={() => setSelectedProvider(result.provider)}
                />
              ))}
            </div>
          )}

          {results.length === 0 && !isLoading && (
            <div className="rounded-2xl border border-slate-200/10 bg-white/5 p-6 text-center">
              <p className="text-sm text-slate-400">
                Enter pickup and drop locations, then click <span className="font-semibold text-slate-300">Compare Prices</span>.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
