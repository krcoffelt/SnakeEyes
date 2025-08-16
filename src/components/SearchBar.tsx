'use client';

import React from 'react';
import { Search, User, Users, Undo2 } from 'lucide-react';
import { useDraftStore } from '../store/draftStore';

export default function SearchBar() {
  const { 
    searchQuery, 
    setSearchQuery, 
    positionFilter, 
    setPositionFilter,
    undo 
  } = useDraftStore();
  
  const positions = ['', 'QB', 'RB', 'WR', 'TE', 'DEF', 'K'];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Search & Quick Actions
      </h2>
      
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Position Filter */}
        <div className="flex flex-wrap gap-2">
          {positions.map(pos => (
            <button
              key={pos}
              onClick={() => setPositionFilter(pos)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                positionFilter === pos
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {pos || 'All'}
            </button>
          ))}
        </div>
        
        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={undo}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Undo2 className="h-4 w-4 mr-2" />
            Undo Last Pick
          </button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <span className="mr-2">Quick Draft:</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              Click "I took" or "Opp took" on player cards
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 