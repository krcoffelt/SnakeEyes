import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Player, Weights, LeagueConfig, DraftedPlayer, RosterCounts, PositionalValueIndex, PlayerPriorityScore } from '../lib/types';
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
  dataHash: string | null;
  
  // Configuration
  config: LeagueConfig;
  weights: Weights;
  blendConfig: { und: number; slp: number };
  tierDropThreshold: number;
  availabilityS: number;
  
  // Computed state
  myRoster: RosterCounts;
  PPS: PlayerPriorityScore;
  PVI: PositionalValueIndex;
  tierMetrics: { gapToNextTier: number[]; lastInTierFlags: boolean[] };
  
  // UI state
  searchQuery: string;
  positionFilter: string;
  valueThreshold: number;
  sortBy: 'PPS' | 'Value' | 'BlendRank';
  
  // Actions
  loadData: () => Promise<void>;
  draft: (playerName: string, who: 'me' | 'opp') => void;
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

export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      // Initial state
      players: [],
      remaining: [],
      drafted: [],
      dataHash: null,
      
      config: defaultConfig,
      weights: defaultWeights,
      blendConfig: defaultBlendConfig,
      tierDropThreshold: 8,
      availabilityS: 6,
      
      myRoster: { QB: 0, RB: 0, WR: 0, TE: 0, DEF: 0, K: 0, total: 0 },
      PPS: {},
      PVI: {},
      tierMetrics: { gapToNextTier: [], lastInTierFlags: [] },
      
      searchQuery: '',
      positionFilter: '',
      valueThreshold: 0,
      sortBy: 'PPS',
      
      // Actions
      loadData: async () => {
        try {
          const { players, dataHash } = await loadAllPlayerData(get().blendConfig);
          
          // Check if data has changed
          if (get().dataHash && get().dataHash !== dataHash) {
            // Data changed, reset draft
            set({ 
              players, 
              remaining: players, 
              drafted: [], 
              dataHash,
              myRoster: { QB: 0, RB: 0, WR: 0, TE: 0, DEF: 0, K: 0, total: 0 }
            });
          } else {
            set({ players, remaining: players, dataHash });
          }
          
          // Recompute tiers and PVE
          get().recompute();
        } catch (error) {
          console.error('Failed to load data:', error);
        }
      },
      
      draft: (playerName: string, who: 'me' | 'opp') => {
        const { players, remaining, drafted, config } = get();
        const player = remaining.find(p => p.player === playerName);
        
        if (!player) return;
        
        const overallPick = getCurrentOverallPick(drafted.length);
        const round = calculateRound(overallPick, config.teams);
        
        const newDrafted: DraftedPlayer = {
          player: playerName,
          who,
          overallPick,
          round,
          timestamp: Date.now()
        };
        
        const newDraftedList = [...drafted, newDrafted];
        const newRemaining = remaining.filter(p => p.player !== playerName);
        
        set({ 
          drafted: newDraftedList, 
          remaining: newRemaining 
        });
        
        // Recompute PVE
        get().recompute();
      },
      
      undo: () => {
        const { drafted, players } = get();
        if (drafted.length === 0) return;
        
        const newDrafted = drafted.slice(0, -1);
        const draftedPlayers = newDrafted.map(d => d.player);
        const newRemaining = players.filter(p => !draftedPlayers.includes(p.player));
        
        set({ 
          drafted: newDrafted, 
          remaining: newRemaining 
        });
        
        // Recompute PVE
        get().recompute();
      },
      
      resetDraft: () => {
        set({ 
          drafted: [], 
          remaining: get().players,
          myRoster: { QB: 0, RB: 0, WR: 0, TE: 0, DEF: 0, K: 0, total: 0 }
        });
        get().recompute();
      },
      
      updateConfig: (config: Partial<LeagueConfig>) => {
        set(state => ({ 
          config: { ...state.config, ...config } 
        }));
        get().recompute();
      },
      
      updateWeights: (weights: Partial<Weights>) => {
        set(state => ({ 
          weights: { ...state.weights, ...weights } 
        }));
        get().recompute();
      },
      
      updateBlendConfig: (config: Partial<{ und: number; slp: number }>) => {
        set(state => ({ 
          blendConfig: { ...state.blendConfig, ...config } 
        }));
        // Reload data with new blend config
        get().loadData();
      },
      
      updateTierDropThreshold: (threshold: number) => {
        set({ tierDropThreshold: threshold });
        get().recompute();
      },
      
      updateAvailabilityS: (s: number) => {
        set({ availabilityS: s });
        get().recompute();
      },
      
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },
      
      setPositionFilter: (position: string) => {
        set({ positionFilter: position });
      },
      
      setValueThreshold: (threshold: number) => {
        set({ valueThreshold: threshold });
      },
      
      setSortBy: (sortBy: 'PPS' | 'Value' | 'BlendRank') => {
        set({ sortBy });
      },
      
      recompute: () => {
        const { remaining, weights, config, drafted, tierDropThreshold, availabilityS } = get();
        
        if (remaining.length === 0) return;
        
        // Build tiers
        const tieredPlayers = buildTiers(remaining);
        set({ remaining: tieredPlayers });
        
        // Group by position for tier metrics
        const playersByPos: { [pos: string]: Player[] } = {};
        tieredPlayers.forEach(player => {
          if (player.pos) {
            if (!playersByPos[player.pos]) {
              playersByPos[player.pos] = [];
            }
            playersByPos[player.pos].push(player);
          }
        });
        
        // Compute tier metrics
        const tierMetrics = tierDropOffMetrics(playersByPos);
        set({ tierMetrics });
        
        // Calculate roster counts
        const myDrafted = drafted.filter(d => d.who === 'me');
        const myRoster: RosterCounts = { QB: 0, RB: 0, WR: 0, TE: 0, DEF: 0, K: 0, total: 0 };
        
        myDrafted.forEach(drafted => {
          const player = tieredPlayers.find(p => p.player === drafted.player);
          if (player && player.pos) {
            const pos = player.pos as keyof Omit<RosterCounts, 'total'>;
            if (pos in myRoster) {
              myRoster[pos]++;
              myRoster.total++;
            }
          }
        });
        
        set({ myRoster });
        
        // Calculate next picks
        const overallPick = getCurrentOverallPick(drafted.length);
        const nextPicks = nextTwoUserPicks(overallPick, config.slot, config.teams);
        
        // Compute PVE
        const pveResult = computePVE(
          tieredPlayers,
          weights,
          nextPicks,
          myRoster,
          tierMetrics,
          tierDropThreshold,
          availabilityS
        );
        
        set({ 
          PPS: pveResult.PPS, 
          PVI: pveResult.PVI 
        });
      },
      
      exportCSV: () => {
        const { remaining, PPS, PVI } = get();
        
        const csvContent = [
          'Player,Position,Team,UndRank,UndADP,SlpRank,Value,BlendRank,Tier,PPS,PVI',
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
            player.pos ? PVI[player.pos] || '' : ''
          ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'draft-board.csv';
        a.click();
        URL.revokeObjectURL(url);
      },
      
      exportSettings: () => {
        const { config, weights, blendConfig, tierDropThreshold, availabilityS } = get();
        
        const settings = {
          config,
          weights,
          blendConfig,
          tierDropThreshold,
          availabilityS,
          exportTime: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'draft-settings.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    }),
    {
      name: 'draft-store',
      partialize: (state) => ({
        drafted: state.drafted,
        config: state.config,
        weights: state.weights,
        blendConfig: state.blendConfig,
        tierDropThreshold: state.tierDropThreshold,
        availabilityS: state.availabilityS,
        dataHash: state.dataHash
      })
    }
  )
); 