"use client";

import { useState, useMemo } from "react";
import { cards } from "@/data/cards";
import { Filters, DEFAULT_FILTERS } from "@/lib/types";
import { filterAndSortCards } from "@/lib/model";
import { getUniqueValues, formatPrice } from "@/lib/utils";
import FilterBar from "./FilterBar";
import CardTile from "./CardTile";

export default function Dashboard() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const sets = useMemo(() => getUniqueValues(cards, "set_code"), []);
  const characters = useMemo(
    () => getUniqueValues(cards, "pokemon_character"),
    []
  );
  const rarities = useMemo(() => getUniqueValues(cards, "rarity_tier"), []);

  const setNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    cards.forEach((c) => {
      map[c.set_code] = c.set_name;
    });
    return map;
  }, []);

  const filteredCards = useMemo(
    () => filterAndSortCards(cards, filters),
    [filters]
  );

  const stats = useMemo(() => {
    const undervalued = cards.filter(
      (c) => c.valuation_gap_percent > 15 && c.confidence_score >= 5
    ).length;
    const avgGap =
      cards.reduce((sum, c) => sum + c.valuation_gap_percent, 0) / cards.length;
    return { total: cards.length, undervalued, avgGap };
  }, []);

  const handleFilterChange = (key: keyof Filters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-slate-100">{stats.total}</div>
          <div className="text-xs text-slate-500">Cards Tracked</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-emerald-400">
            {stats.undervalued}
          </div>
          <div className="text-xs text-slate-500">Undervalued (High Conf.)</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-slate-100">
            {stats.avgGap > 0 ? "+" : ""}
            {stats.avgGap.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500">Avg. Valuation Gap</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-slate-100">
            {new Set(cards.map((c) => c.set_code)).size}
          </div>
          <div className="text-xs text-slate-500">Sets Covered</div>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        sets={sets}
        setNames={setNameMap}
        characters={characters}
        rarities={rarities}
        totalCards={cards.length}
        filteredCount={filteredCards.length}
      />

      {/* Card Grid */}
      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredCards.map((card) => (
            <CardTile key={card.card_id} card={card} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-slate-600 text-lg mb-2">No cards match your filters</div>
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
}
