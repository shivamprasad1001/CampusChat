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
  let before = req.query.before as string;
  const parentId = req.query.parentId as string;

  // Handle cases where the '+' in the timestamp was mangled into a space
  if (before && before.includes(' ')) {
    before = before.replace(/\s/g, '+');
  }

  let query = supabase
    .from('messages')
    .select(`
      *,
      profiles:sender_id(name, avatar_url, username),
      reactions(*),
      parent:parent_id(id, content, sender_id, is_deleted, profiles:sender_id(name, username))
    `)
    .eq('room_id', roomId);

  if (parentId) {
    query = query.eq('parent_id', parentId).order('created_at', { ascending: true });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  query = query.limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`[Messages] Error fetching history for room ${roomId}:`, error);
    return res.status(500).json({ error: error.message });
  }

  if (data && !parentId) {
    data.reverse(); // Send chronologically to frontend for main room view
  }

  res.json(data);
});

export default router;
