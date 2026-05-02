import axios from 'axios'
import type {
  Branch,
  ExecuteRunResponse,
  GitHubTreeItem,
  Project,
  TestRun,
  TestRunDetails,
  TestSuite,
  TokenResponse,
  UserResponse,
} from '@/types/domain'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
})

export function setAccessToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
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
    const body = new URLSearchParams()
    body.set('username', email)
    body.set('password', password)
    const response = await api.post<TokenResponse>('/auth/login', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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

  async executeRun(runId: string): Promise<ExecuteRunResponse> {
    const response = await api.post<ExecuteRunResponse>(`/runs/${runId}/execute`)
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

  async updateUser(userId: string, data: { email?: string; full_name?: string; role?: string; is_active?: boolean; password?: string }): Promise<UserResponse> {
    const response = await api.patch<UserResponse>(`/auth/users/${userId}`, data)
    return response.data
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

  async analyzeProjectRepo(projectId: string): Promise<{ frameworks: string[]; suites: string[]; files_count: number }> {
    const response = await api.get(`/projects/${projectId}/github/analyze`)
    return response.data
  },

  async getProjectRepoTree(projectId: string, path = ''): Promise<GitHubTreeItem[]> {
    const response = await api.get(`/projects/${projectId}/github/tree`, { params: { path } })
    return response.data
  },

  errorMessage: extractErrorMessage,
}
