import { getValuationLabel, getValuationColor, getValuationBgColor } from "@/lib/model";
import { formatPercent } from "@/lib/utils";

export default function ValuationBadge({
  gapPercent,
  confidence,
  size = "md",
}: {
  gapPercent: number;
  confidence: number;
  size?: "sm" | "md" | "lg";
}) {
  const label = getValuationLabel(gapPercent, confidence);
  const textColor = getValuationColor(gapPercent, confidence);
  const bgColor = getValuationBgColor(gapPercent, confidence);

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-medium ${bgColor} ${textColor} ${sizeClasses[size]}`}
    >
      {gapPercent > 0 ? "\u25B2" : gapPercent < 0 ? "\u25BC" : "\u25C6"}{" "}
      {formatPercent(gapPercent)}
    </span>
  );
}
