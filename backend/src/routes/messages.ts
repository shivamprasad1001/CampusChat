import express from 'express';
import { supabase } from '../lib/supabase.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get message history for a room
router.get('/:roomId', authMiddleware, async (req: AuthRequest, res: any) => {
  const { roomId } = req.params;
  
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      profiles:sender_id(name, avatar_url),
      reactions(*)
    `)
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
