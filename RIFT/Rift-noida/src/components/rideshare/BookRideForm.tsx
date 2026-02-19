"use client";

/**
 * Passenger: Book Ride form with Google Places Autocomplete.
 * Users select places from autocomplete → we fetch lat/lng from place ID.
 * On "Book Ride" → insert into ride_bookings with status = 'waiting'.
 * Stores both place names (for display) and lat/lng (for distance calculations).
 */

import { useEffect, useRef, useState } from "react";

type Prediction = { placeId: string; text: string };

async function fetchPredictions(input: string): Promise<Prediction[]> {
  const res = await fetch("/api/places", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  const json = await res.json();
  return json.predictions ?? [];
}

async function fetchPlaceDetails(placeId: string): Promise<{
  placeId: string;
  placeName: string;
  lat: number;
  lng: number;
}> {
  const res = await fetch("/api/places/details", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ placeId }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

type BookRideFormProps = {
  passengerId: string;
  onBookRide: (input: {
    originLat: number;
    originLng: number;
    destinationLat: number;
    destinationLng: number;
    pickupPlaceName?: string | null;
    destinationPlaceName?: string | null;
  }) => Promise<void>;
  isBusy: boolean;
};

function LocationIcon() {
  return (
    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  );
}

export default function BookRideForm({
  passengerId,
  onBookRide,
  isBusy,
}: BookRideFormProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originPlaceId, setOriginPlaceId] = useState<string | null>(null);
  const [destinationPlaceId, setDestinationPlaceId] = useState<string | null>(null);
  const [originPlaceName, setOriginPlaceName] = useState<string | null>(null);
  const [destinationPlaceName, setDestinationPlaceName] = useState<string | null>(null);
  
  const [originSuggestions, setOriginSuggestions] = useState<Prediction[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<Prediction[]>([]);
  const [activeField, setActiveField] = useState<"origin" | "destination" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingPlaceDetails, setIsLoadingPlaceDetails] = useState(false);
  
  const debounceRef = useRef<number | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Fetch autocomplete suggestions when typing
  useEffect(() => {
    if (!activeField) return;

    const value = activeField === "origin" ? origin : destination;
    const query = value.trim();

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    if (query.length < 3) {
      if (activeField === "origin") setOriginSuggestions([]);
      if (activeField === "destination") setDestinationSuggestions([]);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        const preds = await fetchPredictions(query);
        if (activeField === "origin") setOriginSuggestions(preds);
        if (activeField === "destination") setDestinationSuggestions(preds);
      } catch {
        if (activeField === "origin") setOriginSuggestions([]);
        if (activeField === "destination") setDestinationSuggestions([]);
      }
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [activeField, origin, destination]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!formRef.current?.contains(event.target as Node)) {
        setActiveField(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePickSuggestion = async (prediction: Prediction, field: "origin" | "destination") => {
    setIsLoadingPlaceDetails(true);
    setError(null);
    
    try {
      const details = await fetchPlaceDetails(prediction.placeId);
      
      if (field === "origin") {
        setOrigin(details.placeName);
        setOriginPlaceId(details.placeId);
        setOriginPlaceName(details.placeName);
        setOriginSuggestions([]);
      } else {
        setDestination(details.placeName);
        setDestinationPlaceId(details.placeId);
        setDestinationPlaceName(details.placeName);
        setDestinationSuggestions([]);
      }
      
      setActiveField(null);
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
          // Reverse geocode to get place name
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          // Use Google Geocoding API to get place name
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
          if (apiKey) {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
            );
            const data = await res.json();
            const placeName = data.results?.[0]?.formatted_address || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            setOrigin(placeName);
            setOriginPlaceName(placeName);
          } else {
            setOrigin(`My Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
            setOriginPlaceName(`My Location`);
          }
          
          // Store coordinates (we'll use these directly)
          setOriginPlaceId(`manual_${lat}_${lng}`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!originPlaceId || !destinationPlaceId) {
      setError("Please select both pickup and destination locations");
      return;
    }

    setIsLoadingPlaceDetails(true);

    try {
      let originLat: number, originLng: number, destLat: number, destLng: number;

      // If manual location (from geolocation), extract from placeId
      if (originPlaceId.startsWith("manual_")) {
        const [_, lat, lng] = originPlaceId.split("_");
        originLat = parseFloat(lat);
        originLng = parseFloat(lng);
      } else {
        const originDetails = await fetchPlaceDetails(originPlaceId);
        originLat = originDetails.lat;
        originLng = originDetails.lng;
      }

      const destDetails = await fetchPlaceDetails(destinationPlaceId);
      destLat = destDetails.lat;
      destLng = destDetails.lng;

      await onBookRide({
        originLat,
        originLng,
        destinationLat: destLat,
        destinationLng: destLng,
        pickupPlaceName: originPlaceName,
        destinationPlaceName: destinationPlaceName,
      });

      // Reset form
      setOrigin("");
      setDestination("");
      setOriginPlaceId(null);
      setDestinationPlaceId(null);
      setOriginPlaceName(null);
      setDestinationPlaceName(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book ride");
    } finally {
      setIsLoadingPlaceDetails(false);
    }
  };

  const isValid = originPlaceId && destinationPlaceId && !isBusy && !isLoadingPlaceDetails;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Book a Ride</h2>
        <p className="mt-1 text-sm text-slate-400">
          Enter pickup and destination locations
        </p>
      </div>

      {/* Origin with Autocomplete */}
      <div className="relative">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/10 bg-white/5 p-4">
          <LocationIcon />
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-slate-400">Pickup</span>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLoadingPlaceDetails}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
              >
                Use my location
              </button>
            </div>
            <input
              type="text"
              value={origin}
              onFocus={() => setActiveField("origin")}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Pickup location"
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none"
              disabled={isBusy || isLoadingPlaceDetails}
              autoComplete="off"
            />
          </div>
        </div>
        {activeField === "origin" && originSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 z-30 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-600/80 bg-slate-900 shadow-2xl">
            {originSuggestions.slice(0, 6).map((p) => (
              <button
                type="button"
                key={p.placeId}
                onClick={() => void handlePickSuggestion(p, "origin")}
                className="block w-full truncate border-b border-slate-800 px-3 py-2.5 text-left text-sm text-slate-100 transition last:border-b-0 hover:bg-slate-800"
              >
                {p.text}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Destination with Autocomplete */}
      <div className="relative">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/10 bg-white/5 p-4">
          <FlagIcon />
          <div className="flex-1">
            <span className="text-xs text-slate-400">Destination</span>
            <input
              type="text"
              value={destination}
              onFocus={() => setActiveField("destination")}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Drop location"
              className="mt-1 w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none"
              disabled={isBusy || isLoadingPlaceDetails}
              autoComplete="off"
            />
          </div>
        </div>
        {activeField === "destination" && destinationSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 z-30 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-600/80 bg-slate-900 shadow-2xl">
            {destinationSuggestions.slice(0, 6).map((p) => (
              <button
                type="button"
                key={p.placeId}
                onClick={() => void handlePickSuggestion(p, "destination")}
                className="block w-full truncate border-b border-slate-800 px-3 py-2.5 text-left text-sm text-slate-100 transition last:border-b-0 hover:bg-slate-800"
              >
                {p.text}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!isValid}
        className="w-full rounded-2xl bg-emerald-500 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isBusy || isLoadingPlaceDetails ? "Processing…" : "Book Ride"}
      </button>
    </form>
  );
}
