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
    const playersWithPPS = remaining
      .filter(player => PPS[player.player] !== undefined)
      .map(player => ({
        ...player,
        pps: PPS[player.player] || 0
      }))
      .sort((a, b) => b.pps - a.pps)
      .slice(0, 8);

    return playersWithPPS;
  };

  const getRecommendationReason = (player: any) => {
    const reasons = [];
    
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
    
    return reasons.slice(0, 2).join(' • ') || 'Good value';
  };

  const getPriorityLevel = (player: any) => {
    const pps = PPS[player.player] || 0;
    if (pps > 0.8) return { level: 'Take Now', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' };
    if (pps > 0.6) return { level: 'Consider', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' };
    return { level: 'Good Value', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' };
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

      {/* Top Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-3">
            <Target className="h-3 w-3 text-green-600 dark:text-green-400" />
          </div>
          Top Picks
        </h3>
        
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
                    PPS: {(player.pps * 100).toFixed(0)}
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