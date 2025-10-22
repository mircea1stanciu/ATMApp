'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Organization {
  id: number;
  name: string;
  slug: string;
  subscription_plan: string;
  user_count: number;
  chat_count: number;
  is_active: boolean;
  created_at: string;
  access_token?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  organization?: { name: string };
}

interface Stats {
  total_organizations: number;
  total_users: number;
  active_users: number;
  total_chat_sessions: number;
}

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    total_organizations: 0,
    total_users: 0,
    active_users: 0,
    total_chat_sessions: 0
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [showOrgDetailsModal, setShowOrgDetailsModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgStats, setOrgStats] = useState<any>(null);
  const [createOrgForm, setCreateOrgForm] = useState({
    name: '',
    slug: '',
    description: '',
    subscription_plan: 'free'
  });
  const router = useRouter();

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (activeSection === 'overview') loadOverview();
    if (activeSection === 'organizations') loadOrganizations();
    if (activeSection === 'users') loadUsers();
  }, [activeSection]);

  const checkAuthentication = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Unauthorized');
      }

      const user = await response.json();
      setCurrentUser(user);

      if (user.role !== 'super_admin' && user.role !== 'org_admin') {
        router.push('/');
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Authentication failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  const apiCall = async (endpoint: string, options: any = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    const response = await fetch(`http://localhost:8000${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      router.push('/login');
      return;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  };

  const loadOverview = async () => {
    try {
      // Load organizations to calculate stats
      const orgs = await apiCall('/api/organizations');
      setOrganizations(orgs);
      
      // Calculate stats from organization data
      let totalUsers = 0;
      let totalChats = 0;
      
      orgs.forEach((org: Organization) => {
        totalUsers += org.user_count || 0;
        totalChats += org.chat_count || 0;
      });
      
      setStats({
        total_organizations: orgs.length,
        total_users: totalUsers,
        active_users: totalUsers, // Assuming all users are active for now
        total_chat_sessions: totalChats
      });
    } catch (error) {
      console.error('Failed to load overview:', error);
    }
  };

  const loadOrganizations = async () => {
    try {
      const orgs = await apiCall('/api/organizations');
      setOrganizations(orgs);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    }
  };

  const loadUsers = async () => {
    try {
      // Load all organizations first to get users from each
      const orgs = await apiCall('/api/organizations');
      let allUsers: User[] = [];
      
      // Fetch users for each organization
      for (const org of orgs) {
        try {
          const orgUsers = await apiCall(`/api/organizations/${org.id}/users`);
          // Add organization info to each user
          const usersWithOrg = orgUsers.map((user: User) => ({
            ...user,
            organization: { name: org.name }
          }));
          allUsers = [...allUsers, ...usersWithOrg];
        } catch (err) {
          console.error(`Failed to load users for ${org.name}:`, err);
        }
      }
      
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await apiCall('/api/organizations', {
        method: 'POST',
        body: JSON.stringify(createOrgForm)
      });

      setShowCreateOrgModal(false);
      setCreateOrgForm({ name: '', slug: '', description: '', subscription_plan: 'free' });
      
      // Reload organizations and overview
      await loadOrganizations();
      if (activeSection === 'overview') {
        await loadOverview();
      }

      alert(`✅ Organization created successfully!\n\n🔑 Access Token: ${result.access_token}\n\nShare this token with the organization admin to register.`);
    } catch (error) {
      alert('Failed to create organization: ' + (error as Error).message);
    }
  };

  const handleViewOrg = async (org: Organization) => {
    try {
      // Load organization statistics
      const stats = await apiCall(`/api/organizations/${org.id}/stats`);
      setSelectedOrg(org);
      setOrgStats(stats);
      setShowOrgDetailsModal(true);
    } catch (error) {
      alert('Failed to load organization details: ' + (error as Error).message);
    }
  };

  const handleDeleteOrg = async (orgId: number, orgName: string) => {
    if (!confirm(`⚠️ Are you sure you want to delete "${orgName}"?\n\nThis will permanently delete:\n- The organization\n- All users in the organization\n- All chat sessions\n\nThis action cannot be undone!`)) {
      return;
    }

    try {
      await apiCall(`/api/organizations/${orgId}`, {
        method: 'DELETE'
      });

      alert('✅ Organization deleted successfully');
      
      // Reload data
      await loadOrganizations();
      if (activeSection === 'overview') {
        await loadOverview();
      }
    } catch (error) {
      alert('Failed to delete organization: ' + (error as Error).message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold">🤖 UnifiedWork</h2>
          <p className="text-sm text-gray-400 mt-1">Admin Dashboard</p>
        </div>

        <nav className="flex-1 py-4">
          {[
            { id: 'overview', icon: '📊', label: 'Overview' },
            { id: 'organizations', icon: '🏢', label: 'Organizations' },
            { id: 'users', icon: '👥', label: 'Users' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                activeSection === item.id 
                  ? 'bg-blue-600 border-r-3 border-white' 
                  : 'hover:bg-gray-800'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          
          <div className="mt-8 px-6">
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
            >
              <span className="text-lg">💬</span>
              <span>Chat</span>
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
            >
              <span className="text-lg">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeSection === 'overview' && 'Dashboard Overview'}
                {activeSection === 'organizations' && 'Organizations Management'}
                {activeSection === 'users' && 'Users Management'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your multi-tenant platform
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-900 dark:text-white font-medium">
                {currentUser?.full_name || currentUser?.username}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                currentUser?.role === 'super_admin' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
              }`}>
                {currentUser?.role?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.total_organizations}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Organizations</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.total_users}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.active_users}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.total_chat_sessions}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Chats</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Organizations</h3>
                </div>
                <div className="p-6">
                  {organizations.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No organizations yet
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Organization</th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Plan</th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {organizations.slice(0, 5).map((org) => (
                            <tr key={org.id} className="border-b border-gray-100 dark:border-gray-700">
                              <td className="py-3">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">{org.name}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">{org.slug}</div>
                                </div>
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  org.subscription_plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                                  org.subscription_plan === 'premium' ? 'bg-orange-100 text-orange-800' :
                                  org.subscription_plan === 'basic' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {org.subscription_plan.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                                {new Date(org.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Organizations Section */}
          {activeSection === 'organizations' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Organizations Management</h3>
                  <button
                    onClick={() => setShowCreateOrgModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    ➕ Create Organization
                  </button>
                </div>
                <div className="p-6">
                  {organizations.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No organizations found
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Organization</th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Plan</th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Users</th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Created</th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {organizations.map((org) => (
                            <tr key={org.id} className="border-b border-gray-100 dark:border-gray-700">
                              <td className="py-3">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">{org.name}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">{org.slug}</div>
                                </div>
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  org.subscription_plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                                  org.subscription_plan === 'premium' ? 'bg-orange-100 text-orange-800' :
                                  org.subscription_plan === 'basic' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {org.subscription_plan.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-3 text-sm text-gray-600 dark:text-gray-400">{org.user_count || 0}</td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  org.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {org.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                              <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                                {new Date(org.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-3">
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleViewOrg(org)}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                                  >
                                    📊 View
                                  </button>
                                  {currentUser?.role === 'super_admin' && org.id !== 1 && (
                                    <button 
                                      onClick={() => handleDeleteOrg(org.id, org.name)}
                                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                                    >
                                      🗑️ Delete
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Users Section */}
          {activeSection === 'users' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Users Management</h3>
                </div>
                <div className="p-6">
                  {users.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No users found
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Username</th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Email</th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Organization</th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Role</th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Last Login</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700">
                              <td className="py-3">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">{user.username}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">{user.full_name}</div>
                                </div>
                              </td>
                              <td className="py-3 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                              <td className="py-3 text-sm text-gray-600 dark:text-gray-400">{user.organization?.name || '-'}</td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  user.role === 'super_admin' ? 'bg-blue-100 text-blue-800' :
                                  user.role === 'org_admin' ? 'bg-orange-100 text-orange-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {user.role.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                              <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                                {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Organization Details Modal */}
      {showOrgDetailsModal && selectedOrg && orgStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedOrg.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">/{selectedOrg.slug}</p>
              </div>
              <button
                onClick={() => setShowOrgDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Plan and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Subscription Plan</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                    {orgStats.subscription_plan.toUpperCase()}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      selectedOrg.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedOrg.is_active ? '✓ ACTIVE' : '✗ INACTIVE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Usage Statistics */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Usage Statistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {orgStats.total_users} / {orgStats.max_users}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Users ({orgStats.usage_percentage.users}%)</div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(orgStats.usage_percentage.users, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {orgStats.total_chats} / {orgStats.max_chat_sessions}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Chat Sessions ({orgStats.usage_percentage.chats}%)</div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(orgStats.usage_percentage.chats, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* User Breakdown */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">User Breakdown</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{orgStats.active_users}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{orgStats.admin_count}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Admins</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{orgStats.inactive_users}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Inactive</div>
                  </div>
                </div>
              </div>

              {/* Access Token */}
              {selectedOrg.access_token && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🔑 Access Token</h4>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border border-yellow-200 dark:border-yellow-700">
                    <code className="text-sm text-gray-900 dark:text-white break-all">
                      {selectedOrg.access_token}
                    </code>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Share this token with organization admins to allow them to register.
                  </p>
                </div>
              )}

              {/* Created Date */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Created: {new Date(selectedOrg.created_at).toLocaleString()}
              </div>

              <button
                onClick={() => setShowOrgDetailsModal(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Organization Modal */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full m-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Organization</h3>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={createOrgForm.name}
                  onChange={(e) => setCreateOrgForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Acme Corporation"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug (URL-friendly) *
                </label>
                <input
                  type="text"
                  required
                  value={createOrgForm.slug}
                  onChange={(e) => setCreateOrgForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="acme-corp"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={createOrgForm.description}
                  onChange={(e) => setCreateOrgForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the organization"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subscription Plan *
                </label>
                <select
                  required
                  value={createOrgForm.subscription_plan}
                  onChange={(e) => setCreateOrgForm(prev => ({ ...prev, subscription_plan: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="free">FREE (5 users, 100 chats)</option>
                  <option value="basic">BASIC (10 users, 1,000 chats)</option>
                  <option value="premium">PREMIUM (25 users, 10,000 chats)</option>
                  <option value="enterprise">ENTERPRISE (100 users, 50,000 chats)</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateOrgModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
