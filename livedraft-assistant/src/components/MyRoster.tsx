'use client';

import React from 'react';
import { useDraftStore } from '../store/draftStore';
import { User, Users, Shield, Zap } from 'lucide-react';

export default function MyRoster() {
  const { myRoster, config } = useDraftStore();
  
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
  
  const getPositionIcon = (pos: string) => {
    switch (pos) {
      case 'QB': return 'QB';
      case 'RB': return 'RB';
      case 'WR': return 'WR';
      case 'TE': return 'TE';
      case 'DEF': return 'DEF';
      case 'K': return 'K';
      default: return '--';
    }
  };
  
  const positions = [
    { key: 'QB', label: 'QB', required: config.roster.QB, current: myRoster.QB },
    { key: 'RB', label: 'RB', required: config.roster.RB, current: myRoster.RB },
    { key: 'WR', label: 'WR', required: config.roster.WR, current: myRoster.WR },
    { key: 'TE', label: 'TE', required: config.roster.TE, current: myRoster.TE },
    { key: 'FLEX', label: 'FLEX', required: config.flexCount, current: Math.max(0, myRoster.RB + myRoster.WR - 4) },
    { key: 'DEF', label: 'DEF', required: config.roster.DEF, current: myRoster.DEF },
    { key: 'K', label: 'K', required: config.roster.K, current: myRoster.K }
  ];
  
  const totalRequired = Object.values(config.roster).reduce((sum, count) => sum + count, 0);
  const totalCurrent = myRoster.total;
  const progress = (totalCurrent / totalRequired) * 100;
  
  return (
    <div className="sleeper-card p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        My Roster
      </h2>
      
      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Draft Progress
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {totalCurrent}/{totalRequired}
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill progress-fill-primary" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Position Breakdown */}
      <div className="space-y-3">
        {positions.map(({ key, label, required, current }) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getPositionIcon(label)}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-semibold ${current >= required ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {current}/{required}
              </span>
              {current >= required && (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* FLEX Pressure */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            FLEX Pressure
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {Math.max(0, (4 + config.flexCount) - (myRoster.RB + myRoster.WR))} needed
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className={`progress-fill ${myRoster.RB + myRoster.WR >= (4 + config.flexCount) ? 'progress-fill-success' : 'progress-fill-warning'}`}
            style={{ width: `${Math.min(100, ((myRoster.RB + myRoster.WR) / (4 + config.flexCount)) * 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Aim for {4 + config.flexCount}+ RB/WR by end of draft ({config.flexCount === 1 ? '1 FLEX' : '2 FLEX'})
        </p>
      </div>
      
      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {myRoster.total}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Players Drafted
          </div>
        </div>
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {totalRequired - totalCurrent}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Remaining
          </div>
        </div>
      </div>
    </div>
  );
} 