
import { useState } from 'react'
import { useGeminiAI } from '@/lib/ai/geminiAutoReplies'
import { 
  Bot, 
  Zap, 
  Sparkles, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  X
} from 'lucide-react'

interface AISettingsPanelProps {
  userId: string
  apiKey: string
  onClose?: () => void
}

export function AISettingsPanel({ userId, apiKey, onClose }: AISettingsPanelProps) {
  const {
    aiEnabled,
    setAiEnabled,
    currentModel,
    setCurrentModel,
    updatePreferences,
    getAvailableModels,
    error
  } = useGeminiAI(apiKey)

  const [settings, setSettings] = useState({
    personality: 'friendly',
    autoReplyDelay: 2,
    smartResponses: true,
    customPrompts: false
  })

  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  const models = getAvailableModels()

  const handleSave = () => {
    updatePreferences(userId, {
      enabled: aiEnabled,
      personality: settings.personality,
      autoReplyDelay: settings.autoReplyDelay,
      smartResponses: settings.smartResponses,
      model: currentModel
    })
    onClose?.()
  }

  const testConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    
    try {
      // Simple test prompt
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Say "Connection successful!"' }]
            }]
          })
        }
      )
      
      if (response.ok) {
        setTestResult('success')
      } else {
        setTestResult('error')
      }
    } catch (err) {
      setTestResult('error')
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-md bg-[var(--bg-elevated)] glass-panel border border-[var(--border-subtle)] rounded-[var(--radius-xl)] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-blue-500 flex items-center justify-center shadow-[var(--shadow-glow-sm)]">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">AI Auto-Replies</h3>
            <p className="text-xs text-[var(--text-secondary)]">Powered by Google Gemini</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-4 bg-[var(--bg-surface)]/50 rounded-xl border border-[var(--border-subtle)]">
        <div>
          <p className="font-medium text-[var(--text-primary)] text-sm">Enable AI Assistant</p>
          <p className="text-[11px] text-[var(--text-secondary)]">Automatically respond when you're away</p>
        </div>
        <button
          onClick={() => setAiEnabled(!aiEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
            aiEnabled ? 'bg-[var(--accent)] shadow-[var(--shadow-glow-sm)]' : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)]'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
              aiEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {aiEnabled && (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-500">
          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[var(--text-primary)] flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-yellow-500" />
              AI Model
            </label>
            <select
              value={currentModel}
              onChange={(e) => setCurrentModel(e.target.value as any)}
              className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all"
            >
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* Personality Selection */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              Personality
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'friendly', name: 'Friendly', emoji: '😊' },
                { id: 'professional', name: 'Professional', emoji: '💼' },
                { id: 'witty', name: 'Witty', emoji: '😏' },
                { id: 'supportive', name: 'Supportive', emoji: '🤗' }
              ].map(personality => (
                <button
                  key={personality.id}
                  onClick={() => setSettings(s => ({ ...s, personality: personality.id }))}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center ${
                    settings.personality === personality.id
                      ? 'border-[var(--accent)] bg-[var(--accent-muted)]'
                      : 'border-[var(--border-subtle)] hover:border-[var(--accent)]/30 hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <div className="text-xl mb-1">{personality.emoji}</div>
                  <div className="text-[12px] font-medium">{personality.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Response Delay */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[13px] font-medium text-[var(--text-primary)] flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Response Delay
              </label>
              <span className="text-[11px] font-bold text-[var(--accent)] px-2 py-0.5 bg-[var(--accent-muted)] rounded-full">
                {settings.autoReplyDelay}s
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={settings.autoReplyDelay}
              onChange={(e) => setSettings(s => ({ ...s, autoReplyDelay: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-[var(--bg-surface)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-medium">
              <span>Immediate</span>
              <span>Natural Delay</span>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="pt-2">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-[13px] text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">Smart Emoji Usage</span>
              <button
                onClick={() => setSettings(s => ({ ...s, smartResponses: !s.smartResponses }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.smartResponses ? 'bg-[var(--accent)]' : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)]'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    settings.smartResponses ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Test Connection */}
          <div className="pt-2">
            <button
              onClick={testConnection}
              disabled={isTesting}
              className="w-full px-4 py-2.5 text-xs bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg transition-all flex items-center justify-center gap-2 group"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
                  Verifying...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-[var(--accent)] group-hover:scale-110 transition-transform" />
                  Test Engine Status
                </>
              )}
            </button>
            
            {testResult && (
              <div className={`mt-2 p-2.5 rounded-lg flex items-center gap-2 text-[12px] animate-in zoom-in-95 ${
                testResult === 'success' 
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}>
                {testResult === 'success' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Engine ready. All systems green!
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    Connection failed. Verify API configuration.
                  </>
                )}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in shake">
              <p className="text-xs text-red-500 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="p-3 bg-[var(--accent-muted)] rounded-xl border border-[var(--accent)]/10">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="text-[11px] font-bold text-[var(--accent)] uppercase tracking-wider">AI Guardrails</span>
            </div>
            <ul className="space-y-1.5">
              {[
                "Only replies to mentions or questions",
                "Doesn't respond to your own messages",
                "Review & Edit before sending"
              ].map((item, i) => (
                <li key={i} className="text-[11px] text-[var(--text-secondary)] flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-white transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-5 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:shadow-[var(--shadow-glow-sm)] hover:scale-[1.02] active:scale-[0.98] transition-all font-medium"
        >
          Save Configuration
        </button>
      </div>
    </div>
  )
}
