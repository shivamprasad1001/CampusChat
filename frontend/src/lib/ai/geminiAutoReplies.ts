
import { Message } from '@/types'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { useState, useRef, useEffect, useCallback } from 'react'

// Available Gemini models (as of 2024)
export const GEMINI_MODELS = {
  'gemini-1.5-flash': 'gemini-1.5-flash', // Latest fast model
  'gemini-1.5-pro': 'gemini-1.5-pro',     // More capable model
  'gemini-1.0-pro': 'gemini-1.0-pro',     // Legacy stable model
  'gemini-pro': 'gemini-pro'               // Original pro model
} as const

export type GeminiModel = keyof typeof GEMINI_MODELS

export interface AIPersonality {
  name: string
  tone: 'professional' | 'casual' | 'humorous' | 'supportive'
  responseStyle: 'concise' | 'detailed'
  temperature: number
  customPrompt?: string
}

export class GeminiAIReplyEngine {
  private genAI: GoogleGenerativeAI
  private model: any
  private currentModel: GeminiModel = 'gemini-1.5-flash'
  private contextWindow: Message[] = []
  private personalities: Map<string, AIPersonality> = new Map()
  private userPreferences: Map<string, {
    enabled: boolean
    personality: string
    autoReplyDelay: number
    smartResponses: boolean
    model: GeminiModel
  }> = new Map()

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.initializeModel()
    this.initializePersonalities()
  }

  private initializeModel(model: GeminiModel = 'gemini-1.5-flash') {
    this.model = this.genAI.getGenerativeModel({ 
      model: GEMINI_MODELS[model],
      // Safety settings to prevent harmful content
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ],
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7,
        topP: 0.8,
        topK: 40
      }
    })
  }

  private initializePersonalities() {
    this.personalities.set('professional', {
      name: 'Alex',
      tone: 'professional',
      responseStyle: 'concise',
      temperature: 0.5,
      customPrompt: `You are a professional assistant named Alex. 
        Be clear, concise, and helpful. 
        Maintain professional tone while being friendly.
        Use proper grammar and avoid slang.`
    })

    this.personalities.set('friendly', {
      name: 'Sam',
      tone: 'casual',
      responseStyle: 'detailed',
      temperature: 0.8,
      customPrompt: `You are a friendly chat companion named Sam. 
        Be warm, engaging, and conversational.
        Use casual language and occasional emojis.
        Make the conversation feel natural and personal.`
    })

    this.personalities.set('witty', {
      name: 'Max',
      tone: 'humorous',
      responseStyle: 'concise',
      temperature: 0.95,
      customPrompt: `You are a witty AI named Max with a great sense of humor. 
        Be clever, entertaining, and occasionally sarcastic.
        Use wordplay and light humor.
        Keep responses snappy and fun.`
    })

    this.personalities.set('supportive', {
      name: 'Emma',
      tone: 'supportive',
      responseStyle: 'detailed',
      temperature: 0.7,
      customPrompt: `You are a supportive companion named Emma. 
        Be empathetic, encouraging, and understanding.
        Offer validation and positive reinforcement.
        Help users feel heard and supported.`
    })
  }

  // Smart response generation with context
  async generateSmartReply(
    messages: Message[],
    userId: string,
    personalityId: string = 'friendly'
  ): Promise<string | null> {
    const preferences = this.userPreferences.get(userId)
    // If no explicit preferences found, we check if generic AI is enabled via hook state
    // but the engine itself should be allowed to run if called with a personality.

    // Switch model if user has preference
    if (preferences && preferences.model !== this.currentModel) {
      this.currentModel = preferences.model
      this.initializeModel(preferences.model)
    }

    const personality = this.personalities.get(personalityId) || this.personalities.get('friendly')!
    
    // Analyze conversation context
    const context = this.analyzeContext(messages)
    
    // Build prompt with personality and context
    const prompt = this.buildPrompt(messages, personality, context)
    
    try {
      // Update generation config for personality
      const chat = this.model.startChat({
        history: this.buildChatHistory(messages.slice(-5)),
        generationConfig: {
          maxOutputTokens: personality.responseStyle === 'concise' ? 100 : 200,
          temperature: personality.temperature,
        }
      })

      const result = await chat.sendMessage(prompt)
      const response = result.response
      return response.text()

    } catch (error) {
      console.error('Gemini AI reply generation failed:', error)
      
      // Fallback to simpler model if current fails
      if (this.currentModel !== 'gemini-1.0-pro') {
        console.log('Falling back to gemini-1.0-pro...')
        this.initializeModel('gemini-1.0-pro')
        return this.generateSmartReply(messages, userId, personalityId)
      }
      
      return this.getFallbackResponse(context, personality)
    }
  }

  // Generate quick reply suggestions
  async generateQuickReplies(messages: Message[]): Promise<string[]> {
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage?.content) return this.getDefaultQuickReplies()

    try {
      const prompt = `
        Based on this message: "${lastMessage.content}"
        Generate 3 very short, natural quick replies (max 3 words each).
        Return ONLY a JSON array of strings. No explanation.
        Example: ["Sounds good!", "Tell me more", "Got it 👍"]
      `

      const result = await this.model.generateContent(prompt)
      const response = result.response
      const text = response.text()
      
      // Parse JSON from response
      const jsonMatch = text.match(/\[.*\]/s)
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0])
        } catch {
          return this.getDefaultQuickReplies()
        }
      }
      
      return this.getDefaultQuickReplies()
    } catch (error) {
      console.error('Quick replies generation failed:', error)
      return this.getDefaultQuickReplies()
    }
  }

  // Summarize long conversations
  async generateConversationSummary(messages: Message[]): Promise<string> {
    if (messages.length === 0) return 'No conversation to summarize.'
    try {
      const conversation = messages.map(msg => 
        `${msg.profiles?.name || 'User'}: ${msg.content}`
      ).join('\n')

      const prompt = `
        Summarize this conversation in 2-3 sentences:
        ${conversation}
        
        Focus on key points and decisions made.
      `

      const result = await this.model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error('Summary generation failed:', error)
      return 'Unable to generate summary at this time.'
    }
  }

  // Detect message sentiment and intent
  async analyzeMessageIntent(message: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative'
    intent: 'question' | 'statement' | 'greeting' | 'request' | 'gratitude' | 'other'
    urgency: 'low' | 'medium' | 'high'
  }> {
    try {
      const prompt = `
        Analyze this message: "${message}"
        Return ONLY a JSON object with:
        - sentiment: "positive", "neutral", or "negative"
        - intent: "question", "statement", "greeting", "request", "gratitude", or "other"
        - urgency: "low", "medium", or "high"
        
        Example: {"sentiment":"positive","intent":"greeting","urgency":"low"}
      `

      const result = await this.model.generateContent(prompt)
      const text = result.response.text()
      const jsonMatch = text.match(/\{.*\}/s)
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('Intent analysis failed:', error)
    }

    return {
      sentiment: 'neutral',
      intent: 'statement',
      urgency: 'low'
    }
  }

  // Check if AI should respond
  shouldAutoReply(message: Message, userId: string): boolean {
    const preferences = this.userPreferences.get(userId)
    if (preferences && !preferences.enabled) return false

    // Don't reply to own messages
    if (message.sender_id === userId) return false

    // Don't reply if message is very old (> 5 minutes)
    const messageAge = Date.now() - new Date(message.created_at).getTime()
    if (messageAge > 5 * 60 * 1000) return false

    const content = message.content?.toLowerCase() || ''
    
    // Check for direct mentions or questions
    const triggers = [
      /^(hey|hi|hello|yo|sup)/i,
      /\?$/,
      /^(thanks|thank you|thx)/i,
      /^(how are you|how's it going|what's up|howdy)/i,
      /@ai|@bot|@assistant/i,
      /help|assist|support/i,
      /can you|could you|would you/i,
      /tell me|explain|what is|who is/i
    ]

    return triggers.some(pattern => pattern.test(content))
  }

  // Simulate typing with variable speeds
  async simulateTyping(messageLength: number = 50): Promise<void> {
    // Average typing speed: 200-300 characters per minute
    const typingSpeed = 250 // chars per minute
    const delay = Math.min(
      Math.max((messageLength / typingSpeed) * 60000, 1500),
      5000
    )
    
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  // Update user preferences
  setUserPreferences(userId: string, preferences: Partial<{
    enabled: boolean
    personality: string
    autoReplyDelay: number
    smartResponses: boolean
    model: GeminiModel
  }>) {
    const current = this.userPreferences.get(userId) || {
      enabled: false,
      personality: 'friendly',
      autoReplyDelay: 2,
      smartResponses: true,
      model: 'gemini-1.5-flash' as GeminiModel
    }

    this.userPreferences.set(userId, { ...current, ...preferences })
  }

  // Get available models for UI
  getAvailableModels() {
    return [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast, efficient responses' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'More capable, nuanced responses' },
      { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', description: 'Stable legacy model' }
    ]
  }

  private buildChatHistory(messages: Message[]) {
    return messages.map(msg => ({
      role: msg.sender_id === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content || '' }]
    }))
  }

  private analyzeContext(messages: Message[]) {
    const recentMessages = messages.slice(-10)
    const hour = new Date().getHours()
    
    // Enhanced sentiment analysis
    const sentimentMap = {
      positive: ['great', 'awesome', 'love', 'happy', 'excited', 'thanks', 'wonderful', 'fantastic', 'amazing'],
      negative: ['sad', 'angry', 'frustrated', 'bad', 'terrible', 'sorry', 'upset', 'disappointed', 'annoyed']
    }
    
    let sentimentScore = 0
    const topics = new Set<string>()
    
    recentMessages.forEach(msg => {
      if (msg.content) {
        const lower = msg.content.toLowerCase()
        
        sentimentMap.positive.forEach(word => {
          if (lower.includes(word)) sentimentScore++
        })
        
        sentimentMap.negative.forEach(word => {
          if (lower.includes(word)) sentimentScore--
        })
        
        // Extract potential topics (simple approach)
        const words = lower.split(/\s+/)
        words.forEach(word => {
          if (word.length > 4 && !sentimentMap.positive.includes(word) && !sentimentMap.negative.includes(word)) {
            topics.add(word)
          }
        })
      }
    })

    return {
      timeOfDay: hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening',
      mood: sentimentScore > 2 ? 'positive' : sentimentScore < -2 ? 'negative' : 'neutral',
      sentiment: sentimentScore > 2 ? 'positive' : sentimentScore < -2 ? 'negative' : 'neutral',
      sentimentScore,
      topics: Array.from(topics).slice(0, 5),
      messageCount: recentMessages.length
    }
  }

  private buildPrompt(
    messages: Message[], 
    personality: AIPersonality, 
    context: any
  ): string {
    const recentMessages = messages.slice(-3).map(msg => 
      `${msg.profiles?.name || 'User'}: ${msg.content}`
    ).join('\n')

    const timeContext = context.timeOfDay === 'morning' 
      ? 'It\'s morning, keep energy appropriate' 
      : context.timeOfDay === 'evening' 
        ? 'It\'s evening, be slightly more relaxed' 
        : ''

    return `
      ${personality.customPrompt}
      
      Current context:
      - Time: ${context.timeOfDay}
      - Conversation mood: ${context.mood}
      - ${timeContext}
      
      Recent messages:
      ${recentMessages}
      
      You are ${personality.name}. Respond naturally to continue the conversation.
      ${personality.responseStyle === 'concise' ? 'Keep it brief, under 2 sentences.' : 'Feel free to elaborate a bit.'}
      
      Response:
    `
  }

  private getFallbackResponse(context: any, personality: AIPersonality): string {
    const timeGreeting = context.timeOfDay === 'morning' 
      ? 'Good morning' 
      : context.timeOfDay === 'evening' 
        ? 'Good evening' 
        : 'Hi there'
    
    const fallbacks: Record<string, string[]> = {
      professional: [`${timeGreeting}! How can I assist you today?`],
      friendly: [`${timeGreeting}! 👋 What's on your mind?`],
      witty: [`${timeGreeting}! I'm here and slightly caffeinated ☕`],
      supportive: [`${timeGreeting}! I'm here if you need to talk 💙`]
    }

    const options = fallbacks[personality.tone] || fallbacks.friendly
    return options[Math.floor(Math.random() * options.length)]
  }

  private getDefaultQuickReplies(): string[] {
    const defaults = [
      ['Sounds good!', 'Tell me more', '👍'],
      ['Got it!', 'Thanks!', 'Cool'],
      ['Nice!', 'Interesting', 'Okay'],
      ['Sure thing!', 'No problem', 'Great']
    ]
    
    return defaults[Math.floor(Math.random() * defaults.length)]
  }
}

