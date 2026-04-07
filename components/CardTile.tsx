"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { CardValuation } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import ValuationBadge from "./ValuationBadge";
import ConfidenceDots from "./ConfidenceDots";

export default function CardTile({ card }: { card: CardValuation }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link href={`/card/${card.card_id}`}>
      <div className="group bg-slate-900 rounded-xl border border-slate-800 overflow-hidden hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50 transition-all duration-200 cursor-pointer">
        {/* Card Image */}
        <div className="relative aspect-[2.5/3.5] bg-slate-950 overflow-hidden">
          {!imgError ? (
            <Image
              src={card.image_url}
              alt={card.card_name}
              fill
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 p-4">
              <svg
                className="w-12 h-12 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-xs text-center">{card.card_name}</span>
            </div>
          )}
        </div>

        {/* Card Info */}
        <div className="p-3 space-y-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 truncate">
              {card.card_name}
            </h3>
            <p className="text-xs text-slate-500 truncate">
              {card.set_name} &middot; {card.card_number}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-slate-100">
              {formatPrice(card.current_market_price)}
            </span>
            <ValuationBadge
              gapPercent={card.valuation_gap_percent}
              confidence={card.confidence_score}
              size="sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Model: {formatPrice(card.modeled_price)}
            </span>
            <ConfidenceDots score={card.confidence_score} />
          </div>
        </div>
      </div>
    </Link>
  );
}
