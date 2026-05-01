import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, AlertCircle, GitBranch, Loader2, Terminal, Zap } from 'lucide-react'
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
    { icon: Terminal,      text: 'Live WebSocket log streaming' },
    { icon: Activity,      text: 'Pass rate & duration analytics' },
    { icon: Zap,           text: 'Automatic flaky test detection' },
    { icon: GitBranch,     text: 'Git integration & branch selection' },
  ]

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      {/* Left panel - branding */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/40 via-transparent to-indigo-950/40" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(34,211,238,0.08), transparent 50%), radial-gradient(circle at 70% 70%, rgba(99,102,241,0.06), transparent 50%)',
        }} />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md px-12"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">TestManager</span>
          </div>

          <h1 className="mt-10 text-4xl font-bold leading-tight text-white">
            Test infrastructure,
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              sub control.
            </span>
          </h1>

          <p className="mt-5 text-base leading-relaxed text-slate-400">
            Rulezi, monitorizezi și investighezi execuțiile de teste automate direct din browser.
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
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
                  <Icon size={16} className="text-cyan-400" />
                </div>
                <span className="text-sm text-slate-300">{text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center px-6 lg:max-w-lg lg:border-l lg:border-white/[0.04] lg:bg-[#0d0d14]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">TestManager</span>
          </div>

          <h2 className="text-2xl font-bold text-white">
            {mode === 'login' ? 'Bine ai revenit' : 'Creare cont'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {mode === 'login' ? 'Introdu datele de autentificare' : 'Completează pentru cont nou'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Nume complet</label>
                <input
                  className="form-input"
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Ion Popescu"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Email</label>
              <input
                className="form-input"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ion@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Parolă</label>
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
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {mode === 'login' ? 'Login' : 'Creare cont'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-sm text-slate-500 transition hover:text-cyan-400"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
            >
              {mode === 'login' ? 'Nu ai cont? Înregistrează-te' : 'Ai deja cont? Login'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
