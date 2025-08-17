'use client';

import React from 'react';
import { useDraftStore } from '../store/draftStore';
import { TrendingUp, Target, Users, Trophy } from 'lucide-react';

export default function LiveRecommendations() {
  const { 
    remaining, 
    config, 
    draft, 
    PPS, 
    PVI, 
    tierMetrics, 
    rosterNeeds, 
    flexPressure,
    scarcityMetrics,
    tierUrgency,
    availabilityRisk
  } = useDraftStore();

  const getTopRecommendations = () => {
    // Only show players with positive value (cheaper on Sleeper than Underdog ADP)
    const playersWithPositiveValue = remaining
      .filter(player => {
        // Must have both Underdog ADP and Sleeper rank to calculate value
        if (!player.und_adp || !player.slp_rank) return false;
        
        // Calculate value: Sleeper rank - Underdog ADP (positive = cheaper on Sleeper)
        const value = player.slp_rank - player.und_adp;
        return value > 0;
      })
      .map(player => ({
        ...player,
        value: player.slp_rank - player.und_adp,
        pps: PPS[player.player] || 0
      }))
      // Sort by value first (highest positive value first), then by PPS
      .sort((a, b) => {
        if (b.value !== a.value) {
          return b.value - a.value; // Higher value first
        }
        return b.pps - a.pps; // Then by PPS as tiebreaker
      })
      .slice(0, 8);

    return playersWithPositiveValue;
  };

  const getRecommendationReason = (player: any) => {
    const reasons = [];
    
    // Value-based reason (always positive since we filter for positive value)
    reasons.push(`+${player.value} value`);
    
    if (rosterNeeds[player.pos]) {
      reasons.push(`Need ${player.pos}`);
    }
    
    if (tierUrgency[player.player]) {
      reasons.push('Tier cliff');
    }
    
    if (scarcityMetrics[player.pos]?.urgency > 0.7) {
      reasons.push('Scarce position');
    }
    
    if (availabilityRisk[player.player]?.takeNow) {
      reasons.push('Take now');
    }
    
    return reasons.slice(0, 2).join(' • ') || `+${player.value} value`;
  };

  const getPriorityLevel = (player: any) => {
    const value = player.value;
    if (value >= 20) return { level: 'Steal', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' };
    if (value >= 10) return { level: 'Great Value', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' };
    if (value >= 5) return { level: 'Good Value', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' };
    return { level: 'Value Pick', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200' };
  };

  const topRecommendations = getTopRecommendations();
  const remainingRookies = remaining.filter(p => p.isRookie);
  const top50Rookies = remainingRookies.filter(p => (PPS[p.player] || 0) > 0.5).length;

  return (
    <div className="space-y-6">
      {/* PVI Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <div className="w-5 h-5 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-3">
            <TrendingUp className="h-3 w-3 text-purple-600 dark:text-purple-400" />
          </div>
          Positional Value
        </h3>
        
        <div className="space-y-3">
          {Object.entries(PVI)
            .sort(([,a], [,b]) => b - a)
            .map(([pos, value]) => (
              <div key={pos} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{pos}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${value * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {value.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Top Value Picks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-3">
            <Target className="h-3 w-3 text-green-600 dark:text-green-400" />
          </div>
          Top Value Picks
        </h3>
        
        {topRecommendations.length > 0 ? (
          <div className="space-y-3">
            {topRecommendations.map((player, index) => {
              const priority = getPriorityLevel(player);
              const reason = getRecommendationReason(player);
              
              return (
                <div key={player.player} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {player.player}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {player.pos} • {player.team || '-'}
                        {player.isRookie && (
                          <span className="ml-1 inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                            R
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priority.color}`}>
                      {priority.level}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {reason}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Und: {player.und_adp} • SLP: {player.slp_rank}
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          const currentPick = remaining.length + 1;
                          const round = Math.ceil(currentPick / config.teams);
                          const pick = ((currentPick - 1) % config.teams) + 1;
                          draft(player.player, round, pick, 'me');
                        }}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                        title="Draft for me"
                      >
                        <Users className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">
              No value picks available
            </div>
            <div className="text-gray-400 dark:text-gray-500 text-xs">
              Players will appear here when they have positive value (cheaper on Sleeper than Underdog ADP)
            </div>
          </div>
        )}
      </div>

      {/* Rookie Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <div className="w-5 h-5 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mr-3">
            <Trophy className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
          </div>
          2025 Rookies
        </h3>
        
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {remainingRookies.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Remaining</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {top50Rookies}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Top 50 Value</div>
          </div>
        </div>
      </div>
    </div>
  );
} 