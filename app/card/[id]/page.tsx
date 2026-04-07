import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cards } from "@/data/cards";
import { formatPrice, formatPercent, formatGap } from "@/lib/utils";
import { getValuationLabel, getValuationColor, getValuationBgColor } from "@/lib/model";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import ConfidenceDots from "@/components/ConfidenceDots";

export function generateStaticParams() {
  return cards.map((card) => ({ id: card.card_id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const card = cards.find((c) => c.card_id === params.id);
  if (!card) return { title: "Card Not Found" };
  return {
    title: `${card.card_name} - ${card.set_name} | Pokemon Finder`,
    description: `${card.card_name} from ${card.set_name}. Market: ${formatPrice(card.current_market_price)}, Model: ${formatPrice(card.modeled_price)}. ${card.ranking_reason}`,
  };
}

export default function CardPage({ params }: { params: { id: string } }) {
  const card = cards.find((c) => c.card_id === params.id);
  if (!card) notFound();

  const label = getValuationLabel(
    card.valuation_gap_percent,
    card.confidence_score
  );
  const textColor = getValuationColor(
    card.valuation_gap_percent,
    card.confidence_score
  );
  const bgColor = getValuationBgColor(
    card.valuation_gap_percent,
    card.confidence_score
  );

  // Find related cards (same character or same set)
  const relatedByCharacter = cards
    .filter(
      (c) =>
        c.pokemon_character === card.pokemon_character &&
        c.card_id !== card.card_id
    )
    .sort((a, b) => b.valuation_gap_percent - a.valuation_gap_percent)
    .slice(0, 4);

  const relatedBySet = cards
    .filter(
      (c) => c.set_code === card.set_code && c.card_id !== card.card_id
    )
    .sort((a, b) => b.valuation_gap_percent - a.valuation_gap_percent)
    .slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Results
      </Link>

      {/* Main Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Card Image */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden sticky top-20">
            <div className="relative aspect-[2.5/3.5] bg-slate-950">
              <Image
                src={card.image_url}
                alt={card.card_name}
                fill
                className="object-contain p-4"
                sizes="(max-width: 1024px) 100vw, 33vw"
                priority
              />
            </div>
          </div>
        </div>

        {/* Right: Card Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title Section */}
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              {card.card_name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-slate-400">
              <span>{card.set_name}</span>
              <span className="text-slate-700">&middot;</span>
              <span>{card.card_number}</span>
              <span className="text-slate-700">&middot;</span>
              <span>{card.year_of_release}</span>
              <span className="text-slate-700">&middot;</span>
              <span>{card.rarity_tier}</span>
              <span className="text-slate-700">&middot;</span>
              <span>English</span>
            </div>
            {card.artist && (
              <p className="text-sm text-slate-500 mt-1">
                Art by {card.artist}
              </p>
            )}
          </div>

          {/* Pricing Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Market Price */}
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Market Price
                </div>
                <div className="text-3xl font-bold text-slate-100">
                  {formatPrice(card.current_market_price)}
                </div>
              </div>

              {/* Modeled Value */}
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Modeled Value
                </div>
                <div className="text-3xl font-bold text-slate-300">
                  {formatPrice(card.modeled_price)}
                </div>
              </div>

              {/* Valuation Gap */}
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Valuation Gap
                </div>
                <div className={`text-3xl font-bold ${textColor}`}>
                  {formatPercent(card.valuation_gap_percent)}
                </div>
                <div className={`text-sm ${textColor}`}>
                  {formatGap(card.valuation_gap_dollar)}
                </div>
              </div>
            </div>

            {/* Valuation Label */}
            <div
              className={`mt-4 rounded-lg p-3 ${bgColor} border border-slate-700`}
            >
              <div className={`text-sm font-semibold ${textColor}`}>
                {label}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {card.ranking_reason}
              </p>
            </div>

            {/* Confidence */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs text-slate-500">Confidence:</span>
              <ConfidenceDots score={card.confidence_score} showLabel />
            </div>
          </div>

          {/* Market Data */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
              Market Data
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-slate-500">Sales (30d)</div>
                <div className="text-slate-200 font-medium">
                  {card.sales_volume_30d}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Avg Daily</div>
                <div className="text-slate-200 font-medium">
                  {(card.sales_volume_30d / 30).toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Liquidity</div>
                <div className="text-slate-200 font-medium">
                  {card.liquidity_score.toFixed(1)}/10
                </div>
              </div>
              <div>
                <div className="text-slate-500">Price Stability</div>
                <div className="text-slate-200 font-medium">
                  {card.volatility_score.toFixed(1)}/10
                </div>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <ScoreBreakdown card={card} />
          </div>
        </div>
      </div>

      {/* Related Cards */}
      {relatedByCharacter.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">
            Other {card.pokemon_character} Cards
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedByCharacter.map((related) => (
              <Link
                key={related.card_id}
                href={`/card/${related.card_id}`}
                className="bg-slate-900 border border-slate-800 rounded-lg p-3 hover:border-slate-600 transition-colors"
              >
                <div className="text-sm font-medium text-slate-200 truncate">
                  {related.card_name}
                </div>
                <div className="text-xs text-slate-500">{related.set_name}</div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-slate-300">
                    {formatPrice(related.current_market_price)}
                  </span>
                  <span
                    className={`text-xs ${getValuationColor(related.valuation_gap_percent, related.confidence_score)}`}
                  >
                    {formatPercent(related.valuation_gap_percent)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {relatedBySet.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">
            More from {card.set_name}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedBySet.map((related) => (
              <Link
                key={related.card_id}
                href={`/card/${related.card_id}`}
                className="bg-slate-900 border border-slate-800 rounded-lg p-3 hover:border-slate-600 transition-colors"
              >
                <div className="text-sm font-medium text-slate-200 truncate">
                  {related.card_name}
                </div>
                <div className="text-xs text-slate-500">
                  {related.pokemon_character}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-slate-300">
                    {formatPrice(related.current_market_price)}
                  </span>
                  <span
                    className={`text-xs ${getValuationColor(related.valuation_gap_percent, related.confidence_score)}`}
                  >
                    {formatPercent(related.valuation_gap_percent)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
