'use client';

import React from 'react';
import { useDraftStore } from '../store/draftStore';
import { formatRound } from '../lib/util';

export default function DraftTracker() {
  const { drafted, config } = useDraftStore();
  
  const overallPick = drafted.length + 1;
  const round = Math.ceil(overallPick / config.teams);
  const pickInRound = ((overallPick - 1) % config.teams) + 1;
  
  // Calculate next user pick
  const nextUserPick = (() => {
    if (round % 2 === 1) {
      // Odd rounds: ascending order
      return (round - 1) * config.teams + config.slot;
    } else {
      // Even rounds: descending order
      return round * config.teams - (config.slot - 1);
    }
  })();
  
  const picksUntilYou = nextUserPick - overallPick;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Draft Tracker
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {overallPick}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Overall Pick
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatRound(overallPick, config.teams)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Round.Pick
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {nextUserPick}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Next Your Turn
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {picksUntilYou}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Picks Until You
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <strong>Current Position:</strong> Pick #{overallPick} • Round {round} • Pick {pickInRound} of {config.teams}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          <strong>Next Turn:</strong> Overall #{nextUserPick} • {picksUntilYou > 0 ? `${picksUntilYou} picks away` : 'Your turn now!'}
        </div>
      </div>
    </div>
  );
} 