"""
Pokemon Card Data Pipeline
Fetches card metadata from pokemontcg.io (which includes TCGPlayer market prices).
Computes valuation scores and outputs data/cards.ts for the Next.js frontend.

Usage:
    pip install -r requirements.txt
    POKEMONTCG_API_KEY=your_key python scripts/fetch_cards.py

Get a free API key at: https://dev.pokemontcg.io/
Without a key the API still works but is rate-limited to 1,000 requests/day.
"""

import json
import math
import os
import re
import time
import numpy as np
import requests

API_BASE = "https://api.pokemontcg.io/v2"
API_KEY = os.environ.get("POKEMONTCG_API_KEY", "")

HEADERS = {"X-Api-Key": API_KEY} if API_KEY else {}

# ─── Sets to include ──────────────────────────────────────────────────────────
# Add/remove set codes here. pokemontcg.io set codes for Scarlet & Violet era:
TARGET_SETS = [
    "sv1",      # Scarlet & Violet (Mar 2023)
    "sv2",      # Paldea Evolved (Jun 2023)
    "sv3",      # Obsidian Flames (Aug 2023)
    "sv3pt5",   # Scarlet & Violet—151 (Sep 2023)
    "sv4",      # Paradox Rift (Nov 2023)
    "sv4pt5",   # Paldean Fates (Jan 2024)
    "sv5",      # Temporal Forces (Mar 2024)
    "sv6",      # Twilight Masquerade (May 2024)
    "sv6pt5",   # Shrouded Fable (Aug 2024)
    "sv7",      # Stellar Crown (Sep 2024)
    "sv8",      # Surging Sparks (Nov 2024)
    "sv8pt5",   # Prismatic Evolutions (Jan 2025)
    "sv9",      # Journey Together (Mar 2025)
    "sv10",     # Destined Rivals (May 2025) — confirmed sv10
    "zsv10pt5", # Black Bolt (Jul 2025)
    "rsv10pt5", # White Flare (Jul 2025)
]

# ─── Rarity tiers to include ─────────────────────────────────────────────────
CHASE_RARITIES = {
    "Special Illustration Rare",  # SIR — full art trainer/pokemon
    "Hyper Rare",                 # HR — gold border
    "Illustration Rare",          # IR — landscape full art
    "Ultra Rare",                 # UR — full art ex
    "Double Rare",                # DR — ex with standard border (strong playable value)
    "ACE SPEC Rare",              # ACE SPEC — powerful trainer, 1 per deck rule
    "Shiny Rare",                 # Shiny (Paldean Fates / special sets)
    "Shiny Ultra Rare",           # Shiny full art (Paldean Fates)
    "Master Ball Foil",           # MB — ultra rare foil stamp, ~1/19 any (sv8pt5+)
    "Poke Ball Foil",             # PB — foil stamp, ~1/3 any but specific can be valuable
    "Black & White Rare",         # BWR — Black Bolt / White Flare exclusive (rates unknown)
}

