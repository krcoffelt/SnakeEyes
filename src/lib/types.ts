export type Player = {
  player: string;
  pos?: "QB" | "RB" | "WR" | "TE" | "DEF" | "K" | string;
  team?: string;
  und_rank?: number | null;
  und_adp?: number | null;
  slp_rank?: number | null;
  value?: number | null;      // SLP - Und
  blend_rank?: number | null; // 0.6*Und + 0.4*SLP (configurable)
  tier?: number | null;       // computed tier index within position (1 = elite)
};

export type Weights = {
  w_value: number; // market discount
  w_tier: number;  // tier cliff urgency
  w_need: number;  // roster needs / FLEX pressure
  w_scar: number;  // positional scarcity
  w_avail: number; // availability risk
};

export type LeagueConfig = {
  teams: number;
  slot: number;
  roster: {
    QB: number;
    RB: number;
    WR: number;
    TE: number;
    FLEX: number;
    DEF: number;
    K: number;
  };
};

export type DraftState = {
  overallPick: number;
  round: number;
  nextUserPick: number;
  nextTwoUserPicks: [number, number];
  picksUntilYou: number;
};

export type RosterCounts = {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  DEF: number;
  K: number;
  total: number;
};

export type DraftedPlayer = {
  player: string;
  who: 'me' | 'opp';
  overallPick: number;
  round: number;
  timestamp: number;
};

export type TierMetrics = {
  gapToNextTier: number[];
  lastInTierFlags: boolean[];
};

export type AvailabilityRisk = {
  availProb: number;
  risk: number;
  takeNow: boolean;
};

export type PositionalValueIndex = {
  [pos: string]: number;
};

export type PlayerPriorityScore = {
  [player: string]: number;
};

export type CSVData = {
  [key: string]: string | number;
}; 