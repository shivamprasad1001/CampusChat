import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSettings, type FontSize, type MessageDensity } from '@/hooks/useSettings'
import api from '@/lib/api'
import {
  User,
  Palette,
  Bell,
  Info,
  X,
  Camera,
  Check,
  ChevronRight,
} from 'lucide-react'

interface UserSettingsModalProps {
  open: boolean
  onClose: () => void
}

type SettingsTab = 'account' | 'appearance' | 'notifications' | 'about'

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'account', label: 'My Account', icon: <User className="h-4 w-4" /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  { id: 'about', label: 'About', icon: <Info className="h-4 w-4" /> },
]

export default function UserSettingsModal({ open, onClose }: UserSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const switchTab = (tab: SettingsTab) => {
    setActiveTab(tab)
    setMobileNavOpen(false)
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ animation: 'overlay-enter 200ms var(--ease-out)' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 flex h-[min(92vh,720px)] w-[min(96vw,960px)] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-xl)]"
        style={{ animation: 'modal-enter 300ms var(--ease-spring)' }}
      >
        {/* Sidebar Nav — Desktop */}
        <nav className="hidden w-[220px] shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-base)] p-4 md:flex">
          <h2 className="mb-4 px-2 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
            Settings
          </h2>
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-[13px] font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[var(--accent-muted)] text-[var(--accent)] shadow-[var(--shadow-xs)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Mobile Nav — Top bar */}
        <div className="absolute inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 md:hidden">
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)]"
          >
            {tabs.find(t => t.id === activeTab)?.icon}
            {tabs.find(t => t.id === activeTab)?.label}
            <ChevronRight className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform ${mobileNavOpen ? 'rotate-90' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileNavOpen && (
          <div className="absolute inset-x-0 top-14 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2 shadow-[var(--shadow-md)] md:hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-[13px] font-medium ${
                  activeTab === tab.id
                    ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto pt-14 md:pt-0">
          {/* Desktop close button */}
          <div className="hidden items-center justify-end p-4 md:flex">
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              aria-label="Close settings"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 px-6 pb-8 md:px-10">
            {activeTab === 'account' && <AccountSection />}
            {activeTab === 'appearance' && <AppearanceSection />}
            {activeTab === 'notifications' && <NotificationsSection />}
            {activeTab === 'about' && <AboutSection />}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Account Section ─── */
function AccountSection() {
  const { user, profile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: profile?.name || '',
    department: profile?.department || '',
    year: String(profile?.year || ''),
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post('/profile/profile', {
        name: form.name,
        department: form.department,
        year: parseInt(form.year) || undefined,
        role: profile?.role || 'student',
      })
      setSaved(true)
      setTimeout(() => { setSaved(false); setEditing(false) }, 1500)
    } catch (err) {
      console.error('Failed to update profile:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">My Account</h3>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Manage your profile and personal info</p>
      </div>

      {/* Profile Card */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-[var(--accent)] via-indigo-500 to-purple-600 opacity-80" />

        {/* Profile Info */}
        <div className="relative px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            <div className="relative">
              <div
                className="flex h-[72px] w-[72px] items-center justify-center rounded-[var(--radius-lg)] border-[3px] border-[var(--bg-surface)] text-2xl font-bold text-white shadow-[var(--shadow-md)]"
                style={{ background: `linear-gradient(135deg, var(--accent), #8b5cf6)` }}
              >
                {profile?.name?.substring(0, 2).toUpperCase() || '??'}
              </div>
              <button className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
                <Camera className="h-3 w-3" />
              </button>
            </div>
            <div className="mb-1 min-w-0 flex-1">
              <h4 className="truncate text-[17px] font-bold text-[var(--text-primary)]">{profile?.name || 'User'}</h4>
              <p className="truncate text-[12px] text-[var(--text-secondary)]">{user?.email}</p>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="mb-1 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-default)] px-4 py-2 text-[12px] font-semibold text-[var(--text-primary)] shadow-[var(--shadow-xs)] hover:bg-[var(--bg-hover)] transition"
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* Info Fields */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <InfoField label="Display Name" value={form.name} editing={editing} onChange={(v) => setForm(p => ({ ...p, name: v }))} />
            <InfoField label="Email" value={user?.email || ''} editing={false} />
            <InfoField label="Role" value={profile?.role || 'student'} editing={false} badge />
            <InfoField label="Department" value={form.department} editing={editing} onChange={(v) => setForm(p => ({ ...p, department: v }))} />
            <InfoField label="Year" value={form.year} editing={editing} onChange={(v) => setForm(p => ({ ...p, year: v }))} />
          </div>

          {editing && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--accent)] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--accent-hover)] active:scale-[0.97] disabled:opacity-60"
              >
                {saved ? <Check className="h-4 w-4" /> : null}
                {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoField({ label, value, editing, onChange, badge }: {
  label: string
  value: string
  editing: boolean
  onChange?: (value: string) => void
  badge?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">{label}</label>
      {editing && onChange ? (
        <input
          type="text"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          className="h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
        />
      ) : badge ? (
        <span className="inline-flex rounded-full bg-[var(--accent-muted)] px-3 py-1 text-[12px] font-semibold capitalize text-[var(--accent)]">
          {value}
        </span>
      ) : (
        <p className="rounded-[var(--radius-sm)] border border-transparent bg-[var(--bg-elevated)] px-3 py-2.5 text-[13px] text-[var(--text-primary)]">
          {value || '—'}
        </p>
      )}
    </div>
  )
}

/* ─── Appearance Section ─── */
function AppearanceSection() {
  const { fontSize, setFontSize, messageDensity, setMessageDensity } = useSettings()

  const fontSizes: { value: FontSize; label: string }[] = [
    { value: 'small', label: 'Small' },
    { value: 'default', label: 'Default' },
    { value: 'large', label: 'Large' },
  ]

  const densities: { value: MessageDensity; label: string; desc: string }[] = [
    { value: 'compact', label: 'Compact', desc: 'More messages, less spacing' },
    { value: 'cozy', label: 'Cozy', desc: 'Balanced view' },
    { value: 'spacious', label: 'Spacious', desc: 'Relaxed, airy layout' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">Appearance</h3>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Customize how CampusChat looks for you</p>
      </div>

      {/* Font Size */}
      <div className="space-y-3">
        <label className="block text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Font Size</label>
        <div className="flex gap-2">
          {fontSizes.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFontSize(value)}
              className={`flex-1 rounded-[var(--radius-sm)] border px-4 py-3 text-center text-[13px] font-semibold transition ${
                fontSize === value
                  ? 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)] shadow-[var(--shadow-glow)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Density */}
      <div className="space-y-3">
        <label className="block text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Message Density</label>
        <div className="space-y-2">
          {densities.map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => setMessageDensity(value)}
              className={`flex w-full items-center gap-4 rounded-[var(--radius-md)] border px-4 py-3.5 text-left transition ${
                messageDensity === value
                  ? 'border-[var(--accent)] bg-[var(--accent-muted)] shadow-[var(--shadow-glow)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-default)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                messageDensity === value ? 'border-[var(--accent)]' : 'border-[var(--border-strong)]'
              }`}>
                {messageDensity === value && (
                  <div className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                )}
              </div>
              <div>
                <p className={`text-[13px] font-semibold ${messageDensity === value ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>{label}</p>
                <p className="text-[11px] text-[var(--text-muted)]">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-3">
        <label className="block text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Preview</label>
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-base)]">
          <div className="p-[var(--density-padding)] space-y-[var(--density-gap)]">
            <div className="flex items-start gap-3">
              <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600" />
              <div>
                <span className="text-[12px] font-semibold text-[var(--text-primary)]">Alice</span>
                <p className="text-[var(--msg-font-size)] text-[var(--text-primary)]">Hey, how's the project going?</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600" />
              <div>
                <span className="text-[12px] font-semibold text-[var(--text-primary)]">Bob</span>
                <p className="text-[var(--msg-font-size)] text-[var(--text-primary)]">Almost done! Just fixing the last bug 🐛</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Notifications Section ─── */
function NotificationsSection() {
  const { notificationSound, setNotificationSound } = useSettings()

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">Notifications</h3>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Control how you receive alerts</p>
      </div>

      <div className="space-y-4">
        <ToggleRow
          label="Message Sounds"
          description="Play a sound when new messages arrive"
          checked={notificationSound}
          onChange={setNotificationSound}
        />
      </div>
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-4">
      <div>
        <p className="text-[13px] font-semibold text-[var(--text-primary)]">{label}</p>
        <p className="text-[11px] text-[var(--text-muted)]">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-[var(--accent)]' : 'bg-[var(--bg-hover)] border border-[var(--border-default)]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

/* ─── About Section ─── */
function AboutSection() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">About CampusChat</h3>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Information about this application</p>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
        <div className="flex items-center gap-4 border-b border-[var(--border-subtle)] px-5 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--accent)] to-indigo-600 text-white shadow-[var(--shadow-md)]">
            <span className="text-xl font-bold">C</span>
          </div>
          <div>
            <h4 className="text-[15px] font-bold text-[var(--text-primary)]">CampusChat</h4>
            <p className="text-[12px] text-[var(--text-secondary)]">Academic Collaboration Platform</p>
          </div>
        </div>

        <div className="space-y-0 divide-y divide-[var(--border-subtle)]">
          <AboutRow label="Version" value="1.0.0" />
          <AboutRow label="Frontend" value="React + Vite + TypeScript" />
          <AboutRow label="Backend" value="Express + Socket.IO" />
          <AboutRow label="Database" value="Supabase (PostgreSQL)" />
          <AboutRow label="Hosting" value="Vercel + Render" />
        </div>
      </div>
    </div>
  )
}

function AboutRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-[13px] text-[var(--text-secondary)]">{label}</span>
      <span className="text-[13px] font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  )
}
