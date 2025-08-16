'use client';

import React, { useEffect, useState } from 'react';
import { useDraftStore } from '../store/draftStore';
import Header from '../components/Header';
import SettingsCard from '../components/SettingsCard';
import DraftTracker from '../components/DraftTracker';
import RosterCard from '../components/RosterCard';
import PositionalPanel from '../components/PositionalPanel';
import SearchBar from '../components/SearchBar';
import ValueBoard from '../components/ValueBoard';
import TopRecommendations from '../components/TopRecommendations';
import { Download, Settings } from 'lucide-react';

export default function Home() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { loadData, exportCSV, exportSettings } = useDraftStore();
  
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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Row - Settings and Draft Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <SettingsCard />
          </div>
          <div className="space-y-6">
            <DraftTracker />
            <RosterCard />
          </div>
        </div>
        
        {/* Second Row - PVI and Search */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PositionalPanel />
          <SearchBar />
        </div>
        
        {/* Export Buttons */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={exportCSV}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-5 w-5 mr-2" />
            Export Draft Board (CSV)
          </button>
          <button
            onClick={exportSettings}
            className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Settings className="h-5 w-5 mr-2" />
            Export Settings (JSON)
          </button>
        </div>
        
        {/* Third Row - Top Recommendations */}
        <div className="mb-8">
          <TopRecommendations />
        </div>
        
        {/* Fourth Row - Full Value Board */}
        <div className="mb-8">
          <ValueBoard />
        </div>
      </main>
    </div>
  );
} 