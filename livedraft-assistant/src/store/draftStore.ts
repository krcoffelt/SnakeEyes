import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Player, Weights, LeagueConfig, DraftedPlayer, RosterCounts, PositionalValueIndex, PlayerPriorityScore, DraftBoard, DraftState } from '../lib/types';
import { loadAllPlayerData, hashSourceData } from '../lib/data';
import { buildTiers, tierDropOffMetrics } from '../lib/tiers';
import { computePVE } from '../lib/pve';
import { getCurrentOverallPick, nextTwoUserPicks } from '../lib/draftMath';

interface DraftStore {
  players: Player[];
  remaining: Player[];
  drafted: DraftedPlayer[];
  draftBoard: DraftBoard;
  dataHash: string | null;
  config: LeagueConfig;
  weights: Weights;
  blendConfig: { und: number; slp: number };
  tierDropThreshold: number;
  availabilityS: number;
  draftState: DraftState;
  myRoster: RosterCounts;
  PPS: PlayerPriorityScore;
  PVI: PositionalValueIndex;
  tierMetrics: { gapToNextTier: number[]; lastInTierFlags: boolean[] };
  rosterNeeds: { [pos: string]: number };
  flexPressure: number;
  scarcityMetrics: { [pos: string]: { count: number; urgency: number } };
  tierUrgency: { [playerName: string]: number };
  availabilityRisk: { [playerName: string]: { risk: number; takeNow: boolean } };
  searchQuery: string;
  positionFilter: string;
  valueThreshold: number;
  sortBy: 'PPS' | 'Value' | 'BlendRank';
  loading: boolean;
  error?: string;

  loadData: () => Promise<void>;
  draft: (playerName: string, round: number, pick: number, draftedBy: 'me' | 'opp') => void;
  undo: () => void;
  resetDraft: () => void;
  updateConfig: (config: Partial<LeagueConfig>) => void;
  updateWeights: (weights: Partial<Weights>) => void;
  updateBlendConfig: (config: Partial<{ und: number; slp: number }>) => void;
  updateTierDropThreshold: (threshold: number) => void;
  updateAvailabilityS: (s: number) => void;
  setSearchQuery: (query: string) => void;
  setPositionFilter: (position: string) => void;
  setValueThreshold: (threshold: number) => void;
  setSortBy: (sortBy: 'PPS' | 'Value' | 'BlendRank') => void;
  recompute: () => void;
  exportCSV: () => void;
  exportSettings: () => void;
  clearError: () => void;
}

// Function to automatically calculate optimal PVE weights based on league settings
function calculateOptimalWeights(config: LeagueConfig): Weights {
  const { teams, ppr, flexCount } = config;
  
  let weights: Weights;
  
  if (teams === 10) {
    // 10-team leagues: More balanced approach
    if (ppr === 'PPR') {
      weights = {
        w_value: 0.25,    // Market value
        w_tier: 0.30,     // Tier urgency (higher for 10-team)
        w_need: 0.25,     // Roster needs
        w_scar: 0.15,     // Positional scarcity
        w_avail: 0.05     // Availability risk
      };
    } else if (ppr === 'Half PPR') {
      weights = {
        w_value: 0.30,    // Market value
        w_tier: 0.25,     // Tier urgency
        w_need: 0.25,     // Roster needs
        w_scar: 0.15,     // Positional scarcity
        w_avail: 0.05     // Availability risk
      };
    } else { // Standard
      weights = {
        w_value: 0.35,    // Market value (higher for standard)
        w_tier: 0.20,     // Tier urgency
        w_need: 0.25,     // Roster needs
        w_scar: 0.15,     // Positional scarcity
        w_avail: 0.05     // Availability risk
      };
    }
  } else { // 12-team leagues
    // 12-team leagues: More scarcity-focused
    if (ppr === 'PPR') {
      weights = {
        w_value: 0.20,    // Market value
        w_tier: 0.25,     // Tier urgency
        w_need: 0.30,     // Roster needs (higher for 12-team)
        w_scar: 0.20,     // Positional scarcity (higher for 12-team)
        w_avail: 0.05     // Availability risk
      };
    } else if (ppr === 'Half PPR') {
      weights = {
        w_value: 0.25,    // Market value
        w_tier: 0.25,     // Tier urgency
        w_need: 0.30,     // Roster needs
        w_scar: 0.15,     // Positional scarcity
        w_avail: 0.05     // Availability risk
      };
    } else { // Standard
      weights = {
        w_value: 0.30,    // Market value
        w_tier: 0.20,     // Tier urgency
        w_need: 0.30,     // Roster needs
        w_scar: 0.15,     // Positional scarcity
        w_avail: 0.05     // Availability risk
      };
    }
  }

  // Adjust for FLEX configuration
  if (flexCount === 1) {
    // Single FLEX: More position-specific drafting
    weights.w_need += 0.05;
    weights.w_scar += 0.05;
    weights.w_value -= 0.10;
  } else {
    // Double FLEX: More flexible drafting
    weights.w_value += 0.05;
    weights.w_tier += 0.05;
    weights.w_need -= 0.10;
  }

  return weights;
}