# ─── Per-set pull rates (ANY card of that rarity per pack) ───────────────────
# Source: TCGPlayer empirical pull rate data (8,000+ pack samples per set).
# Formula: expected packs for SPECIFIC card = (1/any_rate) × count_in_set
# Sets without exact data use DEFAULT_PULL_RATES below.
PULL_RATES: dict[str, dict[str, float]] = {
    "sv1": {  # Scarlet & Violet Base — TCGPlayer data
        "Hyper Rare":                  1 / 54,
        "Special Illustration Rare":   1 / 32,
        "Illustration Rare":           1 / 13,
        "Ultra Rare":                  1 / 15,
        "Double Rare":                 1 / 7,
    },
    "sv2": {  # Paldea Evolved — TCGPlayer data
        "Hyper Rare":                  1 / 57,
        "Special Illustration Rare":   1 / 32,
        "Illustration Rare":           1 / 13,
        "Ultra Rare":                  1 / 15,
        "Double Rare":                 1 / 7,
    },
    "sv3": {  # Obsidian Flames — TCGPlayer data
        "Hyper Rare":                  1 / 52,
        "Special Illustration Rare":   1 / 32,
        "Illustration Rare":           1 / 13,
        "Ultra Rare":                  1 / 15,
        "Double Rare":                 1 / 7,
    },
    "sv3pt5": {  # Scarlet & Violet—151 — TCGPlayer data
        "Hyper Rare":                  1 / 51,
        "Special Illustration Rare":   1 / 32,
        "Illustration Rare":           1 / 12,
        "Ultra Rare":                  1 / 16,
        "Double Rare":                 1 / 8,
    },
    "sv4": {  # Paradox Rift — TCGPlayer data
        "Hyper Rare":                  1 / 82,
        "Special Illustration Rare":   1 / 47,
        "Illustration Rare":           1 / 13,
        "Ultra Rare":                  1 / 15,
        "Double Rare":                 1 / 6,
    },
    "sv4pt5": {  # Paldean Fates — shiny vault set, estimated from community data
        "Hyper Rare":                  1 / 120,
        "Special Illustration Rare":   1 / 60,
        "Shiny Rare":                  1 / 7,
        "Shiny Ultra Rare":            1 / 60,
        "Illustration Rare":           1 / 13,
        "Ultra Rare":                  1 / 15,
    },
    "sv5": {  # Temporal Forces — TCGPlayer data
        "Hyper Rare":                  1 / 139,
        "Special Illustration Rare":   1 / 88,
        "Illustration Rare":           1 / 13,
        "Ultra Rare":                  1 / 15,
        "ACE SPEC Rare":               1 / 20,
    },
    "sv6": {  # Twilight Masquerade — TCGPlayer data
        "Hyper Rare":                  1 / 146,
        "Special Illustration Rare":   1 / 86,
        "Illustration Rare":           1 / 13,
        "Ultra Rare":                  1 / 15,
        "ACE SPEC Rare":               1 / 20,
    },
    "sv6pt5": {  # Shrouded Fable — estimated (provide exact data to update)
        "Hyper Rare":                  1 / 140,
        "Special Illustration Rare":   1 / 85,
        "Illustration Rare":           1 / 13,
        "Ultra Rare":                  1 / 15,
        "ACE SPEC Rare":               1 / 20,
    },
    "sv7": {  # Stellar Crown — TCGPlayer data
        "Hyper Rare":                  1 / 137,
        "Special Illustration Rare":   1 / 90,
        "Illustration Rare":           1 / 13,
        "Ultra Rare":                  1 / 15,
        "ACE SPEC Rare":               1 / 20,
    },
    "sv8": {  # Surging Sparks — TCGPlayer data
        "Hyper Rare":                  1 / 188,
        "Special Illustration Rare":   1 / 87,
        "Illustration Rare":           1 / 13,
        "Ultra Rare":                  1 / 15,
        "ACE SPEC Rare":               1 / 20,
    },
    "sv8pt5": {  # Prismatic Evolutions — TCGPlayer data (1,200+ pack sample)
        "Hyper Rare":                  1 / 180,
        "Special Illustration Rare":   1 / 45,
        "Master Ball Foil":            1 / 20,
        "Ultra Rare":                  1 / 13,
        "ACE SPEC Rare":               1 / 21,
        "Poke Ball Foil":              1 / 3,
    },
    "sv9": {  # Journey Together — TCGPlayer data
        "Hyper Rare":                  1 / 137,
        "Special Illustration Rare":   1 / 86,
        "Illustration Rare":           1 / 12,
        "Ultra Rare":                  1 / 15,
        "Double Rare":                 1 / 5,
    },
    "sv10": {  # Destined Rivals — TCGPlayer data
        "Hyper Rare":                  1 / 149,
        "Special Illustration Rare":   1 / 94,
        "Illustration Rare":           1 / 12,
        "Ultra Rare":                  1 / 16,
        "Double Rare":                 1 / 5,
    },
    "zsv10pt5": {  # Black Bolt — TCGPlayer data
        "Special Illustration Rare":   1 / 80,
        "Master Ball Foil":            1 / 19,
        "Ultra Rare":                  1 / 17,
        "Illustration Rare":           1 / 6,
        "Poke Ball Foil":              1 / 3,
        "Black & White Rare":          1 / 80,  # BWR rate unknown, using SIR as proxy
    },
    "rsv10pt5": {  # White Flare — TCGPlayer data (same pull rates as Black Bolt)
        "Special Illustration Rare":   1 / 80,
        "Master Ball Foil":            1 / 19,
        "Ultra Rare":                  1 / 17,
        "Illustration Rare":           1 / 6,
        "Poke Ball Foil":              1 / 3,
        "Black & White Rare":          1 / 80,
    },
}

