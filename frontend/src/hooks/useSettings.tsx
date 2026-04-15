import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type FontSize = 'small' | 'default' | 'large'
export type MessageDensity = 'compact' | 'cozy' | 'spacious'

interface SettingsContextValue {
  fontSize: FontSize
  setFontSize: (size: FontSize) => void
  messageDensity: MessageDensity
  setMessageDensity: (density: MessageDensity) => void
  notificationSound: boolean
  setNotificationSound: (enabled: boolean) => void
}

const STORAGE_KEY = 'campuschat-settings'

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Partial<SettingsContextValue>
  } catch {
    // ignore parse errors
  }
  return {}
}

function saveSettings(settings: Record<string, unknown>) {
  try {
    const existing = loadSettings()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...settings }))
  } catch {
    // ignore storage errors
  }
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const saved = useMemo(loadSettings, [])
  
  const [fontSize, setFontSizeState] = useState<FontSize>(
    (saved.fontSize as FontSize) || 'default'
  )
  const [messageDensity, setMessageDensityState] = useState<MessageDensity>(
    (saved.messageDensity as MessageDensity) || 'cozy'
  )
  const [notificationSound, setNotificationSoundState] = useState(
    saved.notificationSound !== false // default true
  )

  // Sync to localStorage
  const setFontSize = (size: FontSize) => {
    setFontSizeState(size)
    saveSettings({ fontSize: size })
  }

  const setMessageDensity = (density: MessageDensity) => {
    setMessageDensityState(density)
    saveSettings({ messageDensity: density })
  }

  const setNotificationSound = (enabled: boolean) => {
    setNotificationSoundState(enabled)
    saveSettings({ notificationSound: enabled })
  }

  // Apply CSS classes to body
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('font-size-small', 'font-size-large')
    if (fontSize !== 'default') {
      root.classList.add(`font-size-${fontSize}`)
    }
  }, [fontSize])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('density-compact', 'density-spacious')
    if (messageDensity !== 'cozy') {
      root.classList.add(`density-${messageDensity}`)
    }
  }, [messageDensity])

  const value = useMemo(
    () => ({
      fontSize,
      setFontSize,
      messageDensity,
      setMessageDensity,
      notificationSound,
      setNotificationSound,
    }),
    [fontSize, messageDensity, notificationSound]
  )

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
