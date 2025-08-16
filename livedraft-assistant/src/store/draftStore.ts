import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Player, Weights, LeagueConfig, DraftedPlayer, RosterCounts, PositionalValueIndex, PlayerPriorityScore, DraftBoard, DraftState } from '../lib/types';
import { loadAllPlayerData, hashSourceData } from '../lib/data';
import { buildTiers, tierDropOffMetrics } from '../lib/tiers';
import { computePVE } from '../lib/pve';
import { 
  nextTwoUserPicks, 
  getCurrentOverallPick, 
  calculateRound,
  picksUntilYou 
} from '../lib/draftMath';

interface DraftStore {
  // Data
  players: Player[];
  remaining: Player[];
  drafted: DraftedPlayer[];
  draftBoard: DraftBoard;
  dataHash: string | null;
  
  // Configuration
  config: LeagueConfig;
  weights: Weights;
  blendConfig: { und: number; slp: number };
  tierDropThreshold: number;
  availabilityS: number;
  
  // Draft State
  draftState: DraftState;
  
  // Computed state
  myRoster: RosterCounts;
  PPS: PlayerPriorityScore;
  PVI: PositionalValueIndex;
  tierMetrics: { gapToNextTier: number[]; lastInTierFlags: boolean[] };
  rosterNeeds: { [pos: string]: number };
  flexPressure: number;
  scarcityMetrics: { [pos: string]: { count: number; urgency: number } };
  tierUrgency: { [playerName: string]: number };
  availabilityRisk: { [playerName: string]: { risk: number; takeNow: boolean } };
  
  // UI state
  searchQuery: string;
  positionFilter: string;
  valueThreshold: number;
  sortBy: 'PPS' | 'Value' | 'BlendRank';
  
  // Actions
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
}

const defaultConfig: LeagueConfig = {
  teams: 10,
  slot: 7,
  ppr: 'PPR',
  flexCount: 2,
  roster: {
    QB: 1,
    RB: 2,
    WR: 2,
    TE: 1,
    FLEX: 2,
    DEF: 1,
    K: 1
  }
};

const defaultWeights: Weights = {
  w_value: 0.30,
  w_tier: 0.25,
  w_need: 0.20,
  w_scar: 0.15,
  w_avail: 0.10
};

