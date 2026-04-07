import { confidenceDots } from "@/lib/utils";

export default function ConfidenceDots({
  score,
  showLabel = false,
}: {
  score: number;
  showLabel?: boolean;
}) {
  const filled = confidenceDots(score);

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i <= filled ? "bg-amber-400" : "bg-slate-700"
            }`}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-xs text-slate-500 ml-1">
          {score.toFixed(1)}
        </span>
      )}
    </div>
  );
}
