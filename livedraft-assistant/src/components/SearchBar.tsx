'use client';

import React, { useState } from 'react';
import { Search, Undo2 } from 'lucide-react';
import { useDraftStore } from '../store/draftStore';

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const { remaining, draft, undo, config } = useDraftStore();
  
  const positions = ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'];
  
  const filteredPlayers = remaining.filter(player => {
    const matchesSearch = player.player.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = !selectedPosition || player.pos === selectedPosition;
    return matchesSearch && matchesPosition;
  });
  
  const handleDraft = (playerName: string, who: 'me' | 'opp') => {
    const currentPick = remaining.length + 1;
    const round = Math.ceil(currentPick / config.teams);
    const pick = ((currentPick - 1) % config.teams) + 1;
    draft(playerName, round, pick, who);
    setSearchTerm('');
  };
  
  return (
    <div className="sleeper-card p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
          <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">🔍</span>
        </div>
        Player Search & Quick Actions
      </h2>
      
      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search players..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="sleeper-input pl-10"
        />
      </div>
      
      {/* Position Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedPosition('')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            !selectedPosition
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All Positions
        </button>
        {positions.map(pos => (
          <button
            key={pos}
            onClick={() => setSelectedPosition(pos)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPosition === pos
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {pos}
          </button>
        ))}
      </div>
      
      {/* Quick Draft Instructions */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <span className="mr-2">Quick Draft:</span>
          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            Click &quot;I took&quot; or &quot;Opp took&quot; on player cards
          </span>
        </div>
      </div>
      
      {/* Undo Button */}
      <div className="mb-6">
        <button
          onClick={undo}
          className="btn-outline flex items-center justify-center w-full"
        >
          <Undo2 className="h-4 w-4 mr-2" />
          Undo Last Pick
        </button>
      </div>
      
      {/* Search Results */}
      {searchTerm && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredPlayers.slice(0, 10).map(player => (
            <div
              key={player.player}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {player.player}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {player.pos} • {player.team} • Und: {player.und_rank} • SLP: {player.slp_rank}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDraft(player.player, 'me')}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                >
                  I took
                </button>
                <button
                  onClick={() => handleDraft(player.player, 'opp')}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                >
                  Opp took
                </button>
              </div>
            </div>
          ))}
          {filteredPlayers.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              No players found matching &quot;{searchTerm}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
} 