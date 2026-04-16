import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GraduationCap, Loader2, Sparkles } from 'lucide-react'

export default function OnboardingPage() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    role: 'student',
    department: '',
    year: ''
  })

  // Success handler move to navigate('/') only after manual form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post('/profile/profile', {
        ...formData,
        year: parseInt(formData.year) || undefined
      })
      
      // Refresh the global auth profile so AppLayout sees the new data
      await refreshProfile()
      
      // After manual onboarding, go to the dashboard
      navigate('/')
    } catch (err) {
      console.error('Failed to save profile', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden p-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[var(--bg-base)]">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 10%, rgba(91,154,255,0.12), transparent), radial-gradient(ellipse 60% 50% at 50% 90%, rgba(52,211,153,0.06), transparent)',
            animation: 'gradient-shift 8s ease infinite',
            backgroundSize: '200% 200%',
          }}
        />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[480px]">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--accent)] to-emerald-500 text-white shadow-[var(--shadow-lg),0_0_32px_rgba(91,154,255,0.2)]">
            <Sparkles className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Complete Your Profile
          </h1>
          <p className="mt-1 text-center text-[13px] text-[var(--text-secondary)]">
            Tell us a bit about yourself to personalize your experience
          </p>
        </div>

        <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-glass-heavy)] shadow-[var(--shadow-xl)] backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Your full name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-muted)] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  Role
                </label>
                <Select 
                  onValueChange={(v: string) => setFormData({ ...formData, role: v })}
                  defaultValue={formData.role}
                >
                  <SelectTrigger className="h-11 rounded-[var(--radius-sm)] border-[var(--border-default)] bg-[var(--bg-elevated)] text-[13px]">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[var(--radius-md)] border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)]">
                    <SelectItem value="student" className="text-[13px]">Student</SelectItem>
                    <SelectItem value="professor" className="text-[13px]">Professor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  Academic Year
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2024"
                  value={formData.year}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, year: e.target.value })}
                  required
                  className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-muted)] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Department
              </label>
              <input
                type="text"
                placeholder="e.g. Computer Science"
                value={formData.department}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, department: e.target.value })}
                required
                className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-muted)] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-gradient-to-r from-[var(--accent)] to-emerald-500 font-semibold text-white shadow-[var(--shadow-sm),0_0_16px_rgba(91,154,255,0.15)] transition-all hover:shadow-[var(--shadow-md),0_0_24px_rgba(91,154,255,0.25)] active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
              {loading ? 'Setting up…' : 'Finish Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
