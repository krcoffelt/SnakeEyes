'use client';

import React from 'react';
import { useDraftStore } from '../store/draftStore';

export default function PositionalPanel() {
  const { PVI, remaining, weights } = useDraftStore();
  
  // Sort positions by PVI (highest first)
  const sortedPositions = Object.entries(PVI)
    .sort(([, a], [, b]) => (b as number) - (a as number));
  
  const getPositionColor = (position: string) => {
    const colors = {
      'QB': 'bg-blue-500',
      'RB': 'bg-green-500',
      'WR': 'bg-purple-500',
      'TE': 'bg-orange-500',
      'DEF': 'bg-red-500',
      'K': 'bg-gray-500'
    };
    return colors[position as keyof typeof colors] || 'bg-gray-500';
  };
  
  const getRationale = (position: string) => {
    const posPlayers = remaining.filter(p => p.pos === position);
    const count = posPlayers.length;
    
    if (count === 0) return 'No players available';
    
    // Simple rationale based on count and weights
    if (count <= 3) return `Critical scarcity (${count} left)`;
    if (count <= 6) return `High scarcity (${count} left)`;
    if (count <= 10) return `Moderate scarcity (${count} left)`;
    return `Good depth (${count} left)`;
  };
  
  if (sortedPositions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Positional Value Index
        </h2>
        <div className="text-gray-500 dark:text-gray-400 text-center py-8">
          Loading PVI data...
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Positional Value Index
      </h2>
      
      <div className="space-y-4">
        {sortedPositions.map(([position, pvi]) => (
          <div key={position} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${getPositionColor(position)}`} />
                <span className="font-medium text-gray-900 dark:text-white">
                  {position}
                </span>
                <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                  {(pvi as number).toFixed(2)}
                </span>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {getRationale(position)}
              </div>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${getPositionColor(position)}`}
                style={{ width: `${(pvi as number) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <strong>PVI Explanation:</strong> Higher values indicate positions with better value opportunities based on:
        </div>
        <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
          <li>• Market discounts (value)</li>
          <li>• Tier cliff urgency</li>
          <li>• Your roster needs</li>
          <li>• Positional scarcity</li>
          <li>• Availability risk</li>
        </ul>
      </div>
    </div>
  );
} 