const defaultBlendConfig = { und: 0.6, slp: 0.4 };

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
      // Initial state
      players: [],
      remaining: [],
      drafted: [],
      draftBoard: {},
      dataHash: null,
      
      config: defaultConfig,
      weights: defaultWeights,
      blendConfig: defaultBlendConfig,
      tierDropThreshold: 8,
      availabilityS: 6,
      
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
      
      // Actions
      loadData: async () => {
        try {
          const { players, dataHash } = await loadAllPlayerData(get().blendConfig);
          set({ players, dataHash, remaining: players });
          get().recompute();
        } catch (error) {
          console.error('Failed to load data:', error);
        }
      },
      
      draft: (playerName: string, round: number, pick: number, draftedBy: 'me' | 'opp') => {
        const { players, draftBoard, config } = get();
        const player = players.find(p => p.player === playerName);
        
        if (!player) return;
        
        const overall = (round - 1) * config.teams + pick;
        const draftedPlayer: DraftedPlayer = {
          player: playerName,
          pos: player.pos || '',
          team: player.team || '',
          bye: player.bye || undefined,
          isRookie: player.isRookie || false,
          round,
          pick,
          overall,
          draftedBy,
          timestamp: new Date()
        };
        
        // Update draft board
        const newDraftBoard = { ...draftBoard };
        if (!newDraftBoard[round]) newDraftBoard[round] = {};
        newDraftBoard[round][pick] = draftedPlayer;
        
        // Update remaining players
        const newRemaining = players.filter(p => p.player !== playerName);
        
        // Update my roster if I drafted the player
        let newMyRoster = { ...get().myRoster };
        if (draftedBy === 'me' && player.pos) {
          if (player.pos === 'QB') newMyRoster.QB++;
          else if (player.pos === 'RB') newMyRoster.RB++;
          else if (player.pos === 'WR') newMyRoster.WR++;
          else if (player.pos === 'TE') newMyRoster.TE++;
          else if (player.pos === 'DEF') newMyRoster.DEF++;
          else if (player.pos === 'K') newMyRoster.K++;
          newMyRoster.total++;
        }
        
        set({
          drafted: [...get().drafted, draftedPlayer],
          remaining: newRemaining,
          draftBoard: newDraftBoard,
          myRoster: newMyRoster
        });
        
        get().recompute();
      },
      
      undo: () => {
        const { drafted, players, draftBoard, config } = get();
        if (drafted.length === 0) return;
        
        const lastPick = drafted[drafted.length - 1];
        const newDrafted = drafted.slice(0, -1);
        
        // Remove from draft board
        const newDraftBoard = { ...draftBoard };
        if (newDraftBoard[lastPick.round] && newDraftBoard[lastPick.round][lastPick.pick]) {
          delete newDraftBoard[lastPick.round][lastPick.pick];
        }
        
        // Add back to remaining
        const originalPlayer = players.find(p => p.player === lastPick.player);
        if (originalPlayer) {
          const newRemaining = [...get().remaining, originalPlayer];
          
          // Update my roster if I drafted the player
          let newMyRoster = { ...get().myRoster };
          if (lastPick.draftedBy === 'me' && lastPick.pos) {
            if (lastPick.pos === 'QB') newMyRoster.QB--;
            else if (lastPick.pos === 'RB') newMyRoster.RB--;
            else if (lastPick.pos === 'WR') newMyRoster.WR--;
            else if (lastPick.pos === 'TE') newMyRoster.TE--;
            else if (lastPick.pos === 'DEF') newMyRoster.DEF--;
            else if (lastPick.pos === 'K') newMyRoster.K--;
            newMyRoster.total--;
          }
          
          set({
            drafted: newDrafted,
            remaining: newRemaining,
            draftBoard: newDraftBoard,
            myRoster: newMyRoster
          });
          
          get().recompute();
        }
      },
      
      resetDraft: () => {
        set({
          drafted: [],
          remaining: get().players,
          draftBoard: {},
          myRoster: { QB: 0, RB: 0, WR: 0, TE: 0, DEF: 0, K: 0, total: 0 },
          draftState: defaultDraftState
        });
        get().recompute();
      },
      
      updateConfig: (config) => {
        set({ config: { ...get().config, ...config } });
        get().recompute();
      },
      
      updateWeights: (weights) => {
        set({ weights: { ...get().weights, ...weights } });
        get().recompute();
      },
      
      updateBlendConfig: (config) => {
        set({ blendConfig: { ...get().blendConfig, ...config } });
        get().recompute();
      },
      
      updateTierDropThreshold: (threshold) => {
        set({ tierDropThreshold: threshold });
        get().recompute();
      },
      
      updateAvailabilityS: (s) => {
        set({ availabilityS: s });
        get().recompute();
      },
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      setPositionFilter: (position) => set({ positionFilter: position }),
      setValueThreshold: (threshold) => set({ valueThreshold: threshold }),
      setSortBy: (sortBy) => set({ sortBy }),
      
      recompute: () => {
        const { remaining, weights, config, tierDropThreshold, availabilityS } = get();
        
        if (remaining.length === 0) return;
        
        // Build tiers
        const playersWithTiers = buildTiers(remaining);
        const tierMetrics = tierDropOffMetrics(
          Object.fromEntries(
            ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'].map(pos => [
              pos,
              playersWithTiers.filter(p => p.pos === pos)
            ])
          )
        );
        
        // Calculate next picks
        const nextPicks = nextTwoUserPicks(
          getCurrentOverallPick(get().drafted.length),
          config.slot,
          config.teams
        );
        
                 // Compute PVE
         const pveResults = computePVE(
           remaining,
           weights,
           nextPicks,
           get().myRoster,
           tierMetrics,
           tierDropThreshold,
           availabilityS,
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
      
      exportCSV: () => {
        const { remaining, PPS, PVI } = get();
        const csvContent = [
          'Player,Position,Team,Und Rank,Und ADP,SLP Rank,Value,Blend Rank,Tier,PPS,PVI',
          ...remaining.map(player => [
            player.player,
            player.pos || '',
            player.team || '',
            player.und_rank || '',
            player.und_adp || '',
            player.slp_rank || '',
            player.value || '',
            player.blend_rank || '',
            player.tier || '',
            PPS[player.player] || '',
            Object.entries(PVI).find(([pos]) => pos === player.pos)?.[1] || ''
          ].join(','))
        ].join('\n');
        
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
          availabilityS
        };
        
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'draft-settings.json';
        a.click();
        window.URL.revokeObjectURL(url);
      }
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