# Fallback for any set not listed above
DEFAULT_PULL_RATES: dict[str, float] = {
    "Hyper Rare":                  1 / 137,
    "Special Illustration Rare":   1 / 87,
    "Illustration Rare":           1 / 13,
    "Ultra Rare":                  1 / 15,
    "Double Rare":                 1 / 7,
    "ACE SPEC Rare":               1 / 20,
    "Shiny Rare":                  1 / 7,
    "Shiny Ultra Rare":            1 / 60,
}

# ─── Booster box / single-pack prices (USD) ──────────────────────────────────
# Used to compute the dollar cost to pull a specific card.
# Update these when box prices shift significantly.
BOX_PRICES = {
    "sv1":    105,
    "sv2":    110,
    "sv3":    100,
    "sv3pt5": 160,
    "sv4":    105,
    "sv4pt5": 120,
    "sv5":    100,
    "sv6":    100,
    "sv6pt5":  60,
    "sv7":    100,
    "sv8":    110,
    "sv8pt5": 150,  # ETB / bundle products; single pack ≈ $5–6
    "sv9":    110,
    "sv10":      110,  # Destined Rivals
    "zsv10pt5":  110,  # Black Bolt
    "rsv10pt5":  110,  # White Flare
}

PACKS_PER_BOX = 36

# ─── Character premium scores (1–10) ─────────────────────────────────────────
# Reflects historical price percentile across all printings of a character.
# Higher = stronger collector/player demand regardless of specific card.
CHARACTER_PREMIUMS = {
    "Charizard": 9.8, "Umbreon": 9.5, "Mew": 9.0, "Mewtwo": 9.0,
    "Pikachu": 8.5, "Iono": 8.5, "Eevee": 8.0, "Gengar": 7.5,
    "Dragonite": 7.0, "Gardevoir": 7.2, "Sylveon": 7.0,
    "Rayquaza": 8.0, "Lugia": 7.5, "Greninja": 7.5, "Mimikyu": 6.5,
    "Arcanine": 5.5, "Venusaur": 6.8, "Blastoise": 7.0,
    "Alakazam": 5.5, "Lapras": 5.5, "Tyranitar": 6.5,
    "Garchomp": 6.0, "Darkrai": 6.5, "Espeon": 6.5,
    "Vaporeon": 5.0, "Glaceon": 5.5, "Jolteon": 5.5,
    "Flareon": 5.0, "Leafeon": 5.0, "Miraidon": 5.5, "Koraidon": 5.5,
    "Terapagos": 7.0, "Pecharunt": 5.0, "Ogerpon": 6.5,
    "Munkidori": 4.5, "Fezandipiti": 4.5, "Okidogi": 4.0,
    "Ninetales": 6.0, "Raichu": 6.0, "Clefairy": 5.5,
    "Moltres": 6.0, "Zapdos": 6.0, "Articuno": 6.0,
    "Entei": 6.5, "Suicune": 6.5, "Raikou": 6.0,
    "Latias": 6.0, "Latios": 6.0, "Giratina": 7.0,
    "Dialga": 6.5, "Palkia": 6.5, "Arceus": 7.5,
    "Zacian": 6.5, "Zamazenta": 5.5, "Eternatus": 6.0,
    "Calyrex": 6.5, "Chien-Pao": 5.5, "Iron Valiant": 5.5,
    "Roaring Moon": 5.5, "Sandy Shocks": 4.0,
}

# ─── Universal appeal scores (1–10, Google Trends proxy) ─────────────────────
UNIVERSAL_APPEAL = {
    "Charizard": 9.5, "Pikachu": 10.0, "Mewtwo": 8.5, "Mew": 8.0,
    "Eevee": 8.0, "Gengar": 7.0, "Umbreon": 7.5, "Dragonite": 6.5,
    "Gardevoir": 5.5, "Rayquaza": 6.0, "Lugia": 6.0, "Greninja": 6.5,
    "Venusaur": 6.5, "Blastoise": 6.5, "Arcanine": 5.0, "Lapras": 5.5,
    "Tyranitar": 5.5, "Garchomp": 5.0, "Mimikyu": 6.0,
    "Sylveon": 6.0, "Espeon": 5.5, "Darkrai": 5.5,
    "Giratina": 6.5, "Arceus": 7.0, "Dialga": 5.5, "Palkia": 5.5,
    "Zacian": 5.5, "Terapagos": 6.5, "Ogerpon": 6.0,
    "Ninetales": 5.5, "Raichu": 5.5, "Entei": 5.5, "Suicune": 5.5,
    "Calyrex": 5.5, "Iono": 7.0,
}

