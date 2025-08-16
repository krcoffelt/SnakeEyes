'use client';

import React from 'react';
import { User, Users, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { useDraftStore } from '../store/draftStore';
import { Player } from '../lib/types';

export default function TopRecommendations() {
  const { 
    remaining, 
    PPS, 
    PVI, 
    myRoster,
    draft 
  } = useDraftStore();
  
  // Get top 12 players by PPS
  const topPlayers = [...remaining]
    .sort((a, b) => (PPS[b.player] || 0) - (PPS[a.player] || 0))
    .slice(0, 12);
  
  const getRecommendationReason = (player: Player) => {
    const reasons: string[] = [];
    const pos = player.pos;
    
    if (!pos) return 'Position unknown';
    
    // Check roster needs
    if (pos === 'QB' && myRoster.QB === 0) reasons.push('Need QB');
    if (pos === 'TE' && myRoster.TE === 0) reasons.push('Need TE');
    if (pos === 'RB' && myRoster.RB < 2) reasons.push('Need RB');
    if (pos === 'WR' && myRoster.WR < 2) reasons.push('Need WR');
    
    // Check FLEX pressure
    const flexDebt = Math.max(0, 6 - (myRoster.RB + myRoster.WR));
    if ((pos === 'RB' || pos === 'WR') && flexDebt > 0) {
      reasons.push(`FLEX pressure (${flexDebt} needed)`);
    }
    
    // Check tier urgency
    if (player.tier && player.tier <= 2) {
      reasons.push(`Tier ${player.tier} player`);
    }
    
    // Check availability risk
    if (player.slp_rank && player.slp_rank <= 50) {
      reasons.push('High availability risk');
    }
    
    // Check positional scarcity
    const posPlayers = remaining.filter(p => p.pos === pos);
    if (posPlayers.length <= 5) {
      reasons.push(`Critical ${pos} scarcity`);
    } else if (posPlayers.length <= 10) {
      reasons.push(`${pos} scarcity`);
    }
    
    return reasons.length > 0 ? reasons.join('; ') : 'Good value';
  };
  
  const getPriorityColor = (pps: number) => {
    if (pps >= 0.8) return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    if (pps >= 0.6) return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    return 'border-green-500 bg-green-50 dark:bg-green-900/20';
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Top Recommendations
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topPlayers.map((player, index) => {
          const pps = PPS[player.player] || 0;
          const reason = getRecommendationReason(player);
          
          return (
            <div 
              key={player.player}
              className={`border-2 rounded-xl p-4 ${getPriorityColor(pps)}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white text-lg">
                    {player.player}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {player.pos} • {player.team || 'N/A'}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    #{index + 1}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    PPS: {pps.toFixed(3)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  <span className="truncate">{reason}</span>
                </div>
                
                {player.tier && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span>Tier {player.tier}</span>
                  </div>
                )}
                
                {player.slp_rank && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Sleeper #{player.slp_rank}</span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => draft(player.player, 'me')}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <User className="h-4 w-4 mr-1" />
                  I took
                </button>
                <button
                  onClick={() => draft(player.player, 'opp')}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Opp took
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {topPlayers.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No recommendations available. Load player data first.
        </div>
      )}
    </div>
  );
} 