# Pokemon Card Valuation System: Full Analysis & Product Specification

**Scope**: English-language Pokemon cards only
**Objective**: Identify, rank, and surface undervalued cards for collectors and investors
**Source Material**: YouTube transcript — "Data scientist builds price prediction model to find OVERVALUED & UNDERVALUED Pokemon cards" + Booster Box supply/pricing data

---

## PHASE 1 — MODEL RECONSTRUCTION

### 1.1 Model Overview

The creator built a **log-linear regression model** using two composite variables to predict market prices of **top chase cards** from modern Pokemon sets. The model claims ~88% explanatory power (R² = 0.88) and isolates supply from demand into two clean inputs.

**Model Type**: Log-linear OLS regression (implied by "percentage increase per point" language)

**Estimated Equation**:

```
ln(Market_Price) = β₀ + β₁ × Pull_Cost_Score + β₂ × Desirability_Score
```

Where:
- β₁ ≈ 0.174 (each point of pull cost → ~19% price increase)
- β₂ ≈ 0.344 (each point of desirability → ~41% price increase)
- β₀ = intercept (not stated; estimated ~$15–25 base price for a 1/1 scored card)

**Implied predicted price formula**:

```
Predicted_Price = e^(β₀ + 0.174 × Pull_Cost_Score + 0.344 × Desirability_Score)
```

### 1.2 Variable 1: Pull Cost Score (Supply Proxy)

**Definition**: How expensive it is, in expectation, to pull one specific chase card from sealed product.

**Calculation**:

```
Expected_Packs = (1 / Pull_Rate_Per_Pack) × Cards_In_Rarity_Slot

Pull_Cost_Raw = Expected_Packs × Price_Per_Pack
```

Then normalized to a **1–10 scale** across the dataset.

**Sub-components**:

| Component | Definition | Source |
|-----------|-----------|--------|
| Pull Rate | Probability of hitting any card in a specific rarity tier from a single pack | Set product specs, community-verified pull rate data |
| Cards in Rarity Slot | Number of distinct cards sharing that rarity tier within the set | Official set lists |
| Pack Price | Cost of a single booster pack (implied from booster box price / 36) | Market data |

**Example from transcript**:
- Prismatic Evolutions: 1-in-45 pack pull rate for the rarity tier, but a large number of cards in that slot → still very high expected packs to pull a specific card
- Obsidian Flames Charizard 223: Lowest pull cost in dataset → easiest to pull → suppresses price even for Charizard

**Key insight stated by creator**: Pull cost captures both the pull rate AND the dilution from how many cards compete in the same rarity slot. A generous pull rate means nothing if 30+ cards share the slot.

### 1.3 Variable 2: Desirability Score (Demand Proxy)

**Definition**: Composite demand signal combining character strength, artwork quality, and cultural awareness.

**Formula**:

```
Desirability = 0.45 × Character_Premium + 0.45 × Artwork_Hype + 0.10 × Universal_Appeal
```

**Sub-component A: Character Premium (45% weight)**

- **Definition**: Historical average price ranking of a Pokemon character across ALL printings, ALL rarity tiers, ALL sets ever released
- **Method**: For each character, collect every card ever printed → rank each card within its rarity tier and set by price → take the average rank across all printings
- **Scale**: Normalized to 1–10
- **Examples given**:
  - Charizard: 1.1 average rank → ~10.0 normalized
  - Umbreon: 1.3 → ~9.7
  - Mew: 1.4 → ~9.5
  - Dragonite: 2.3 → ~7.5
- **Nature**: Objective/quantitative (derived from historical price data)

**Sub-component B: Artwork / Hype (45% weight)**

- **Definition**: Subjective assessment of card desirability driven by artwork quality, community hype, card-specific lore, and artist reputation
- **Method**: Manual scoring by the creator based on community consensus, visual quality, and cultural moment
- **Scale**: 1–10
- **Examples given**:
  - 10: Bubble Mew (universally loved artwork, famous artist, lore significance)
  - 10: Mega Charizard X (consensus best Charizard artwork ever printed)
  - 9: Mewtwo from Destined Rivals (top chase card from top set, but "lack of universal consensus around artwork")
  - 1: Dottsbun (obscure Pokemon, no recognition, no hype)
- **Nature**: Purely subjective

**Sub-component C: Universal Appeal (10% weight)**

- **Definition**: Broad public recognition of the Pokemon character beyond the collector community
- **Method**: Google Trends search volume for the character name
- **Scale**: Normalized to 1–10
- **Rationale for low weight**: "Big swings for higher popular Pokemon" — Charizard and Pikachu dominate so heavily that a higher weight would over-index on mainstream characters
- **Nature**: Objective (Google Trends data)

### 1.4 Model Output & Interpretation

The model produces a **predicted price** for each top chase card. The interpretation method:

```
Valuation_Gap = (Predicted_Price - Market_Price) / Market_Price × 100

If Valuation_Gap > 0 → card is UNDERVALUED (model says it should cost more)
If Valuation_Gap < 0 → card is OVERVALUED (market price exceeds model prediction)
```

**Example outputs from transcript**:

| Card | Pull Cost Score | Desirability Score | Predicted Price | Market Price | Interpretation |
|------|----------------|-------------------|----------------|-------------|----------------|
| Gardevoir (SV Base) | 1.4 | ~5.0 (mid) | ~$71 | ~$65 | Slightly undervalued |
| Charizard 223 (Obsidian Flames) | 1.0 (lowest) | 7.8 | Low | Low | Possibly undervalued for a Charizard |
| Charizard (151) | ~3.0 (mid-low) | ~9.0 | ~$500 | ~$400 | Undervalued — market "catching up" |
| Umbreon (Prismatic Evo) | ~9.0 (very high) | ~9.0 | High | Slightly below model | Slightly undervalued |
| Mega Charizard X (Phantasmal) | 2.0 (low) | ~9.5 | ~$500 | ~$800+ | OVERVALUED by model (or model limitation) |
| Pikachu (Ascended Heroes) | Very high | High | High | Rising | Correctly valued, surpassing Dragonite |

### 1.5 Hidden Assumptions

1. **Top chase cards only** — the model is NOT trained on all cards in a set, only the top-tier chase cards. This is a massive scope restriction that is not always clearly stated.
2. **Cross-sectional snapshot** — the model treats all cards at a single point in time. No temporal dynamics.
3. **Single-condition assumption** — no distinction between raw, PSA 10, PSA 9, etc. Appears to model raw/NM market price.
4. **Modern sets only** — Scarlet & Violet era. Vintage and SWSH-era cards are excluded.
5. **Equal pull cost normalization** — assumes pack prices are comparable across sets (they are not always; sealed product premiums vary wildly).
6. **Character premium is historically stable** — assumes past rank performance predicts future demand. Doesn't account for "comeback" characters (e.g., Dragonite having no premium printing for years then spiking).
7. **Artwork scoring is fixed** — doesn't decay or shift with market sentiment over time.
8. **English-only is implied** — Japanese printings are not discussed, but this is not explicitly enforced.

### 1.6 Where Subjectivity Enters

| Component | Subjective? | Impact |
|-----------|------------|--------|
| Pull rate data | No — verifiable | Low risk |
| Cards in rarity slot | No — from set lists | Low risk |
| Pack price | Low — observable | Low risk |
| Character premium | Low — derived from data | Moderate (methodology choices matter) |
| **Artwork/Hype score** | **100% subjective** | **CRITICAL — 45% of demand signal is one person's opinion** |
| Google Trends | No — API data | Low risk |
| Desirability weights (45/45/10) | Yes — creator's judgment | Moderate — no stated basis for these weights |

### 1.7 Where the Model is Fragile

1. **Artwork/Hype is 45% of demand and 100% subjective** — this single variable carries enormous weight and has no reproducible scoring methodology
2. **Small training set** — creator acknowledges limited data; overfitting risk is real
3. **No cross-validation mentioned** — R² of 0.88 on training data without holdout testing is unreliable
4. **Selection bias** — only "top chase cards" are modeled. The model has never seen mid-tier or bulk cards.
5. **The Mega Charizard X problem** — the model's biggest outlier is its most famous prediction. If the model breaks on the most culturally significant card in the dataset, the model has a fundamental blind spot.

---

## PHASE 2 — CRITICAL ANALYSIS

### 2.1 What the Model Does Well