# ─── Model constants ──────────────────────────────────────────────────────────
MODEL_ALPHA = 1.8
MODEL_BETA = 0.52
WEIGHTS = {"pull_cost": 0.35, "character": 0.40, "appeal": 0.25}


# ─── API helpers ──────────────────────────────────────────────────────────────

def fetch_set_cards(set_id: str) -> list[dict]:
    """Fetch all cards from a set via pokemontcg.io API."""
    all_cards = []
    page = 1
    while True:
        params = {
            "q": f"set.id:{set_id}",
            "pageSize": 250,
            "page": page,
            "select": "id,name,number,set,rarity,artist,images,tcgplayer",
        }
        try:
            resp = requests.get(
                f"{API_BASE}/cards", params=params, headers=HEADERS, timeout=30
            )
            resp.raise_for_status()
            data = resp.json()
            batch = data.get("data", [])
            all_cards.extend(batch)
            if len(batch) < 250:
                break
            page += 1
            time.sleep(0.5)
        except requests.RequestException as e:
            print(f"  Error fetching {set_id} page {page}: {e}")
            break
    return all_cards


def get_market_price(card: dict) -> float | None:
    """Extract NM TCGplayer market price from card data."""
    tcg = card.get("tcgplayer", {})
    prices = tcg.get("prices", {})
    # Priority order for SV-era chase cards
    for category in ["holofoil", "reverseHolofoil", "normal", "1stEditionHolofoil"]:
        p = prices.get(category, {})
        if p.get("market"):
            return p["market"]
    return None


# ─── Score computation ────────────────────────────────────────────────────────

def compute_pull_cost_score(set_id: str, rarity: str, rarity_count: int) -> float:
    """
    Pull cost score (1–10): how expensive it is to pull a SPECIFIC card.

    Formula:
        expected_packs = (1 / any_rate) × count_in_rarity
        pull_cost_usd  = expected_packs × pack_price_usd
        score          = log-normalised to 1–10 ($50 easy → $5,000+ extreme)

    Uses TCGPlayer empirical "any card of this rarity" rates per set.
    """
    set_rates = PULL_RATES.get(set_id, DEFAULT_PULL_RATES)
    any_rate = set_rates.get(rarity, DEFAULT_PULL_RATES.get(rarity, 1 / 60))

    box_price = BOX_PRICES.get(set_id, 100)
    pack_price = box_price / PACKS_PER_BOX

    expected_packs = (1 / any_rate) * rarity_count
    pull_cost_usd = expected_packs * pack_price

    log_min, log_max = math.log(50), math.log(5000)
    log_cost = max(log_min, min(log_max, math.log(max(pull_cost_usd, 1))))
    return round(1 + 9 * (log_cost - log_min) / (log_max - log_min), 1)


def compute_modeled_price(pull_cost: float, char_premium: float, appeal: float) -> float:
    composite = (
        WEIGHTS["pull_cost"] * pull_cost
        + WEIGHTS["character"] * char_premium
        + WEIGHTS["appeal"] * appeal
    )
    return round(math.exp(MODEL_ALPHA + MODEL_BETA * composite), 2)


def extract_character(card_name: str) -> str:
    """Extract base Pokemon character name from a card name."""
    name = card_name
    for suffix in [" ex", " EX", " V", " VMAX", " VSTAR", " GX", " LV.X"]:
        name = name.replace(suffix, "")
    # Handle "Trainer's Pokemon" format
    if "'s " in name:
        name = name.split("'s ")[-1]
    return name.strip()


# ─── Main pipeline ────────────────────────────────────────────────────────────

