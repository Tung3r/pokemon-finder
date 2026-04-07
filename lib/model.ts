import { CardValuation } from "./types";

const MODEL_ALPHA = 0.2411;
const MODEL_BETA = 0.4486;

const MVP_WEIGHTS = {
  pull_cost: 0.35,
  character_premium: 0.40,
  universal_appeal: 0.25,
};

export function computeCompositeScore(card: {
  pull_cost_score: number;
  character_premium: number;
  universal_appeal: number;
}): number {
  return (
    MVP_WEIGHTS.pull_cost * card.pull_cost_score +
    MVP_WEIGHTS.character_premium * card.character_premium +
    MVP_WEIGHTS.universal_appeal * card.universal_appeal
  );
}

export function computeModeledPrice(card: {
  pull_cost_score: number;
  character_premium: number;
  universal_appeal: number;
}): number {
  const composite = computeCompositeScore(card);
  return Math.round(Math.exp(MODEL_ALPHA + MODEL_BETA * composite) * 100) / 100;
}

export function computeValuationGap(
  modeledPrice: number,
  marketPrice: number
): { dollar: number; percent: number } {
  const dollar = Math.round((modeledPrice - marketPrice) * 100) / 100;
  const percent =
    marketPrice > 0
      ? Math.round(((modeledPrice - marketPrice) / marketPrice) * 10000) / 100
      : 0;
  return { dollar, percent };
}

export function computeConfidenceScore(card: {
  liquidity_score: number;
  volatility_score: number;
  print_cycle_score: number;
}): number {
  return Math.round(
    (0.35 * card.liquidity_score +
      0.3 * card.volatility_score +
      0.2 * card.print_cycle_score +
      0.15 * 7) *
      10
  ) / 10;
}

export function getValuationLabel(gapPercent: number, confidence: number): string {
  if (confidence < 3) return "Insufficient Data";
  if (gapPercent > 30) return "Strong Buy Signal";
  if (gapPercent > 15) return "Undervalued";
  if (gapPercent > 5) return "Slightly Undervalued";
  if (gapPercent > -5) return "Fair Value";
  if (gapPercent > -15) return "Slightly Overvalued";
  if (gapPercent > -30) return "Overvalued";
  return "Significantly Overvalued";
}

export function getValuationColor(gapPercent: number, confidence: number): string {
  if (confidence < 3) return "text-slate-500";
  if (gapPercent > 30) return "text-emerald-400";
  if (gapPercent > 15) return "text-green-400";
  if (gapPercent > 5) return "text-green-300";
  if (gapPercent > -5) return "text-slate-400";
  if (gapPercent > -15) return "text-orange-300";
  if (gapPercent > -30) return "text-red-400";
  return "text-red-500";
}

export function getValuationBgColor(gapPercent: number, confidence: number): string {
  if (confidence < 3) return "bg-slate-800";
  if (gapPercent > 30) return "bg-emerald-950";
  if (gapPercent > 15) return "bg-green-950";
  if (gapPercent > 5) return "bg-green-950/50";
  if (gapPercent > -5) return "bg-slate-800";
  if (gapPercent > -15) return "bg-orange-950/50";
  if (gapPercent > -30) return "bg-red-950";
  return "bg-red-950";
}

export function filterAndSortCards(
  cards: CardValuation[],
  filters: {
    search: string;
    set: string;
    character: string;
    rarity: string;
    priceMin: number;
    priceMax: number;
    minUndervaluation: number;
    minConfidence: number;
    sortBy: string;
    sortDir: "asc" | "desc";
  }
): CardValuation[] {
  let result = cards.filter((card) => {
    if (
      filters.search &&
      !card.card_name.toLowerCase().includes(filters.search.toLowerCase()) &&
      !card.pokemon_character
        .toLowerCase()
        .includes(filters.search.toLowerCase()) &&
      !card.set_name.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    if (filters.set !== "all" && card.set_code !== filters.set) return false;
    if (
      filters.character !== "all" &&
      card.pokemon_character !== filters.character
    )
      return false;
    if (filters.rarity !== "all" && card.rarity_tier !== filters.rarity)
      return false;
    if (card.current_market_price < filters.priceMin) return false;
    if (card.current_market_price > filters.priceMax) return false;
    if (card.valuation_gap_percent < filters.minUndervaluation) return false;
    if (card.confidence_score < filters.minConfidence) return false;
    return true;
  });

  result.sort((a, b) => {
    const key = filters.sortBy as keyof CardValuation;
    const aVal = a[key] as number;
    const bVal = b[key] as number;
    return filters.sortDir === "desc" ? bVal - aVal : aVal - bVal;
  });

  return result;
}
