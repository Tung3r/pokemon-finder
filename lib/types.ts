export interface CardValuation {
  card_id: string;
  card_name: string;
  pokemon_character: string;
  set_name: string;
  set_code: string;
  card_number: string;
  year_of_release: number;
  language: string;
  rarity_tier: string;
  artist: string;
  image_url: string;

  // Supply scores (1-10)
  pull_cost_score: number;
  rarity_slot_score: number;

  // Demand scores (1-10)
  character_premium: number;
  universal_appeal: number;

  // Context scores (1-10)
  print_cycle_score: number;
  set_popularity: number;

  // Market data
  liquidity_score: number;
  volatility_score: number;
  confidence_score: number;
  sales_volume_30d: number;

  // Valuation
  modeled_price: number;
  current_market_price: number;
  valuation_gap_dollar: number;
  valuation_gap_percent: number;

  // Ranking
  ranking_score: number;
  ranking_reason: string;
}

export type SortField =
  | "valuation_gap_percent"
  | "valuation_gap_dollar"
  | "current_market_price"
  | "confidence_score"
  | "ranking_score"
  | "character_premium"
  | "universal_appeal";

export type SortDirection = "asc" | "desc";

export interface Filters {
  search: string;
  set: string;
  character: string;
  rarity: string;
  priceMin: number;
  priceMax: number;
  minUndervaluation: number;
  minConfidence: number;
  sortBy: SortField;
  sortDir: SortDirection;
}

export const DEFAULT_FILTERS: Filters = {
  search: "",
  set: "all",
  character: "all",
  rarity: "all",
  priceMin: 0,
  priceMax: 10000,
  minUndervaluation: -100,
  minConfidence: 0,
  sortBy: "valuation_gap_percent",
  sortDir: "desc",
};
