import express, { type Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get rooms the user is a member of
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'User not authenticated' });

  const { data, error } = await supabase
    .from('rooms')
    .select('*');

  if (error) {
    console.error('[Rooms] Fetch error:', error)
    return res.status(500).json({ error: error.message })
  }
  
  res.json(data);
});

// Create a new room
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { name, description, type, members } = req.body;
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'User not authenticated' });

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({ name, description, type, created_by: user.id })
    .select()
    .single();

  if (roomError) return res.status(500).json({ error: roomError.message });

  // Add creator and invited members
  const allMembers = Array.from(new Set([user.id, ...(members || [])]));
  const memberInserts = allMembers.map(mId => ({ room_id: room.id, user_id: mId }));

  const { error: memberError } = await supabase
    .from('room_members')
    .insert(memberInserts);

  if (memberError) return res.status(500).json({ error: memberError.message });

  res.json(room);
});

export default router;
