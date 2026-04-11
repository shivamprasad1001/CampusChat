import express from 'express';
import { supabase } from '../lib/supabase.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Handle profile setup/update
router.post('/profile', authMiddleware, async (req: AuthRequest, res: any) => {
  const { name, role, department, year, avatar_url } = req.body;
  const userId = req.user.id;

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      name,
      role,
      department,
      year,
      avatar_url,
      email: req.user.email
    })
    .select()
    .single();

  if (error) {
    console.error('Profile upsert error:', error)
    return res.status(500).json({ error: error.message })
  }
  
  console.log(`Profile updated for user ${userId}`)
  res.json(data);
});

export default router;
