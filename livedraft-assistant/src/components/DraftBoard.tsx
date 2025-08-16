'use client';

import React from 'react';
import { useDraftStore } from '../store/draftStore';
import { Grid, Clock, User, Users } from 'lucide-react';

export default function DraftBoard() {
  const { draftBoard, config, drafted, undo, resetDraft } = useDraftStore();
  
  const maxRounds = 20; // Maximum rounds to display
  const teams = config.teams;
  
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
  
  const getDraftDirection = (round: number) => {
    return round % 2 === 1 ? 'left-to-right' : 'right-to-left';
  };
  
  const getCurrentPick = () => {
    const totalPicks = drafted.length;
    const round = Math.ceil(totalPicks / teams);
    const pick = ((totalPicks - 1) % teams) + 1;
    return { round, pick };
  };
  
  const { round: currentRound, pick: currentPick } = getCurrentPick();
  
  return (
    <div className="sleeper-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-3">
            <Grid className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          Draft Board
        </h2>
        
        <div className="flex space-x-2">
          <button
            onClick={undo}
            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors flex items-center"
          >
            <Clock className="h-4 w-4 mr-1" />
            Undo
          </button>
          <button
            onClick={resetDraft}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center"
          >
            <Users className="h-4 w-4 mr-1" />
            Reset
          </button>
        </div>
      </div>
      
      {/* Current Pick Indicator */}
      <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Current Pick:</span>
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              Round {currentRound}, Pick {currentPick}
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-600 dark:text-gray-400">Overall:</span>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              #{((currentRound - 1) * teams) + currentPick}
            </div>
          </div>
        </div>
      </div>
      
      {/* Draft Board Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header Row */}
          <div className="grid grid-cols-21 gap-1 mb-2">
            <div className="w-20 text-xs font-medium text-gray-500 dark:text-gray-400 text-center">
              Round
            </div>
            {Array.from({ length: teams }, (_, i) => i + 1).map(teamNum => (
              <div key={teamNum} className="w-24 text-xs font-medium text-gray-500 dark:text-gray-400 text-center">
                Team {teamNum}
              </div>
            ))}
          </div>
          
          {/* Draft Rows */}
          {Array.from({ length: maxRounds }, (_, roundIndex) => {
            const round = roundIndex + 1;
            const direction = getDraftDirection(round);
            
            return (
              <div key={round} className="grid grid-cols-21 gap-1 mb-1">
                {/* Round Label */}
                <div className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300 text-center py-2">
                  {round}
                </div>
                
                {/* Team Picks */}
                {Array.from({ length: teams }, (_, pickIndex) => {
                  const pick = direction === 'left-to-right' ? pickIndex + 1 : teams - pickIndex;
                  const draftedPlayer = draftBoard[round]?.[pick];
                  const isCurrentPick = round === currentRound && pick === currentPick;
                  const isUserTeam = pick === config.slot;
                  
                  return (
                    <div
                      key={pick}
                      className={`w-24 h-16 rounded-lg border-2 transition-all ${
                        isCurrentPick
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : isUserTeam
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                                             {draftedPlayer ? (
                         <div className="p-2 h-full flex flex-col justify-between">
                           <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                             {draftedPlayer.player}
                           </div>
                           <div className="text-xs text-gray-500 dark:text-gray-400">
                             {draftedPlayer.bye && `BYE ${draftedPlayer.bye}`}
                             {draftedPlayer.isRookie && (
                               <span className="ml-1 inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                                 R
                               </span>
                             )}
                           </div>
                           <div className="flex items-center justify-between">
                             <span className={`text-xs px-2 py-1 rounded-full ${getPositionColor(draftedPlayer.pos)}`}>
                               {draftedPlayer.pos}
                             </span>
                             <span className={`text-xs ${draftedPlayer.draftedBy === 'me' ? 'text-green-600' : 'text-red-600'}`}>
                               {draftedPlayer.draftedBy === 'me' ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                             </span>
                           </div>
                         </div>
                       ) : (
                        <div className="h-full flex items-center justify-center">
                          <span className="text-xs text-gray-400 dark:text-gray-600">
                            {isCurrentPick ? 'Current' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Draft Summary */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {drafted.filter(p => p.draftedBy === 'me').length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">My Picks</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {drafted.filter(p => p.draftedBy === 'opp').length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Opponent Picks</div>
          </div>
        </div>
      </div>
    </div>
  );
} 