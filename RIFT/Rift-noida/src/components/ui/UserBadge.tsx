"use client";

import RatingStars from "./RatingStars";

type UserBadgeProps = {
  name?: string;
  rating?: number;
  ratingCount?: number;
  className?: string;
};

export default function UserBadge({ name, rating, ratingCount, className = "" }: UserBadgeProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700/50 text-sm font-semibold text-slate-300">
        {name ? name[0].toUpperCase() : "U"}
      </div>
      <div className="flex-1">
        {name && <p className="text-sm font-medium text-slate-100">{name}</p>}
        {rating !== undefined && (
          <div className="flex items-center gap-1.5">
            <RatingStars rating={rating} size="sm" />
            {ratingCount !== undefined && ratingCount > 0 && (
              <span className="text-xs text-slate-400">({ratingCount})</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
