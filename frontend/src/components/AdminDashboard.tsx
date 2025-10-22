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
  assigned_communities?: string; // JSON string for community leads
  is_active: boolean;
  last_login?: string;
  organization?: { 
    id: number;
    name: string;
  };
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
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [newPlan, setNewPlan] = useState('');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    role: '',
    assigned_communities: [] as string[],
    full_name: '',
    is_active: true
  });
  const [createUserForm, setCreateUserForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'user',
    assigned_communities: [] as string[]
  });
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

      // Set initial section based on role
      if (user.role === 'org_admin') {
        // Org admins start with users section (their organization users)
        setActiveSection('users');
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
      if (currentUser?.role === 'org_admin') {
        // Org admins see stats for their organization only
        if (currentUser.organization?.id) {
          const orgStats = await apiCall(`/api/organizations/${currentUser.organization.id}/stats`);
          const myOrg = await apiCall('/api/organizations/my-organization');
          
          setStats({
            total_organizations: 1,
            total_users: orgStats.total_users || 0,
            active_users: orgStats.active_users || 0,
            total_chat_sessions: orgStats.total_chats || 0
          });
          
          setOrganizations([myOrg]);
        }
      } else {
        // Super admins see platform-wide stats
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
      }
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
      if (currentUser?.role === 'org_admin') {
        // Org admins can only see users from their organization
        if (currentUser.organization?.id) {
          const orgUsers = await apiCall(`/api/organizations/${currentUser.organization.id}/users`);
          const usersWithOrg = orgUsers.map((user: User) => ({
            ...user,
            organization: { name: currentUser.organization?.name || '' }
          }));
          setUsers(usersWithOrg);
        }
      } else {
        // Super admins can see users from all organizations
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
      }
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

  const handleChangePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg || !newPlan) return;

    try {
      const result = await apiCall(`/api/organizations/${selectedOrg.id}/subscription`, {
        method: 'PATCH',
        body: JSON.stringify({ subscription_plan: newPlan })
      });

      alert(`✅ Subscription plan updated successfully!\n\n${result.organization}\n${result.old_plan.toUpperCase()} → ${result.new_plan.toUpperCase()}\n\nNew Limits:\n• Max Users: ${result.max_users}\n• Max Chat Sessions: ${result.max_chat_sessions}`);
      
      setShowChangePlanModal(false);
      setShowOrgDetailsModal(false);
      setNewPlan('');
      
      // Reload data
      await loadOrganizations();
      if (activeSection === 'overview') {
        await loadOverview();
      }
    } catch (error) {
      alert('Failed to update subscription plan: ' + (error as Error).message);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate community_lead has at least one community
    if (createUserForm.role === 'community_lead' && createUserForm.assigned_communities.length === 0) {
      alert('❌ Community Leads must have at least one assigned community');
      return;
    }
    
    try {
      const orgId = currentUser?.role === 'org_admin' 
        ? currentUser.organization?.id 
        : organizations[0]?.id; // For super_admin, use first org or could add org selector

      if (!orgId) {
        alert('No organization available for user creation');
        return;
      }

      const result = await apiCall(`/api/organizations/${orgId}/users`, {
        method: 'POST',
        body: JSON.stringify(createUserForm)
      });

      alert(`✅ User created successfully!\n\nUsername: ${result.user.username}\nEmail: ${result.user.email}\nRole: ${result.user.role}`);
      
      setShowCreateUserModal(false);
      setCreateUserForm({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'user',
        assigned_communities: []
      });
      
      // Reload users
      await loadUsers();
    } catch (error) {
      alert('Failed to create user: ' + (error as Error).message);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    // Validate community_lead has at least one community
    if (editUserForm.role === 'community_lead' && editUserForm.assigned_communities.length === 0) {
      alert('❌ Community Leads must have at least one assigned community');
      return;
    }
    
    try {
      const orgId = selectedUser.organization?.id;
      if (!orgId) {
        alert('User organization not found');
        return;
      }

      const result = await apiCall(`/api/organizations/${orgId}/users/${selectedUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editUserForm)
      });

      alert(`✅ User updated successfully!\n\nUsername: ${result.user.username}\nRole: ${result.user.role}\nStatus: ${result.user.is_active ? 'Active' : 'Inactive'}`);
      
      setShowEditUserModal(false);
      setSelectedUser(null);
      setEditUserForm({
        role: '',
        assigned_communities: [],
        full_name: '',
        is_active: true
      });
      
      // Reload users
      await loadUsers();
    } catch (error) {
      alert('Failed to update user: ' + (error as Error).message);
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
            { id: 'overview', icon: '📊', label: 'Overview', roles: ['super_admin', 'org_admin'] },
            { id: 'organizations', icon: '🏢', label: 'Organizations', roles: ['super_admin'] },
            { id: 'users', icon: '👥', label: 'Users', roles: ['super_admin', 'org_admin'] }
          ].filter(item => item.roles.includes(currentUser?.role || '')).map((item) => (
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
                {activeSection === 'users' && (currentUser?.role === 'org_admin' ? 'Organization Users' : 'Users Management')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {currentUser?.role === 'org_admin' ? 'Manage your organization' : 'Manage your multi-tenant platform'}
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
                {currentUser?.role === 'super_admin' && (
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.total_organizations}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Organizations</div>
                  </div>
                )}
                {currentUser?.role === 'org_admin' && (
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {currentUser.organization?.name || 'My Organization'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Organization</div>
                  </div>
                )}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.total_users}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {currentUser?.role === 'org_admin' ? 'Organization Users' : 'Total Users'}
                  </div>
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
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {currentUser?.role === 'org_admin' ? 'Organization Chats' : 'Total Chats'}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentUser?.role === 'org_admin' ? 'My Organization' : 'Recent Organizations'}
                  </h3>
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
                                  {currentUser?.role === 'super_admin' && (
                                    <button 
                                      onClick={async () => {
                                        try {
                                          const stats = await apiCall(`/api/organizations/${org.id}/stats`);
                                          setSelectedOrg(org);
                                          setOrgStats(stats);
                                          setNewPlan(org.subscription_plan);
                                          setShowChangePlanModal(true);
                                        } catch (error) {
                                          alert('Failed to load organization details: ' + (error as Error).message);
                                        }
                                      }}
                                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                                    >
                                      💳 Change Plan
                                    </button>
                                  )}
                                  {currentUser?.role === 'super_admin' && org.id !== 1 && (
                                    org.is_active ? (
                                      <button 
                                        onClick={async () => {
                                          if (!confirm(`⚠️ Block "${org.name}"?\n\nThis will prevent all users from logging in and new registrations.`)) {
                                            return;
                                          }
                                          try {
                                            await apiCall(`/api/organizations/${org.id}/block`, { method: 'PATCH' });
                                            alert(`✅ Organization "${org.name}" has been blocked.`);
                                            await loadOrganizations();
                                          } catch (error) {
                                            alert('Failed to block organization: ' + (error as Error).message);
                                          }
                                        }}
                                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200 transition-colors"
                                      >
                                        🚫 Block
                                      </button>
                                    ) : (
                                      <button 
                                        onClick={async () => {
                                          try {
                                            await apiCall(`/api/organizations/${org.id}/unblock`, { method: 'PATCH' });
                                            alert(`✅ Organization "${org.name}" has been unblocked.`);
                                            await loadOrganizations();
                                          } catch (error) {
                                            alert('Failed to unblock organization: ' + (error as Error).message);
                                          }
                                        }}
                                        className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                                      >
                                        ✅ Unblock
                                      </button>
                                    )
                                  )}
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
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Users Management</h3>
                  <button
                    onClick={() => setShowCreateUserModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    ➕ Create User
                  </button>
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
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Communities</th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Last Login</th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
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
                                  user.role === 'super_admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  user.role === 'org_admin' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                  user.role === 'community_lead' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }`}>
                                  {user.role.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td className="py-3">
                                {user.role === 'community_lead' && user.assigned_communities ? (
                                  <div className="flex gap-1 flex-wrap max-w-[200px]">
                                    {JSON.parse(user.assigned_communities).map((comm: string) => (
                                      <span key={comm} className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {comm}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  user.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                              <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                                {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                              </td>
                              <td className="py-3">
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setEditUserForm({
                                      role: user.role,
                                      assigned_communities: user.assigned_communities ? JSON.parse(user.assigned_communities) : [],
                                      full_name: user.full_name,
                                      is_active: user.is_active
                                    });
                                    setShowEditUserModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                                >
                                  ✏️ Edit
                                </button>
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
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Subscription Plan</div>
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                      orgStats.subscription_plan === 'free' ? 'bg-gray-200 text-gray-800' :
                      orgStats.subscription_plan === 'basic' ? 'bg-blue-100 text-blue-800' :
                      orgStats.subscription_plan === 'premium' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {orgStats.subscription_plan.toUpperCase()}
                    </span>
                    {currentUser?.role === 'super_admin' && (
                      <button
                        onClick={() => {
                          setNewPlan(orgStats.subscription_plan);
                          setShowChangePlanModal(true);
                        }}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Change Plan
                      </button>
                    )}
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
                  onChange={(e) => {
                    const name = e.target.value;
                    // Auto-generate slug from name
                    const slug = name
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '');
                    setCreateOrgForm(prev => ({ ...prev, name, slug }));
                  }}
                  placeholder="Acme Corporation"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug (URL-friendly) *
                  <span className="text-xs text-gray-500 ml-2">(auto-generated from name)</span>
                </label>
                <input
                  type="text"
                  required
                  value={createOrgForm.slug}
                  onChange={(e) => setCreateOrgForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="acme-corp"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Example: "{createOrgForm.slug || 'acme-corp'}"
                </p>
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

      {/* Change Subscription Plan Modal */}
      {showChangePlanModal && selectedOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full m-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Change Subscription Plan
            </h3>
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Organization:</strong> {selectedOrg.name}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                <strong>Current Plan:</strong> {orgStats?.subscription_plan.toUpperCase()}
              </p>
            </div>
            <form onSubmit={handleChangePlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Subscription Plan *
                </label>
                <select
                  required
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select a plan...</option>
                  <option value="free">FREE - 10 users, 1,000 chats/month</option>
                  <option value="basic">BASIC - 20 users, 5,000 chats/month</option>
                  <option value="premium">PREMIUM - 50 users, 25,000 chats/month</option>
                  <option value="enterprise">ENTERPRISE - 100 users, 50,000 chats/month</option>
                </select>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  ⚠️ <strong>Note:</strong> Changing the subscription plan will automatically update the organization's user and chat session limits.
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePlanModal(false);
                    setNewPlan('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full m-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create New User
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={createUserForm.username}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="john_doe"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={createUserForm.full_name}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={createUserForm.password}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum 6 characters
                </p>
              </div>
              {currentUser?.role === 'super_admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role *
                  </label>
                  <select
                    required
                    value={createUserForm.role}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, role: e.target.value, assigned_communities: [] }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="user">User</option>
                    <option value="community_lead">Community Lead</option>
                    <option value="org_admin">Organization Admin</option>
                  </select>
                </div>
              )}
              {currentUser?.role === 'org_admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role *
                  </label>
                  <select
                    required
                    value={createUserForm.role}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, role: e.target.value, assigned_communities: [] }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="user">User</option>
                    <option value="community_lead">Community Lead</option>
                  </select>
                </div>
              )}
              {(currentUser?.role === 'org_admin' || currentUser?.role === 'super_admin') && createUserForm.role === 'community_lead' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assigned Communities *
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-900">
                    {[
                      { id: 'qa', name: 'QA Engineers', icon: '🎯' },
                      { id: 'backend', name: 'Backend Developers', icon: '🔧' },
                      { id: 'frontend', name: 'Frontend Developers', icon: '🎨' },
                      { id: 'design', name: 'UI/UX Designers', icon: '✨' },
                      { id: 'product', name: 'Product Managers', icon: '📊' },
                      { id: 'devops', name: 'DevOps Engineers', icon: '🔐' },
                      { id: 'docs', name: 'Technical Writers', icon: '📝' }
                    ].map((community) => (
                      <label key={community.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={createUserForm.assigned_communities.includes(community.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setCreateUserForm(prev => ({
                              ...prev,
                              assigned_communities: checked
                                ? [...prev.assigned_communities, community.id]
                                : prev.assigned_communities.filter(c => c !== community.id)
                            }));
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {community.icon} {community.name}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Select at least one community for this Community Lead
                  </p>
                </div>
              )}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  ℹ️ <strong>Note:</strong> The user will be created in {currentUser?.role === 'org_admin' ? 'your organization' : 'the first available organization'}.
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateUserModal(false);
                    setCreateUserForm({
                      username: '',
                      email: '',
                      password: '',
                      full_name: '',
                      role: 'user',
                      assigned_communities: []
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full m-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edit User
            </h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={selectedUser.username}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={selectedUser.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editUserForm.full_name}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              {currentUser?.role === 'super_admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role *
                  </label>
                  <select
                    required
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, role: e.target.value, assigned_communities: [] }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="user">User</option>
                    <option value="community_lead">Community Lead</option>
                    <option value="org_admin">Organization Admin</option>
                  </select>
                </div>
              )}
              {currentUser?.role === 'org_admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role *
                  </label>
                  <select
                    required
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, role: e.target.value, assigned_communities: [] }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="user">User</option>
                    <option value="community_lead">Community Lead</option>
                  </select>
                </div>
              )}
              {(currentUser?.role === 'org_admin' || currentUser?.role === 'super_admin') && editUserForm.role === 'community_lead' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assigned Communities *
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-900">
                    {[
                      { id: 'qa', name: 'QA Engineers', icon: '🎯' },
                      { id: 'backend', name: 'Backend Developers', icon: '🔧' },
                      { id: 'frontend', name: 'Frontend Developers', icon: '🎨' },
                      { id: 'design', name: 'UI/UX Designers', icon: '✨' },
                      { id: 'product', name: 'Product Managers', icon: '📊' },
                      { id: 'devops', name: 'DevOps Engineers', icon: '🔐' },
                      { id: 'docs', name: 'Technical Writers', icon: '📝' }
                    ].map((community) => (
                      <label key={community.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={editUserForm.assigned_communities.includes(community.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setEditUserForm(prev => ({
                              ...prev,
                              assigned_communities: checked
                                ? [...prev.assigned_communities, community.id]
                                : prev.assigned_communities.filter(c => c !== community.id)
                            }));
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {community.icon} {community.name}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Select at least one community for this Community Lead
                  </p>
                </div>
              )}
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editUserForm.is_active}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    User is Active
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                  Inactive users cannot log in
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUserModal(false);
                    setSelectedUser(null);
                    setEditUserForm({
                      role: '',
                      assigned_communities: [],
                      full_name: '',
                      is_active: true
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
