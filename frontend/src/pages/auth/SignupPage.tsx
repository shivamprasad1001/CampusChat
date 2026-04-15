import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Loader2 } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden p-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[var(--bg-base)]">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 80% 20%, rgba(139,92,246,0.12), transparent), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(91,154,255,0.08), transparent)',
            animation: 'gradient-shift 8s ease infinite',
            backgroundSize: '200% 200%',
          }}
        />
      </div>

      {/* Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-gradient-to-br from-purple-500 to-[var(--accent)] text-white shadow-[var(--shadow-lg),0_0_32px_rgba(139,92,246,0.2)]">
            <GraduationCap className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Create Account
          </h1>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Join CampusChat and connect with your campus
          </p>
        </div>

        <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-glass-heavy)] shadow-[var(--shadow-xl)] backdrop-blur-xl">
          <form onSubmit={handleSignup} className="space-y-5 p-6 sm:p-8">
            {error && (
              <div className="rounded-[var(--radius-sm)] border border-[var(--danger)]/20 bg-[var(--danger)]/8 px-4 py-3 text-[12px] text-[var(--danger)]">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                required
                className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-muted)] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Email
              </label>
              <input
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-muted)] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-muted)] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-gradient-to-r from-purple-500 to-[var(--accent)] font-semibold text-white shadow-[var(--shadow-sm),0_0_16px_rgba(139,92,246,0.15)] transition-all hover:shadow-[var(--shadow-md),0_0_24px_rgba(139,92,246,0.25)] active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

            <p className="text-center text-[12px] text-[var(--text-muted)]">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[var(--accent)] transition hover:text-[var(--accent-hover)]">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
