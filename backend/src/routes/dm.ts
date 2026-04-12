import express, { type Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Find or create a DM room between the current user and target user
router.get('/:targetUserId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'User not authenticated' });
  
  const currentUserId = user.id;
  const { targetUserId } = req.params;

  if (currentUserId === targetUserId) {
    return res.status(400).json({ error: "Cannot DM yourself" });
  }

  // Check if a DM room exists between them
  const { data: existingRooms, error: findError } = await supabase
    .from('rooms')
    .select(`
      id,
      name,
      type,
      room_members!inner(user_id)
    `)
    .eq('type', 'dm')
    .eq('room_members.user_id', currentUserId);

  if (findError) {
    console.error('[DM] Search error:', findError);
    return res.status(500).json({ error: findError.message });
  }

  // Filter existing rooms to find one where the target user is also a member
  for (const room of (existingRooms || [])) {
    const { data: targetMember } = await supabase
      .from('room_members')
      .select('user_id')
      .eq('room_id', room.id)
      .eq('user_id', targetUserId)
      .single();

    if (targetMember) {
      return res.json(room);
    }
  }

  // Create new DM room if none found
  const { data: newRoom, error: createError } = await supabase
    .from('rooms')
    .insert({
      name: `dm-${currentUserId}-${targetUserId}`,
      type: 'dm'
    })
    .select()
    .single();

  if (createError) {
    console.error('[DM] Creation error:', createError);
    return res.status(500).json({ error: createError.message });
  }

  // Add both members
  await supabase
    .from('room_members')
    .insert([
      { room_id: newRoom.id, user_id: currentUserId },
      { room_id: newRoom.id, user_id: targetUserId }
    ]);

  res.json(newRoom);
});

export default router;
