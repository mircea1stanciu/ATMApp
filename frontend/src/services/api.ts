import axios from 'axios'
import type {
  Branch,
  ExecuteRunResponse,
  GitHubTreeItem,
  JiraProject,
  Project,
  TestRun,
  TestRunDetails,
  TestSuite,
  TokenResponse,
  UserResponse,
} from '@/types/domain'

const AUTH_EXPIRED_EVENT = 'atm:auth-expired'

function notifyAuthExpired(reason: 'unauthorized' | 'session_expired' = 'unauthorized') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail: { reason } }))
}

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const requestUrl = error.config?.url || ''
      const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register')
      if (!isAuthEndpoint) {
        notifyAuthExpired('unauthorized')
      }
    }
    return Promise.reject(error)
  },
)

// Ensure authenticated calls work even right after page refresh,
// before store hydration effects run.
const initialToken = typeof window !== 'undefined'
  ? (localStorage.getItem('tm_access_token') || localStorage.getItem('token'))
  : null
if (initialToken) {
  api.defaults.headers.common.Authorization = `Bearer ${initialToken}`
}

export function setAccessToken(token: string | null) {
  if (token) {
    // Keep both keys in sync while legacy screens still read `token`.
    if (typeof window !== 'undefined') {
      localStorage.setItem('tm_access_token', token)
      localStorage.setItem('token', token)
    }
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tm_access_token')
      localStorage.removeItem('token')
    }
    delete api.defaults.headers.common.Authorization
  }
}

function extractErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'Unexpected error occurred.'
  }
  const detail = error.response?.data?.detail
  if (typeof detail === 'string') {
    return detail
  }
  return error.message || 'Request failed.'
}

