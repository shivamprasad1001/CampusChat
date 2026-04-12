import express, { type Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Handle profile setup/update
router.post('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'User not authenticated' });

  const { name, role, department, year, avatar_url } = req.body;
  const userId = user.id;

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      name,
      role,
      department,
      year,
      avatar_url,
      email: user.email
    })
    .select()
    .single();

  if (error) {
    console.error(`[Profile] Upsert error for user ${userId}:`, error)
    return res.status(500).json({ error: error.message })
  }
  
  res.json(data);
});

export default router;
