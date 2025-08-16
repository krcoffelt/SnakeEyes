# Draft Value Assistant

A production-ready web app that auto-loads Underdog ADP and Sleeper ranks, tracks live snake drafts, and recommends picks using a Positional Value Index (PVE).

## Features

- **Auto-loading Data**: Fetches and merges Underdog ADP and Sleeper ranks at runtime
- **Live Draft Tracking**: Tracks current draft position, rounds, and next picks
- **Positional Value Engine (PVE)**: Computes Player Priority Scores (PPS) and Positional Value Index (PVI)
- **Smart Recommendations**: Suggests picks based on market value, tier urgency, roster needs, scarcity, and availability risk
- **Responsive UI**: Clean, modern interface with light/dark theme support
- **Local Persistence**: Saves draft state, settings, and weights to localStorage
- **Export Functionality**: Export current board as CSV and settings as JSON

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Zustand** for state management
- **PapaParse** for CSV parsing
- **Lucide React** for icons

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Place CSV files** in `/public/data/`:
   - `underdog_adp.csv` - Underdog ADP data
   - `sleeper_ranks_full_2025.csv` - Sleeper rankings

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## CSV Format Requirements

### Underdog ADP (`underdog_adp.csv`)
Headers (case-insensitive): `Player`, `Pos|Position`, `Team`, `Rank`, `ADP`

### Sleeper Ranks (`sleeper_ranks_full_2025.csv`)
Headers: `Rank`, `Player`, `Position`, `Team`

## How It Decides: Positional Value Engine (PVE)

The PVE computes a **Player Priority Score (PPS)** for each remaining player using five weighted factors:

### 1. Market Value (30% default)
- Calculates `value = Sleeper_rank - Underdog_rank`
- Positive values indicate market discounts (cheaper on Sleeper)
- Uses z-score normalization clipped to [0,1]

### 2. Tier Urgency (25% default)
- Builds dynamic tiers using k-means clustering on `blend_rank`
- Identifies players at tier cliffs (gaps ≥ 8 ranks)
- High urgency for last players in tiers before significant drop-offs

### 3. Roster Need (20% default)
- Tracks required starters: QB(1), RB(2), WR(2), TE(1), FLEX(2)
- Calculates FLEX debt: need 6+ RB/WR by end of Round 8
- Prioritizes positions you still need

### 4. Positional Scarcity (15% default)
- Counts players available at your next two picks
- Higher scarcity = higher priority
- Normalized across all positions

### 5. Availability Risk (10% default)
- Uses logistic function: `P(available) = 1 / (1 + exp(-delta/s))`
- `delta = next_pick - sleeper_rank`
- "Take now" if Sleeper rank ≤ next pick

### PPS Calculation
```
PPS = w_value × MarketValue + w_tier × TierUrgency + w_need × Need + w_scar × Scarcity + w_avail × AvailabilityRisk
```

### Positional Value Index (PVI)
- Aggregates top-6 PPS values per position
- Normalized so highest position = 1.00
- Shows relative value opportunities across positions

## Usage

1. **Configure League**: Set teams, slot, and roster requirements
2. **Adjust Weights**: Fine-tune PVE factors based on your strategy
3. **Track Draft**: Monitor current position and next picks
4. **Make Picks**: Click "I took" or "Opp took" on player cards
5. **Follow Recommendations**: Top cards show highest PPS with reasoning
6. **Export Data**: Download current board and settings

## Key Components

- **SettingsCard**: League config and weight sliders
- **DraftTracker**: Current pick, round, and next turn
- **RosterCard**: Position counts and FLEX pressure
- **PositionalPanel**: PVI bars with scarcity rationale
- **ValueBoard**: Sortable table with all players
- **TopRecommendations**: Top 12 picks with reasoning

## Data Flow

1. **Load**: Fetch CSVs → Parse with PapaParse → Merge by player name
2. **Process**: Build tiers → Compute metrics → Calculate PPS/PVI
3. **Update**: Recompute on every draft event or setting change
4. **Persist**: Save to localStorage with data hash invalidation

## Edge Cases & Guardrails

- **Missing Data**: Players without both ranks get penalty (×1.2)
- **Tier Fallback**: Uses quantiles if <12 players per position
- **Normalization**: All metrics clamped to [0,1] range
- **Deterministic**: Player name ascending as tie-breaker
- **Mobile**: Responsive grid collapses to single column

## Export Features

- **CSV**: Current board with PPS, PVI, and all player data
- **JSON**: Complete settings including weights and configuration
- **Auto-save**: Draft state persists across browser sessions

## Future Enhancements

- "What changed?" diff badges after picks
- ADP-delta mode for Sleeper ADP data
- Stacking bonuses for QB/WR same-team combinations
- Round planner showing projections
- Advanced tier visualization

## License

MIT License - see LICENSE file for details. 