1. **Clean conceptual separation**: Supply (pull cost) vs. demand (desirability) is the right first-principles decomposition. Most card pricing discussions conflate the two.
2. **Pull cost is a genuinely good supply proxy**: Combining pull rate × rarity slot size into expected packs is more useful than either metric alone. This captures the "Prismatic Evolutions problem" (generous pull rate but massive slot dilution).
3. **Character premium is data-driven**: Using historical cross-set, cross-rarity average rankings grounds the demand signal in actual transaction history.
4. **The R² is directionally useful**: Even if overfit, 88% suggests the two variables genuinely capture meaningful variance. The signal is real even if the precision is overstated.
5. **Clear outlier identification**: The model's FAILURES are informative. Mega Charizard X being a massive outlier tells us something real about the market — that "cultural moment" pricing exists above fundamentals.

### 2.2 Where the Model Systematically Fails

**Failure Mode 1: Cultural Moment / Hype Cycle Cards**
- The Mega Charizard X is modeled at ~$500 and trades at $800+
- The model has NO mechanism to capture "best artwork of all time" or "this is THE card of the generation" sentiment
- These cards operate on a different pricing dynamic — they become cultural objects, not just collectibles
- The model treats all "10" artwork scores equally, but there are 10s and then there are TRANSCENDENT 10s

**Failure Mode 2: Time Dynamics Are Absent**
- A card from a set released 2 weeks ago and a card from a set released 2 years ago are treated identically
- New release cards have artificially inflated prices (hype premium) that decay
- Mature set cards have stabilized prices that reflect long-term demand
- The model cannot distinguish between "overvalued because new" and "overvalued because permanently mispriced"

**Failure Mode 3: No Liquidity Filter**
- A card with 500 sales/day and a card with 2 sales/week get the same treatment
- Illiquid cards can have manipulated or stale prices
- You cannot "act on" an undervaluation signal if the card has no market depth

**Failure Mode 4: Artwork Scoring is Not Reproducible**
- Different raters would assign different scores
- The 45% weight means small scoring differences (7 vs 8) materially change the predicted price
- No framework for what constitutes a "5" vs a "7" — only extreme examples (1 and 10) are given

**Failure Mode 5: No Set-Level Effects**
- Some sets are more popular than others regardless of individual card quality (e.g., Evolving Skies as a whole is beloved)
- The model has no variable for set-level demand
- A mediocre card in a beloved set will be mispriced vs. a good card in a forgotten set

**Failure Mode 6: Sealed Product Feedback Loop**
- The booster box price image data shows sets with different supply levels (BB Supply) and daily sales velocities
- When sealed product prices rise, pull cost effectively rises — but the model uses a STATIC pull cost
- Evolving Skies booster boxes at $1,292 means the effective pull cost for any card in that set has skyrocketed, but the model still uses the original pack price

**Failure Mode 7: Grading Population Is Ignored**
- PSA 10 population vs. raw population changes the effective supply for graded card markets
- Cards that are easy to grade PSA 10 have higher "graded supply" than cards with strict grading curves
- The model only addresses raw market pricing

### 2.3 Missing Variables

| Variable | Why It Matters | Impact of Omission |
|----------|---------------|-------------------|
| Time since release | New sets have hype premiums that decay | Overstates undervaluation of mature cards, understates it for new releases |
| Sealed product price | Directly affects pull cost and secondary market entry | Model uses stale pack prices |
| Sales velocity / liquidity | Determines if a price is "real" or a thin market artifact | May flag illiquid cards as undervalued when price is simply stale |
| Bid-ask spread | Wide spread = uncertain pricing | Overconfident in prices that are actually noisy |
| Reprint risk | Cards in sets likely to be reprinted face supply dilution | Model may flag a card as undervalued right before a reprint destroys value |
| Set popularity | Some sets carry a premium beyond individual card quality | Systematically misprices cards in beloved vs. forgettable sets |
| Chase concentration | Sets where one card is 80% of the value vs. evenly distributed | Affects sealed product opening dynamics and individual card supply |
| Price momentum | Rapidly rising or falling prices signal regime change | Model sees a snapshot, not a trajectory |
| Grading pop / centering difficulty | Affects graded card supply and raw-to-graded conversion economics | Ignores an entire secondary market layer |

### 2.4 Overfitting vs. Underfitting Assessment

**Overfitting risks**:
- Small dataset (only "top chase cards" from ~8-10 modern sets = roughly 15-25 data points)
- Two continuous variables can easily fit 15-25 points with high R²
- No stated cross-validation, holdout testing, or out-of-sample validation
- The 88% R² is almost certainly inflated by in-sample fitting on a small dataset

**Underfitting risks**:
- Only two input variables for a market driven by dozens of factors
- Mega Charizard X residual (~60% overpriced vs. model) is massive — that's not noise, it's missing structure
- The model likely underfits the tails of the distribution (extreme outliers in both directions)

**Verdict**: The model is probably BOTH overfitting on its small training set AND underfitting the true complexity of the market. It captures the central tendency well but misses the extremes where the most actionable signals live.

### 2.5 Why "Mispriced" Cards May Stay Mispriced

The model assumes the market will converge toward "fair value." But several forces can sustain divergence indefinitely:

1. **Collector vs. investor split**: Collectors pay premiums for personal attachment that the model can't capture. A collector who MUST have Mega Charizard X will pay $800 because it completes their collection. This is rational for them.
2. **Display and status value**: Cards bought for display (graded slabs) have consumption utility beyond resale value. The model treats cards as financial assets, but they're also aesthetic objects.
3. **Illiquidity premium**: Cards that are hard to find in high condition carry premiums because the COST of searching is real. A card may be "overvalued" on paper but fairly priced when search costs are included.
4. **Anchoring**: Once a card trades at $800, both buyers and sellers anchor to that number. Even if "fair value" is $500, market participants have adjusted expectations.
5. **Network effects**: If the Pokemon collecting community collectively believes Mega Charizard X is a $1000 card, the belief is partially self-fulfilling.

### 2.6 Is Ranking by Undervaluation Alone Sufficient?

**No.** Undervaluation ranking alone will surface:
- Low-liquidity cards where the model price is above a stale last-sold price
- Cards in dying sets where no one is buying
- Cards with data errors or outlier transactions
- New cards where the price hasn't settled

The system NEEDS a confidence/quality filter layered on top of the undervaluation signal. At minimum:
- Minimum sales volume threshold
- Minimum number of recent comps (last 30 days)
- Maximum bid-ask spread
- Minimum confidence score based on data freshness and volume

---

## PHASE 3 — ENHANCED MODEL DESIGN

### 3.1 Variable Definitions

#### Variable 1: Pull Cost Score

| Attribute | Value |
|-----------|-------|
| **Definition** | Expected dollar cost to pull one specific card from sealed product, based on current booster box market price, pull rate, and rarity slot dilution |
| **Why it matters** | Directly quantifies supply scarcity. Higher pull cost = fewer copies entering the market = higher equilibrium price |
| **Measurement** | `Pull_Cost = (Booster_Box_Price / Packs_Per_Box) × (1 / Pull_Rate) × Cards_In_Rarity_Slot` |
| **Data sources** | TCGplayer/PriceCharting for booster box prices; community-verified pull rates (PokeData, pull rate trackers); official set lists for rarity slot counts |
| **Scoring** | Log-normalize across all cards in dataset to 1–10 scale. `Score = 1 + 9 × (log(Pull_Cost) - log(min)) / (log(max) - log(min))` |
| **Nature** | Objective |
| **Recommended weight** | 20% of total model |

**Improvement over original**: Uses CURRENT booster box prices (not static pack MSRP), capturing the sealed product premium that makes vintage set cards more expensive to pull.

#### Variable 2: Rarity-Slot Control Score

