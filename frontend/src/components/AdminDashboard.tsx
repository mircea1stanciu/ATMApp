'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || 'localhost';
const API_PORT = process.env.NEXT_PUBLIC_API_PORT || '8002';
const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;

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
  const [isDark, setIsDark] = useState(false);
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
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    is_active: true,
    organization_id: 0
  });
  const [createUserForm, setCreateUserForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    full_name: '',
    role: 'user',
    assigned_communities: [] as string[],
    organization_slug: '',
    access_token: ''
  });
  const [createOrgForm, setCreateOrgForm] = useState({
    name: '',
    slug: '',
    description: '',
    subscription_plan: 'free'
  });
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    // Initialize dark mode from localStorage
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
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
      const response = await fetch('http://localhost:8002/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Unauthorized');
      }

      const user = await response.json();
      setCurrentUser(user);
      
      // Debug: Log user information for troubleshooting
      console.log('🔍 Current User Info:', {
        username: user.username,
        role: user.role,
        organization_id: user.organization_id,
        organization_name: user.organization?.name
      });

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

    try {
      console.log(`[API] ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      console.log(`[API] Response status: ${response.status}`);

      if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        let errorMessage = 'Request failed';
        try {
          const error = await response.json();
          errorMessage = error.detail || error.message || error.error || 'Request failed';
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error(`[API] Error: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`[API] Success`);
      return data;
    } catch (error) {
      console.error(`[API] Exception:`, error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error(`Network error: Cannot reach backend at ${API_BASE_URL}. Make sure the backend is running on ${API_HOST}:${API_PORT}.`);
      }
      throw error;
    }
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
          console.log(`📋 Loading users for organization ID: ${currentUser.organization.id}`);
          const orgUsers = await apiCall(`/api/organizations/${currentUser.organization.id}/users`);
          const usersWithOrg = orgUsers.map((user: User) => ({
            ...user,
            organization: { id: currentUser.organization?.id, name: currentUser.organization?.name || '' }
          }));
          setUsers(usersWithOrg);
        } else {
          console.error('❌ Org Admin has no organization ID');
          alert('❌ Error: Your account is not associated with an organization. Please contact support.');
        }
      } else {
        // Super admins can see users from all organizations
        const orgs = await apiCall('/api/organizations');
        console.log(`📋 Super Admin: Loading users from ${orgs.length} organizations:`, orgs.map((o: Organization) => `${o.name} (ID: ${o.id})`));
        let allUsers: User[] = [];
        
        // Fetch users for each organization
        for (const org of orgs) {
          try {
            console.log(`  ↳ Fetching users for ${org.name} (ID: ${org.id})...`);
            const orgUsers = await apiCall(`/api/organizations/${org.id}/users`);
            console.log(`    ✅ Loaded ${orgUsers.length} users`);
            // Add organization info to each user
            const usersWithOrg = orgUsers.map((user: User) => ({
              ...user,
              organization: { id: org.id, name: org.name }
            }));
            allUsers = [...allUsers, ...usersWithOrg];
          } catch (err) {
            console.error(`    ❌ Failed to load users for ${org.name} (ID: ${org.id}):`, err);
            // Continue loading other organizations even if one fails
          }
        }
        
        console.log(`✅ Total users loaded: ${allUsers.length}`);
        setUsers(allUsers);
      }
    } catch (error) {
      console.error('❌ Failed to load users:', error);
      alert('❌ Failed to load users: ' + (error as Error).message);
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
    
    // Validate passwords match
    if (createUserForm.password !== createUserForm.confirm_password) {
      alert('❌ Passwords do not match');
      return;
    }
    
    // Validate community_lead has at least one community
    if (createUserForm.role === 'community_lead' && createUserForm.assigned_communities.length === 0) {
      alert('❌ Community Leads must have at least one assigned community');
      return;
    }
    
    // Super Admin creating Organization Admin - use register-org-admin endpoint
    if (currentUser?.role === 'super_admin' && createUserForm.role === 'org_admin') {
      if (!createUserForm.access_token) {
        alert('❌ Organization Access Token is required for Organization Admin');
        return;
      }
      
      try {
        const response = await fetch('http://localhost:8002/api/auth/register-org-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            access_token: createUserForm.access_token,
            username: createUserForm.username,
            email: createUserForm.email,
            password: createUserForm.password,
            full_name: createUserForm.full_name
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to create Organization Admin');
        }

        const result = await response.json();
        alert(`✅ Organization Admin created successfully!\n\nUsername: ${result.user.username}\nEmail: ${result.user.email}\nOrganization: ${result.user.organization?.name || 'N/A'}`);
        
        setShowCreateUserModal(false);
        setCreateUserForm({
          username: '',
          email: '',
          password: '',
          confirm_password: '',
          full_name: '',
          role: 'user',
          assigned_communities: [],
          organization_slug: '',
          access_token: ''
        });
        
        // Reload users
        await loadUsers();
      } catch (error) {
        alert('Failed to create Organization Admin: ' + (error as Error).message);
      }
      return;
    }
    
    // Super Admin creating User or Community Lead - use register-user endpoint
    if (currentUser?.role === 'super_admin' && (createUserForm.role === 'user' || createUserForm.role === 'community_lead')) {
      if (!createUserForm.organization_slug) {
        alert('❌ Organization Slug is required');
        return;
      }
      
      try {
        const response = await fetch('http://localhost:8002/api/auth/register-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            organization_slug: createUserForm.organization_slug,
            username: createUserForm.username,
            email: createUserForm.email,
            password: createUserForm.password,
            full_name: createUserForm.full_name,
            role: createUserForm.role,
            assigned_communities: createUserForm.assigned_communities
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to create user');
        }

        const result = await response.json();
        alert(`✅ ${createUserForm.role === 'user' ? 'User' : 'Community Lead'} created successfully!\n\nUsername: ${result.user.username}\nEmail: ${result.user.email}\nOrganization: ${result.user.organization?.name || 'N/A'}`);
        
        setShowCreateUserModal(false);
        setCreateUserForm({
          username: '',
          email: '',
          password: '',
          confirm_password: '',
          full_name: '',
          role: 'user',
          assigned_communities: [],
          organization_slug: '',
          access_token: ''
        });
        
        // Reload users
        await loadUsers();
      } catch (error) {
        alert('Failed to create user: ' + (error as Error).message);
      }
      return;
    }
    
    // Org Admin creating User or Community Lead - use organization-specific endpoint
    try {
      const orgId = currentUser?.role === 'org_admin' 
        ? currentUser.organization?.id 
        : null;

      if (!orgId) {
        alert('No organization available for user creation');
        return;
      }

      const result = await apiCall(`/api/organizations/${orgId}/users`, {
        method: 'POST',
        body: JSON.stringify({
          username: createUserForm.username,
          email: createUserForm.email,
          password: createUserForm.password,
          full_name: createUserForm.full_name,
          role: createUserForm.role,
          assigned_communities: createUserForm.assigned_communities
        })
      });

      alert(`✅ User created successfully!\n\nUsername: ${result.user.username}\nEmail: ${result.user.email}\nRole: ${result.user.role}`);
      
      setShowCreateUserModal(false);
      setCreateUserForm({
        username: '',
        email: '',
        password: '',
        confirm_password: '',
        full_name: '',
        role: 'user',
        assigned_communities: [],
        organization_slug: '',
        access_token: ''
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

    // Validate password if provided
    if (editUserForm.password && editUserForm.password.length < 8) {
      alert('❌ Password must be at least 8 characters');
      return;
    }

    // Validate password confirmation
    if (editUserForm.password && editUserForm.password !== editUserForm.confirm_password) {
      alert('❌ Passwords do not match. Please confirm your password.');
      return;
    }
    
    try {
      // Get organization ID from the user being edited
      const orgId = selectedUser.organization?.id;
      
      if (!orgId) {
        alert('❌ User organization not found. Please reload the page.');
        return;
      }

      // Build update data based on user role
      // Super admins can update all fields including role
      // Org admins can only update certain fields, but NOT change to org_admin role
      const updateData: any = {
        full_name: editUserForm.full_name,
        username: editUserForm.username,
        email: editUserForm.email,
        is_active: editUserForm.is_active,
        assigned_communities: editUserForm.assigned_communities,
        ...(editUserForm.password && { password: editUserForm.password })
      };

      // Only super admins can change role
      if (currentUser?.role === 'super_admin') {
        updateData.role = editUserForm.role;
        // Only super admins can set organization_id
        if (editUserForm.role === 'org_admin' && editUserForm.organization_id) {
          updateData.organization_id = editUserForm.organization_id;
        }
      }

      const result = await apiCall(`/api/organizations/${orgId}/users/${selectedUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      alert(`✅ User updated successfully!\n\nUsername: ${result.user.username}\nRole: ${result.user.role}\nStatus: ${result.user.is_active ? 'Active' : 'Inactive'}`);
      
      setShowEditUserModal(false);
      setSelectedUser(null);
      setEditUserForm({
        role: '',
        assigned_communities: [],
        full_name: '',
        username: '',
        email: '',
        password: '',
        confirm_password: '',
        is_active: true,
        organization_id: 0
      });
      
      // Reload users
      await loadUsers();
    } catch (error) {
      alert('Failed to update user: ' + (error as Error).message);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`⚠️ Are you sure you want to delete user "${user.username}"?\n\nThis will permanently delete:\n- The user account\n- All their chat sessions\n\nThis action cannot be undone!`)) {
      return;
    }

    try {
      const orgId = user.organization?.id;
      if (!orgId) {
        alert('❌ User organization not found');
        return;
      }

      await apiCall(`/api/organizations/${orgId}/users/${user.id}`, {
        method: 'DELETE'
      });

      alert(`✅ User "${user.username}" deleted successfully`);
      
      // Reload users
      await loadUsers();
    } catch (error) {
      alert('Failed to delete user: ' + (error as Error).message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const toggleDarkMode = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newTheme);
  };

  // Helper function to get role priority (lower number = higher priority)
  const getRolePriority = (role: string): number => {
    const priorities: { [key: string]: number } = {
      'super_admin': 1,
      'org_admin': 2,
      'community_lead': 3,
      'user': 4
    };
    return priorities[role] || 999;
  };

  // Filter and sort users for display
  const getFilteredAndSortedUsers = () => {
    let filtered = users;

    // Apply organization filter (only for super admin)
    if (currentUser?.role === 'super_admin' && selectedOrgFilter !== 'all') {
      filtered = users.filter(user => user.organization?.id === parseInt(selectedOrgFilter));
    }

    // Sort by: 1) Role priority (descending), 2) Username (alphabetically)
    const sorted = [...filtered].sort((a, b) => {
      // First sort by role priority
      const roleDiff = getRolePriority(a.role) - getRolePriority(b.role);
      if (roleDiff !== 0) return roleDiff;

      // If same role, sort alphabetically by username
      return a.username.localeCompare(b.username);
    });

    return sorted;
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
            { id: 'users', icon: '👥', label: 'Users', roles: ['super_admin', 'org_admin'] },
            { id: 'api-docs', icon: '📚', label: 'API Documentation', roles: ['super_admin'] }
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
              onClick={() => router.push('/settings')}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
            >
              <span className="text-lg">⚙️</span>
              <span>Settings</span>
            </button>
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
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 md:px-6 py-2 sm:py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                {activeSection === 'overview' && 'Dashboard Overview'}
                {activeSection === 'organizations' && 'Organizations Management'}
                {activeSection === 'users' && (currentUser?.role === 'org_admin' ? 'Organization Users' : 'Users Management')}
                {activeSection === 'api-docs' && 'API Documentation'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {currentUser?.role === 'org_admin' ? 'Manage your organization' : 'Manage your multi-tenant platform'}
                </p>
                {currentUser?.role === 'org_admin' && activeSection === 'users' && currentUser?.organization?.slug && (
                  <div className="group relative">
                    <code className="text-[10px] sm:text-xs font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 cursor-help">
                      {currentUser.organization.slug}
                    </code>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                      <div className="bg-gray-900 dark:bg-gray-950 text-white text-xs rounded py-2 px-3 whitespace-nowrap shadow-lg">
                        Slug for user creation
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-950"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Responsive Breakpoint Indicator - Remove after testing */}
              <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                <span className="sm:hidden text-red-600">📱 Mobile</span>
                <span className="hidden sm:inline md:hidden text-yellow-600">📱 Tablet</span>
                <span className="hidden md:inline lg:hidden text-green-600">💻 Desktop</span>
                <span className="hidden lg:inline text-blue-600">🖥️ Large</span>
              </div>
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <span className="hidden sm:inline text-xs sm:text-sm text-gray-900 dark:text-white font-medium">
                {currentUser?.full_name || currentUser?.username}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium ${
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
        <main className="flex-1 p-3 sm:p-4 md:p-5 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                {currentUser?.role === 'super_admin' && (
                  <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-base sm:text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.total_organizations}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Total Organizations</div>
                  </div>
                )}
                {currentUser?.role === 'org_admin' && (
                  <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm sm:text-base md:text-lg font-bold text-blue-600 dark:text-blue-400 truncate">
                      {currentUser.organization?.name || 'My Organization'}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Organization</div>
                  </div>
                )}
                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-base sm:text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.total_users}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                    {currentUser?.role === 'org_admin' ? 'Organization Users' : 'Total Users'}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-base sm:text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.active_users}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Active Users</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-base sm:text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.total_chat_sessions}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                    {currentUser?.role === 'org_admin' ? 'Organization Chats' : 'Total Chats'}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
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
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Organizations Management</h3>
                  <button
                    onClick={() => setShowCreateOrgModal(true)}
                    className="px-3 py-1.5 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    ➕ Create Organization
                  </button>
                </div>
                <div className="p-3 sm:p-4">
                  {organizations.length === 0 ? (
                    <p className="text-center text-sm sm:text-base text-gray-500 dark:text-gray-400 py-8">
                      No organizations found
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Organization</th>
                            <th className="text-left py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Slug</th>
                            <th className="text-left py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Plan</th>
                            <th className="text-left py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Users</th>
                            <th className="text-left py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                            <th className="text-left py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Created</th>
                            <th className="text-left py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {organizations.map((org) => (
                            <tr key={org.id} className="border-b border-gray-100 dark:border-gray-700">
                              <td className="py-3">
                                <div className="font-medium text-gray-900 dark:text-white">{org.name}</div>
                              </td>
                              <td className="py-3">
                                <code className="text-xs sm:text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded">
                                  {org.slug}
                                </code>
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
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-3 gap-2 sm:gap-3">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Users Management</h3>
                    <button
                      onClick={() => setShowCreateUserModal(true)}
                      className="px-3 py-1.5 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      ➕ Create User
                    </button>
                  </div>
                  
                  {/* Filters - Only for Super Admin */}
                  {currentUser?.role === 'super_admin' && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                        <label className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300">
                          Filter by Organization:
                        </label>
                        <select
                          value={selectedOrgFilter}
                          onChange={(e) => setSelectedOrgFilter(e.target.value)}
                          className="box-border w-full sm:w-auto px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                          <option value="all">All Organizations</option>
                          {organizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        Showing {getFilteredAndSortedUsers().length} of {users.length} users
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 sm:p-4">
                  {users.length === 0 ? (
                    <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 py-6">
                      No users found
                    </p>
                  ) : getFilteredAndSortedUsers().length === 0 ? (
                    <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 py-6">
                      No users found matching the selected filter
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Username</th>
                            <th className="text-left py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Email</th>
                            <th className="text-left py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Organization</th>
                            <th className="text-left py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                              Role
                              <span className="ml-1 text-[10px] sm:text-xs text-gray-400">(sorted)</span>
                            </th>
                            <th className="text-left py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Communities</th>
                            <th className="text-left py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                            <th className="text-left py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Last Login</th>
                            <th className="text-left py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredAndSortedUsers().map((user) => (
                            <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700">
                              <td className="py-2">
                                <div>
                                  <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{user.username}</div>
                                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{user.full_name}</div>
                                </div>
                              </td>
                              <td className="py-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">{user.email}</td>
                              <td className="py-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">{user.organization?.name || '-'}</td>
                              <td className="py-2">
                                <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
                                  user.role === 'super_admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  user.role === 'org_admin' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                  user.role === 'community_lead' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }`}>
                                  {user.role.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td className="py-3">
                                {((user.role === 'community_lead' || user.role === 'user') && user.assigned_communities && Array.isArray(user.assigned_communities) && user.assigned_communities.length > 0) ? (
                                  <div className="flex gap-1 flex-wrap max-w-[200px]">
                                    {user.assigned_communities.map((comm: string) => (
                                      <span key={comm} className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {comm}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs sm:text-sm text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-3">
                                <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
                                  user.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                              <td className="py-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                              </td>
                              <td className="py-3">
                                <div className="flex gap-1 sm:gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setEditUserForm({
                                        role: user.role,
                                        assigned_communities: Array.isArray(user.assigned_communities) ? user.assigned_communities : [],
                                        full_name: user.full_name,
                                        username: user.username,
                                        email: user.email,
                                        password: '',
                                        confirm_password: '',
                                        is_active: user.is_active,
                                        organization_id: user.organization?.id || 0
                                      });
                                      setShowEditUserModal(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs sm:text-sm font-medium"
                                  >
                                    ✏️ Edit
                                  </button>
                                  {currentUser?.role === 'super_admin' && user.role !== 'super_admin' && user.id !== currentUser.id && (
                                    <button
                                      onClick={() => handleDeleteUser(user)}
                                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs sm:text-sm font-medium"
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

          {/* API Documentation Section */}
          {activeSection === 'api-docs' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 sm:p-5 md:p-6 text-white mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">🚀 UnifiedWork API Documentation</h2>
                <p className="text-xs sm:text-sm text-blue-100">
                  Complete REST API reference for integrating with UnifiedWork platform
                </p>
              </div>

              {/* Base URL */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">📍 Base URL</h3>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 rounded-lg font-mono text-xs sm:text-sm">
                  <code className="text-blue-600 dark:text-blue-400">http://localhost:8002</code>
                </div>
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  All API endpoints are relative to this base URL
                </p>
              </div>

              {/* Authentication */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">🔐 Authentication</h3>
                
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2">Login</h4>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-[10px] sm:text-xs font-bold">POST</span>
                        <code className="text-xs sm:text-sm">/api/auth/login</code>
                      </div>
                      <pre className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-2 overflow-x-auto">{`{
  "username": "admin",
  "password": "admin123",
  "organization_slug": "your-org-slug"  // Optional
}`}</pre>
                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-2">Response:</p>
                        <pre className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">{`{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@unifiedwork.com",
    "role": "super_admin",
    "assigned_communities": ["qa", "backend"],
    "organization": { ... }
  }
}`}</pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2">Using the Token</h4>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Include the token in the Authorization header for all protected endpoints:
                      </p>
                      <pre className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Authorization: Bearer &lt;your_access_token&gt;</pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Organizations API */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">🏢 Organizations API</h3>
                
                <div className="space-y-3 sm:space-y-4">
                  {/* List Organizations */}
                  <div className="border-l-4 border-blue-500 pl-3 sm:pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-[10px] sm:text-xs font-bold">GET</span>
                      <code className="text-xs sm:text-sm text-gray-900 dark:text-white">/api/organizations</code>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">List all organizations (Super Admin only)</p>
                  </div>

                  {/* Create Organization */}
                  <div className="border-l-4 border-green-500 pl-3 sm:pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-[10px] sm:text-xs font-bold">POST</span>
                      <code className="text-xs sm:text-sm text-gray-900 dark:text-white">/api/organizations</code>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">Create a new organization</p>
                    <pre className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 rounded overflow-x-auto">{`{
  "name": "Acme Inc",
  "slug": "acme-inc",
  "admin_email": "admin@acme.com",
  "admin_username": "acme_admin",
  "admin_password": "secure123",
  "subscription_plan": "premium"
}`}</pre>
                  </div>

                  {/* Update Organization */}
                  <div className="border-l-4 border-yellow-500 pl-3 sm:pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded text-[10px] sm:text-xs font-bold">PATCH</span>
                      <code className="text-xs sm:text-sm text-gray-900 dark:text-white">/api/organizations/{`{org_id}`}</code>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Update organization details (subscription plan, status)</p>
                  </div>

                  {/* Block/Unblock Organization */}
                  <div className="border-l-4 border-orange-500 pl-3 sm:pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded text-[10px] sm:text-xs font-bold">POST</span>
                      <code className="text-xs sm:text-sm text-gray-900 dark:text-white">/api/organizations/{`{org_id}`}/block</code>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Block or unblock an organization</p>
                  </div>
                </div>
              </div>

              {/* Users API */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">👥 Users API</h3>
                
                <div className="space-y-3 sm:space-y-4">
                  {/* List Users */}
                  <div className="border-l-4 border-blue-500 pl-3 sm:pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-[10px] sm:text-xs font-bold">GET</span>
                      <code className="text-xs sm:text-sm text-gray-900 dark:text-white">/api/organizations/{`{org_id}`}/users</code>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">List all users in an organization</p>
                    <pre className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 rounded mt-2 overflow-x-auto">{`// Response includes assigned_communities
{
  "users": [{
    "id": 1,
    "username": "john_qa",
    "email": "john@acme.com",
    "role": "community_lead",
    "assigned_communities": ["qa", "backend"],
    "is_active": true
  }]
}`}</pre>
                  </div>

                  {/* Create User */}
                  <div className="border-l-4 border-green-500 pl-3 sm:pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-[10px] sm:text-xs font-bold">POST</span>
                      <code className="text-xs sm:text-sm text-gray-900 dark:text-white">/api/organizations/{`{org_id}`}/users</code>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">Create a new user with community assignments</p>
                    <pre className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 rounded overflow-x-auto">{`{
  "username": "jane_qa",
  "email": "jane@acme.com",
  "password": "secure123",
  "full_name": "Jane Doe",
  "role": "community_lead",  // user, community_lead, org_admin
  "assigned_communities": ["qa", "backend"]
}`}</pre>
                  </div>

                  {/* Update User */}
                  <div className="border-l-4 border-yellow-500 pl-3 sm:pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded text-[10px] sm:text-xs font-bold">PATCH</span>
                      <code className="text-xs sm:text-sm text-gray-900 dark:text-white">/api/organizations/{`{org_id}`}/users/{`{user_id}`}</code>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">Update user role, communities, and status</p>
                    <pre className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 rounded overflow-x-auto">{`{
  "role": "community_lead",
  "assigned_communities": ["qa", "frontend", "design"],
  "full_name": "Jane Smith",
  "is_active": true
}`}</pre>
                  </div>

                  {/* Delete User */}
                  <div className="border-l-4 border-red-500 pl-3 sm:pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded text-[10px] sm:text-xs font-bold">DELETE</span>
                      <code className="text-xs sm:text-sm text-gray-900 dark:text-white">/api/organizations/{`{org_id}`}/users/{`{user_id}`}</code>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Delete a user from an organization</p>
                  </div>
                </div>
              </div>

              {/* Communities Reference */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">🏘️ Available Communities</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { id: 'qa', name: 'QA Engineers', icon: '🎯' },
                    { id: 'backend', name: 'Backend Developers', icon: '🔧' },
                    { id: 'frontend', name: 'Frontend Developers', icon: '🎨' },
                    { id: 'design', name: 'UI/UX Designers', icon: '✨' },
                    { id: 'product', name: 'Product Managers', icon: '📊' },
                    { id: 'devops', name: 'DevOps Engineers', icon: '🔐' },
                    { id: 'analyst', name: 'Business System Analysts', icon: '�' }
                  ].map(community => (
                    <div key={community.id} className="bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-lg sm:text-xl">{community.icon}</span>
                        <div>
                          <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white">{community.name}</div>
                          <code className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{community.id}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Role Hierarchy */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">👑 Role Hierarchy</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-600 text-white rounded text-[10px] sm:text-xs font-bold">SUPER_ADMIN</span>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Full platform access, manage all organizations</span>
                  </div>
                  <div className="ml-4 sm:ml-8 flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-orange-600 text-white rounded text-[10px] sm:text-xs font-bold">ORG_ADMIN</span>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Manage organization users, all community access</span>
                  </div>
                  <div className="ml-8 sm:ml-16 flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-purple-600 text-white rounded text-[10px] sm:text-xs font-bold">COMMUNITY_LEAD</span>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Access assigned communities only</span>
                  </div>
                  <div className="ml-12 sm:ml-24 flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-600 text-white rounded text-[10px] sm:text-xs font-bold">USER</span>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Access assigned communities only</span>
                  </div>
                </div>
              </div>

              {/* Interactive API Tester */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">🧪 Quick Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <a
                    href="http://localhost:8002/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
                  >
                    <span className="text-xl sm:text-2xl">📖</span>
                    <div>
                      <div className="text-sm sm:text-base font-semibold">Swagger Documentation</div>
                      <div className="text-[10px] sm:text-xs text-blue-100">Interactive API explorer</div>
                    </div>
                  </a>
                  <a
                    href="http://localhost:8002/redoc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all"
                  >
                    <span className="text-xl sm:text-2xl">📚</span>
                    <div>
                      <div className="text-sm sm:text-base font-semibold">ReDoc Documentation</div>
                      <div className="text-xs text-purple-100">Clean API reference</div>
                    </div>
                  </a>
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
                  className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full m-4 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New User
              </h3>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4 overflow-y-auto flex-1 px-6 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={createUserForm.username}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="john_doe"
                  className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                  className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                  className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={createUserForm.password}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="At least 8 characters"
                  className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={createUserForm.confirm_password}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                  placeholder="Re-enter your password"
                  className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              {currentUser?.role === 'super_admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role *
                  </label>
                  <select
                    required
                    value={createUserForm.role}
                    onChange={(e) => setCreateUserForm(prev => ({ 
                      ...prev, 
                      role: e.target.value, 
                      assigned_communities: [],
                      organization_slug: '',
                      access_token: ''
                    }))}
                    className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="user">User</option>
                    <option value="community_lead">Community Lead</option>
                    <option value="org_admin">Organization Admin</option>
                  </select>
                </div>
              )}
              {currentUser?.role === 'super_admin' && createUserForm.role === 'org_admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Organization Access Token *
                  </label>
                  <input
                    type="text"
                    required
                    value={createUserForm.access_token}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, access_token: e.target.value }))}
                    placeholder="Paste the organization access token"
                    className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    The access token that determines which organization this admin belongs to
                  </p>
                </div>
              )}
              {currentUser?.role === 'super_admin' && (createUserForm.role === 'user' || createUserForm.role === 'community_lead') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Organization Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={createUserForm.organization_slug}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, organization_slug: e.target.value }))}
                    placeholder="organization-slug"
                    className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    The slug (URL identifier) of the organization this user belongs to
                  </p>
                </div>
              )}
              {currentUser?.role === 'super_admin' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    {createUserForm.role === 'org_admin' && (
                      <>
                        <strong>📋 Organization Admin:</strong> Requires an <strong>access token</strong> to determine the organization.
                      </>
                    )}
                    {(createUserForm.role === 'user' || createUserForm.role === 'community_lead') && (
                      <>
                        <strong>👥 {createUserForm.role === 'user' ? 'User' : 'Community Lead'}:</strong> Requires an <strong>organization slug</strong> to determine the organization.
                      </>
                    )}
                  </p>
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
                    className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="user">User</option>
                    <option value="community_lead">Community Lead</option>
                  </select>
                </div>
              )}
              {(currentUser?.role === 'org_admin' || currentUser?.role === 'super_admin') && (createUserForm.role === 'community_lead' || createUserForm.role === 'user') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assigned Communities {createUserForm.role === 'community_lead' ? '*' : '(Optional)'}
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-900">
                    {[
                      { id: 'qa', name: 'QA Engineers', icon: '🎯' },
                      { id: 'backend', name: 'Backend Developers', icon: '🔧' },
                      { id: 'frontend', name: 'Frontend Developers', icon: '🎨' },
                      { id: 'design', name: 'UI/UX Designers', icon: '✨' },
                      { id: 'product', name: 'Product Managers', icon: '📊' },
                      { id: 'devops', name: 'DevOps Engineers', icon: '🔐' },
                      { id: 'analyst', name: 'Business System Analysts', icon: '�' }
                    ].map(community => (
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
                    {createUserForm.role === 'community_lead' 
                      ? 'Select at least one community for this Community Lead' 
                      : 'Select communities this user belongs to (optional)'}
                  </p>
                </div>
              )}
              {currentUser?.role === 'org_admin' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    ℹ️ <strong>Note:</strong> The user will be created in your organization.
                  </p>
                </div>
              )}
              <div className="flex gap-3 mt-6 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateUserModal(false);
                    setCreateUserForm({
                      username: '',
                      email: '',
                      password: '',
                      confirm_password: '',
                      full_name: '',
                      role: 'user',
                      assigned_communities: [],
                      organization_slug: '',
                      access_token: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full m-4 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit User
              </h3>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-4 overflow-y-auto flex-1 px-6 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={editUserForm.username}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="john_doe"
                  className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                  className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password (Leave empty to keep current)
                </label>
                <input
                  type="password"
                  minLength={8}
                  value={editUserForm.password}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="At least 8 characters"
                  className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Only fill this field if you want to change the password
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  minLength={8}
                  value={editUserForm.confirm_password}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                  placeholder="Re-enter your password"
                  className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Only required if changing the password
                </p>
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
                    className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="user">User</option>
                    <option value="community_lead">Community Lead</option>
                  </select>
                </div>
              )}
              {currentUser?.role === 'super_admin' && editUserForm.role === 'org_admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Organization *
                  </label>
                  <select
                    required
                    value={editUserForm.organization_id}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, organization_id: parseInt(e.target.value) }))}
                    className="box-border w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={0}>Select an organization...</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {(currentUser?.role === 'org_admin' || currentUser?.role === 'super_admin') && (editUserForm.role === 'community_lead' || editUserForm.role === 'user') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assigned Communities {editUserForm.role === 'community_lead' ? '*' : '(Optional)'}
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-900">
                    {[
                      { id: 'qa', name: 'QA Engineers', icon: '🎯' },
                      { id: 'backend', name: 'Backend Developers', icon: '🔧' },
                      { id: 'frontend', name: 'Frontend Developers', icon: '🎨' },
                      { id: 'design', name: 'UI/UX Designers', icon: '✨' },
                      { id: 'product', name: 'Product Managers', icon: '📊' },
                      { id: 'devops', name: 'DevOps Engineers', icon: '🔐' },
                      { id: 'analyst', name: 'Business System Analysts', icon: '�' }
                    ].map(community => (
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
                    {editUserForm.role === 'community_lead' 
                      ? 'Select at least one community for this Community Lead' 
                      : 'Select communities this user belongs to (optional)'}
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
              <div className="flex gap-3 mt-6 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUserModal(false);
                    setSelectedUser(null);
                    setEditUserForm({
                      role: '',
                      assigned_communities: [],
                      full_name: '',
                      username: '',
                      email: '',
                      password: '',
                      confirm_password: '',
                      is_active: true,
                      organization_id: 0
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
