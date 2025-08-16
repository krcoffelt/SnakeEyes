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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        League Settings & Weights
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* League Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            League Config
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teams
              </label>
              <input
                type="number"
                min="2"
                max="16"
                value={config.teams}
                onChange={(e) => updateConfig({ teams: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Slot
              </label>
              <input
                type="number"
                min="1"
                max={config.teams}
                value={config.slot}
                onChange={(e) => updateConfig({ slot: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Blend Weights (Underdog vs Sleeper)
            </label>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">Und</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={blendConfig.und}
                onChange={(e) => updateBlendConfig({ und: parseFloat(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">SLP</span>
              <span className="text-sm font-mono text-gray-900 dark:text-white min-w-[3rem]">
                {blendConfig.und.toFixed(1)}:{blendConfig.slp.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
        
        {/* PVE Weights */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            PVE Weights
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Market Value: {weights.w_value.toFixed(2)}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tier Urgency: {weights.w_tier.toFixed(2)}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Roster Need: {weights.w_need.toFixed(2)}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Positional Scarcity: {weights.w_scar.toFixed(2)}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Availability Risk: {weights.w_avail.toFixed(2)}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tier Drop Threshold: {tierDropThreshold}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Availability S: {availabilityS}
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