| Attribute | Value |
|-----------|-------|
| **Definition** | How diluted the rarity slot is — how many other cards compete for the same slot in the same set |
| **Why it matters** | A card in a rarity slot with 5 cards is structurally scarcer than one with 30 cards, even at the same pull rate. Separating this from pull cost allows independent weighting. |
| **Measurement** | `Slot_Dilution = Cards_In_Rarity_Slot`. Inverse-scored: fewer cards = higher score |
| **Data sources** | Official Pokemon set lists, Bulbapedia, pokemontcg.io API |
| **Scoring** | Inverse linear normalization 1–10. `Score = 1 + 9 × (max_cards - cards) / (max_cards - min_cards)` |
| **Nature** | Objective |
| **Recommended weight** | 5% of total model (it's partially captured in pull cost already, but worth isolating) |

#### Variable 3: Character Premium Score

| Attribute | Value |
|-----------|-------|
| **Definition** | Historical market performance of a Pokemon character across ALL English printings, measured as average price PERCENTILE within its rarity tier and set |
| **Why it matters** | Charizard consistently commands top prices across every set. This is the strongest and most stable demand signal in the TCG. |
| **Measurement** | For each character: collect all English card printings → for each, calculate its price percentile within its rarity tier in its set → average all percentiles → normalize to 1–10 |
| **Data sources** | PriceCharting or TCGplayer for historical pricing; pokemontcg.io for complete printing history |
| **Scoring** | 1–10 normalized from average percentile rank |
| **Nature** | Objective (data-derived) |
| **Recommended weight** | 20% of total model |

**Improvement over original**: Using percentile within rarity tier (not raw rank) prevents set size from distorting the metric. A #1 card in a 5-card slot and a #1 card in a 30-card slot are treated equally.

#### Variable 4: Artwork / Visual Appeal Score

| Attribute | Value |
|-----------|-------|
| **Definition** | Quality and desirability of the card's specific artwork, isolated from character identity and lore |
| **Why it matters** | Two cards of the same Pokemon with different artwork can have wildly different prices. Artwork is the primary differentiator within a character's printings. |
| **Measurement** | Hybrid scoring: (a) Community polling / sentiment analysis from Reddit, Twitter, YouTube (60% of sub-score); (b) Structured rubric: composition, color palette, artist reputation, card type design (full art / alt art / illustration rare), uniqueness (40% of sub-score) |
| **Data sources** | Reddit /r/PokemonTCG sentiment, YouTube reveal reactions, Twitter/X engagement metrics on card reveals, structured manual evaluation |
| **Scoring** | 1–10 using defined rubric anchors: 1-2 = generic/bland; 3-4 = acceptable; 5-6 = good artwork, standard for tier; 7-8 = standout within set; 9-10 = community-recognized masterpiece |
| **Nature** | Hybrid (subjective scoring with objective sentiment validation) |
| **Recommended weight** | 15% of total model |

**Improvement over original**: Separated from character identity and hype. Validated against measurable community sentiment rather than one person's opinion. Rubric anchors make scoring reproducible.

#### Variable 5: Story / Lore Factor Score

| Attribute | Value |
|-----------|-------|
| **Definition** | Narrative significance of the specific card's context — does it reference a famous game moment, anime scene, or Pokemon lore event? |
| **Why it matters** | The "Bubble Mew" isn't just good artwork — it references Mew's iconic status in the original games. Cards that tap into shared memories or story moments carry pricing premiums that pure artwork scoring misses. |
| **Measurement** | Manual scoring based on: Does the card reference a specific game/anime moment? Is it a milestone printing (e.g., 25th anniversary)? Is it an homage to a classic card? Does it feature a legendary/mythical Pokemon in a lore-relevant context? |
| **Data sources** | Bulbapedia lore, card set descriptions, community context from forums |
| **Scoring** | 1–10. 1 = no lore connection; 5 = mild thematic relevance; 10 = iconic lore moment directly depicted |
| **Nature** | Subjective (but more constrained than artwork — lore facts are verifiable) |
| **Recommended weight** | 5% of total model |

#### Variable 6: Universal Appeal Score

| Attribute | Value |
|-----------|-------|
| **Definition** | Broad public recognition and search interest for the Pokemon character, measuring demand from casual buyers and non-collectors |
| **Why it matters** | Pikachu and Charizard command premiums partly because non-collectors buy them. This captures the "gift buyer" and "nostalgia buyer" market that character premium alone misses. |
| **Measurement** | Google Trends 12-month average search volume for "[Pokemon name] card" (not just the character name — "Charizard card" not "Charizard") |
| **Data sources** | Google Trends API, normalized against the top character |
| **Scoring** | Log-normalize to 1–10 (log because Charizard/Pikachu dominate linearly) |
| **Nature** | Objective |
| **Recommended weight** | 5% of total model |

**Improvement over original**: Search query includes "card" to filter for card-specific demand (not just game/anime interest). Log normalization prevents Charizard from drowning all other signals.

#### Variable 7: Print-Cycle Adjustment Score

| Attribute | Value |
|-----------|-------|
| **Definition** | Time-based adjustment capturing where a card sits in its price lifecycle: new release hype → price crash → stabilization → appreciation (or stagnation) |
| **Why it matters** | A card released 2 weeks ago is in a fundamentally different pricing regime than a card from 2 years ago. The model needs to understand WHERE in the cycle a card is. |
| **Measurement** | Three sub-signals: (a) Months since set release; (b) Is the set still in active print runs? (c) Has the sealed product price begun appreciating above MSRP? Combined into a lifecycle stage: "Hype" (0-3 months), "Correction" (3-9 months), "Stable" (9-24 months), "Appreciating" (24+ months and sealed rising) |
| **Data sources** | Set release dates (official), booster box price trends (TCGplayer/PriceCharting), print run status (Pokemon Company announcements, distributor availability) |
| **Scoring** | 1–10 where: 1-3 = still in hype/correction (high uncertainty); 4-6 = stabilizing; 7-10 = mature set with appreciating sealed product (high confidence) |
| **Nature** | Objective |
| **Recommended weight** | 10% of total model |

#### Variable 8: Liquidity Score

| Attribute | Value |
|-----------|-------|
| **Definition** | How easily and frequently a card actually trades on the secondary market |
| **Why it matters** | A "fair value" of $200 means nothing if the card sells once a month. Liquidity determines whether a valuation gap is actionable. |
| **Measurement** | Average daily sales volume over trailing 30 days on TCGplayer + eBay combined |
| **Data sources** | TCGplayer sales data (if available via API/scrape), eBay sold listings count |
| **Scoring** | Log-normalize to 1–10. 1 = <1 sale/week; 5 = 1-3 sales/day; 10 = 10+ sales/day |
| **Nature** | Objective |
| **Recommended weight** | 5% of total model (but CRITICAL as a filter — see ranking methodology) |

#### Variable 9: Volatility / Confidence Penalty

| Attribute | Value |
|-----------|-------|
| **Definition** | Standard deviation of sold prices over trailing 30 days, relative to the mean. High volatility = low confidence in current pricing. |
| **Why it matters** | A card whose price swings between $50 and $150 in a month has a meaningless "market price." Valuation gaps are unreliable in high-volatility environments. |
| **Measurement** | Coefficient of Variation (CV) = StdDev(last_30_sold_prices) / Mean(last_30_sold_prices) |
| **Data sources** | eBay sold listings, TCGplayer recent sales |
| **Scoring** | Inverse 1–10. Low CV (stable prices) = 10; High CV (wild swings) = 1 |
| **Nature** | Objective |
| **Recommended weight** | 5% of total model (primarily used as confidence modifier on ranking) |

#### Variable 10: Set Popularity Score

| Attribute | Value |
|-----------|-------|
| **Definition** | Overall market enthusiasm for the set as a whole, independent of individual card quality |
| **Why it matters** | Cards from beloved sets (Evolving Skies, 151) carry a set-level premium. Cards from forgettable sets (Battle Styles, Fusion Strike) are depressed regardless of individual merit. |
| **Measurement** | Composite of: (a) sealed product price trajectory vs MSRP; (b) total set sales volume; (c) community sentiment (Reddit mention frequency, YouTube video count) |
| **Data sources** | Sealed product prices (PriceCharting), Reddit/YouTube API for mention counts |
| **Scoring** | 1–10 normalized |
| **Nature** | Hybrid (objective sales data + sentiment signals) |
| **Recommended weight** | 5% of total model |

#### Variable 11: Chase Concentration Index

| Attribute | Value |
|-----------|-------|
| **Definition** | How concentrated the set's value is in its top cards. A "Charizard or bust" set (like Phantasmal Flames) vs. a set with evenly distributed value (like Destined Rivals). |
| **Why it matters** | In high-concentration sets, the chase card absorbs disproportionate value from pack opening — every non-chase pull is "wasted money," driving up the chase card price beyond what pull cost alone predicts. This explains Mega Charizard X. |
| **Measurement** | `Concentration = Price_of_Top_Card / Sum_of_Top_10_Cards_Prices`. Ranges from ~0.10 (even) to ~0.60+ (one card dominates). |
| **Data sources** | TCGplayer/PriceCharting card prices within the set |
| **Scoring** | Normalized 1–10. Higher concentration = higher score for the TOP card, lower score for non-chase cards in the same set |
| **Nature** | Objective |
| **Recommended weight** | 5% of total model |

**This is the variable that explains Mega Charizard X.** In a set where one card captures 50%+ of total set value, pack openers either hit the jackpot or get near-worthless pulls. This drives direct purchases of the chase card, inflating its price beyond pull-cost-based predictions.

### 3.2 Full Scoring Equation

**Modeled Fair Value**:

```
Composite_Score = (
    0.20 × Pull_Cost_Score +
    0.05 × Rarity_Slot_Score +
    0.20 × Character_Premium_Score +
    0.15 × Artwork_Score +
    0.05 × Lore_Score +
    0.05 × Universal_Appeal_Score +
    0.10 × Print_Cycle_Score +
    0.05 × Liquidity_Score +
    0.05 × Volatility_Score_Inverse +
    0.05 × Set_Popularity_Score +
    0.05 × Chase_Concentration_Score
)

Modeled_Price = e^(α + β × Composite_Score)
```

Where α and β are calibrated via regression on the training set of cards with known market prices.

**Alternatively, a multi-factor regression**:

```
ln(Market_Price) = β₀ + β₁×Pull_Cost + β₂×Rarity_Slot + β₃×Character_Premium
                   + β₄×Artwork + β₅×Lore + β₆×Universal_Appeal
                   + β₇×Print_Cycle + β₈×Liquidity + β₉×Volatility_Inv
                   + β₁₀×Set_Popularity + β₁₁×Chase_Concentration + ε
```

This second form is BETTER because it lets the data determine relative weights rather than us imposing them a priori. Use the first form (fixed weights) only for the MVP before you have enough data for regression.

### 3.3 Ranking Methodology for Undervalued Cards

The ranking system is NOT just "sort by valuation gap." It's a multi-lens system.

**Ranking Lens 1: Highest Undervaluation % (Relative Bargains)**

```
Rank by: (Modeled_Price - Market_Price) / Market_Price DESC
Filter: Liquidity_Score >= 4, Volatility_Score >= 4, Print_Cycle_Score >= 4
```

Best for: Finding percentage-return opportunities. $50 card modeled at $100 = 100% upside.

**Ranking Lens 2: Highest Absolute Dollar Gap (Big-Ticket Opportunities)**

```
Rank by: (Modeled_Price - Market_Price) DESC
Filter: Liquidity_Score >= 5, Market_Price >= $50
```

Best for: Investors looking for dollar-value opportunities, not percentage games.

**Ranking Lens 3: Best Undervalued Cards Above Confidence Threshold (High-Conviction Picks)**

```
Confidence_Score = (Liquidity_Score + Volatility_Score_Inverse + Print_Cycle_Score) / 3
Rank by: Valuation_Gap_Percent DESC
Filter: Confidence_Score >= 6
```

Best for: Risk-averse collectors who want undervalued cards they can trust the data on.

**Ranking Lens 4: Best Within Budget**

```
Rank by: Valuation_Gap_Percent DESC
Filter: Market_Price <= [user_budget], Liquidity_Score >= 3
```

Best for: Collectors with a specific budget looking for the best value.

**Ranking Lens 5: Best Within Specific Filters (Pokemon, Set, Era, Rarity)**

```
Rank by: Valuation_Gap_Percent DESC
Filter: [user-selected filters] + Liquidity_Score >= 3
```

Best for: Targeted collecting — "show me the most undervalued Charizard" or "best deals in Scarlet & Violet era."

**Ranking Lens 6: Collector Picks vs. Investment Picks**

Collector Pick criteria:
- Artwork_Score >= 7
- Lore_Score >= 5
- Valuation_Gap_Percent > 0 (any undervaluation)
- No minimum liquidity requirement

Investment Pick criteria:
- Valuation_Gap_Percent >= 15%
- Liquidity_Score >= 5
- Volatility_Score >= 5
- Print_Cycle_Score >= 5
- Confidence_Score >= 6

---

## PHASE 4 — DATA LAYER DESIGN

### 4.1 Primary Data Sources

#### Source 1: TCGplayer

| Attribute | Detail |
|-----------|--------|
| **Data available** | Current market prices, recent sales, price history, card listings, seller inventory, set metadata |
| **Access method** | Official API (TCGplayer API v2.0) — requires developer account and approval. Rate-limited. Alternatively, structured scraping of public product pages. |
| **Reliability** | High — industry standard pricing reference for English-language cards |
| **Latency** | Near real-time for listed prices; sold data may lag 1-24 hours |
| **Cost** | API is free tier with limits; higher volume requires partnership. Scraping has infrastructure cost only. |
| **Model feed** | Market_Price, Liquidity (sales count), Volatility (price history), Set_Popularity (set-level sales) |
| **English-only** | Yes — TCGplayer is English-language card focused. Clean filtering. |

#### Source 2: PriceCharting

| Attribute | Detail |
|-----------|--------|
| **Data available** | Aggregated prices across conditions (ungraded, PSA 10, PSA 9, etc.), price history charts, set completion data, booster box prices |
| **Access method** | Affiliate API (requires approval), or structured scraping of public pages |
| **Reliability** | High for trending and historical data; aggregation methodology not fully transparent |
| **Latency** | Daily updates typically |
| **Cost** | API free with attribution requirements |
| **Model feed** | Historical_Price, Booster_Box_Price (for Pull_Cost), Character_Premium (historical cross-set data), Print_Cycle (sealed product trends) |
| **English-only** | Primarily English. Japanese cards are listed separately. |

#### Source 3: eBay Sold Listings

| Attribute | Detail |
|-----------|--------|
| **Data available** | Actual transaction prices, auction vs. BIN split, seller info, listing photos, condition notes, sales timestamps, volume |
| **Access method** | eBay Browse API (Finding API deprecated) or scraping of completed listings. Terapeak for volume sellers. |
| **Reliability** | High for actual market clearing prices; noise from misidentified cards, misgraded cards, and shill bidding |
| **Latency** | Near real-time; completed listings visible within hours |
| **Cost** | eBay API free tier (5000 calls/day); Terapeak requires eBay Store subscription |
| **Model feed** | Market_Price (sold comps), Liquidity (sales frequency), Volatility (price dispersion), Bid-Ask_Spread (listing vs. sold delta) |
| **English-only** | Filter by item location (US/UK/AU/CA) and title keywords. Requires card-level language detection (some sellers list Japanese cards without clear labeling). |

#### Source 4: Pokemon TCG API (pokemontcg.io)

| Attribute | Detail |
|-----------|--------|
| **Data available** | Complete card database: every card ever printed with name, set, number, rarity, types, artist, images, legality. Also includes TCGplayer price data. |
| **Access method** | Free REST API with optional API key for higher rate limits |
| **Reliability** | Very high for card metadata. Pricing data pulled from TCGplayer. |
| **Latency** | Card data is near-complete. Some new sets may lag a few days. |
| **Cost** | Free |
| **Model feed** | Card metadata (name, set, rarity, artist), Rarity_Slot (count cards per rarity per set), Character identification, Set data, English-only filtering |
| **English-only** | Can filter by language parameter directly. Cleanest source for language filtering. |

#### Source 5: Pull Rate Data

| Attribute | Detail |
|-----------|--------|
| **Data available** | Community-aggregated pull rates per rarity tier per set, based on large-scale pack opening data |
| **Access method** | Manual collection from: PokeRand, PTCGRadar, Reddit /r/PokemonTCG pull rate threads, YouTube pack opening aggregators, dedicated pull rate tracking sites |
| **Reliability** | Moderate — based on sample sizes that vary widely. Newer sets have better data. Older sets may rely on theoretical calculations from The Pokemon Company's rarity distribution statements. |
| **Latency** | Usually available 1-4 weeks after set release as community data accumulates |
| **Cost** | Free (community data) |
| **Model feed** | Pull_Rate for Pull_Cost calculation |
| **English-only** | Pull rates are generally the same for English and Japanese within the same product type, but English and Japanese products have different structures. Must match pull rate to the correct product SKU. |

#### Source 6: PSA Population Reports

| Attribute | Detail |
|-----------|--------|
| **Data available** | Number of cards graded at each grade level (PSA 1-10) per card per year |
| **Access method** | PSA Cert Verification lookup (public), PSA Pop Report (public web). No official bulk API — scraping required. Third-party services (PopReport.com) aggregate data. |
| **Reliability** | High for PSA specifically; does not capture BGS, CGC, or unsubmitted cards |
| **Latency** | Updated daily-ish; new submissions take 2-8 weeks to appear |
| **Cost** | Free to view; scraping infrastructure cost |
| **Model feed** | Grading population data (for future graded card features), relative scarcity signal |
| **English-only** | PSA does not explicitly label language in pop reports for modern cards. English vs. Japanese must be inferred from set code or cert lookup. |

#### Source 7: Google Trends

| Attribute | Detail |
|-----------|--------|
| **Data available** | Relative search interest over time for any query, by geography |
| **Access method** | Unofficial API (pytrends library), or manual export. Official API does not exist. |
| **Reliability** | Moderate — relative numbers only (not absolute volume), subject to sampling |
| **Latency** | Near real-time for daily data; weekly data has slight lag |
| **Cost** | Free; rate-limited |
| **Model feed** | Universal_Appeal_Score |
| **English-only** | Filter by geography (US, UK, etc.) to approximate English-market interest |

### 4.2 Data Gaps and Approximations

| Gap | Impact | Approximation Strategy |
|-----|--------|----------------------|
| **Exact print run sizes** | Cannot calculate true supply. Pull cost is a proxy. | Use expected-packs-to-pull as supply proxy. Cross-reference with sealed product availability. |
| **Real-time TCGplayer sold data** | API may not expose granular sold data. | Supplement with eBay sold listings. Use TCGplayer "last sold" when available. |
| **Artwork sentiment scoring at scale** | Cannot manually score thousands of cards. | Seed with manual scores for top chase cards. Use Reddit upvote/comment ratios on card reveal posts as proxy. Long-term: fine-tuned image model or community voting system. |
| **Lore scoring at scale** | Manual and niche. | Binary flag initially (is this card lore-significant? y/n). Expand to 1-10 for top cards only. |
| **Japanese-to-English price differentials** | Many English cards are "previewed" by Japanese releases. | Track Japanese card prices as leading indicators for upcoming English releases. Out of scope for MVP. |
| **Pull rate data for older sets** | Community data is sparse pre-2020. | Use theoretical rates based on Pokemon Company's stated rarity distribution formulas. |
| **Seller manipulation / wash trading** | Inflated prices from self-buying. | Filter outlier transactions (>2 standard deviations from rolling mean). Require minimum 5 comps. |

---

## PHASE 5 — PRODUCT ARCHITECTURE

### 5.1 Core Dashboard Layout

```
+------------------------------------------------------------------+
|  POKEMON CARD FINDER — Undervalued Card Discovery Engine          |
|  [Search: card name, Pokemon, set...]  [Language: English]        |
+------------------------------------------------------------------+
|                                                                    |
|  FILTER BAR (collapsible):                                         |
|  [Price Range ▼] [Undervaluation % ▼] [Set ▼] [Year ▼]          |
|  [Pokemon ▼] [Rarity ▼] [Min Liquidity ▼] [Min Confidence ▼]    |
|  [Sort By ▼] [View: Collector | Investor] [Raw | Graded]          |
|                                                                    |
+--------------------+---------------------------------------------+
|  QUICK VIEWS       |  MAIN CARD GRID                              |
|                    |                                               |
|  Top Undervalued   |  +--------+ +--------+ +--------+ +--------+ |
|  Best Confidence   |  | Card 1 | | Card 2 | | Card 3 | | Card 4 | |
|  Hot Movers        |  | img    | | img    | | img    | | img    | |
|  New Signals       |  | $45    | | $120   | | $89    | | $200   | |
|  My Watchlist      |  | +32%▲  | | +18%▲  | | +45%▲  | | -12%▼  | |
|  Alerts            |  | ●●●●○  | | ●●●●●  | | ●●●○○  | | ●●●●○  | |
|                    |  +--------+ +--------+ +--------+ +--------+ |
|  PRICE BANDS       |                                               |
|  Under $25         |  +--------+ +--------+ +--------+ +--------+ |
|  $25-$50           |  | Card 5 | | Card 6 | | Card 7 | | Card 8 | |
|  $50-$100          |  | ...    | | ...    | | ...    | | ...    | |
|  $100-$250         |  +--------+ +--------+ +--------+ +--------+ |
|  $250-$500         |                                               |
|  $500+             |  [Load More...]                               |
|                    |                                               |
+--------------------+---------------------------------------------+
```

### 5.2 Card Grid Tile (Each Card in Grid)

Each tile shows at a glance:
- **Card image** (from pokemontcg.io)
- **Card name** + set icon
- **Current market price** (prominent)
- **Valuation indicator**: Green up arrow (undervalued) / Red down arrow (overvalued) with percentage
- **Confidence dots** (1-5 filled dots representing confidence score)
- **Watchlist star** (toggle)
- **Mini sparkline** (30-day price trend)

### 5.3 Card Detail Page

```
+------------------------------------------------------------------+
|  ← Back to Results                                                |
+------------------------------------------------------------------+
|                                                                    |
|  +----------------+  CHARIZARD EX 223/197                          |
|  |                |  Obsidian Flames (SV03) · 2023                 |
|  |   [CARD IMG]   |  Rarity: Special Illustration Rare             |
|  |                |  Language: English                              |
|  |                |                                                |
|  +----------------+  PRICING                                       |
|                      Market Price:    $185.00                      |
|                      Modeled Value:   $232.50                      |
|                      Gap:            +$47.50 (+25.7%) ▲ UNDERVAL   |
|                      30d High/Low:    $210 / $165                  |
|                      Confidence:      ●●●●○ (8.2/10)              |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |  SCORING BREAKDOWN (Radar/Spider Chart)                       | |
|  |                                                                | |
|  |        Pull Cost: 3.2          Character: 9.8                 | |
|  |        Artwork: 7.8            Lore: 4.0                      | |
|  |        Universal: 9.5          Print Cycle: 7.0               | |
|  |        Set Pop: 5.5            Chase Conc: 6.2                | |
|  |        Liquidity: 8.0          Volatility: 7.5                | |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  PRICE HISTORY CHART (line chart, 90d / 1y / all-time)           |
|  [Chart showing market price vs. modeled price over time]          |
|                                                                    |
|  COMPARABLE CARDS                                                  |
|  [Other Charizard cards ranked by valuation gap]                   |
|                                                                    |
|  MARKET DATA                                                       |
|  Sales Volume (30d): 145 sales                                     |
|  Avg Daily Sales: 4.8                                              |
|  Listing Count: 312 active                                         |
|  Median Sold: $183   |   Avg Sold: $188   |   Last Sold: $185     |
|  Bid-Ask Spread: 8.2%                                              |
|                                                                    |
|  [Add to Watchlist]  [Set Price Alert]  [View on TCGplayer →]     |
+------------------------------------------------------------------+
```

### 5.4 Filters (Full Specification)

| Filter | Type | Options |
|--------|------|---------|
| Price Range | Range slider | $0 — $5000+ (or preset bands: Under $25, $25-50, $50-100, $100-250, $250-500, $500+) |
| Undervaluation % | Range slider | -100% to +200% (negative = overvalued) |
| Absolute Valuation Gap | Range slider | -$500 to +$1000 |
| Pokemon Set | Multi-select dropdown | All English sets, grouped by era (SV, SWSH, SM, XY, etc.) |
| Year of Release | Range slider or multi-select | 2013 — Present |
| Pokemon Character | Searchable dropdown | All characters with cards |
| Rarity Tier | Multi-select | Common, Uncommon, Rare, Holo Rare, Ultra Rare, Full Art, Alt Art, Special Art Rare, Illustration Rare, Special Illustration Rare, Hyper Rare, Secret Rare |
| Language | Fixed: English | Not user-changeable in v1 — hardcoded |
| Condition | Toggle: Raw / Graded / Both | Default: Raw |
| Min Liquidity | Slider (1-10) or toggle: "Active market only" (≥4) | Default: 3 |
| Min Confidence | Slider (1-10) or toggle: "High confidence only" (≥6) | Default: off |
| View Mode | Toggle: Collector / Investor | Changes default sort and which scores are emphasized |
| Min Sales Volume (30d) | Number input | Default: 5 |

### 5.5 Sort Options

| Sort | Description |
|------|-------------|
| Undervaluation % (High → Low) | Default for investor view |
| Absolute Gap ($) (High → Low) | Dollar-value opportunity sort |
| Confidence Score (High → Low) | Trust the data sort |
| Market Price (Low → High / High → Low) | Standard price sort |
| Ranking Score (composite) | Blended sort using weighted undervaluation + confidence |
| Trending (Most improved valuation gap, 7d) | What's becoming more undervalued |
| Newly Detected | Recently identified undervaluation signals |

### 5.6 Over/Undervaluation Indicator Logic

```
valuation_gap_pct = (modeled_price - market_price) / market_price × 100

Display rules:
  gap > +30%  → Deep green, "STRONG BUY SIGNAL" (if confidence ≥ 6)
  gap > +15%  → Green, "Undervalued"
  gap > +5%   → Light green, "Slightly Undervalued"
  gap -5% to +5% → Gray, "Fair Value"
  gap < -5%   → Light red, "Slightly Overvalued"
  gap < -15%  → Red, "Overvalued"
  gap < -30%  → Deep red, "Significantly Overvalued" (or model limitation)

Confidence overlay:
  If confidence < 4 → append "(Low Confidence)" and dim the color
  If confidence < 2 → show as "Insufficient Data" instead of a valuation signal
```

### 5.7 Confidence Score Calculation

```
Confidence_Score = (
    0.35 × Liquidity_Score +
    0.30 × Volatility_Score_Inverse +
    0.20 × Print_Cycle_Score +
    0.15 × Data_Freshness_Score
)

Data_Freshness_Score:
  10 = last sale within 24 hours
  7  = last sale within 7 days
  4  = last sale within 30 days
  1  = last sale > 30 days ago
```

### 5.8 Watchlist System

- Users can star any card to add to their personal watchlist
- Watchlist page shows all starred cards with current valuation status
- Cards on watchlist are monitored for alert triggers
- Watchlist supports custom notes per card
- Export watchlist to CSV

### 5.9 Alert System

| Alert Type | Trigger | Delivery |
|------------|---------|----------|
| Undervaluation threshold | Card crosses user-defined undervaluation % (e.g., >25%) | Email, in-app notification |
| Price drop | Market price drops >X% in 24 hours | Email, in-app |
| New undervalued signal | A new card enters the "undervalued" zone for the first time | In-app, daily digest email |
| Watchlist card movement | Any watchlist card changes valuation status | In-app |
| Confidence upgrade | A previously low-confidence card gains enough data to become high-confidence | In-app |

### 5.10 Refresh / Update Frequency Strategy

| Data Type | Refresh Frequency | Rationale |
|-----------|-------------------|-----------|
| Market prices | Every 6 hours | Balance freshness vs. API cost |
| Sales volume / liquidity | Daily | Doesn't change rapidly enough to need more |
| Modeled prices | Daily (after market price refresh) | Model re-runs once inputs update |
| Pull rate data | Monthly or on new set release | Stable after initial community consensus |
| Character premium | Weekly | Historical data shifts slowly |
| Artwork/lore scores | Manual update cycle (monthly or on new set) | Subjective scores don't auto-update |
| Google Trends | Weekly | Trends are noisy day-to-day |
| Booster box prices | Daily | Direct input to pull cost |

### 5.11 Handling Noisy / Conflicting Data

1. **Outlier transaction filtering**: Exclude sold prices >2.5 standard deviations from 30-day rolling mean
2. **Minimum comps requirement**: Require ≥3 comparable sales in last 30 days to generate a market price. Below this threshold, show "Insufficient Data"
3. **Source triangulation**: When TCGplayer and eBay disagree by >20%, flag the card and use the source with more recent sales
4. **Condition mismatch filtering**: eBay listings must be filtered to NM/Mint condition only for raw card pricing (exclude damaged, HP, MP)
5. **Misidentified card filtering**: Match eBay listings against known card numbers and set codes. Reject listings that don't match unambiguously.

### 5.12 Excluding Illiquid / Manipulated Cards

**Illiquidity filter**: Cards with <3 sales in 30 days are excluded from rankings by default (but visible in search results with a "Low Liquidity" badge)

**Manipulation detection**:
- Flag cards where listing price is >50% above recent sold prices (listing manipulation)
- Flag cards where a single seller accounts for >40% of recent sales (wash trading risk)
- Flag cards where the price spiked >100% in <7 days without a clear catalyst (pump risk)

### 5.13 Collector vs. Investor Mode

| Aspect | Collector Mode | Investor Mode |
|--------|---------------|---------------|
| Default sort | Artwork Score × Undervaluation | Undervaluation % × Confidence |
| Emphasized scores | Artwork, Lore, Character Premium | Liquidity, Volatility, Gap % |
| Card detail emphasis | Visual, lore context, comparable artworks | Market data, sales velocity, price charts |
| Recommendations | "Beautiful undervalued cards" | "High-conviction undervalued opportunities" |
| Minimum filters | None (show everything) | Liquidity ≥ 5, Confidence ≥ 5 |

---

## PHASE 6 — OUTPUT SCHEMA

### 6.1 Core Card Valuation Record

```sql
CREATE TABLE card_valuations (
    -- Identity
    card_id             TEXT PRIMARY KEY,      -- "{set_code}-{card_number}" e.g., "sv03-223"
    card_name           TEXT NOT NULL,          -- "Charizard ex"
    pokemon_character   TEXT NOT NULL,          -- "Charizard"
    set_name            TEXT NOT NULL,          -- "Obsidian Flames"
    set_code            TEXT NOT NULL,          -- "sv03"
    card_number         TEXT NOT NULL,          -- "223/197"
    year_of_release     INTEGER NOT NULL,       -- 2023
    language            TEXT NOT NULL DEFAULT 'en', -- Always 'en' for v1
    rarity_tier         TEXT NOT NULL,          -- "Special Illustration Rare"
    artist              TEXT,                   -- "Akira Komayama"

    -- Supply Variables
    rarity_slot_count   INTEGER,               -- Number of cards in same rarity slot in this set
    pull_rate           REAL,                   -- 1 in X packs for this rarity tier
    pull_cost_raw       REAL,                   -- Expected dollar cost to pull this specific card
    pull_cost_score     REAL,                   -- Normalized 1-10
    rarity_slot_score   REAL,                   -- Normalized 1-10 (inverse of dilution)

    -- Demand Variables
    character_premium   REAL,                   -- Normalized 1-10
    artwork_score       REAL,                   -- 1-10 (hybrid)
    lore_score          REAL,                   -- 1-10 (subjective)
    universal_appeal    REAL,                   -- 1-10 (Google Trends derived)

    -- Context Variables
    print_cycle_stage   TEXT,                   -- "hype" | "correction" | "stable" | "appreciating"
    print_cycle_score   REAL,                   -- 1-10
    set_popularity      REAL,                   -- 1-10
    chase_concentration REAL,                   -- 0.0-1.0 (ratio), also stored as 1-10 score

    -- Market Data
    liquidity_score     REAL,                   -- 1-10
    sales_volume_30d    INTEGER,                -- Raw count of sales in last 30 days
    avg_daily_sales     REAL,                   -- Average sales per day (30d)
    volatility_cv       REAL,                   -- Coefficient of variation of sold prices (30d)
    volatility_score    REAL,                   -- 1-10 (inverse — higher = more stable)
    bid_ask_spread_pct  REAL,                   -- (avg_listing - avg_sold) / avg_sold × 100
    data_freshness      TEXT,                   -- ISO timestamp of most recent sale used

    -- Confidence
    confidence_score    REAL,                   -- 1-10 composite

    -- Valuation
    modeled_price       REAL,                   -- Model-predicted fair value in USD
    current_market_price REAL,                  -- Current market price in USD
    valuation_gap_dollar REAL,                  -- modeled_price - market_price
    valuation_gap_percent REAL,                 -- (modeled - market) / market × 100

    -- Ranking
    ranking_score       REAL,                   -- Composite ranking metric
    ranking_reason      TEXT,                   -- Human-readable explanation: "High character premium + strong undervaluation with reliable data"

    -- Metadata
    last_updated        TIMESTAMP NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_valuation_gap ON card_valuations(valuation_gap_percent DESC);
CREATE INDEX idx_set ON card_valuations(set_code);
CREATE INDEX idx_character ON card_valuations(pokemon_character);
CREATE INDEX idx_rarity ON card_valuations(rarity_tier);
CREATE INDEX idx_price ON card_valuations(current_market_price);
CREATE INDEX idx_confidence ON card_valuations(confidence_score DESC);
CREATE INDEX idx_year ON card_valuations(year_of_release);
```

### 6.2 Supporting Tables

```sql
-- Historical pricing for charts
CREATE TABLE price_history (
    card_id         TEXT REFERENCES card_valuations(card_id),
    date            DATE NOT NULL,
    market_price    REAL,
    modeled_price   REAL,
    sales_count     INTEGER,
    PRIMARY KEY (card_id, date)
);

-- User watchlist
CREATE TABLE watchlists (
    user_id     TEXT NOT NULL,
    card_id     TEXT REFERENCES card_valuations(card_id),
    added_at    TIMESTAMP DEFAULT NOW(),
    notes       TEXT,
    PRIMARY KEY (user_id, card_id)
);

-- User alerts
CREATE TABLE alerts (
    alert_id        SERIAL PRIMARY KEY,
    user_id         TEXT NOT NULL,
    card_id         TEXT REFERENCES card_valuations(card_id),
    alert_type      TEXT NOT NULL, -- 'undervaluation_threshold', 'price_drop', 'new_signal'
    threshold_value REAL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Set-level metadata
CREATE TABLE sets (
    set_code            TEXT PRIMARY KEY,
    set_name            TEXT NOT NULL,
    release_date        DATE,
    total_cards         INTEGER,
    era                 TEXT,           -- "Scarlet & Violet", "Sword & Shield", etc.
    booster_box_price   REAL,           -- Current market price
    packs_per_box       INTEGER DEFAULT 36,
    set_popularity_score REAL,
    still_in_print      BOOLEAN,
    last_updated        TIMESTAMP
);

-- Character-level metadata
CREATE TABLE characters (
    character_name      TEXT PRIMARY KEY,
    total_printings     INTEGER,
    avg_price_percentile REAL,
    character_premium_score REAL,
    google_trends_score REAL,
    universal_appeal_score REAL,
    last_updated        TIMESTAMP
);
```

### 6.3 Sample Record

```json
{
    "card_id": "sv03-223",
    "card_name": "Charizard ex",
    "pokemon_character": "Charizard",
    "set_name": "Obsidian Flames",
    "set_code": "sv03",
    "card_number": "223/197",
    "year_of_release": 2023,
    "language": "en",
    "rarity_tier": "Special Illustration Rare",
    "artist": "Akira Komayama",
    "rarity_slot_count": 6,
    "pull_rate": 0.022,
    "pull_cost_raw": 245.00,
    "pull_cost_score": 2.1,
    "rarity_slot_score": 7.5,
    "character_premium": 9.8,
    "artwork_score": 7.8,
    "lore_score": 4.0,
    "universal_appeal": 9.5,
    "print_cycle_stage": "stable",
    "print_cycle_score": 7.0,
    "set_popularity": 5.5,
    "chase_concentration": 6.2,
    "liquidity_score": 8.0,
    "sales_volume_30d": 145,
    "avg_daily_sales": 4.8,
    "volatility_cv": 0.12,
    "volatility_score": 7.5,
    "bid_ask_spread_pct": 8.2,
    "data_freshness": "2026-04-06T14:00:00Z",
    "confidence_score": 7.8,
    "modeled_price": 232.50,
    "current_market_price": 185.00,
    "valuation_gap_dollar": 47.50,
    "valuation_gap_percent": 25.7,
    "ranking_score": 78.3,
    "ranking_reason": "Top-tier character premium (Charizard) with low pull cost creating accessible supply. Artwork slightly below peak for character. Stable mature set with strong liquidity. Model suggests 25% upside relative to historical character performance."
}
```

---

## PHASE 7 — BUILD STRATEGY

### 7.1 Phased Roadmap

#### Phase 1 — MVP (Weeks 1-4): Static Undervalued Card Finder

**Goal**: Fastest useful version. A searchable, filterable table of English Pokemon cards with undervaluation signals.

**Build**:
- Ingest card metadata from pokemontcg.io API (all English cards)
- Pull current market prices from TCGplayer (via API or structured scrape)
- Calculate pull cost for modern sets (Scarlet & Violet era only) using community pull rates
- Compute character premium from historical pricing data
- Manually score artwork/lore for top ~100 chase cards across 10-15 sets
- Apply fixed-weight composite model (Phase 3 equation with pre-set weights)
- Build a basic web UI: filterable table + card detail page
- Deploy as static site with daily data refresh

**Exclude from MVP**:
- User accounts, watchlists, alerts
- Graded card pricing
- Vintage/older sets
- Automated artwork scoring
- eBay data integration (use TCGplayer only)
- Real-time pricing
- Radar charts (just show numbers)

**Stack**:
- Frontend: Next.js (React) with Tailwind CSS
- Backend: Supabase (PostgreSQL + auth + API for free)
- Data pipeline: Python scripts (pandas, requests) on a daily cron
- Hosting: Vercel (free tier)
- Data refresh: GitHub Actions (free) running Python ETL daily

**Cost**: $0/month (all free tiers)

#### Phase 2 — Data Enrichment + Better Scoring (Weeks 5-10)

**Add**:
- eBay sold listing integration for market price triangulation
- Liquidity and volatility scoring from sales data
- Confidence score computation
- Booster box price tracking for dynamic pull cost
- Expand coverage to Sword & Shield era sets
- Print-cycle stage detection
- Set popularity scoring
- Price history charts (30d, 90d, 1y)
- Basic user accounts (Supabase auth)
- Watchlist functionality

#### Phase 3 — Automation + Alerts (Weeks 11-16)

**Add**:
- Automated data pipeline (no manual intervention)
- Email alert system for watchlist cards
- Alert configuration UI
- Chase concentration index calculation
- Community artwork scoring (voting system)
- Expanded to all modern English sets
- Mobile-responsive design optimization
- Export functionality (CSV, portfolio tracking)

#### Phase 4 — Advanced Analytics / Predictive Layer (Weeks 17+)

**Add**:
- Machine learning regression replacing fixed-weight model (enough data to train properly)
- Predictive signals: which cards are ABOUT to become undervalued
- Japanese release → English price prediction pipeline
- Graded card pricing layer
- Sealed product investment analysis
- Portfolio tracker with unrealized gains/losses
- Community features (discussion, shared watchlists)
- Vintage set expansion

### 7.2 Tech Stack Recommendation

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14 + Tailwind CSS + shadcn/ui | Fast to build, good SEO for card pages, free hosting on Vercel |
| Backend/DB | Supabase (PostgreSQL) | Free tier is generous (500MB, 50K monthly active users). Built-in auth, real-time subscriptions, REST API auto-generated from schema. |
| Data Pipeline | Python (pandas, requests, beautifulsoup4) | Best ecosystem for data scraping, transformation, and analysis |
| Scheduling | GitHub Actions | Free for public repos. Runs daily data refresh pipeline. |
| Hosting | Vercel (frontend) + Supabase (backend) | $0/month at MVP scale |
| Charts | Recharts or Chart.js | Lightweight, works with React, handles price history and radar charts |
| Search | Supabase full-text search (built-in PostgreSQL) | No additional service needed for MVP |

### 7.3 Scraping vs. API Strategy

| Source | Strategy | Rationale |
|--------|----------|-----------|
| pokemontcg.io | API | Free, reliable, well-documented. Use for all card metadata. |
| TCGplayer | API first, scrape as fallback | Apply for API access. If rejected or insufficient, scrape public product pages respectfully (rate-limited, cached). |
| PriceCharting | API (affiliate) | Apply for affiliate API. Good for booster box prices and historical data. |
| eBay | API (Browse API) | Official API is free for completed item searches. Sufficient for sold price data. |
| Google Trends | pytrends (unofficial) | No official API exists. pytrends is standard approach. Cache results aggressively. |
| PSA Pop Reports | Scrape (deferred) | Not needed for MVP. Add in Phase 4. |

### 7.4 Keeping Costs Low

1. **All free tiers initially**: Vercel, Supabase, GitHub Actions, pokemontcg.io, Google Trends
2. **Cache aggressively**: Store API responses locally. Most data doesn't change hourly.
3. **Batch processing**: Run data pipeline once daily during off-peak hours, not real-time
4. **Start narrow**: Only top chase cards from SV era (~100-150 cards). Expand gradually.
5. **Static generation**: Pre-render card pages at build time. No server-side computation per request.
6. **No infrastructure to manage**: Serverless everything. No VPS, no containers.

### 7.5 Enforcing English-Only Scope

1. **pokemontcg.io**: Filter by `language=en` parameter on all API calls
2. **TCGplayer**: Only index cards from the English TCGplayer storefront (tcgplayer.com, not Japanese)
3. **eBay**: Filter by item location (US, UK, Canada, Australia) + exclude title keywords ("Japanese", "JP", "JPN")
4. **Database**: `language` column defaulted to 'en', enforced with a CHECK constraint
5. **UI**: No language selector in v1. Hardcode "English" in header. Add Japanese as future expansion.

---

## PHASE 8 — EDGE CASES & FAILURE MODES

### 8.1 Hype Spikes (e.g., new set release)

**What happens**: A new set drops. Prices are inflated by 50-300% in the first 2-4 weeks due to limited supply and maximum hype.

**How the model handles it**: The Print-Cycle Adjustment score marks these cards as "Hype" stage (score 1-3). The confidence score is low because of limited sales data and high volatility. The system will NOT flag them as undervalued even if the composite score suggests it, because the confidence penalty suppresses the signal.

**Remaining risk**: If someone manually forces a high artwork score on a new card, the model may still generate a misleading signal. Mitigation: artwork scores for cards <30 days old should be provisional and flagged.

### 8.2 Influencer-Driven Demand

**What happens**: A major YouTuber opens a pack on camera, pulls a specific card, goes viral. The card price spikes 50-200% in 48 hours.

**How the model handles it**: The model does NOT capture this. It will flag the card as suddenly "overvalued" because the market price jumped above the modeled price. This is actually CORRECT behavior — the model is saying "this spike is not supported by fundamentals."

**Remaining risk**: If the influencer effect is permanent (shifts community consensus on the card's artwork/desirability), the model's artwork score needs updating. The volatility score will correctly flag the uncertainty.

### 8.3 Supply Shocks (Reprints)

**What happens**: Pokemon Company announces a reprint of a popular set. Sealed product prices crash. Single card prices follow.

**How the model handles it**: Pull Cost Score will adjust downward as booster box prices drop (if using current BB prices). Print-Cycle Score should shift from "appreciating" back to "stable" or "correction." The model will automatically reduce the modeled price.

**Remaining risk**: The model cannot PREDICT reprints. A card flagged as "undervalued" today could be reprinted tomorrow. Mitigation: add a "reprint risk" flag for sets that are candidates for reprinting (based on age, popularity, and Pokemon Company patterns).

### 8.4 Grading Population Distortions

**What happens**: A card is easy to grade PSA 10, flooding the graded market. Or a card is nearly impossible to grade PSA 10, creating extreme scarcity.

**How the model handles it**: The MVP model does NOT handle this. It only prices raw cards.

**Remaining risk**: Users who buy raw cards with the intent to grade them may get bad signals. A card that's "undervalued" raw may be worthless to grade if PSA 10 pop is already high. Mitigation: Phase 4 adds grading population data. For now, clearly label all prices as "Raw / Near Mint."

### 8.5 Low-Liquidity Cards

**What happens**: A card has 1-2 sales per month. The "market price" is based on a single transaction that may be an outlier.

**How the model handles it**: Liquidity_Score will be 1-2. Confidence_Score will be suppressed below 4. The card will be excluded from default rankings. In the UI, it will show a "Low Liquidity" badge and a dimmed valuation indicator.

**Remaining risk**: The card's modeled price is still computed and could be wildly wrong. Users who disable the liquidity filter may see misleading signals. Mitigation: when confidence < 3, show "Insufficient Data" instead of a valuation gap.

### 8.6 Newly Released Sets (< 30 Days)

**What happens**: Prices are volatile, sales volume is high but erratic, pull rate data may not be confirmed yet.

**How the model handles it**: Print_Cycle_Score = 1-2 (hype stage). All scores are provisional. A "NEW SET" badge appears on the card tile. Rankings are suppressed by default for cards < 30 days old.

**Remaining risk**: High sales volume may make liquidity look good even though prices are unstable. The volatility score should catch this, but if initial prices cluster tightly (before the correction starts), volatility may not trigger.

### 8.7 Manipulated Comps

**What happens**: A seller buys their own listing to inflate the "last sold" price. Or a group coordinates to push a card's price on eBay.

**How the model handles it**: Outlier filtering removes transactions >2.5 standard deviations from the 30-day mean. Minimum comps requirement (≥3) prevents a single manipulated sale from setting the price.

**Remaining risk**: Coordinated manipulation across multiple transactions can fool the filters. Mitigation: cross-reference TCGplayer and eBay prices. If they diverge by >25%, flag the card for manual review.

### 8.8 Stale Pricing Data

**What happens**: A data source hasn't updated in 3+ days, or a card's last sale was weeks ago.

**How the model handles it**: Data_Freshness_Score drops. Confidence_Score is reduced. Cards with no sales in 30+ days show "Stale Data" badge.

**Remaining risk**: The modeled price may still be computed from stale inputs, leading to phantom signals. Mitigation: if ANY critical input (market price, pull cost components) is >7 days stale, suppress the valuation signal entirely.

---

## PHASE 9 — RECOMMENDED MVP

### 9.1 Opinionated Specification

**What to build first**: A searchable, filterable table of the top ~150 chase cards from the 12-15 most recent English Scarlet & Violet era sets, with undervaluation scoring and a card detail page.

**What to include in v1**:

1. **Card database**: Top chase cards only (Special Illustration Rare, Illustration Rare, and other highest-rarity cards) from SV-era English sets. ~10-15 cards per set × ~12-15 sets = ~150-200 cards.

2. **Pricing**: TCGplayer market price, refreshed daily. Single source. Do not triangulate with eBay yet — adds complexity without proportional value at this scale.

3. **Scoring (simplified for MVP)**:
   - Pull Cost Score (objective — calculate from community pull rates + current booster box prices)
   - Character Premium Score (objective — calculate from PriceCharting historical data)
   - Artwork Score (manual — score all ~150 cards yourself. At this scale it takes a few hours.)
   - Universal Appeal Score (objective — Google Trends data)
   - Skip lore, volatility, set popularity, chase concentration for v1.

4. **Model**: Fixed-weight composite:
   ```
   Composite = 0.30 × Pull_Cost + 0.30 × Character_Premium + 0.25 × Artwork + 0.15 × Universal_Appeal
   Modeled_Price = e^(α + β × Composite)    [calibrate α, β via regression on training set]
   ```

5. **Valuation gap**: Simple (Modeled - Market) / Market × 100

6. **Confidence**: Binary for v1. "Sufficient Data" (≥5 sales in 30 days on TCGplayer) or "Low Data."

7. **Filters that matter most first**:
   - Price range (budget filtering is the #1 practical need)
   - Set (collectors browse by set)
   - Pokemon character (collectors search by character)
   - Undervaluation % (the core value prop)
   - Rarity tier
   - Sort by: undervaluation %, price, character premium

8. **Card detail page**: Card image, price, modeled value, gap %, scoring breakdown (simple bar chart, not radar), link to TCGplayer listing.

9. **No user accounts in v1**. No watchlist, no alerts. Just a public tool.

10. **Deployed as a static site**: Pre-rendered daily. No backend servers needed at runtime.

**What to exclude from v1**:
- User accounts, watchlists, alerts (add in Phase 2)
- Graded card pricing (Phase 4)
- eBay data integration (Phase 2)
- Vintage/SWSH-era sets (Phase 2)
- Real-time pricing (Phase 3)
- Community features (Phase 4)
- Automated artwork scoring (Phase 4)
- Mobile app (responsive web is sufficient)
- Portfolio tracking (Phase 4)
- Predictive signals (Phase 4)

**What should remain manual at the start**:
- Artwork scoring (you score 150 cards, it takes a few hours, and it's better than any automated approach at this scale)
- Pull rate data entry (verify community pull rates manually for each set)
- New set onboarding (manually add new sets as they release)
- Data quality checks (eyeball the top/bottom of the rankings weekly)

### 9.2 Best Data Source Combination for v1

| Data Need | Source | Priority |
|-----------|--------|----------|
| Card metadata (name, set, rarity, image) | pokemontcg.io API | Must have |
| Market prices | TCGplayer (via pokemontcg.io price data) | Must have |
| Booster box prices | PriceCharting | Must have |
| Pull rates | Community sources (manual) | Must have |
| Character historical pricing | PriceCharting | Must have |
| Google Trends | pytrends | Nice to have (can hardcode top characters initially) |
| Artwork scores | Manual by you | Must have |

### 9.3 Best Ranking Logic for v1

Default sort: **Undervaluation % descending**, filtered to cards with ≥5 recent sales.

Secondary sort option: **"Best Value Under $X"** — undervaluation % descending, filtered by max price.

This is the simplest ranking that delivers the core value proposition: "Show me the most undervalued Pokemon cards I can buy right now."

---

## FINAL RECOMMENDATION

**If you were building this today, this is exactly what you would build first and why:**

Build a **static Next.js site on Vercel + Supabase** that displays ~150-200 top chase cards from the Scarlet & Violet era with daily-refreshed pricing from TCGplayer and a 4-variable undervaluation model (pull cost, character premium, artwork, universal appeal).

**Why this specific scope:**

1. **150-200 cards is small enough to manually quality-control** but large enough to be genuinely useful. These are the cards people actually search for and buy.

2. **SV era only** because sealed product is still available (pull cost is calculable), pricing data is dense (high liquidity), and this is where the active collector base is spending money right now.

3. **4 variables, not 11** because with ~150 data points, a 4-variable model is statistically defensible. An 11-variable model overfits. You can ALWAYS add complexity later when you have more data.

4. **Static site** because it costs $0/month, loads instantly, requires no backend engineering, and SEO indexes every card page (organic traffic = free users).

5. **TCGplayer only** (not eBay) because one clean data source is better than two noisy ones at the start. TCGplayer is the English card market standard.

6. **No user accounts** because the core value is the DATA, not the platform. Prove the model works first. Add social features only after people are using the tool.

**The single most important thing to get right**: The modeled price must pass the smell test. If your top 10 "most undervalued" list looks wrong to an experienced collector, the model is broken. Validate against your own domain knowledge before launching. The model doesn't need to be perfect — it needs to be directionally correct and more useful than manually comparing prices across TCGplayer tabs.

**The single biggest risk**: Artwork scoring is 25% of the MVP model and entirely subjective. Mitigate this by publishing your methodology (scoring rubric with anchor examples) and inviting community feedback from day one. Transparency about subjectivity is better than pretending it doesn't exist.

**Ship this in 2-3 weeks. Iterate from real user feedback. Everything else is premature optimization.**
