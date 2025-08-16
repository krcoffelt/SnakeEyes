'use client';

import React from 'react';
import { useDraftStore } from '../store/draftStore';

export default function SettingsCard() {
  const {
    config,
    weights,
    blendConfig,
    tierDropThreshold,
    availabilityS,
    updateConfig,
    updateWeights,
    updateBlendConfig,
    updateTierDropThreshold,
    updateAvailabilityS
  } = useDraftStore();

  return (
    <div className="sleeper-card-elevated p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-3">
          <span className="text-purple-600 dark:text-purple-400 text-sm font-bold">⚙️</span>
        </div>
        League Settings & Weights
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* League Configuration */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            League Config
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teams
              </label>
              <input
                type="number"
                min="2"
                max="16"
                value={config.teams}
                onChange={(e) => updateConfig({ teams: parseInt(e.target.value) || 10 })}
                className="sleeper-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Slot
              </label>
              <input
                type="number"
                min="1"
                max={config.teams}
                value={config.slot}
                onChange={(e) => updateConfig({ slot: parseInt(e.target.value) || 1 })}
                className="sleeper-input"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Blend Weights (Underdog vs Sleeper)
            </label>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Und</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={blendConfig.und}
                onChange={(e) => updateBlendConfig({ und: parseFloat(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">SLP</span>
              <span className="text-sm font-mono text-gray-900 dark:text-white min-w-[3rem] bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-lg">
                {blendConfig.und.toFixed(1)}:{blendConfig.slp.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
        
        {/* PVE Weights */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
            PVE Weights
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Market Value: <span className="text-purple-600 dark:text-purple-400 font-semibold">{weights.w_value.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.w_value}
                onChange={(e) => updateWeights({ w_value: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tier Urgency: <span className="text-purple-600 dark:text-purple-400 font-semibold">{weights.w_tier.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.w_tier}
                onChange={(e) => updateWeights({ w_tier: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Roster Need: <span className="text-purple-600 dark:text-purple-400 font-semibold">{weights.w_need.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.w_need}
                onChange={(e) => updateWeights({ w_need: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Positional Scarcity: <span className="text-purple-600 dark:text-purple-400 font-semibold">{weights.w_scar.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.w_scar}
                onChange={(e) => updateWeights({ w_scar: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Availability Risk: <span className="text-purple-600 dark:text-purple-400 font-semibold">{weights.w_avail.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.w_avail}
                onChange={(e) => updateWeights({ w_avail: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
          
          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tier Drop Threshold: <span className="text-purple-600 dark:text-purple-400 font-semibold">{tierDropThreshold}</span>
            </label>
            <input
              type="range"
              min="4"
              max="16"
              step="1"
              value={tierDropThreshold}
              onChange={(e) => updateTierDropThreshold(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Availability S: <span className="text-purple-600 dark:text-purple-400 font-semibold">{availabilityS}</span>
            </label>
            <input
              type="range"
              min="2"
              max="12"
              step="0.5"
              value={availabilityS}
              onChange={(e) => updateAvailabilityS(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 