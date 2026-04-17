
import { Router } from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'

dotenv.config()

const router = Router()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

router.post('/reply', async (req, res) => {
  try {
    const { context, roomName } = req.body

    if (!context || !Array.isArray(context)) {
      return res.status(400).json({ error: 'Context array is required' })
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('[AI] GEMINI_API_KEY is missing from environment')
      return res.status(500).json({ error: 'AI key not configured' })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    // Use gemini-1.5-flash-latest or gemini-pro if 1.5-flash is not found

    const prompt = `
      You are an AI assistant helping a user in a college chat room called "${roomName || 'General'}".
      The following is the recent context of the chat:
      
      ${context.map((m: any) => `${m.sender}: ${m.content}`).join('\n')}
      
      Provide a concise, helpful, and natural-sounding reply that the user could send next. 
      Keep it under 30 words. Do not include quotes. Just the message content.
    `

    console.log('[AI] Generating reply for room:', roomName)
    const result = await model.generateContent(prompt)
    const response = await result.response
    
    // Check if the response was blocked by safety filters
    if (response.candidates && response.candidates[0]?.finishReason === 'SAFETY') {
      console.warn('[AI] Response blocked by safety filters')
      return res.status(400).json({ error: 'Response blocked by safety filters' })
    }

    const text = response.text().trim()
    console.log('[AI] Successfully generated reply')

    res.json({ reply: text })
  } catch (error: any) {
    console.error('[AI] Error generating AI reply:', error.message)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

export default router
