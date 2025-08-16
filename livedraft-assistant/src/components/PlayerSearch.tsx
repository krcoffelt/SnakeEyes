'use client';

import React, { useState } from 'react';
import { useDraftStore } from '../store/draftStore';
import { Search, Filter, User, Users, ChevronUp, ChevronDown } from 'lucide-react';

export default function PlayerSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [showRookiesOnly, setShowRookiesOnly] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [draftRound, setDraftRound] = useState(1);
  const [draftPick, setDraftPick] = useState(1);
  const [draftBy, setDraftBy] = useState<'me' | 'opp'>('opp');
  const [sortBy, setSortBy] = useState<'rank' | 'adp' | 'value'>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const { remaining, config, draft } = useDraftStore();
  
  const positions = ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'];
  
  const filteredPlayers = remaining.filter(player => {
    const matchesSearch = player.player.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = !selectedPosition || player.pos === selectedPosition;
    const matchesRookie = !showRookiesOnly || player.isRookie;
    return matchesSearch && matchesPosition && matchesRookie;
  }).slice(0, 20); // Limit to top 20 results for search
  
  // Sort function for the main table
  const getSortedPlayers = () => {
    let sorted = [...remaining];
    
    // Apply filters
    if (selectedPosition) {
      sorted = sorted.filter(player => player.pos === selectedPosition);
    }
    if (showRookiesOnly) {
      sorted = sorted.filter(player => player.isRookie);
    }
    if (searchTerm) {
      sorted = sorted.filter(player => 
        player.player.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort
    sorted.sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortBy) {
        case 'rank':
          aValue = a.und_rank || 999;
          bValue = b.und_rank || 999;
          break;
        case 'adp':
          aValue = a.und_adp || 999;
          bValue = b.und_adp || 999;
          break;
        case 'value':
          aValue = a.value || 0;
          bValue = b.value || 0;
          break;
        default:
          aValue = a.und_rank || 999;
          bValue = b.und_rank || 999;
      }
      
      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
    
    return sorted;
  };
  
  const handleSort = (column: 'rank' | 'adp' | 'value') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };
  
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
  
  const sortedPlayers = getSortedPlayers();
  
  return (
    <div className="sleeper-card p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-3">
          <Search className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
        Player Search & Board
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
      <div className="mb-6">
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
      
      {/* Live Player Table */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Available Players ({sortedPlayers.length})
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full sleeper-table">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300">
                  Player
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300">
                  Pos
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300">
                  Team
                </th>
                <th 
                  className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => handleSort('rank')}
                >
                  <div className="flex items-center">
                    Und Rank
                    {sortBy === 'rank' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => handleSort('adp')}
                >
                  <div className="flex items-center">
                    Und ADP
                    {sortBy === 'adp' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => handleSort('value')}
                >
                  <div className="flex items-center">
                    Value
                    {sortBy === 'value' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.slice(0, 50).map((player, index) => (
                <tr 
                  key={player.player} 
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {player.player}
                      </div>
                      {player.isRookie && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                          ROOKIE
                        </span>
                      )}
                    </div>
                    {player.bye && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        BYE: {player.bye}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      player.pos === 'QB' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
                      player.pos === 'RB' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                      player.pos === 'WR' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200' :
                      player.pos === 'TE' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200' :
                      player.pos === 'DEF' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                      player.pos === 'K' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {player.pos}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-700 dark:text-gray-300">
                    {player.team || '-'}
                  </td>
                  <td className="py-3 px-2 text-gray-700 dark:text-gray-300">
                    {player.und_rank || '-'}
                  </td>
                  <td className="py-3 px-2 text-gray-700 dark:text-gray-300">
                    {player.und_adp || '-'}
                  </td>
                  <td className="py-3 px-2 text-gray-700 dark:text-gray-300">
                    {player.value ? (player.value > 0 ? `+${player.value}` : player.value.toString()) : '-'}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => quickDraft(player.player, 'me')}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                        title="Draft for me"
                      >
                        <User className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => quickDraft(player.player, 'opp')}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                        title="Draft for opponent"
                      >
                        <Users className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedPlayers.length > 50 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            Showing first 50 players. Use search and filters to find specific players.
          </div>
        )}
      </div>
      
      {/* Search Results (for quick access) */}
      {searchTerm && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Quick Search Results
          </h3>
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