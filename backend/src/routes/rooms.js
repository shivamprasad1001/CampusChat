import express from 'express';
import { supabase } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
const router = express.Router();
// Get rooms the user is a member of
router.get('/', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { data, error } = await supabase
        .from('rooms')
        .select('*');
    if (error) {
        console.error('Fetch rooms error:', error);
        return res.status(500).json({ error: error.message });
    }
    console.log(`Successfully fetched ${data?.length || 0} rooms for user ${userId}`);
    res.json(data);
});
// Create a new room
router.post('/', authMiddleware, async (req, res) => {
    const { name, description, type, members } = req.body;
    const userId = req.user.id;
    const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({ name, description, type, created_by: userId })
        .select()
        .single();
    if (roomError)
        return res.status(500).json({ error: roomError.message });
    // Add creator and invited members
    const allMembers = Array.from(new Set([userId, ...(members || [])]));
    const memberInserts = allMembers.map(mId => ({ room_id: room.id, user_id: mId }));
    const { error: memberError } = await supabase
        .from('room_members')
        .insert(memberInserts);
    if (memberError)
        return res.status(500).json({ error: memberError.message });
    res.json(room);
});
export default router;
//# sourceMappingURL=rooms.js.map