export type UserRole = 'admin' | 'automation_lead' | 'automation_user' | 'viewer'

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  automation_lead: 'Automation Lead',
  automation_user: 'Automation User',
  viewer: 'Viewer',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  automation_lead: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  automation_user: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  viewer: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
}

/** Roles allowed to access each route. Absence = all authenticated users. */
export const ROUTE_ROLES: Record<string, UserRole[]> = {
  '/jira-projects': ['admin', 'automation_lead', 'automation_user', 'viewer'],
  '/projects': ['admin', 'automation_lead', 'automation_user', 'viewer'],
  '/runs':     ['admin', 'automation_lead', 'automation_user', 'viewer'],
  '/analytics':['admin', 'automation_lead', 'automation_user', 'viewer'],
  '/users':    ['admin', 'automation_lead'],
  '/settings': ['admin', 'automation_lead', 'automation_user', 'viewer'],
}

export function canAccess(role: UserRole | string | undefined, path: string): boolean {
  const allowed = ROUTE_ROLES[path]
  if (!allowed) return true           // dashboard and other open pages
  const normalizedRole = role === 'developer' ? 'automation_user' : role
  return allowed.includes(normalizedRole as UserRole)
}

export type RunStatus =
  | 'pending'
  | 'running'
  | 'passed'
  | 'failed'
  | 'error'
  | 'skipped'
  | 'cancelled'

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type?: string
}

export interface UserResponse {
  id: string
  email: string
  full_name: string | null
  role: string
  assigned_lead_id?: string | null
  assigned_lead_name?: string | null
  is_active: boolean
  created_at: string
}

export interface ProjectNotificationsConfig {
  email_enabled?: boolean
  email_recipients?: string[]
  notify_on_failed?: boolean
  notify_on_error?: boolean
  slack_enabled?: boolean
  slack_webhook_url?: string
}

export interface ProjectConfig {
  notifications?: ProjectNotificationsConfig
  [key: string]: unknown
}

export interface Project {
  id: string
  name: string
  description: string | null
  git_repo_url: string
  git_provider: string
  default_branch: string
  framework: string | null
  config_json: ProjectConfig | null
  created_at: string
}

export interface GitHubTreeItem {
  name: string
  path: string
  type: 'file' | 'dir'
  size?: number
  sha: string
  download_url?: string | null
}

export interface JiraProject {
  id: string
  key: string
  name: string
  project_type?: string | null
}

export interface TestSuite {
  id: string
  project_id: string
  name: string
  tags: string[] | null
  cron_expression: string | null
  active: boolean
  created_at: string
}

export interface TestRun {
  id: string
  suite_id: string
  status: RunStatus
  branch: string | null
  commit_sha: string | null
  triggered_by: string | null
  started_at: string | null
  finished_at: string | null
  total_tests: number
  passed_tests: number
  failed_tests: number
  skipped_tests: number
  created_at: string
}

export interface TestResult {
  id: string
  run_id: string
  test_name: string
  class_name: string | null
  status: RunStatus
  duration_ms: number | null
  error_message: string | null
  stack_trace: string | null
}

export interface TestRunDetails extends TestRun {
  results: TestResult[]
}

export interface Branch {
  name: string
  commit_sha: string
  is_default: boolean
}

export interface Tag {
  name: string
  commit_sha: string
}

export interface ExecuteRunResponse {
  status: string
  run_id: string
  task_id: string
  message: string
}

export interface WsRunMessage {
  type: string
  data?: string
  status?: string
  timestamp?: string
}
