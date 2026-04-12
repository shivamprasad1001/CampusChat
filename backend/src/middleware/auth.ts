import type { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase.js'

export interface AuthRequest extends Request {
  user?: any;
  file?: any;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    console.error('No token provided in headers')
    return res.status(401).json({ error: 'Unauthorized: No token provided' })
  }

  try {
    console.log(`Verifying token: ${token.substring(0, 10)}...`)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      console.error('Auth error:', error?.message || 'User not found')
      return res.status(401).json({ error: 'Unauthorized: Invalid token' })
    }

    console.log(`User verified: ${user.id}`)
    req.user = user
    next()
  } catch (err) {
    console.error('Token verification catch:', err)
    return res.status(401).json({ error: 'Unauthorized: Token verification failed' })
  }
}
