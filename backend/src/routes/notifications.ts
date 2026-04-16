import express, { type Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get unread notifications for the current user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      profiles:sender_id(name, avatar_url, username),
      messages:message_id(content, room_id)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[Notifications] Error fetching:', error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// Mark all as read
router.post('/read-all', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
});

// Mark one as read
router.patch('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
});

export default router;
