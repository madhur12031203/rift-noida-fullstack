"use client";

import Image from "next/image";
import type { FareResult } from "@/types";

interface ResultCardProps {
  result: FareResult;
  isBestDeal?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width={18} height={18}>
      <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
    </svg>
  );
}

export default function ResultCard({ result, isBestDeal, isSelected, onSelect }: ResultCardProps) {
  const iconPath = result.icon ? `/icons/${result.icon}` : null;
  const isHighlight = isBestDeal || isSelected;
  const cardBg = isHighlight
    ? "bg-slate-800/80 border-amber-500/50 shadow-lg shadow-amber-500/10"
    : "bg-slate-800/60 border-slate-600/50";

  return (
    <div
      className={`flex flex-col rounded-xl border-2 p-5 shadow-lg backdrop-blur-sm transition ${cardBg}`}
    >
      <div className="mb-3 flex items-center gap-2">
        {iconPath ? (
          <div className="relative h-12 w-12 overflow-hidden rounded-full bg-slate-700/80 ring-2 ring-slate-600/50">
            <Image
              src={iconPath}
              alt={result.provider}
              width={48}
              height={48}
              className="object-contain p-1"
              unoptimized
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
            />
            <span
              className="absolute inset-0 hidden items-center justify-center text-lg font-bold text-slate-400"
              style={{ display: "none" }}
            >
              {result.provider[0]}
            </span>
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700/80 text-lg font-bold text-slate-400 ring-2 ring-slate-600/50">
            {result.provider[0]}
          </div>
        )}
        <div>
          <p className="flex items-center gap-1.5 font-bold text-slate-100">
            {result.provider}
            {isBestDeal && (
              <span className="text-amber-400">
                <CrownIcon />
              </span>
            )}
          </p>
          <p className="text-sm text-slate-400">Est. Time: {result.duration.replace("~", "")}</p>
        </div>
      </div>
      <p className="mb-4 text-2xl font-bold text-slate-100">Rs {result.price}</p>
      <a
        href={result.bookingUrl || "#"}
        target="_blank"
        rel="noreferrer"
        onClick={onSelect}
        className={`mt-auto rounded-lg px-4 py-2 text-center text-sm font-semibold transition ${
          isSelected
            ? "bg-amber-400 text-slate-900 shadow-md shadow-amber-500/20"
            : isHighlight
              ? "bg-amber-500/90 text-slate-900 hover:bg-amber-400 shadow-md shadow-amber-500/20"
              : "bg-slate-700 text-slate-100 hover:bg-slate-600 ring-1 ring-slate-600"
        }`}
      >
        Book Now
      </a>
    </div>
  );
}
