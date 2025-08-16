'use client';

import React from 'react';
import { ChevronUp, ChevronDown, User, Users } from 'lucide-react';
import { useDraftStore } from '../store/draftStore';
import { Player } from '../lib/types';

export default function ValueBoard() {
  const { 
    remaining, 
    PPS, 
    searchQuery, 
    positionFilter, 
    sortBy, 
    setSortBy,
    draft 
  } = useDraftStore();
  
  // Filter players based on search and position
  const filteredPlayers = remaining.filter(player => {
    const matchesSearch = searchQuery === '' || 
      player.player.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (player.team && player.team.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPosition = positionFilter === '' || player.pos === positionFilter;
    
    return matchesSearch && matchesPosition;
  });
  
  // Sort players
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    switch (sortBy) {
      case 'PPS':
        return (PPS[b.player] || 0) - (PPS[a.player] || 0);
      case 'Value':
        return (b.value || 0) - (a.value || 0);
      case 'BlendRank':
        return (a.blend_rank || Infinity) - (b.blend_rank || Infinity);
      default:
        return 0;
    }
  });
  
  const getSortIcon = (column: 'PPS' | 'Value' | 'BlendRank') => {
    if (sortBy !== column) return null;
    return <ChevronDown className="h-4 w-4" />;
  };
  
  const getRiskLevel = (player: Player) => {
    if (!player.slp_rank) return { level: 'unknown', text: 'Unknown', color: 'bg-gray-500' };
    
    // This would need to be computed based on next pick availability
    // For now, using a simple heuristic
    if (player.slp_rank <= 50) return { level: 'high', text: 'Take now', color: 'bg-red-500' };
    if (player.slp_rank <= 100) return { level: 'medium', text: 'Could wait', color: 'bg-yellow-500' };
    return { level: 'low', text: 'Safe to wait', color: 'bg-green-500' };
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Value Board
        </h2>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'PPS' | 'Value' | 'BlendRank')}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="PPS">PPS</option>
            <option value="Value">Value</option>
            <option value="BlendRank">Blend Rank</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Player
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Pos
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Team
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Und Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                SLP Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tier
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                PPS
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Risk
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedPlayers.map((player, index) => {
              const risk = getRiskLevel(player);
              return (
                <tr key={player.player} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {player.player}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      {player.pos || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {player.team || 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {player.und_rank || 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {player.slp_rank || 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {player.value !== null && player.value !== undefined ? player.value.toFixed(1) : 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {player.tier || 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {(PPS[player.player] || 0).toFixed(3)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${risk.color}`}>
                      {risk.text}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => draft(player.player, 'me')}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                      >
                        <User className="h-3 w-3 mr-1" />
                        I took
                      </button>
                      <button
                        onClick={() => draft(player.player, 'opp')}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Opp took
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {sortedPlayers.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No players match your current filters.
        </div>
      )}
    </div>
  );
} 