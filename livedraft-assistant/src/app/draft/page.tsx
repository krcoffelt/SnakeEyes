'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDraftStore } from '../../store/draftStore';
import Header from '../../components/Header';
import DraftBoard from '../../components/DraftBoard';
import LiveRecommendations from '../../components/LiveRecommendations';
import PlayerSearch from '../../components/PlayerSearch';
import MyRoster from '../../components/MyRoster';
import { ArrowLeft, Settings } from 'lucide-react';

export default function DraftPage() {
  const router = useRouter();
  const { loadData, config, resetDraft } = useDraftStore();
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
  const handleResetDraft = () => { resetDraft(); };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
              <button onClick={handleResetDraft} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium">
                Reset Draft
              </button>
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
                  <span className="font-medium text-gray-900 dark:text-white">1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Pick:</span>
                  <span className="font-medium text-gray-900 dark:text-white">#{config.slot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Overall:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{config.slot}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Draft Area - Full Width Layout */}
        <div className="space-y-6">
          {/* Draft Board - Full Width at Top */}
          <DraftBoard />
          
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