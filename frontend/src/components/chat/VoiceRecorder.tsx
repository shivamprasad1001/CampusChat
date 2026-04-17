// components/chat/VoiceMessageRecorder.tsx
import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Play, Pause, Trash2, Send } from 'lucide-react'
import WaveSurfer from 'wavesurfer.js'

interface VoiceMessageRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void
  onCancel: () => void
}

export function VoiceMessageRecorder({ onSend, onCancel }: VoiceMessageRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const stream = useRef<MediaStream | null>(null)
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurfer = useRef<WaveSurfer | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Start recording
  const startRecording = async () => {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream.current)
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data)
        }
      }

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        
        // Initialize waveform
        if (waveformRef.current && !wavesurfer.current) {
          wavesurfer.current = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: 'var(--accent)',
            progressColor: 'white',
            cursorColor: 'transparent',
            barWidth: 2,
            barRadius: 3,
            height: 48,
            normalize: true,
          })
          
          wavesurfer.current.loadBlob(blob)
          wavesurfer.current.on('finish', () => setIsPlaying(false))
        }
      }

      mediaRecorder.current.start()
      setIsRecording(true)
      
      // Start timer
      const startTime = Date.now()
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  // Pause/Resume recording
  const togglePause = () => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.pause()
      setIsPaused(true)
      if (timerRef.current) clearInterval(timerRef.current)
    } else if (mediaRecorder.current?.state === 'paused') {
      mediaRecorder.current.resume()
      setIsPaused(false)
      
      const startTime = Date.now() - duration * 1000
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    }
  }

  // Stop recording
  const stopRecording = () => {
    mediaRecorder.current?.stop()
    stream.current?.getTracks().forEach(track => track.stop())
    setIsRecording(false)
    setIsPaused(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  // Play/Pause preview
  const togglePlayback = () => {
    if (wavesurfer.current) {
      if (isPlaying) {
        wavesurfer.current.pause()
      } else {
        wavesurfer.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Send voice message
  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob, duration)
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      stream.current?.getTracks().forEach(track => track.stop())
      wavesurfer.current?.destroy()
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-[var(--bg-elevated)] rounded-2xl p-4 shadow-xl border border-[var(--border-subtle)]">
      {!audioBlob ? (
        // Recording UI
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isRecording ? 'bg-red-500/20' : 'bg-[var(--bg-surface)]'
              }`}>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)]'
                  }`}
                >
                  {isRecording ? (
                    <Square className="w-4 h-4 text-white" />
                  ) : (
                    <Mic className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
              
              {isRecording && (
                <div className="absolute -top-1 -right-1">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1">
              {isRecording ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-[var(--text-primary)]">
                    {formatTime(duration)}
                  </span>
                  <div className="flex-1 h-1 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--accent)] transition-all duration-1000"
                      style={{ width: `${Math.min((duration / 60) * 100, 100)}%` }}
                    />
                  </div>
                  <button
                    onClick={togglePause}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition"
                  >
                    {isPaused ? (
                      <Play className="w-4 h-4 text-[var(--text-secondary)]" />
                    ) : (
                      <Pause className="w-4 h-4 text-[var(--text-secondary)]" />
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">
                  Click the mic to start recording
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition"
          >
            <Trash2 className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>
      ) : (
        // Preview UI
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayback}
              className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center hover:bg-[var(--accent-hover)] transition"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" />
              )}
            </button>
            
            <div ref={waveformRef} className="flex-1" />
            
            <span className="text-sm font-mono text-[var(--text-secondary)]">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setAudioBlob(null)
                setDuration(0)
                audioChunks.current = []
                wavesurfer.current?.destroy()
                wavesurfer.current = null
              }}
              className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            >
              Record Again
            </button>
            <button
              onClick={handleSend}
              className="px-4 py-1.5 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent-hover)] transition flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Voice Message Player Component (for displaying sent voice messages)
export function VoiceMessagePlayer({ 
  audioUrl, 
  duration 
}: { 
  audioUrl: string
  duration: number 
}) {
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurfer = useRef<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'rgba(255, 255, 255, 0.4)',
        progressColor: 'white',
        cursorColor: 'transparent',
        barWidth: 2,
        barRadius: 3,
        height: 40,
        normalize: true,
      })

      wavesurfer.current.load(audioUrl)
      
      wavesurfer.current.on('audioprocess', () => {
        setCurrentTime(wavesurfer.current?.getCurrentTime() || 0)
      })
      
      wavesurfer.current.on('finish', () => {
        setIsPlaying(false)
        setCurrentTime(0)
      })

      return () => wavesurfer.current?.destroy()
    }
  }, [audioUrl])

  const togglePlayback = () => {
    if (wavesurfer.current) {
      if (isPlaying) {
        wavesurfer.current.pause()
      } else {
        wavesurfer.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-3 min-w-[200px] max-w-[300px]">
      <button
        onClick={togglePlayback}
        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 text-white" />
        ) : (
          <Play className="w-3.5 h-3.5 text-white ml-0.5" />
        )}
      </button>
      
      <div className="flex-1">
        <div ref={waveformRef} className="w-full" />
      </div>
      
      <span className="text-xs text-white/60 font-mono">
        {formatTime(isPlaying ? currentTime : duration)}
      </span>
    </div>
  )
}