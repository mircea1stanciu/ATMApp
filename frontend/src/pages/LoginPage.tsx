import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, AlertCircle, GitBranch, Loader2, Moon, Sun, Terminal, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiService } from '@/services/api'
import { useAppStore } from '@/store/useAppStore'

type AuthMode = 'login' | 'register'

export default function LoginPage() {
  const authenticate = useAppStore(s => s.authenticate)
  const navigate = useNavigate()

  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark') ||
    localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )

  const toggleDark = () => {
    setIsDark(d => {
      const next = !d
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('theme', next ? 'dark' : 'light')
      return next
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = mode === 'login'
        ? await apiService.login(email, password)
        : await apiService.register(email, password, fullName)
      authenticate(response.access_token)
      navigate('/')
    } catch (err) {
      setError(apiService.errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: Terminal,   text: 'Live WebSocket log streaming' },
    { icon: Activity,   text: 'Pass rate & duration analytics' },
    { icon: Zap,        text: 'Automatic flaky test detection' },
    { icon: GitBranch,  text: 'Git integration & branch selection' },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left panel - branding */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden lg:flex bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 30% 50%, white, transparent 50%), radial-gradient(circle at 70% 70%, white, transparent 50%)',
        }} />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md px-12"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">AutomationTestManager (ATM)</span>
          </div>

          <h1 className="mt-10 text-3xl font-bold leading-tight text-white">
            Test infrastructure <span className="text-blue-200">under control.</span>
          </h1>

          <p className="mt-5 text-base leading-relaxed text-blue-100">
            Run, monitor and investigate automated test executions directly from your browser.
          </p>

          <div className="mt-10 space-y-4">
            {features.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <Icon size={16} className="text-white" />
                </div>
                <span className="text-sm text-blue-50">{text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel - form */}
      <div className="relative flex flex-1 items-center justify-center px-6 lg:max-w-lg lg:border-l lg:border-gray-200 dark:lg:border-gray-700 bg-white dark:bg-gray-900">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          title="Toggle theme"
          className="absolute top-4 right-4 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">AutomationTestManager (ATM)</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {mode === 'login' ? 'Sign in to your account' : 'Fill in your details to get started'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Full name</label>
                <input
                  className="form-input"
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Email</label>
              <input
                className="form-input"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Password</label>
              <input
                className="form-input"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-2.5 text-sm text-red-600 dark:text-red-400">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-sm text-gray-500 dark:text-gray-400 transition hover:text-blue-600 dark:hover:text-blue-400"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
