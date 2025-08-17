'use client';

import React from 'react';
import { useDraftStore } from '../store/draftStore';
import { Grid, Clock, User, Users, Undo2, RotateCcw } from 'lucide-react';

export default function DraftBoard() {
  const { draftBoard, config, drafted, undo, resetDraft } = useDraftStore();
  
  const maxRounds = 15; // Maximum rounds to display
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
    <div className="w-full">
      {/* Draft Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {config.teams}-team {config.ppr} Snake Draft
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Round {currentRound} • Pick {currentPick} • Overall #{((currentRound - 1) * teams) + currentPick}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={undo}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors flex items-center"
            >
              <Undo2 className="h-4 w-4 mr-1" />
              Undo
            </button>
            <button
              onClick={resetDraft}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </button>
          </div>
        </div>
      </div>
      
      {/* Live Draft Board - Wide and Prominent */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <div className="w-5 h-5 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-3">
            <Grid className="h-3 w-3 text-purple-600 dark:text-purple-400" />
          </div>
          Live Draft Board
        </h2>
        
        {/* Current Pick Indicator */}
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Pick:</span>
              <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
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
                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
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
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
    </div>
  );
} 