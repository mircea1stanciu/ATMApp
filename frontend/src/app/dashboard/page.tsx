'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';
import { MessageSquare, Clock, TrendingUp, Users } from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  organization?: {
    id: number;
    name: string;
    slug: string;
    subscription_plan: string;
  };
}

const communities = [
  { id: 'qa', name: 'QA Engineers', icon: '🎯', agent: 'QualityGPT', color: 'bg-blue-500', description: 'Test automation & quality assurance' },
  { id: 'backend', name: 'Backend Developers', icon: '🔧', agent: 'BackendGPT', color: 'bg-green-500', description: 'APIs, databases, and server-side logic' },
  { id: 'frontend', name: 'Frontend Developers', icon: '🎨', agent: 'FrontendGPT', color: 'bg-purple-500', description: 'UI development with React, Vue, Angular' },
  { id: 'design', name: 'UI/UX Designers', icon: '✨', agent: 'DesignGPT', color: 'bg-pink-500', description: 'Design systems and user experience' },
  { id: 'product', name: 'Product Managers', icon: '📊', agent: 'ProductGPT', color: 'bg-orange-500', description: 'Product strategy and roadmaps' },
  { id: 'devops', name: 'DevOps Engineers', icon: '🔐', agent: 'OpsGPT', color: 'bg-red-500', description: 'CI/CD, infrastructure, and deployment' },
  { id: 'docs', name: 'Technical Writers', icon: '📝', agent: 'DocsGPT', color: 'bg-indigo-500', description: 'Documentation and technical writing' },
];

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (e) {
      router.push('/login');
      return;
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user.full_name || user.username}! 👋
              </h1>
              <p className="text-blue-100 text-lg">
                {user.organization ? `${user.organization.name} • ` : ''}Ready to explore your communities
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-5xl">🚀</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">7</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Communities</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">24/7</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">AI Support</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">∞</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Questions</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-orange-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.organization?.subscription_plan || 'Free'}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Plan</p>
          </div>
        </div>

        {/* Communities Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Explore Communities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <Link
                key={community.id}
                href={`/community/${community.id}`}
                className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${community.color} w-12 h-12 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200`}>
                    {community.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {community.agent}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {community.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {community.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Getting Started
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Choose a Community
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Select a community that matches your role and interests
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Start Chatting
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Ask questions and get instant AI-powered assistance
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Collaborate & Learn
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Learn from examples and improve your workflow
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
