'use client';

import React from 'react';
import { useDraftStore } from '../store/draftStore';

export default function RosterCard() {
  const { myRoster } = useDraftStore();
  
  const flexDebt = Math.max(0, 6 - (myRoster.RB + myRoster.WR));
  const flexProgress = Math.min(1, (myRoster.RB + myRoster.WR) / 6);
  
  const getPositionColor = (count: number, required: number) => {
    if (count >= required) return 'text-green-600 dark:text-green-400';
    if (count === required - 1) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        My Roster
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className={`text-2xl font-bold ${getPositionColor(myRoster.QB, 1)}`}>
            {myRoster.QB}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">QB</div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${getPositionColor(myRoster.RB, 2)}`}>
            {myRoster.RB}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">RB</div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${getPositionColor(myRoster.WR, 2)}`}>
            {myRoster.WR}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">WR</div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${getPositionColor(myRoster.TE, 1)}`}>
            {myRoster.TE}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">TE</div>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* FLEX Pressure Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              FLEX Pressure (RB + WR)
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {myRoster.RB + myRoster.WR}/6
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                flexProgress >= 1 
                  ? 'bg-green-500' 
                  : flexProgress >= 0.67 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
              }`}
              style={{ width: `${flexProgress * 100}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>0</span>
            <span>2</span>
            <span>4</span>
            <span>6+</span>
          </div>
        </div>
        
        {/* FLEX Debt Indicator */}
        {flexDebt > 0 && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>FLEX Debt:</strong> Need {flexDebt} more RB/WR by end of Round 8
            </div>
          </div>
        )}
        
        {/* Special Teams */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className={`text-xl font-bold ${getPositionColor(myRoster.DEF, 1)}`}>
              {myRoster.DEF}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">DEF</div>
          </div>
          
          <div className="text-center">
            <div className={`text-xl font-bold ${getPositionColor(myRoster.K, 1)}`}>
              {myRoster.K}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">K</div>
          </div>
        </div>
        
        {/* Total Count */}
        <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            Total: {myRoster.total}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Drafted Players
          </div>
        </div>
      </div>
    </div>
  );
} 