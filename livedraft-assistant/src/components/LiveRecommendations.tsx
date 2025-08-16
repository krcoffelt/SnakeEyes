'use client';

import React from 'react';
import { useDraftStore } from '../store/draftStore';
import { TrendingUp, AlertTriangle, Clock, Target } from 'lucide-react';

export default function LiveRecommendations() {
  const { remaining, PPS, PVI, myRoster, config, weights, tierMetrics, scarcityMetrics } = useDraftStore();
  
  // Get top recommendations by PPS
  const topRecommendations = remaining
    .map(player => ({
      ...player,
      pps: PPS[player.player] || 0
    }))
    .sort((a, b) => b.pps - a.pps)
    .slice(0, 8);
  
  const getPositionColor = (pos: string) => {
    switch (pos) {
      case 'QB': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'RB': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'WR': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
      case 'TE': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200';
      case 'DEF': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      case 'K': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };
  
  const getRecommendationReason = (player: any) => {
    const reasons = [];
    
    // Check roster needs
    if (player.pos === 'QB' && myRoster.QB < config.roster.QB) {
      reasons.push('Need QB');
    }
    if (player.pos === 'RB' && myRoster.RB < config.roster.RB) {
      reasons.push('Need RB');
    }
    if (player.pos === 'WR' && myRoster.WR < config.roster.WR) {
      reasons.push('Need WR');
    }
    if (player.pos === 'TE' && myRoster.TE < config.roster.TE) {
      reasons.push('Need TE');
    }
    
    // Check FLEX pressure
    const flexDebt = Math.max(0, 6 - (myRoster.RB + myRoster.WR));
    if ((player.pos === 'RB' || player.pos === 'WR') && flexDebt > 0) {
      reasons.push('FLEX pressure');
    }
    
    // Check tier urgency
    if (player.tier && player.tier <= 2) {
      reasons.push('Elite tier');
    }
    
    // Check availability risk
    if (player.slp_rank && player.slp_rank <= 50) {
      reasons.push('High value');
    }
    
    return reasons.length > 0 ? reasons.join(' • ') : 'Best available';
  };
  
  const getPriorityLevel = (pps: number) => {
    if (pps >= 0.8) return { color: 'text-red-600 dark:text-red-400', icon: AlertTriangle, label: 'Take Now' };
    if (pps >= 0.6) return { color: 'text-orange-600 dark:text-orange-400', icon: Clock, label: 'Consider' };
    return { color: 'text-green-600 dark:text-green-400', icon: Target, label: 'Good Value' };
  };
  
  return (
    <div className="sleeper-card p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mr-3">
          <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </div>
        Live Recommendations
      </h2>
      
      {/* PVI Summary */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Positional Value Index</h3>
        <div className="space-y-2">
          {Object.entries(PVI)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([pos, value]) => (
              <div key={pos} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{pos}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(value as number) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {(value as number).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
      
      {/* Rookie Summary */}
      <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
        <h3 className="text-sm font-medium text-green-700 dark:text-green-300 mb-3">2025 Rookies</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-medium text-green-600 dark:text-green-400">
              {remaining.filter(p => p.isRookie).length}
            </span>
            <span className="text-green-600 dark:text-green-400"> remaining</span>
          </div>
          <div>
            <span className="font-medium text-green-600 dark:text-green-400">
              {remaining.filter(p => p.isRookie && p.slp_rank && p.slp_rank <= 50).length}
            </span>
            <span className="text-green-600 dark:text-green-400"> top 50</span>
          </div>
        </div>
        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
          Rookies get +8% PPS boost for upside potential
        </p>
      </div>
      
      {/* Top Recommendations */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Top Picks</h3>
        {topRecommendations.map((player, index) => {
          const priority = getPriorityLevel(player.pps);
          const PriorityIcon = priority.icon;
          
          return (
            <div
              key={player.player}
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {index + 1}. {player.player}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {player.pos} • {player.team} • Und: {player.und_rank} • SLP: {player.slp_rank}
                    {player.bye && ` • BYE: ${player.bye}`}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getPositionColor(player.pos)}`}>
                    {player.pos}
                  </span>
                  {player.isRookie && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                      R
                    </span>
                  )}
                  <div className={`flex items-center space-x-1 ${priority.color}`}>
                    <PriorityIcon className="h-3 w-3" />
                    <span className="text-xs font-medium">{priority.label}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {getRecommendationReason(player)}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    PPS: {player.pps.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Tier: {player.tier || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Quick Actions */}
      <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
        <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">Quick Actions</h3>
        <div className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
          <div>• Click player cards to draft</div>
          <div>• Use search for specific players</div>
          <div>• Adjust weights to change recommendations</div>
        </div>
      </div>
    </div>
  );
} 