'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDraftStore } from '../../store/draftStore';
import Header from '../../components/Header';
import DraftBoard from '../../components/DraftBoard';
import LiveRecommendations from '../../components/LiveRecommendations';
import PlayerSearch from '../../components/PlayerSearch';
import MyRoster from '../../components/MyRoster';
import { ArrowLeft } from 'lucide-react';
import { getCurrentOverallPick, getRoundAndPick, nextTwoUserPicks } from '../../lib/draftMath';

export default function DraftPage() {
  const router = useRouter();
  const { loadData, config, loading, error, clearError, resetDraft, drafted } = useDraftStore(s => ({
    loadData: s.loadData,
    config: s.config,
    loading: s.loading,
    error: s.error,
    clearError: s.clearError,
    resetDraft: s.resetDraft,
    drafted: s.drafted,
  }));
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    loadData();
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) { setTheme(savedTheme); }
  }, [loadData]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => { setTheme(prev => prev === 'light' ? 'dark' : 'light'); };
  const goBackToSetup = () => { router.push('/'); };

  const { overall, round, pickInRound, nextPicks } = useMemo(() => {
    const overallNow = getCurrentOverallPick(drafted.length);
    const { round, pickInRound } = getRoundAndPick(overallNow, config.teams);
    const nextPicks = nextTwoUserPicks(overallNow, config.slot, config.teams);
    return { overall: overallNow, round, pickInRound, nextPicks };
  }, [drafted.length, config.teams, config.slot]);

  const jumpToMyNextPick = () => {
    const nextOverall = nextPicks[0];
    const { round, pickInRound } = getRoundAndPick(nextOverall, config.teams);
    // Scroll to the DraftBoard area; DraftBoard already autoscrolls rounds, so this focuses attention
    const board = document.querySelector('#live-draft-board');
    if (board) board.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1a]">
      {loading && (
        <div className="w-full bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-center py-2 text-sm">Loading player data…</div>
      )}
      {error && (
        <div className="w-full bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-center py-2 text-sm">
          {error} <button onClick={() => { clearError(); loadData(); }} className="underline ml-2">Retry</button>
        </div>
      )}
      {/* Header with Back Button */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={goBackToSetup} className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Setup</span>
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Live Draft - {config.teams} Team League
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pick #{config.slot} • {config.ppr} • {config.flexCount} FLEX
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={toggleTheme} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button onClick={() => resetDraft()} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium">
                Reset Draft
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky context bar */}
      <div className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#0a0f1a]/60 bg-white/80 dark:bg-[#0a0f1a]/80 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 dark:text-gray-400">Current</span>
              <span className="font-semibold text-gray-900 dark:text-white">Round {round}</span>
              <span className="font-semibold text-gray-900 dark:text-white">Pick {pickInRound}</span>
              <span className="text-gray-600 dark:text-gray-400">Overall #{overall}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 dark:text-gray-400">My next picks:</span>
              <span className="font-medium text-gray-900 dark:text-white">#{nextPicks[0]}</span>
              <span className="font-medium text-gray-900 dark:text-white">#{nextPicks[1]}</span>
              <button onClick={jumpToMyNextPick} className="px-3 py-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white">Jump</button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Row - My Roster and Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3">
            <MyRoster />
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Draft Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Round:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{round}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Pick:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{pickInRound}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Overall:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{overall}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Draft Area - Full Width Layout */}
        <div className="space-y-6">
          {/* Draft Board - Full Width at Top */}
          <div id="live-draft-board">
            <DraftBoard />
          </div>
          
          {/* Player Table and Recommendations - Side by Side */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Player Search and Table - Left Side (3/4 width) */}
            <div className="xl:col-span-3">
              <PlayerSearch />
            </div>
            
            {/* Live Recommendations - Right Sidebar (1/4 width) */}
            <div className="xl:col-span-1">
              <LiveRecommendations />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 