// React Hook for Gemini AI Auto-Replies
export function useGeminiAI(apiKey: string) {
  const aiEngine = useRef<GeminiAIReplyEngine | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [quickReplies, setQuickReplies] = useState<string[]>([])
  const [aiEnabled, setAiEnabled] = useState(false)
  const [currentModel, setCurrentModel] = useState<GeminiModel>('gemini-1.5-flash')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (apiKey) {
      try {
        aiEngine.current = new GeminiAIReplyEngine(apiKey)
        setError(null)
      } catch (err) {
        setError('Failed to initialize AI. Please check your API key.')
        console.error('AI initialization error:', err)
      }
    }
  }, [apiKey])

  const processIncomingMessage = useCallback(async (
    messages: Message[],
    userId: string,
    onAIReply: (reply: string) => void
  ) => {
    if (!aiEngine.current || !aiEnabled) return

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage) return

    try {
      // Generate quick replies
      const replies = await aiEngine.current.generateQuickReplies(messages)
      setQuickReplies(replies)

      // Check if AI should auto-reply
      if (aiEngine.current.shouldAutoReply(lastMessage, userId)) {
        setIsTyping(true)
        
        // Simulate typing delay based on response length
        await aiEngine.current.simulateTyping()
        
        const reply = await aiEngine.current.generateSmartReply(messages, userId)
        
        setIsTyping(false)
        
        if (reply) {
          onAIReply(reply)
        }
      }
    } catch (err) {
      console.error('Error processing message:', err)
      setIsTyping(false)
      setError('Failed to generate response. Please try again.')
    }
  }, [aiEnabled])

  const analyzeMessage = useCallback(async (message: string) => {
    if (!aiEngine.current) return null
    return await aiEngine.current.analyzeMessageIntent(message)
  }, [])

  const generateSummary = useCallback(async (messages: Message[]) => {
    if (!aiEngine.current) return null
    return await aiEngine.current.generateConversationSummary(messages)
  }, [])

  const updatePreferences = useCallback((
    userId: string, 
    preferences: Partial<{
      enabled: boolean
      personality: string
      autoReplyDelay: number
      smartResponses: boolean
      model: GeminiModel
    }>
  ) => {
    aiEngine.current?.setUserPreferences(userId, preferences)
  }, [])

  const getAvailableModels = useCallback(() => {
    return aiEngine.current?.getAvailableModels() || []
  }, [])

  return {
    processIncomingMessage,
    analyzeMessage,
    generateSummary,
    isTyping,
    quickReplies,
    aiEnabled,
    setAiEnabled,
    currentModel,
    setCurrentModel,
    updatePreferences,
    getAvailableModels,
    error,
    setError
  }
}