// Function to calculate optimal tier drop threshold
function calculateOptimalTierThreshold(config: LeagueConfig): number {
  const { teams, ppr } = config;
  
  if (teams === 10) {
    return ppr === 'PPR' ? 6 : 8; // Lower threshold for PPR (more tiers)
  } else {
    return ppr === 'PPR' ? 8 : 10; // Higher threshold for 12-team
  }
}

// Function to calculate optimal availability sensitivity
function calculateOptimalAvailabilityS(config: LeagueConfig): number {
  const { teams } = config;
  return teams === 10 ? 5 : 7; // More sensitive for 10-team, less for 12-team
}

// helper to rebuild board from drafted list
function buildBoard(drafted: DraftedPlayer[], teams: number): DraftBoard {
  const board: DraftBoard = {};
  drafted.forEach(d => {
    const isOdd = d.round % 2 === 1;
    const col = isOdd ? d.pick : (teams - d.pick + 1);
    if (!board[d.round]) board[d.round] = {};
    board[d.round][col] = d;
  });
  return board;
}

const defaultConfig: LeagueConfig = {
  teams: 10,
  slot: 7,
  ppr: 'PPR',
  flexCount: 2,
  roster: {
    QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 2, DEF: 1, K: 1
  }
};

const defaultDraftState: DraftState = {
  currentRound: 1,
  currentPick: 1,
  currentTeam: 1,
  isUserTurn: false,
  picksUntilUser: 0,
  nextUserPick: 0,
  nextTwoUserPicks: [0, 0]
};