def process_cards() -> list[dict]:
    all_cards = []

    for set_id in TARGET_SETS:
        print(f"Fetching {set_id}...")
        raw_cards = fetch_set_cards(set_id)
        time.sleep(1)

        if not raw_cards:
            print(f"  No cards returned — check set code")
            continue

        # Count cards per rarity (needed for specific pull rate calculation)
        rarity_counts: dict[str, int] = {}
        for card in raw_cards:
            r = card.get("rarity", "")
            rarity_counts[r] = rarity_counts.get(r, 0) + 1

        chase_cards = [c for c in raw_cards if c.get("rarity") in CHASE_RARITIES]
        print(f"  {len(raw_cards)} total cards, {len(chase_cards)} chase cards")

        for card in chase_cards:
            market_price = get_market_price(card)
            if not market_price or market_price < 3:
                continue  # Skip cards without meaningful market price data

            character = extract_character(card["name"])
            rarity = card.get("rarity", "")
            rarity_count = rarity_counts.get(rarity, 10)
            set_info = card.get("set", {})

            pull_cost = compute_pull_cost_score(set_id, rarity, rarity_count)
            rarity_slot = round(1 + 9 * (30 - min(rarity_count, 30)) / 29, 1)
            char_premium = CHARACTER_PREMIUMS.get(character, 3.5)
            appeal = UNIVERSAL_APPEAL.get(character, 3.5)

            modeled = compute_modeled_price(pull_cost, char_premium, appeal)
            gap_dollar = round(modeled - market_price, 2)
            gap_percent = round(gap_dollar / market_price * 100, 1) if market_price > 0 else 0

            # Confidence proxy — improve with real sales volume data when available
            liquidity = 6.0
            volatility = 6.0
            # Older sets = more stable prices (higher confidence)
            set_age_map = {
                "sv1": 9, "sv2": 8, "sv3": 8, "sv3pt5": 8,
                "sv4": 7, "sv4pt5": 7, "sv5": 7, "sv6": 6,
                "sv6pt5": 6, "sv7": 5, "sv8": 5, "sv8pt5": 4, "sv9": 4, "sv10": 3,
                "zsv10pt5": 2, "rsv10pt5": 2,
            }
            print_cycle = set_age_map.get(set_id, 5)
            confidence = round(
                0.35 * liquidity + 0.30 * volatility + 0.20 * print_cycle + 0.15 * 7, 1
            )

            release_year_str = set_info.get("releaseDate", "2024-01-01")
            release_year = int(release_year_str[:4]) if release_year_str else 2024

            valuation = {
                "card_id": card["id"],
                "card_name": card["name"],
                "pokemon_character": character,
                "set_name": set_info.get("name", ""),
                "set_code": set_id,
                "card_number": card.get("number", ""),
                "year_of_release": release_year,
                "language": "en",
                "rarity_tier": rarity,
                "artist": card.get("artist", ""),
                "image_url": card.get("images", {}).get("large", ""),
                "pull_cost_score": pull_cost,
                "rarity_slot_score": rarity_slot,
                "character_premium": char_premium,
                "universal_appeal": appeal,
                "print_cycle_score": float(print_cycle),
                "set_popularity": 6.0,
                "liquidity_score": liquidity,
                "volatility_score": volatility,
                "confidence_score": confidence,
                "sales_volume_30d": 50,
                "modeled_price": modeled,
                "current_market_price": market_price,
                "valuation_gap_dollar": gap_dollar,
                "valuation_gap_percent": gap_percent,
                "ranking_score": float(round(
                    max(0, min(100, 50 + gap_percent * 0.3 + confidence * 3)), 0
                )),
                "ranking_reason": (
                    f"{character} — {set_info.get('name', '')}. "
                    f"Pull cost {pull_cost}/10, Character premium {char_premium}/10. "
                    f"{'Undervalued' if gap_percent > 10 else 'Overvalued' if gap_percent < -10 else 'Fair value'} "
                    f"by {abs(gap_percent):.1f}%."
                ),
            }
            all_cards.append(valuation)

    all_cards.sort(key=lambda c: c["valuation_gap_percent"], reverse=True)
    print(f"\nTotal cards processed: {len(all_cards)}")
    return all_cards


def write_typescript(cards: list[dict], path: str = "data/cards.ts") -> None:
    ts = 'import { CardValuation } from "@/lib/types";\n\n'
    ts += "// Auto-generated by scripts/fetch_cards.py — do not edit manually\n"
    ts += f"// Last updated: {time.strftime('%Y-%m-%d %H:%M UTC')}\n"
    ts += f"// Cards: {len(cards)}\n\n"
    ts += "export const cards: CardValuation[] = "
    ts += json.dumps(cards, indent=2)
    ts += ";\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(ts)
    print(f"Wrote {len(cards)} cards -> {path}")


