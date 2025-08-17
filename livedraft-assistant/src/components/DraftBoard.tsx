'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDraftStore } from '../store/draftStore';
import shallow from 'zustand/shallow';
import { Grid, Clock, User, Users, Undo2, RotateCcw, ChevronUp, ChevronDown, Circle } from 'lucide-react';

export default function DraftBoard() {
  const { draftBoard, config, drafted, undo, resetDraft } = useDraftStore(
    s => ({ draftBoard: s.draftBoard, config: s.config, drafted: s.drafted, undo: s.undo, resetDraft: s.resetDraft }),
    shallow
  );
  const [visibleRounds, setVisibleRounds] = useState({ start: 1, end: 5 });
  
  const maxRounds = 15; // Maximum rounds to display
  const teams = config.teams;
  const roundsToShow = 5; // Number of rounds visible at once
  
  const posGradient = (pos: string) => {
    switch (pos) {
      case 'QB': return 'from-sky-500 to-sky-600 text-white';
      case 'RB': return 'from-emerald-500 to-emerald-600 text-white';
      case 'WR': return 'from-indigo-500 to-indigo-600 text-white';
      case 'TE': return 'from-amber-500 to-amber-600 text-white';
      case 'DEF': return 'from-rose-500 to-rose-600 text-white';
      case 'K': return 'from-yellow-500 to-yellow-600 text-white';
      default: return 'from-gray-200 to-gray-300 text-gray-800 dark:from-gray-700 dark:to-gray-600 dark:text-white';
    }
  };

  const gridStyle = useMemo(() => ({ gridTemplateColumns: `80px repeat(${teams}, 96px)` }), [teams]);
  
  const getDraftDirection = (round: number) => {
    return round % 2 === 1 ? 'left-to-right' : 'right-to-left';
  };
  
  const getCurrentPick = () => {
    const totalPicks = drafted.length;
    const round = Math.ceil(totalPicks / teams);
    const pick = ((totalPicks - 1) % teams) + 1;
    return { round, pick };
  };
  
  // Function to abbreviate: First initial + Last name (e.g., "J. Chase")
  const getAbbreviatedName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const suffixes = new Set(['Jr.', 'Jr', 'Sr.', 'Sr', 'II', 'III', 'IV', 'V']);
    let last = parts[parts.length - 1];
    if (suffixes.has(last) && parts.length >= 2) {
      last = parts[parts.length - 2];
    }
    const firstInitial = parts[0].charAt(0);
    return `${firstInitial}. ${last}`;
  };
  
  const { round: currentRound, pick: currentPick } = getCurrentPick();
  
  // Auto-scroll to keep current round visible
  useEffect(() => {
    if (currentRound < visibleRounds.start || currentRound > visibleRounds.end) {
      const newStart = Math.max(1, currentRound - Math.floor(roundsToShow / 2));
      const newEnd = Math.min(maxRounds, newStart + roundsToShow - 1);
      setVisibleRounds({ start: newStart, end: newEnd });
    }
  }, [currentRound, visibleRounds.start, visibleRounds.end]);
  
  const scrollUp = () => {
    setVisibleRounds(prev => ({
      start: Math.max(1, prev.start - roundsToShow),
      end: Math.max(roundsToShow, prev.end - roundsToShow)
    }));
  };
  
  const scrollDown = () => {
    setVisibleRounds(prev => ({
      start: Math.min(maxRounds - roundsToShow + 1, prev.start + roundsToShow),
      end: Math.min(maxRounds, prev.end + roundsToShow)
    }));
  };
  
  const canScrollUp = visibleRounds.start > 1;
  const canScrollDown = visibleRounds.end < maxRounds;
  
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
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <div className="w-5 h-5 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-3">
              <Grid className="h-3 w-3 text-purple-600 dark:text-purple-400" />
            </div>
            Live Draft Board
          </h2>
          
          {/* Scroll Controls */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Rounds {visibleRounds.start}-{visibleRounds.end} of {maxRounds}
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

        {/* Team header chips */}
        <div className="grid gap-1 mb-2" style={gridStyle}>
          <div className="w-20" />
          {Array.from({ length: teams }, (_, i) => i + 1).map(teamNum => (
            <div key={teamNum} className="w-24 flex items-center justify-center">
              <div className="px-2 py-1 rounded-full bg-gray-800 text-gray-100 text-[10px] dark:bg-gray-700">
                Team {teamNum}
              </div>
            </div>
          ))}
        </div>

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
        
        {/* Draft Board Grid - Scrollable */}
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {Array.from({ length: roundsToShow }, (_, index) => {
              const round = visibleRounds.start + index;
              if (round > maxRounds) return null;
              const direction = getDraftDirection(round);
              return (
                <div key={round} className="grid gap-1 mb-1" style={gridStyle}>
                  <div className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300 text-center py-2">
                    {round}
                  </div>
                  {Array.from({ length: teams }, (_, pickIndex) => {
                    const teamColumn = pickIndex + 1; // always render by team number left-to-right
                    const draftedPlayer = draftBoard[round]?.[teamColumn];
                    const isCurrentPick = round === currentRound && teamColumn === (currentRound % 2 === 1 ? currentPick : (teams - currentPick + 1));
                    const isUserTeam = teamColumn === config.slot;
                    const overall = draftedPlayer ? draftedPlayer.overall : undefined;

                    return (
                      <div
                        key={teamColumn}
                        className={`w-24 h-16 rounded-lg border transition-all ${
                          isCurrentPick
                            ? 'border-yellow-500'
                            : isUserTeam
                            ? 'border-blue-500'
                            : 'border-transparent'
                        }`}
                      >
                        {draftedPlayer ? (
                          <div className={`h-full w-full rounded-lg p-2 bg-gradient-to-br ${posGradient(draftedPlayer.pos)} shadow-sm`}> 
                            <div className="flex justify-between items-start">
                              <div className="text-[11px] font-semibold truncate">
                                {getAbbreviatedName(draftedPlayer.player)}
                              </div>
                              <div className="text-[10px] bg-white/20 px-1.5 rounded-full">
                                #{overall}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <div className="text-[10px] opacity-90 truncate">
                                {draftedPlayer.pos} • {draftedPlayer.team || '-'}
                              </div>
                              <span className="text-[10px] opacity-90">
                                {draftedPlayer.draftedBy === 'me' ? 'Me' : 'Opp'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className={`h-full w-full rounded-lg p-2 bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${
                            isCurrentPick ? 'ring-2 ring-yellow-500' : isUserTeam ? 'ring-2 ring-blue-500' : ''
                          }`}>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
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