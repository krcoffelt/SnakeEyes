'use client';

import React, { useEffect, useState } from 'react';
import { useDraftStore } from '../store/draftStore';
import Header from '../components/Header';
import DraftBoard from '../components/DraftBoard';
import LeagueSettings from '../components/LeagueSettings';
import LiveRecommendations from '../components/LiveRecommendations';
import PlayerSearch from '../components/PlayerSearch';
import MyRoster from '../components/MyRoster';

export default function Home() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // Default to dark like Sleeper
  const { loadData } = useDraftStore();
  
  useEffect(() => {
    // Load data on mount
    loadData();
    
    // Check for saved theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [loadData]);
  
  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header theme={theme} onThemeToggle={toggleTheme} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Row - League Settings and My Roster */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <LeagueSettings />
          </div>
          <div>
            <MyRoster />
          </div>
        </div>
        
        {/* Main Draft Area */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
          {/* Left Sidebar - Player Search */}
          <div className="xl:col-span-1">
            <PlayerSearch />
          </div>
          
          {/* Center - Draft Board */}
          <div className="xl:col-span-2">
            <DraftBoard />
          </div>
          
          {/* Right Sidebar - Live Recommendations */}
          <div className="xl:col-span-1">
            <LiveRecommendations />
          </div>
        </div>
      </main>
    </div>
  );
} 