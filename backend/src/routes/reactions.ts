import express, { type Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Add or remove reaction
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'User not authenticated' });

  const { messageId, emoji } = req.body;
  const userId = user.id;

  if (!messageId || !emoji) {
    return res.status(400).json({ error: 'Missing messageId or emoji' });
  }

  // Check if reaction already exists
  const { data: existing } = await supabase
    .from('reactions')
    .select('*')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .maybeSingle();

  if (existing) {
    // Remove if it exists (toggle behavior)
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('id', existing.id);

    if (error) {
      console.error(`[Reactions] Delete error for message ${messageId}:`, error);
      return res.status(500).json({ error: error.message });
    }
    return res.json({ status: 'removed' });
  } else {
    // Add if it doesn't
    const { data, error } = await supabase
      .from('reactions')
      .insert({
        message_id: messageId,
        user_id: userId,
        emoji
      })
      .select()
      .single();

    if (error) {
      console.error(`[Reactions] Insert error for message ${messageId}:`, error);
      return res.status(500).json({ error: error.message });
    }
    return res.json({ status: 'added', reaction: data });
  }
});

export default router;
