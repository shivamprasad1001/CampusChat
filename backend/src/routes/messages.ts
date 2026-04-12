import express, { type Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get message history for a room
router.get('/:roomId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
  
  if (!roomId) {
    return res.status(400).json({ error: 'Room ID is required' });
  }

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      profiles:sender_id(name, avatar_url),
      reactions(*),
      parent:parent_id(id, content, sender_id, profiles:sender_id(name))
    `)
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`[Messages] Error fetching history for room ${roomId}:`, error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

export default router;
