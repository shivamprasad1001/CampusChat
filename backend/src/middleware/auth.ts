import type { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase.js'
import type { User } from '@supabase/supabase-js'

export interface AuthRequest extends Request {
  user?: User;
  file?: Express.Multer.File;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader

  if (!token) {
    console.error('[Auth] No token provided')
    return res.status(401).json({ error: 'Unauthorized: No token provided' })
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      console.error('[Auth] User verification failed:', error?.message || 'User not found')
      return res.status(401).json({ error: 'Unauthorized: Invalid token' })
    }

    req.user = user
    next()
  } catch (err) {
    console.error('[Auth] Internal verification error:', err)
    return res.status(500).json({ error: 'Internal server error during authentication' })
  }
}
