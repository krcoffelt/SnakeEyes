'use client';

import React, { useState } from 'react';
import { useDraftStore } from '../store/draftStore';
import { Search, Filter, User, Users } from 'lucide-react';

export default function PlayerSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [showRookiesOnly, setShowRookiesOnly] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [draftRound, setDraftRound] = useState(1);
  const [draftPick, setDraftPick] = useState(1);
  const [draftBy, setDraftBy] = useState<'me' | 'opp'>('opp');
  
  const { remaining, config, draft } = useDraftStore();
  
  const positions = ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'];
  
  const filteredPlayers = remaining.filter(player => {
    const matchesSearch = player.player.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = !selectedPosition || player.pos === selectedPosition;
    const matchesRookie = !showRookiesOnly || player.isRookie;
    return matchesSearch && matchesPosition && matchesRookie;
  }).slice(0, 20); // Limit to top 20 results
  
  const handleDraft = () => {
    if (selectedPlayer) {
      draft(selectedPlayer, draftRound, draftPick, draftBy);
      setShowDraftModal(false);
      setSelectedPlayer('');
      setSearchTerm('');
    }
  };
  
  const quickDraft = (playerName: string, who: 'me' | 'opp') => {
    const currentPick = remaining.length + 1;
    const round = Math.ceil(currentPick / config.teams);
    const pick = ((currentPick - 1) % config.teams) + 1;
    draft(playerName, round, pick, who);
    setSearchTerm('');
  };
  
  return (
    <div className="sleeper-card p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-3">
          <Search className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
        Player Search
      </h2>
      
      {/* Search Input */}
      <div className="relative mb-4">
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
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedPosition('')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                !selectedPosition
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All
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
          
          {/* Rookie Filter */}
          <div className="mb-4">
            <button
              onClick={() => setShowRookiesOnly(!showRookiesOnly)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showRookiesOnly
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {showRookiesOnly ? 'ROOKIES ONLY' : 'SHOW ROOKIES'}
            </button>
          </div>
      
      {/* Search Results */}
      {searchTerm && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredPlayers.map(player => (
            <div
              key={player.player}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedPlayer(player.player);
                setShowDraftModal(true);
              }}
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {player.player}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {player.pos} • {player.team} • Und: {player.und_rank} • SLP: {player.slp_rank}
                  {player.bye && ` • BYE: ${player.bye}`}
                  {player.isRookie && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                      ROOKIE
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    quickDraft(player.player, 'me');
                  }}
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                >
                  <User className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    quickDraft(player.player, 'opp');
                  }}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                >
                  <Users className="h-3 w-3" />
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
      
      {/* Draft Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Draft {selectedPlayer}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Round
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={draftRound}
                  onChange={(e) => setDraftRound(parseInt(e.target.value))}
                  className="sleeper-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pick in Round
                </label>
                <input
                  type="number"
                  min="1"
                  max={config.teams}
                  value={draftPick}
                  onChange={(e) => setDraftPick(parseInt(e.target.value))}
                  className="sleeper-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Drafted By
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setDraftBy('me')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      draftBy === 'me'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Me
                  </button>
                  <button
                    onClick={() => setDraftBy('opp')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      draftBy === 'opp'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Opponent
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowDraftModal(false)}
                className="flex-1 py-2 px-4 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDraft}
                className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Draft Player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 