'use client';

import { useState, useEffect } from 'react';
import AIDeliveryFlow from './AIDeliveryFlow';

interface CommunityDashboardProps {
  communityId: string;
  communityName: string;
  communityIcon: string;
  communityColor: string;
  capabilities: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

export default function CommunityDashboard({
  communityId,
  communityName,
  communityIcon,
  communityColor,
  capabilities
}: CommunityDashboardProps) {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalChats: 0,
    thisWeek: 0,
    activeNow: 0
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'delivery'>('overview');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    // TODO: Fetch real stats from API
    setStats({
      totalChats: 24,
      thisWeek: 8,
      activeNow: 1
    });
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${communityColor} text-white`}>
              {communityIcon}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {communityName} Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome back, {user?.full_name || user?.username || 'User'}! 👋
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? `${communityColor} text-white`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('delivery')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'delivery'
                  ? `${communityColor} text-white`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              🚀 AI Delivery Flow
              <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full">NEW</span>
            </button>
          </div>
        </div>

        {/* Conditional Content */}
        {activeTab === 'overview' ? (
          <>
        {/* Stats Grid */}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Conversations</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalChats}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-2xl">
                💬
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">This Week</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.thisWeek}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center text-2xl">
                📊
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Sessions</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeNow}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center text-2xl">
                ⚡
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🚀 Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {capabilities.slice(0, 6).map((capability, index) => (
              <button
                key={index}
                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                onClick={() => {
                  // This will be handled by parent to open chat with pre-filled query
                  const event = new CustomEvent('openChatWithQuery', {
                    detail: { query: `Help me with ${capability.title.toLowerCase()}` }
                  });
                  window.dispatchEvent(event);
                }}
              >
                <span className="text-2xl">{capability.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {capability.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {capability.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📜 Recent Activity
          </h2>
          <div className="space-y-3">
            {[
              { action: 'Started conversation', time: '2 hours ago', icon: '💬' },
              { action: 'Completed task', time: 'Yesterday', icon: '✅' },
              { action: 'Asked question', time: '2 days ago', icon: '❓' },
              { action: 'Received help', time: '3 days ago', icon: '🎯' },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="text-xl">{activity.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Community Resources */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📚 Resources & Guides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <a
              href="#"
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="text-2xl">📖</span>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                  Getting Started Guide
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Learn the basics
                </p>
              </div>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="text-2xl">🎓</span>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                  Best Practices
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Tips and tricks
                </p>
              </div>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                  Example Projects
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  See it in action
                </p>
              </div>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="text-2xl">❓</span>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                  FAQ
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Common questions
                </p>
              </div>
            </a>
          </div>
        </div>
        </>
        ) : (
          <AIDeliveryFlow
            communityId={communityId}
            communityName={communityName}
            communityColor={communityColor}
          />
        )}
      </div>
    </div>
  );
}
