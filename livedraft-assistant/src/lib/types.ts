export type Player = {
  player: string;
  pos?: "QB" | "RB" | "WR" | "TE" | "DEF" | "K" | string;
  team?: string;
  bye?: number | null;        // BYE week
  isRookie?: boolean;         // 2025 rookie status
  und_id?: string;            // Underdog player Id (for reliable joins)
  ron_id?: string | null;     // Ron-provided id (should match Underdog Id when available)
  und_rank?: number | null;
  und_adp?: number | null;
  slp_rank?: number | null;
  ron_rank?: number | null;   // Ron ADP (overall rank)
  ron_pos_rank?: number | null; // Ron positional rank
  ron_tier?: number | null;   // Ron-provided tier number
  ron_target_round_12?: number | null; // Ron target round for 12-team leagues
  value?: number | null;      // SLP - Und
  blend_rank?: number | null; // 0.6*Und + 0.4*SLP (configurable)
  tier?: number | null;       // computed/preferred tier index within position (1 = elite)
};

export type Weights = {
  w_value: number; // market discount
  w_tier: number;  // tier cliff urgency
  w_need: number;  // roster needs / FLEX pressure
  w_scar: number;  // positional scarcity
  w_avail: number; // availability risk
};

export type LeagueConfig = {
  teams: number;           // 10 or 12
  slot: number;            // your draft position (1-10 or 1-12)
  ppr: 'PPR' | 'Half PPR' | 'Standard';
  flexCount: 1 | 2;        // 1 FLEX vs 2 FLEX
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
  currentRound: number;
  currentPick: number;
  currentTeam: number;
  isUserTurn: boolean;
  picksUntilUser: number;
  nextUserPick: number;
  nextTwoUserPicks: [number, number];
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
  pos: string;
  team: string;
  bye?: number;
  isRookie?: boolean;
  round: number;
  pick: number;
  overall: number;
  draftedBy: 'me' | 'opp';
  timestamp: Date;
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
  [playerName: string]: number;
};

export type CSVData = {
  [key: string]: string | number;
};

export type DraftBoard = {
  [round: number]: {
    [pick: number]: DraftedPlayer | null;
  };
}; 