export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      players: [],
      remaining: [],
      drafted: [],
      draftBoard: {},
      dataHash: null,
      config: defaultConfig,
      weights: calculateOptimalWeights(defaultConfig),
      blendConfig: { und: 0.6, slp: 0.4 },
      tierDropThreshold: calculateOptimalTierThreshold(defaultConfig),
      availabilityS: calculateOptimalAvailabilityS(defaultConfig),
      draftState: defaultDraftState,
      myRoster: { QB: 0, RB: 0, WR: 0, TE: 0, DEF: 0, K: 0, total: 0 },
      PPS: {},
      PVI: {},
      tierMetrics: { gapToNextTier: [], lastInTierFlags: [] },
      rosterNeeds: {},
      flexPressure: 0,
      scarcityMetrics: {},
      tierUrgency: {},
      availabilityRisk: {},
      searchQuery: '',
      positionFilter: '',
      valueThreshold: 0,
      sortBy: 'PPS',
      loading: false,
      error: undefined,

      loadData: async () => {
        try {
          set({ loading: true, error: undefined });
          const { players, dataHash } = await loadAllPlayerData();
          const currentHash = get().dataHash;
          
          if (dataHash !== currentHash) {
            set({ players, remaining: players, dataHash });
            get().recompute();
          }
          set({ loading: false });
        } catch (error) {
          console.error('Failed to load data:', error);
          set({ loading: false, error: 'Failed to load player data. Please check your CSV files.' });
        }
      },

      draft: (playerName: string, round: number, pick: number, draftedBy: 'me' | 'opp') => {
        const { remaining, draftBoard, config } = get();
        const player = remaining.find(p => p.player === playerName);

        if (!player) return;

        const overall = (round - 1) * config.teams + pick;
        const draftedPlayer: DraftedPlayer = {
          player: playerName,
          pos: player.pos || '',
          team: player.team || '',
          bye: player.bye || undefined,
          isRookie: player.isRookie || false,
          round,
          pick, // pick sequence within round (1..teams)
          overall,
          draftedBy,
          timestamp: new Date()
        };

        // Compute team column for snake direction
        const isOddRound = round % 2 === 1;
        const teamColumn = isOddRound ? pick : (config.teams - pick + 1);

        // Update draft board using team column index
        const newDraftBoard = { ...draftBoard };
        if (!newDraftBoard[round]) newDraftBoard[round] = {};
        newDraftBoard[round][teamColumn] = draftedPlayer;

        // Update remaining players - filter from remaining, not all players
        const newRemaining = remaining.filter(p => p.player !== playerName);

        const newMyRoster = { ...get().myRoster } as RosterCounts;
        if (draftedBy === 'me' && player.pos) {
          if (player.pos === 'QB') newMyRoster.QB++;
          else if (player.pos === 'RB') newMyRoster.RB++;
          else if (player.pos === 'WR') newMyRoster.WR++;
          else if (player.pos === 'TE') newMyRoster.TE++;
          else if (player.pos === 'DEF') newMyRoster.DEF++;
          else if (player.pos === 'K') newMyRoster.K++;
          newMyRoster.total++;
        }

        const newDrafted = [...get().drafted, draftedPlayer];
        const rebuiltBoard = buildBoard(newDrafted, config.teams);

        set({
          drafted: newDrafted,
          remaining: newRemaining,
          draftBoard: rebuiltBoard,
          myRoster: newMyRoster
        });

        get().recompute();
      },

      undo: () => {
        const { drafted, players, config } = get();
        if (drafted.length === 0) return;

        const lastDrafted = drafted[drafted.length - 1];
        const newDrafted = drafted.slice(0, -1);
        
        // Find the player in the original players array to restore
        const playerToRestore = players.find(p => p.player === lastDrafted.player);
        if (!playerToRestore) return;
        
        const newRemaining = [...get().remaining, playerToRestore];

        const newMyRoster = { ...get().myRoster } as RosterCounts;
        if (lastDrafted.draftedBy === 'me' && lastDrafted.pos) {
          if (lastDrafted.pos === 'QB') newMyRoster.QB--;
          else if (lastDrafted.pos === 'RB') newMyRoster.RB--;
          else if (lastDrafted.pos === 'WR') newMyRoster.WR--;
          else if (lastDrafted.pos === 'TE') newMyRoster.TE--;
          else if (lastDrafted.pos === 'DEF') newMyRoster.DEF--;
          else if (lastDrafted.pos === 'K') newMyRoster.K--;
          newMyRoster.total--;
        }

        const rebuiltBoard = buildBoard(newDrafted, config.teams);

        set({
          drafted: newDrafted,
          remaining: newRemaining,
          draftBoard: rebuiltBoard,
          myRoster: newMyRoster
        });

        get().recompute();
      },

      resetDraft: () => {
        const currentState = get();
        const playersToRestore = currentState.players.length > 0 ? currentState.players : currentState.remaining;
        
        set({
          drafted: [],
          remaining: playersToRestore,
          draftBoard: {},
          draftState: defaultDraftState,
          myRoster: { QB: 0, RB: 0, WR: 0, TE: 0, DEF: 0, K: 0, total: 0 },
          // Reset all computed values
          PPS: {},
          PVI: {},
          tierMetrics: { gapToNextTier: [], lastInTierFlags: [] },
          rosterNeeds: {},
          flexPressure: 0,
          scarcityMetrics: {},
          tierUrgency: {},
          availabilityRisk: {}
        });
        
        // Only recompute if we have players to work with
        if (playersToRestore.length > 0) {
          get().recompute();
        }
      },

      updateConfig: (newConfig) => {
        const updatedConfig = { ...get().config, ...newConfig };
        
        // Automatically recalculate optimal weights and thresholds
        const optimalWeights = calculateOptimalWeights(updatedConfig);
        const optimalTierThreshold = calculateOptimalTierThreshold(updatedConfig);
        const optimalAvailabilityS = calculateOptimalAvailabilityS(updatedConfig);
        
        set({
          config: updatedConfig,
          weights: optimalWeights,
          tierDropThreshold: optimalTierThreshold,
          availabilityS: optimalAvailabilityS
        });
        
        get().recompute();
      },

      updateWeights: (weights) => set({ weights: { ...get().weights, ...weights } }),
      updateBlendConfig: (config) => set({ blendConfig: { ...get().blendConfig, ...config } }),
      updateTierDropThreshold: (threshold) => set({ tierDropThreshold: threshold }),
      updateAvailabilityS: (s) => set({ availabilityS: s }),

      recompute: () => {
        const { remaining, weights, config, myRoster, tierDropThreshold, availabilityS } = get();

        if (remaining.length === 0) return;

        const playersWithTiers = buildTiers(remaining);
        const tierMetrics = tierDropOffMetrics(
          Object.fromEntries(
            ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'].map(pos => [
              pos,
              playersWithTiers.filter(p => p.pos === pos)
            ])
          )
        );

        const currentOverall = getCurrentOverallPick(get().drafted.length);
        const nextPicks = nextTwoUserPicks(
          currentOverall,
          config.slot,
          config.teams
        );
        const picksUntilUser = Math.max(0, nextPicks[0] - currentOverall);

        const pveResults = computePVE(
          remaining,
          weights,
          nextPicks,
          myRoster,
          tierMetrics,
          tierDropThreshold,
          availabilityS,
          picksUntilUser,
          currentOverall,
          { teams: config.teams, flexCount: config.flexCount, ppr: config.ppr }
        );

        set({
          tierMetrics,
          PPS: pveResults.PPS,
          PVI: pveResults.PVI,
          rosterNeeds: pveResults.rosterNeeds,
          flexPressure: pveResults.flexPressure,
          scarcityMetrics: pveResults.scarcityMetrics,
          tierUrgency: pveResults.tierUrgency,
          availabilityRisk: pveResults.availabilityRisk
        });
      },

      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setPositionFilter: (position: string) => set({ positionFilter: position }),
      setValueThreshold: (threshold: number) => set({ valueThreshold: threshold }),
      setSortBy: (sortBy: 'PPS' | 'Value' | 'BlendRank') => set({ sortBy }),

      exportCSV: () => {
        const { remaining, PPS, PVI } = get();
        const csvContent = [
          ['Player', 'Position', 'Team', 'Underdog Rank', 'Sleeper Rank', 'PPS', 'PVI'],
          ...remaining.map(player => [
            player.player,
            player.pos || '',
            player.team || '',
            player.und_rank || '',
            player.slp_rank || '',
            PPS[player.player] || '',
            PVI[player.pos || ''] || ''
          ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'draft-board.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      },

      exportSettings: () => {
        const { config, weights, blendConfig, tierDropThreshold, availabilityS } = get();
        const settings = {
          config,
          weights,
          blendConfig,
          tierDropThreshold,
          availabilityS,
          timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'draft-settings.json';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      clearError: () => set({ error: undefined })
    }),
    {
      name: 'draft-store',
      partialize: (state) => ({
        config: state.config,
        weights: state.weights,
        blendConfig: state.blendConfig,
        tierDropThreshold: state.tierDropThreshold,
        availabilityS: state.availabilityS,
        drafted: state.drafted,
        draftBoard: state.draftBoard,
        myRoster: state.myRoster
      })
    }
  )
); 