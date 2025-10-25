'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, User, Moon, Sun, Sparkles, ArrowLeft, Mail, MapPin, Briefcase, Edit2, Save, X } from 'lucide-react';
import ModelSelector from '@/components/ModelSelector';

interface UserData {
  id: number;
  role: string;
  username: string;
  email?: string;
  full_name?: string;
  organization?: {
    name: string;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'general' | 'ai-models' | 'profile'>('general');
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
  });
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setProfileData({
          full_name: userData.full_name || '',
          email: userData.email || '',
        });
        
        // Set default tab based on user role
        const allowedRoles = ['super_admin', 'org_admin', 'community_lead'];
        if (!allowedRoles.includes(userData.role)) {
          // Regular users default to 'general' tab
          setActiveTab('general');
        } else {
          // Admins and community leads default to 'ai-models' tab
          setActiveTab('ai-models');
        }
      } catch (e) {
        router.push('/login');
        return;
      }
    } else {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [router]);

  const handleProfileUpdate = () => {
    if (user) {
      const updatedUser = {
        ...user,
        full_name: profileData.full_name,
        email: profileData.email,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditingProfile(false);
      setSavedMessage('Profile updated successfully!');
      setTimeout(() => setSavedMessage(''), 3000);
    }
  };

  const handleCancel = () => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        email: user.email || '',
      });
    }
    setIsEditingProfile(false);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {/* AI Models Tab - Only for super_admin, org_admin, community_lead */}
              {user && ['super_admin', 'org_admin', 'community_lead'].includes(user.role) && (
                <button
                  onClick={() => setActiveTab('ai-models')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'ai-models'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  AI Models
                </button>
              )}
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'general'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Settings className="w-5 h-5" />
                General
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <User className="w-5 h-5" />
                Profile
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              {activeTab === 'ai-models' && (
                <div>
                  <ModelSelector />
                </div>
              )}

              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      General Settings
                    </h3>
                    
                    {/* Theme Selector */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Theme
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
                          <Sun className="w-6 h-6" />
                          <span className="text-sm">Light</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
                          <Moon className="w-6 h-6" />
                          <span className="text-sm">Dark</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 p-4 border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <Settings className="w-6 h-6 text-blue-600" />
                          <span className="text-sm text-blue-600">System</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Profile Information
                      </h3>
                      {!isEditingProfile && (
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                          Edit Profile
                        </button>
                      )}
                    </div>

                    {savedMessage && (
                      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
                        ✓ {savedMessage}
                      </div>
                    )}

                    {isEditingProfile ? (
                      <div className="space-y-4">
                        {/* Full Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={profileData.full_name}
                            onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your full name"
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your email address"
                          />
                        </div>

                        {/* Username (Read-only) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Username
                          </label>
                          <input
                            type="text"
                            value={user?.username || ''}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Username cannot be changed</p>
                        </div>

                        {/* Role (Read-only) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Role
                          </label>
                          <input
                            type="text"
                            value={user?.role?.replace('_', ' ').toUpperCase() || ''}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                          />
                        </div>

                        {/* Organization (Read-only) */}
                        {user?.organization && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Organization
                            </label>
                            <input
                              type="text"
                              value={user.organization.name || ''}
                              disabled
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                            />
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={handleProfileUpdate}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          >
                            <Save size={16} />
                            Save Changes
                          </button>
                          <button
                            onClick={handleCancel}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg transition-colors"
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Display Profile Info */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {user?.full_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                {user?.full_name || 'User Profile'}
                              </h4>
                              <div className="space-y-3">
                                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                  <Mail size={18} className="text-gray-500" />
                                  <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                                    <p className="font-medium">{user?.email || 'Not provided'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                  <Briefcase size={18} className="text-gray-500" />
                                  <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
                                    <p className="font-medium">{user?.role?.replace('_', ' ').toUpperCase()}</p>
                                  </div>
                                </div>
                                {user?.organization && (
                                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                    <MapPin size={18} className="text-gray-500" />
                                    <div>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">Organization</p>
                                      <p className="font-medium">{user.organization.name}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
