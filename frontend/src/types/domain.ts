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
