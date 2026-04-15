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

  const limit = parseInt(req.query.limit as string) || 50;
  const before = req.query.before as string;

  let query = supabase
    .from('messages')
    .select(`
      *,
      profiles:sender_id(name, avatar_url),
      reactions(*),
      parent:parent_id(id, content, sender_id, profiles:sender_id(name))
    `)
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`[Messages] Error fetching history for room ${roomId}:`, error);
    return res.status(500).json({ error: error.message });
  }

  if (data) {
    data.reverse(); // Send chronologically to frontend
  }

  res.json(data);
});

export default router;
