'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Zap, Brain, DollarSign, Info, Check } from 'lucide-react';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  speed: string;
  capabilities: string[];
  cost: number;
}

interface ModelSelectorProps {
  onModelSelect?: (modelId: string) => void;
  currentModel?: string;
}

export default function ModelSelector({ onModelSelect, currentModel }: ModelSelectorProps) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(currentModel || 'gpt-4o-mini');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState<string>('free');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadModels();
    loadPreferences();
  }, []);

  const loadModels = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/ai-models', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setModels(data.models);
      setSubscription(data.subscription);
      setSelectedModel(data.user_preference);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/user/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setTemperature(data.temperature || 0.7);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/user/preferences/model?model_id=${selectedModel}&temperature=${temperature}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        if (onModelSelect) {
          onModelSelect(selectedModel);
        }
        alert('✅ Preferences saved! Your new model will be used for all future conversations.');
      } else {
        const error = await response.json();
        alert(`❌ Failed to save: ${error.detail}`);
      }
    } catch (error) {
      alert('❌ Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const getSpeedIcon = (speed: string) => {
    switch (speed) {
      case 'fast':
        return <Zap className="w-4 h-4 text-green-500" />;
      case 'medium':
        return <Brain className="w-4 h-4 text-blue-500" />;
      case 'slow':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getProviderColor = (provider: string) => {
    return provider === 'openai' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
           provider === 'anthropic' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
           'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            AI Model Selection
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Choose the AI model that best fits your needs
          </p>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <Info className="w-4 h-4" />
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {/* Subscription Badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
        subscription === 'enterprise' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
        subscription === 'pro' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      }`}>
        <Sparkles className="w-3 h-3" />
        {subscription.toUpperCase()} Plan
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {models.map((model) => (
          <button
            key={model.id}
            onClick={() => setSelectedModel(model.id)}
            className={`relative p-4 rounded-lg border-2 text-left transition-all ${
              selectedModel === model.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800'
            }`}
          >
            {/* Selected Check */}
            {selectedModel === model.id && (
              <div className="absolute top-2 right-2">
                <Check className="w-5 h-5 text-blue-500" />
              </div>
            )}

            {/* Model Name & Provider */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {model.name}
                </h4>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${getProviderColor(model.provider)}`}>
                  {model.provider}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {model.description}
            </p>

            {/* Attributes */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Speed */}
              <div className="flex items-center gap-1">
                {getSpeedIcon(model.speed)}
                <span className="text-gray-600 dark:text-gray-400 capitalize">{model.speed}</span>
              </div>

              {/* Cost */}
              {showDetails && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    ${model.cost.toFixed(4)}/1K
                  </span>
                </div>
              )}

              {/* Capabilities */}
              {showDetails && (
                <div className="flex flex-wrap gap-1 mt-2 w-full">
                  {model.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Temperature Control */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Creativity Level (Temperature): {temperature.toFixed(1)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Precise (0.0)</span>
          <span>Balanced (0.5)</span>
          <span>Creative (1.0)</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Lower values make responses more focused and deterministic. Higher values make them more creative and varied.
        </p>
      </div>

      {/* Save Button */}
      <button
        onClick={savePreferences}
        disabled={saving}
        className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
          saving
            ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {saving ? 'Saving...' : '💾 Save Preferences'}
      </button>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">GitHub Copilot-Style Experience</p>
            <p className="text-blue-700 dark:text-blue-400">
              Your selected model will be used across all communities. Switch anytime to match your task needs!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
