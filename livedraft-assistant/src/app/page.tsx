'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDraftStore } from '../store/draftStore';
import { Trophy, Users, Target, Zap, ArrowRight } from 'lucide-react';

export default function LeagueSetup() {
  const router = useRouter();
  const { config, updateConfig } = useDraftStore();
  const [isLoading, setIsLoading] = useState(false);

  const [leagueSettings, setLeagueSettings] = useState({
    teams: config.teams,
    slot: config.slot,
    ppr: config.ppr,
    flexCount: config.flexCount
  });

  const handleStartDraft = async () => {
    setIsLoading(true);
    
    // Update store with new settings
    updateConfig(leagueSettings);
    
    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Navigate to draft screen
    router.push('/draft');
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'transparent' }}>
      {/* Gradient Background with Noise */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-600 to-red-900"></div>
      
      {/* Noise Overlay */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      ></div>
      
      {/* Additional subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center p-4 min-h-screen">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div>
                <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg" style={{ fontFamily: 'Times New Roman, serif' }}>Draft Value Assistant</h1>
                <p className="text-xl text-yellow-100 drop-shadow-md" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Powered by Advanced PVE</p>
              </div>
            </div>
            <p className="text-lg text-orange-100 max-w-2xl mx-auto drop-shadow-md" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
              Set up your league settings and let our Positional Value Engine guide you to draft day success
            </p>
          </div>

          {/* League Setup Form */}
          <div className="bg-white/15 backdrop-blur-lg rounded-3xl p-8 border border-white/25 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 text-center drop-shadow-md" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>League Configuration</h2>
            
            <div className="space-y-6">
              {/* League Size */}
              <div className="space-y-3">
                <label className="text-white font-medium flex items-center" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                  <Users className="h-5 w-5 mr-2" />
                  League Size
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setLeagueSettings(prev => ({ ...prev, teams: 10 }))}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      leagueSettings.teams === 10
                        ? 'border-purple-400 bg-purple-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-2xl font-bold" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>10</div>
                    <div className="text-sm" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Teams</div>
                  </button>
                  <button
                    onClick={() => setLeagueSettings(prev => ({ ...prev, teams: 12 }))}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      leagueSettings.teams === 12
                        ? 'border-purple-400 bg-purple-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-2xl font-bold" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>12</div>
                    <div className="text-sm" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Teams</div>
                  </button>
                </div>
              </div>

              {/* Scoring System */}
              <div className="space-y-3">
                <label className="text-white font-medium flex items-center" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                  <Target className="h-5 w-5 mr-2" />
                  Scoring System
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['Standard', 'Half PPR', 'PPR'].map((scoring) => (
                    <button
                      key={scoring}
                      onClick={() => setLeagueSettings(prev => ({ ...prev, ppr: scoring as any }))}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        leagueSettings.ppr === scoring
                          ? 'border-purple-400 bg-purple-500/20 text-white'
                          : 'border-white/20 bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-medium" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{scoring}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* FLEX Configuration */}
              <div className="space-y-3">
                <label className="text-white font-medium flex items-center" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                  <Zap className="h-5 w-5 mr-2" />
                  FLEX Slots
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setLeagueSettings(prev => ({ ...prev, flexCount: 1 }))}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      leagueSettings.flexCount === 1
                        ? 'border-purple-400 bg-purple-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-2xl font-bold" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>1</div>
                    <div className="text-sm" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>FLEX</div>
                  </button>
                  <button
                    onClick={() => setLeagueSettings(prev => ({ ...prev, flexCount: 2 }))}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      leagueSettings.flexCount === 2
                        ? 'border-purple-400 bg-purple-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-2xl font-bold" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>2</div>
                    <div className="text-sm" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>FLEX</div>
                  </button>
                </div>
              </div>

              {/* Draft Position */}
              <div className="space-y-3">
                <label className="text-white font-medium" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                  Your Draft Position
                </label>
                <select
                  value={leagueSettings.slot}
                  onChange={(e) => setLeagueSettings(prev => ({ ...prev, slot: parseInt(e.target.value) }))}
                  className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white text-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                  style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                >
                  {Array.from({ length: leagueSettings.teams }, (_, i) => (
                    <option key={i + 1} value={i + 1} className="bg-gray-800 text-white">
                      Pick #{i + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Start Draft Button */}
            <div className="mt-8">
              <button
                onClick={handleStartDraft}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <>
                    Start Draft
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>

            {/* League Summary */}
            <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-white font-medium mb-2" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>League Summary</h3>
              <div className="text-sm text-gray-300 space-y-1" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                <div>• {leagueSettings.teams}-team league</div>
                <div>• {leagueSettings.ppr} scoring</div>
                <div>• {leagueSettings.flexCount} FLEX slot{leagueSettings.flexCount > 1 ? 's' : ''}</div>
                <div>• Your pick: #{leagueSettings.slot}</div>
                <div>• Roster: 1 QB, 2 RB, 2 WR, 1 TE, {leagueSettings.flexCount} FLEX, 1 DEF, 1 K</div>
              </div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
              Your PVE weights and settings will be automatically optimized based on your league configuration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 