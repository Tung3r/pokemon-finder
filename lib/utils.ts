export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatGap(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${formatPrice(value)}`;
}

export function confidenceDots(score: number): number {
  if (score >= 8) return 5;
  if (score >= 6) return 4;
  if (score >= 4) return 3;
  if (score >= 2) return 2;
  return 1;
}

export function getUniqueValues<T>(
  items: T[],
  key: keyof T
): string[] {
  const values = new Set(items.map((item) => String(item[key])));
  return Array.from(values).sort();
}
