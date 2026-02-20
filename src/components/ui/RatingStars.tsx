"use client";

type RatingStarsProps = {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
};

export default function RatingStars({
  rating,
  size = "md",
  showValue = false,
  className = "",
}: RatingStarsProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <StarIcon key={`full-${i}`} className={`${sizeClasses[size]} text-amber-400`} filled />
      ))}
      {hasHalfStar && (
        <StarIcon className={`${sizeClasses[size]} text-amber-400`} filled={false} half />
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <StarIcon key={`empty-${i}`} className={`${sizeClasses[size]} text-slate-600`} filled={false} />
      ))}
      {showValue && <span className="ml-1 text-xs text-slate-400">{rating.toFixed(1)}</span>}
    </div>
  );
}

function StarIcon({
  className,
  filled,
  half = false,
}: {
  className: string;
  filled: boolean;
  half?: boolean;
}) {
  if (half) {
    return (
      <svg className={className} viewBox="0 0 20 20" fill="currentColor">
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
          fill="url(#half)"
        />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={filled ? 0 : 1.5}
        d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
      />
    </svg>
  );
}
