"use client";

/**
 * Driver: Wrapper that captures driver location using Google Places Autocomplete,
 * then shows RealtimeRideList. Driver location is required for the 8 km distance filter (Haversine).
 */

import { useEffect, useRef, useState } from "react";
import RealtimeRideList from "./RealtimeRideList";

type Prediction = { placeId: string; text: string };

async function fetchPredictions(input: string): Promise<Prediction[]> {
  try {
    const res = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Failed to fetch places" }));
      throw new Error(errorData.error || "Failed to fetch places");
    }

    const json = await res.json().catch(() => ({ predictions: [] }));
    return json.predictions ?? [];
  } catch (error) {
    console.error("Error fetching predictions:", error);
    return [];
  }
}

async function fetchPlaceDetails(placeId: string): Promise<{
  placeId: string;
  placeName: string;
  lat: number;
  lng: number;
}> {
  try {
    const res = await fetch("/api/places/details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Failed to fetch place details" }));
      throw new Error(errorData.error || "Failed to fetch place details");
    }

    const json = await res.json().catch(() => {
      throw new Error("Invalid response from server");
    });

    if (json.error) throw new Error(json.error);
    if (!json.lat || !json.lng) {
      throw new Error("Place location data is incomplete");
    }

    return json;
  } catch (error) {
    console.error("Error fetching place details:", error);
    throw error;
  }
}

function LocationIcon() {
  return (
    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function DriverRealtimeView() {
  const [driverLat, setDriverLat] = useState<number | null>(null);
  const [driverLng, setDriverLng] = useState<number | null>(null);
  const [locationName, setLocationName] = useState("");
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingPlaceDetails, setIsLoadingPlaceDetails] = useState(false);
  
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLDivElement | null>(null);

  // Fetch autocomplete suggestions when typing
  useEffect(() => {
    if (!isActive) return;

    const query = locationName.trim();

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        const preds = await fetchPredictions(query);
        setSuggestions(preds);
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [isActive, locationName]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!inputRef.current?.contains(event.target as Node)) {
        setIsActive(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePickSuggestion = async (prediction: Prediction) => {
    setIsLoadingPlaceDetails(true);
    setError(null);
    
    try {
      const details = await fetchPlaceDetails(prediction.placeId);
      setLocationName(details.placeName);
      setDriverLat(details.lat);
      setDriverLng(details.lng);
      setSuggestions([]);
      setIsActive(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load place details");
    } finally {
      setIsLoadingPlaceDetails(false);
    }
  };

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    
    setIsLoadingPlaceDetails(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          // Use Google Geocoding API to get place name
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
          if (apiKey) {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
            );
            const data = await res.json();
            const placeName = data.results?.[0]?.formatted_address || `My Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            setLocationName(placeName);
          } else {
            setLocationName(`My Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          }
          
          setDriverLat(lat);
          setDriverLng(lng);
        } catch (err) {
          setError("Could not get location name");
        } finally {
          setIsLoadingPlaceDetails(false);
        }
      },
      () => {
        setError("Could not get location");
        setIsLoadingPlaceDetails(false);
      }
    );
  };

  const hasLocation = driverLat != null && driverLng != null;

  return (
    <div className="space-y-4">
      {!hasLocation ? (
        <div className="rounded-2xl border border-slate-200/10 bg-white/5 p-4">
          <p className="mb-3 text-sm font-medium text-slate-300">
            Enter your location to see nearby rides
          </p>
          <div className="relative" ref={inputRef}>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/10 bg-white/5 p-3">
              <LocationIcon />
              <div className="flex-1">
                <input
                  type="text"
                  value={locationName}
                  onFocus={() => setIsActive(true)}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Your current location"
                  className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none"
                  disabled={isLoadingPlaceDetails}
                  autoComplete="off"
                />
              </div>
            </div>
            {isActive && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 z-30 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-600/80 bg-slate-900 shadow-2xl">
                {suggestions.slice(0, 6).map((p) => (
                  <button
                    type="button"
                    key={p.placeId}
                    onClick={() => void handlePickSuggestion(p)}
                    className="block w-full truncate border-b border-slate-800 px-3 py-2.5 text-left text-sm text-slate-100 transition last:border-b-0 hover:bg-slate-800"
                  >
                    {p.text}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-3">
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLoadingPlaceDetails}
              className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
            >
              {isLoadingPlaceDetails ? "Loading..." : "Use my location"}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-rose-400">{error}</p>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/10 bg-white/5 px-4 py-2">
            <span className="text-sm text-slate-400">
              Your location: {locationName || `${driverLat.toFixed(4)}, ${driverLng.toFixed(4)}`}
            </span>
            <button
              type="button"
              onClick={() => {
                setDriverLat(null);
                setDriverLng(null);
                setLocationName("");
              }}
              className="text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Change
            </button>
          </div>
          <RealtimeRideList driverLat={driverLat} driverLng={driverLng} />
        </>
      )}
    </div>
  );
}
