import { Server, Socket } from 'socket.io';
import { supabase } from '../lib/supabase.js';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', ({ roomId }) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);
    });
    socket.on('send_message', async ({ roomId, content, fileUrl, userId }) => {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          sender_id: userId,
          content,
          file_url: fileUrl
        })
        .select('*, profiles(name, avatar_url)')
        .single();

      if (error) {
        console.error('[send_message] Supabase insertion error:', error);
      } else if (message) {
        console.log(`[send_message] Success: Message ${message.id} from ${userId} in ${roomId}`);
        io.to(roomId).emit('new_message', message);
      }
    });

    socket.on('typing', ({ roomId, userId, name }) => {
      socket.to(roomId).emit('user_typing', { userId, name });
    });

    socket.on('toggle_reaction', async ({ messageId, emoji, userId, roomId }) => {
      try {
        // 1. Check if reaction exists
        const { data: existing } = await supabase
          .from('reactions')
          .select('id')
          .eq('message_id', messageId)
          .eq('user_id', userId)
          .eq('emoji', emoji)
          .maybeSingle();

        if (existing) {
          // Remove it
          await supabase.from('reactions').delete().eq('id', existing.id);
        } else {
          // Add it
          await supabase.from('reactions').insert({
            message_id: messageId,
            user_id: userId,
            emoji
          });
        }

        // 2. Fetch all reactions for this message to broadcast the update
        const { data: reactions, error: fetchError } = await supabase
          .from('reactions')
          .select('emoji, user_id')
          .eq('message_id', messageId);

        if (fetchError) {
          console.error('[toggle_reaction] Error fetching updated reaction list:', fetchError);
        } else {
          console.log(`[toggle_reaction] Broadcast: ${reactions?.length || 0} reactions for msg ${messageId}`);
          io.to(roomId).emit('reaction_update', { messageId, reactions });
        }
      } catch (err) {
        console.error('[toggle_reaction] Unexpected logic error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
}
