import { CardValuation } from "@/lib/types";

function ScoreRow({
  label,
  value,
  maxValue = 10,
  color,
}: {
  label: string;
  value: number;
  maxValue?: number;
  color: string;
}) {
  const pct = Math.min((value / maxValue) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200 font-medium">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ScoreBreakdown({ card }: { card: CardValuation }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
        Score Breakdown
      </h3>

      <div className="space-y-2.5">
        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-2">
          Supply
        </div>
        <ScoreRow
          label="Pull Cost"
          value={card.pull_cost_score}
          color="bg-blue-500"
        />
        <ScoreRow
          label="Rarity Slot"
          value={card.rarity_slot_score}
          color="bg-blue-400"
        />

        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-3">
          Demand
        </div>
        <ScoreRow
          label="Character Premium"
          value={card.character_premium}
          color="bg-purple-500"
        />
        <ScoreRow
          label="Universal Appeal"
          value={card.universal_appeal}
          color="bg-purple-400"
        />

        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-3">
          Market
        </div>
        <ScoreRow
          label="Liquidity"
          value={card.liquidity_score}
          color="bg-amber-500"
        />
        <ScoreRow
          label="Price Stability"
          value={card.volatility_score}
          color="bg-amber-400"
        />
        <ScoreRow
          label="Print Cycle"
          value={card.print_cycle_score}
          color="bg-teal-500"
        />
        <ScoreRow
          label="Confidence"
          value={card.confidence_score}
          color="bg-emerald-500"
        />
      </div>
    </div>
  );
}