def calibrate_model(cards: list[dict]) -> tuple[float, float, float]:
    """
    Fit alpha and beta via OLS regression on real price data.
    Model: ln(market_price) = alpha + beta * composite_score
    Returns: (alpha, beta, r_squared)
    """
    composites = []
    ln_prices = []

    for card in cards:
        price = card["current_market_price"]
        if price > 0:
            composite = (
                WEIGHTS["pull_cost"] * card["pull_cost_score"]
                + WEIGHTS["character"] * card["character_premium"]
                + WEIGHTS["appeal"] * card["universal_appeal"]
            )
            composites.append(composite)
            ln_prices.append(math.log(price))

    x = np.array(composites)
    y = np.array(ln_prices)

    # OLS: np.polyfit(x, y, 1) returns [slope, intercept]
    coeffs = np.polyfit(x, y, 1)
    beta  = round(float(coeffs[0]), 4)
    alpha = round(float(coeffs[1]), 4)

    # R² — how much price variance the model explains
    y_pred = alpha + beta * x
    ss_res = float(np.sum((y - y_pred) ** 2))
    ss_tot = float(np.sum((y - np.mean(y)) ** 2))
    r_squared = round(1 - ss_res / ss_tot, 4)

    return alpha, beta, r_squared


def recompute_valuations(cards: list[dict], alpha: float, beta: float) -> list[dict]:
    """Recompute modeled prices and valuation gaps using calibrated alpha/beta."""
    for card in cards:
        composite = (
            WEIGHTS["pull_cost"] * card["pull_cost_score"]
            + WEIGHTS["character"] * card["character_premium"]
            + WEIGHTS["appeal"] * card["universal_appeal"]
        )
        modeled = round(math.exp(alpha + beta * composite), 2)
        market  = card["current_market_price"]
        gap_dollar  = round(modeled - market, 2)
        gap_percent = round(gap_dollar / market * 100, 1) if market > 0 else 0

        card["modeled_price"]          = modeled
        card["valuation_gap_dollar"]   = gap_dollar
        card["valuation_gap_percent"]  = gap_percent
        card["ranking_score"] = float(round(
            max(0, min(100, 50 + gap_percent * 0.3 + card["confidence_score"] * 3)), 0
        ))
        card["ranking_reason"] = (
            f"{card['pokemon_character']} — {card['set_name']}. "
            f"Pull cost {card['pull_cost_score']}/10, Character premium {card['character_premium']}/10. "
            f"{'Undervalued' if gap_percent > 10 else 'Overvalued' if gap_percent < -10 else 'Fair value'} "
            f"by {abs(gap_percent):.1f}%."
        )

    cards.sort(key=lambda c: c["valuation_gap_percent"], reverse=True)
    return cards


def update_ts_model(alpha: float, beta: float, path: str = "lib/model.ts") -> None:
    """Write calibrated alpha/beta back into the TypeScript frontend model."""
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    content = re.sub(r"const MODEL_ALPHA = [\d.]+;", f"const MODEL_ALPHA = {alpha};", content)
    content = re.sub(r"const MODEL_BETA = [\d.]+;",  f"const MODEL_BETA = {beta};",  content)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Updated lib/model.ts  ->  alpha={alpha}, beta={beta}")


if __name__ == "__main__":
    print("Pokemon Card Data Pipeline")
    print("=" * 50)
    if not API_KEY:
        print("Note: No POKEMONTCG_API_KEY set — using anonymous tier (1,000 req/day)")
    cards = process_cards()

    # ── Calibrate model on real price data ────────────────────────────────────
    alpha, beta, r2 = calibrate_model(cards)
    print(f"\nCalibrated model:  alpha={alpha}  beta={beta}  R²={r2}")
    print(f"(previous values:  alpha=1.8       beta=0.52)")

    # ── Recompute all valuations with fitted constants ─────────────────────────
    cards = recompute_valuations(cards, alpha, beta)

    # ── Write outputs ──────────────────────────────────────────────────────────
    write_typescript(cards)
    update_ts_model(alpha, beta)
    print("Done. Run 'npm run build' to rebuild the site.")
