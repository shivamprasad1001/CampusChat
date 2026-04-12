import { Server, Socket } from 'socket.io';
import { supabase } from '../lib/supabase.js';

const onlineUsersByRoom = new Map<string, Set<string>>(); // roomId -> Set of userIds
const socketToUser = new Map<string, { userId: string, roomId: string }>();

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    socket.on('join_room', ({ roomId, userId }: { roomId: string, userId: string }) => {
      socket.join(roomId);
      
      if (userId) {
        if (!onlineUsersByRoom.has(roomId)) {
          onlineUsersByRoom.set(roomId, new Set());
        }
        onlineUsersByRoom.get(roomId)!.add(userId);
        socketToUser.set(socket.id, { userId, roomId });
        
        // Broadcast updated room member status
        io.to(roomId).emit('room_users', Array.from(onlineUsersByRoom.get(roomId)!));
      }
      
      console.log(`User ${userId || socket.id} joined room: ${roomId}`);
    });

    socket.on('send_message', async ({ roomId, content, fileUrl, userId, parentId }: { roomId: string, content: string, fileUrl?: string, userId: string, parentId?: string }) => {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          sender_id: userId,
          content,
          file_url: fileUrl,
          parent_id: parentId
        })
        .select(`
          *,
          profiles:sender_id(name, avatar_url),
          parent:parent_id(id, content, sender_id, profiles:sender_id(name))
        `)
        .single();

      if (error) {
        console.error('[send_message] Supabase insertion error:', error);
      } else if (message) {
        io.to(roomId).emit('new_message', message);
      }
    });

    socket.on('toggle_pin', async ({ messageId, roomId }: { messageId: string, roomId: string }) => {
      try {
        const { data: current } = await supabase
          .from('messages')
          .select('is_pinned')
          .eq('id', messageId)
          .single();

        if (current) {
          const { data: updated, error } = await supabase
            .from('messages')
            .update({ is_pinned: !current.is_pinned })
            .eq('id', messageId)
            .select('id, is_pinned')
            .single();

          if (!error && updated) {
            io.to(roomId).emit('message_pinned', { messageId, isPinned: updated.is_pinned });
          }
        }
      } catch (err) {
        console.error('[toggle_pin] Error:', err);
      }
    });

    socket.on('typing', ({ roomId, userId, name }: { roomId: string, userId: string, name: string }) => {
      socket.to(roomId).emit('user_typing', { userId, name });
    });

    socket.on('toggle_reaction', async ({ messageId, emoji, userId, roomId }: { messageId: string, emoji: string, userId: string, roomId: string }) => {
      try {
        const { data: existing } = await supabase
          .from('reactions')
          .select('id')
          .eq('message_id', messageId)
          .eq('user_id', userId)
          .eq('emoji', emoji)
          .maybeSingle();

        if (existing) {
          await supabase.from('reactions').delete().eq('id', existing.id);
        } else {
          await supabase.from('reactions').insert({
            message_id: messageId,
            user_id: userId,
            emoji
          });
        }

        const { data: reactions, error: fetchError } = await supabase
          .from('reactions')
          .select('emoji, user_id')
          .eq('message_id', messageId);

        if (!fetchError) {
          io.to(roomId).emit('reaction_update', { messageId, reactions });
        }
      } catch (err) {
        console.error('[toggle_reaction] Error:', err);
      }
    });

    socket.on('disconnect', () => {
      const info = socketToUser.get(socket.id);
      if (info) {
        const { userId, roomId } = info;
        const roomSet = onlineUsersByRoom.get(roomId);
        if (roomSet) {
          roomSet.delete(userId);
          io.to(roomId).emit('room_users', Array.from(roomSet));
        }
        socketToUser.delete(socket.id);
      }
      console.log('User disconnected:', socket.id);
    });
  });
}
