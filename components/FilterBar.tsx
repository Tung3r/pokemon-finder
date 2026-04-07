"use client";

import { Filters, SortField } from "@/lib/types";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "valuation_gap_percent", label: "Undervaluation %" },
  { value: "valuation_gap_dollar", label: "Value Gap ($)" },
  { value: "current_market_price", label: "Market Price" },
  { value: "confidence_score", label: "Confidence" },
  { value: "ranking_score", label: "Ranking Score" },
  { value: "character_premium", label: "Character Premium" },
  { value: "universal_appeal", label: "Universal Appeal" },
];

export default function FilterBar({
  filters,
  onFilterChange,
  sets,
  setNames,
  characters,
  rarities,
  totalCards,
  filteredCount,
}: {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string | number) => void;
  sets: string[];
  setNames: Record<string, string>;
  characters: string[];
  rarities: string[];
  totalCards: number;
  filteredCount: number;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      {/* Search + Stats Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search cards, Pokemon, sets..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <div className="text-xs text-slate-500 whitespace-nowrap">
          {filteredCount} of {totalCards} cards
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <select
          value={filters.set}
          onChange={(e) => onFilterChange("set", e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-slate-500"
        >
          <option value="all">All Sets</option>
          {sets.map((s) => (
            <option key={s} value={s}>
              {setNames[s] || s}
            </option>
          ))}
        </select>

        <select
          value={filters.character}
          onChange={(e) => onFilterChange("character", e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-slate-500"
        >
          <option value="all">All Pokemon</option>
          {characters.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={filters.rarity}
          onChange={(e) => onFilterChange("rarity", e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-slate-500"
        >
          <option value="all">All Rarities</option>
          {rarities.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) => onFilterChange("sortBy", e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-slate-500"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.sortDir}
          onChange={(e) => onFilterChange("sortDir", e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-slate-500"
        >
          <option value="desc">High to Low</option>
          <option value="asc">Low to High</option>
        </select>

        <select
          value={
            filters.priceMax === 10000
              ? "all"
              : `${filters.priceMin}-${filters.priceMax}`
          }
          onChange={(e) => {
            if (e.target.value === "all") {
              onFilterChange("priceMin", 0);
              onFilterChange("priceMax", 10000);
            } else {
              const [min, max] = e.target.value.split("-").map(Number);
              onFilterChange("priceMin", min);
              onFilterChange("priceMax", max);
            }
          }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-slate-500"
        >
          <option value="all">All Prices</option>
          <option value="0-25">Under $25</option>
          <option value="25-50">$25 - $50</option>
          <option value="50-100">$50 - $100</option>
          <option value="100-250">$100 - $250</option>
          <option value="250-500">$250 - $500</option>
          <option value="500-10000">$500+</option>
        </select>
      </div>

      {/* Advanced Filters Row */}
      <div className="flex flex-wrap gap-4 items-center text-sm">
        <label className="flex items-center gap-2 text-slate-400">
          <span className="whitespace-nowrap">Min Confidence:</span>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={filters.minConfidence}
            onChange={(e) =>
              onFilterChange("minConfidence", Number(e.target.value))
            }
            className="w-24 accent-amber-500"
          />
          <span className="text-slate-300 w-4">{filters.minConfidence}</span>
        </label>
        <label className="flex items-center gap-2 text-slate-400">
          <span className="whitespace-nowrap">Min Undervaluation:</span>
          <input
            type="range"
            min={-100}
            max={100}
            step={5}
            value={filters.minUndervaluation}
            onChange={(e) =>
              onFilterChange("minUndervaluation", Number(e.target.value))
            }
            className="w-24 accent-emerald-500"
          />
          <span className="text-slate-300 w-12">
            {filters.minUndervaluation}%
          </span>
        </label>
      </div>
    </div>
  );
}
