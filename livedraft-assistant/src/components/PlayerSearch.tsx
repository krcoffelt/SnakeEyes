'use client';

import React, { useState } from 'react';
import { useDraftStore } from '../store/draftStore';
import { Search, Filter, User, Users, ChevronUp, ChevronDown, Plus } from 'lucide-react';

export default function PlayerSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [showRookiesOnly, setShowRookiesOnly] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [draftRound, setDraftRound] = useState(1);
  const [draftPick, setDraftPick] = useState(1);
  const [draftBy, setDraftBy] = useState<'me' | 'opp'>('opp');
  const [sortBy, setSortBy] = useState<'rank' | 'und_adp' | 'slp_rank' | 'value'>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [visiblePlayers, setVisiblePlayers] = useState({ start: 0, end: 10 });
  
  const { remaining, config, draft } = useDraftStore();
  
  const positions = ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'];
  const playersToShow = 10; // Number of players visible at once
  
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
        case 'und_adp':
          aValue = a.und_adp || 999;
          bValue = b.und_adp || 999;
          break;
        case 'slp_rank':
          aValue = a.slp_rank || 999;
          bValue = b.slp_rank || 999;
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
  
  const handleSort = (column: 'rank' | 'und_adp' | 'slp_rank' | 'value') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
    // Reset to first page when sorting
    setVisiblePlayers({ start: 0, end: playersToShow });
  };
  
  const scrollUp = () => {
    setVisiblePlayers(prev => ({
      start: Math.max(0, prev.start - playersToShow),
      end: Math.max(playersToShow, prev.end - playersToShow)
    }));
  };
  
  const scrollDown = () => {
    const sortedPlayers = getSortedPlayers();
    setVisiblePlayers(prev => ({
      start: Math.min(sortedPlayers.length - playersToShow, prev.start + playersToShow),
      end: Math.min(sortedPlayers.length, prev.end + playersToShow)
    }));
  };
  
  const canScrollUp = visiblePlayers.start > 0;
  const sortedPlayers = getSortedPlayers();
  const canScrollDown = visiblePlayers.end < sortedPlayers.length;
  const visiblePlayerSet = sortedPlayers.slice(visiblePlayers.start, visiblePlayers.end);
  
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
    <div className="w-full">
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-3">
            <Search className="h-3 w-3 text-green-600 dark:text-green-400" />
          </div>
          Player Search & Filters
        </h2>
        
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Find player..."
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
            All {remaining.length}/15
          </button>
          {positions.map(pos => {
            const count = remaining.filter(p => p.pos === pos).length;
            const required = pos === 'QB' || pos === 'TE' || pos === 'DEF' || pos === 'K' ? 1 : pos === 'FLEX' ? config.flexCount : 2;
            return (
              <button
                key={pos}
                onClick={() => setSelectedPosition(pos)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPosition === pos
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {pos} {count}/{required}
              </button>
            );
          })}
        </div>
        
        {/* Additional Filters */}
        <div className="flex flex-wrap gap-2">
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
      </div>
      
      {/* Live Player Table - Sleeper Style */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Available Players ({sortedPlayers.length})
            </h3>
            
            {/* Scroll Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Players {visiblePlayers.start + 1}-{Math.min(visiblePlayers.end, sortedPlayers.length)} of {sortedPlayers.length}
              </span>
              <div className="flex space-x-1">
                <button
                  onClick={scrollUp}
                  disabled={!canScrollUp}
                  className={`p-2 rounded-lg transition-colors ${
                    canScrollUp
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  }`}
                  title="Scroll up"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={scrollDown}
                  disabled={!canScrollDown}
                  className={`p-2 rounded-lg transition-colors ${
                    canScrollDown
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  }`}
                  title="Scroll down"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-4 px-4 font-medium text-gray-700 dark:text-gray-300">
                  RK
                </th>
                <th className="text-left py-4 px-4 font-medium text-gray-700 dark:text-gray-300">
                  PLAYER
                </th>
                <th 
                  className="text-left py-4 px-4 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => handleSort('und_adp')}
                >
                  <div className="flex items-center">
                    UND ADP
                    {sortBy === 'und_adp' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-left py-4 px-4 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => handleSort('slp_rank')}
                >
                  <div className="flex items-center">
                    SLP ADP
                    {sortBy === 'slp_rank' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-left py-4 px-4 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => handleSort('value')}
                >
                  <div className="flex items-center">
                    DIFF
                    {sortBy === 'value' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="text-left py-4 px-4 font-medium text-gray-700 dark:text-gray-300">
                  BYE
                </th>
                <th className="text-left py-4 px-4 font-medium text-gray-700 dark:text-gray-300">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {visiblePlayerSet.map((player, index) => (
                <tr 
                  key={player.player} 
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {player.und_rank || '-'}
                      </span>
                      <button className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
                        <Plus className="h-3 w-3 text-gray-500" />
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {player.player}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {player.pos} • {player.team || '-'}
                        </div>
                      </div>
                      {player.isRookie && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                          R
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                    {player.und_adp ? player.und_adp.toFixed(1) : '-'}
                  </td>
                  <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                    {player.slp_rank ? player.slp_rank.toFixed(1) : '-'}
                  </td>
                  <td className="py-4 px-4">
                    {player.und_adp && player.slp_rank ? (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        player.und_adp < player.slp_rank
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                      }`}>
                        {player.und_adp < player.slp_rank ? `+${(player.slp_rank - player.und_adp).toFixed(1)}` : `${(player.und_adp - player.slp_rank).toFixed(1)}`}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                    {player.bye || '-'}
                  </td>
                  <td className="py-4 px-4">
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
        
        {sortedPlayers.length > playersToShow && (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
            Showing {visiblePlayers.start + 1}-{Math.min(visiblePlayers.end, sortedPlayers.length)} of {sortedPlayers.length} players. Use scroll controls to navigate.
          </div>
        )}
      </div>
      
      {/* Search Results (for quick access) */}
      {searchTerm && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Quick Search Results
            </h3>
          </div>
          <div className="p-4">
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
                      {player.pos} • {player.team} • Und ADP: {player.und_adp ? player.und_adp.toFixed(1) : 'N/A'} • SLP ADP: {player.slp_rank ? player.slp_rank.toFixed(1) : 'N/A'}
                      {player.bye && ` • BYE: ${player.bye}`}
                      {player.isRookie && (
                        <span className="ml-2 inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                          R
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
                        : 'bg-gray-700 dark:bg-gray-600 text-gray-300'
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