export const apiService = {
  async login(email: string, password: string): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/auth/login', {
      email,
      password,
    })
    return response.data
  },

  async register(email: string, password: string, fullName: string): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/auth/register', {
      email,
      password,
      full_name: fullName,
    })
    return response.data
  },

  async me(): Promise<UserResponse> {
    const response = await api.get<UserResponse>('/auth/me')
    return response.data
  },

  async listProjects(): Promise<Project[]> {
    const response = await api.get<Project[]>('/projects')
    return response.data
  },

  async createProject(payload: {
    name: string
    description?: string
    git_repo_url: string
    default_branch?: string
    framework?: string
  }): Promise<Project> {
    const response = await api.post<Project>('/projects', {
      git_provider: 'github',
      ...payload,
    })
    return response.data
  },

  async updateProject(
    projectId: string,
    payload: {
      name?: string
      description?: string
      default_branch?: string
      framework?: string
      config_json?: Record<string, unknown>
    },
  ): Promise<Project> {
    const response = await api.put<Project>(`/projects/${projectId}`, payload)
    return response.data
  },

  async deleteProject(projectId: string): Promise<void> {
    await api.delete(`/projects/${projectId}`)
  },

  async listBranches(projectId: string): Promise<Branch[]> {
    const response = await api.get<Branch[]>(`/projects/${projectId}/branches`)
    return response.data
  },

  async listSuites(projectId: string): Promise<TestSuite[]> {
    const response = await api.get<TestSuite[]>(`/suites/projects/${projectId}`)
    return response.data
  },

  async createSuite(projectId: string, payload: { name: string; tags?: string[] }): Promise<TestSuite> {
    const response = await api.post<TestSuite>(`/suites/projects/${projectId}/suites`, {
      active: true,
      ...payload,
    })
    return response.data
  },

  async updateSuite(
    suiteId: string,
    payload: { name?: string; tags?: string[]; cron_expression?: string | null; active?: boolean },
  ): Promise<TestSuite> {
    const response = await api.put<TestSuite>(`/suites/${suiteId}`, payload)
    return response.data
  },

  async listRunsByProject(projectId: string): Promise<TestRun[]> {
    const response = await api.get<TestRun[]>(`/runs/projects/${projectId}`)
    return response.data
  },

  async createRun(payload: {
    suite_id: string
    branch?: string
    commit_sha?: string
    triggered_by?: string
  }): Promise<TestRun> {
    const response = await api.post<TestRun>('/runs', payload)
    return response.data
  },

  async executeRun(
    runId: string,
    payload?: { run_project?: string; run_collection?: string; run_environment?: string },
  ): Promise<ExecuteRunResponse> {
    const response = await api.post<ExecuteRunResponse>(`/runs/${runId}/execute`, payload || {})
    return response.data
  },

  async cancelRun(runId: string): Promise<void> {
    await api.post(`/runs/${runId}/cancel`)
  },

  async deleteRun(runId: string): Promise<void> {
    await api.delete(`/runs/${runId}`)
  },

  async deleteSuite(suiteId: string): Promise<void> {
    await api.delete(`/suites/${suiteId}`)
  },

  async getRunDetails(runId: string): Promise<TestRunDetails> {
    const response = await api.get<TestRunDetails>(`/runs/${runId}`)
    return response.data
  },

  // Admin: user management
  async listUsers(): Promise<UserResponse[]> {
    const response = await api.get<UserResponse[]>('/auth/users')
    return response.data
  },

  async createUser(payload: { email: string; password: string; full_name: string; role: string }): Promise<UserResponse> {
    const response = await api.post<UserResponse>('/auth/users', payload)
    return response.data
  },

  async updateUser(userId: string, data: { email?: string; full_name?: string; role?: string; assigned_lead_id?: string | null; is_active?: boolean; password?: string }): Promise<UserResponse> {
    const response = await api.patch<UserResponse>(`/auth/users/${userId}`, data)
    return response.data
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/auth/users/${userId}`)
  },

  // Admin: settings
  async getSettings(): Promise<{ github_token_set: boolean; github_token_preview: string; github_mcp_base_url: string }> {
    const response = await api.get('/settings')
    return response.data
  },

  async saveGithubSettings(payload: { github_token?: string; github_mcp_base_url?: string }): Promise<{ github_token_set: boolean; github_token_preview: string; github_mcp_base_url: string }> {
    const response = await api.patch('/settings/github', payload)
    return response.data
  },

  async testGithubConnection(): Promise<{ ok: boolean; login?: string; name?: string; plan?: string; error?: string }> {
    const response = await api.post('/settings/github/test')
    return response.data
  },

  async getJiraSettings(): Promise<{ jira_token_set: boolean; jira_token_preview: string; jira_mcp_base_url: string; jira_project_key?: string | null; jira_project_name?: string | null }> {
    const response = await api.get('/settings/jira')
    return response.data
  },

  async saveJiraSettings(payload: { jira_token?: string; jira_mcp_base_url?: string; jira_project_key?: string; jira_project_name?: string }): Promise<{ jira_token_set: boolean; jira_token_preview: string; jira_mcp_base_url: string; jira_project_key?: string | null; jira_project_name?: string | null }> {
    const response = await api.patch('/settings/jira', payload)
    return response.data
  },

  async testJiraConnection(): Promise<{ ok: boolean; user?: string; error?: string }> {
    const response = await api.post('/settings/jira/test')
    return response.data
  },

  async listJiraProjects(): Promise<JiraProject[]> {
    const response = await api.get<{ projects: JiraProject[] }>('/settings/jira/projects')
    return response.data.projects
  },

  // Zephyr (Test Manager) settings
  async getZephyrSettings(): Promise<{ zephyr_project_key: string; zephyr_selected_folder_id: string }> {
    const response = await api.get('/settings/zephyr')
    return response.data
  },

  async saveZephyrSettings(payload: { zephyr_project_key?: string; zephyr_selected_folder_id?: string }): Promise<{ zephyr_project_key: string; zephyr_selected_folder_id: string }> {
    const response = await api.patch('/settings/zephyr', payload)
    return response.data
  },

  async listZephyrCycles(projectKey: string): Promise<{ project_key: string; cycles: Array<{ id: string; name: string; description?: string; created?: string; updated?: string; folder?: string }>; total: number }> {
    const response = await api.get(`/settings/zephyr/cycles/${projectKey}`)
    return response.data
  },

  // Test Manager — sprint-based test overview (Jira Agile REST API)
  async getTestSprints(projectKey: string, state = 'active'): Promise<{
    project_key: string
    sprints: Array<{
      id: number; name: string; state: string; startDate: string; endDate: string
      boardId: number; boardName: string; totalTests: number; byStatus: Record<string, number>
    }>
    total: number
  }> {
    const response = await api.get(`/test-manager/sprints/${projectKey}`, { params: { state } })
    return response.data
  },

  async getSprintTestIssues(sprintId: number, projectKey: string): Promise<{
    sprint_id: number; project_key: string
    issues: Array<{
      key: string; summary: string; status: string; issueType: string
      assignee: string; components: string[]; updated: string; url: string
    }>
    total: number
  }> {
    const response = await api.get(`/test-manager/sprints/${sprintId}/issues/${projectKey}`)
    return response.data
  },

  // Test Cases (automation tracking)
  async getTestCases(projectKey: string, automationStatus = 'all', search = ''): Promise<{
    project_key: string
    cases: Array<{
      key: string; summary: string; jiraStatus: string; issueType: string
      components: string[]; updated: string; assignee: string; url: string
      automationStatus: 'pending' | 'to_automate' | 'automated' | 'manual'
    }>
    total: number
    total_jira: number
  }> {
    const response = await api.get(`/test-manager/cases/${projectKey}`, {
      params: { automation_status: automationStatus, search },
    })
    return response.data
  },

  async getTestCaseStats(projectKey: string): Promise<{
    project_key: string; total_jira: number; loaded: number
    pending: number; to_automate: number; automated: number; manual: number
  }> {
    const response = await api.get(`/test-manager/cases/${projectKey}/stats`)
    return response.data
  },

  async updateTestCaseAutomation(jiraKey: string, projectKey: string, status: string): Promise<{
    jira_key: string; project_key: string; status: string
  }> {
    const response = await api.patch(`/test-manager/cases/${projectKey}/${jiraKey}/automation`, { status })
    return response.data
  },

  async getEpicStories(projectKey: string, search = '', refresh = false): Promise<{
    project_key: string
    epics: Array<{
      key: string; summary: string; created: string; year: string; team: string; url: string
      stories: Array<{ key: string; summary: string; created: string; team: string; status: string; url: string }>
    }>
    total: number
  }> {
    const response = await api.get(`/test-manager/epics/${projectKey}`, { params: { search, refresh } })
    return response.data
  },

  // Per-project GitHub settings (Automation Lead or Admin)
  async getProjectGithub(projectId: string): Promise<{ github_token_set: boolean; github_token_preview: string; github_repo_url: string }> {
    const response = await api.get(`/projects/${projectId}/github`)
    return response.data
  },

  async saveProjectGithub(projectId: string, payload: { github_token?: string; github_repo_url?: string }): Promise<{ github_token_set: boolean; github_token_preview: string; github_repo_url: string }> {
    const response = await api.patch(`/projects/${projectId}/github`, payload)
    return response.data
  },

  async testProjectGithub(projectId: string): Promise<{ ok: boolean; login?: string; name?: string; error?: string }> {
    const response = await api.post(`/projects/${projectId}/github/test`)
    return response.data
  },

  async disconnectProjectGithub(projectId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/github`)
  },

  async analyzeProjectRepo(projectId: string): Promise<{ frameworks: string[]; projects: { path: string; environments: string[] }[]; files_count: number }> {
    const response = await api.get(`/projects/${projectId}/github/analyze`)
    return response.data
  },

  async getProjectRepoTree(projectId: string, path = ''): Promise<GitHubTreeItem[]> {
    const response = await api.get(`/projects/${projectId}/github/tree`, { params: { path } })
    return response.data
  },

  errorMessage: extractErrorMessage,
}
