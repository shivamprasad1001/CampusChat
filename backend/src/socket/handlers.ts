import type { Server, Socket } from 'socket.io';
import { supabase } from '../lib/supabase.js';

interface JoinRoomPayload {
  roomId: string;
  userId: string;
}

interface SendMessagePayload {
  roomId: string;
  content: string;
  fileUrl?: string;
  userId: string;
  parentId?: string;
}

interface TogglePinPayload {
  messageId: string;
  roomId: string;
}

interface TypingPayload {
  roomId: string;
  userId: string;
  name: string;
}

interface ToggleReactionPayload {
  messageId: string;
  emoji: string;
  userId: string;
  roomId: string;
}

interface EditMessagePayload {
  messageId: string;
  roomId: string;
  content: string;
  userId: string;
}

interface DeleteMessagePayload {
  messageId: string;
  roomId: string;
  userId: string;
}


const onlineUsersByRoom = new Map<string, Set<string>>(); // roomId -> Set of userIds
const socketToUser = new Map<string, { userId: string, roomId: string }>();

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    socket.on('join_room', ({ roomId, userId }: JoinRoomPayload) => {
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
      
      console.log(`[Socket] User ${userId || socket.id} joined room: ${roomId}`);
    });

    socket.on('send_message', async ({ roomId, content, fileUrl, userId, parentId }: SendMessagePayload) => {
      // 1. Insert message
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
          profiles:sender_id(name, avatar_url, username),
          parent:parent_id(id, content, sender_id, is_deleted, profiles:sender_id(name, username))
        `)
        .single();

      if (error) {
        console.error('[Socket] send_message error:', error);
      } else if (message) {
        io.to(roomId).emit('new_message', message);

        // 2. Handle Threads: If it's a reply, increment parent's reply_count
        if (parentId) {
          try {
            const { data: parent } = await supabase
              .from('messages')
              .select('reply_count')
              .eq('id', parentId)
              .single();
            
            if (parent) {
              await supabase
                .from('messages')
                .update({ reply_count: (parent.reply_count || 0) + 1 })
                .eq('id', parentId);
              
              // Notify subscribers that a reply was added (useful for thread indicators)
              io.to(roomId).emit('reply_added', { parentId, newCount: (parent.reply_count || 0) + 1 });
            }
          } catch (err) {
            console.error('[Socket] Thread count increment error:', err);
          }
        }

        // 3. Handle Mentions
        const mentions = parseMentions(content);
        if (mentions.length > 0) {
          handleMentions(mentions, message.id, roomId, userId, io);
        }
      }
    });

    socket.on('toggle_pin', async ({ messageId, roomId }: TogglePinPayload) => {
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
        console.error('[Socket] toggle_pin error:', err);
      }
    });

    socket.on('typing', ({ roomId, userId, name }: TypingPayload) => {
      socket.to(roomId).emit('user_typing', { userId, name });
    });

    socket.on('toggle_reaction', async ({ messageId, emoji, userId, roomId }: ToggleReactionPayload) => {
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
        console.error('[Socket] toggle_reaction error:', err);
      }
    });

    socket.on('edit_message', async ({ messageId, roomId, content, userId }: EditMessagePayload) => {
      try {
        const { data: message, error } = await supabase
          .from('messages')
          .update({ content, edited: true })
          .eq('id', messageId)
          .eq('sender_id', userId) // Enforce ownership
          .select('*, profiles(name, avatar_url, username)')
          .single();

        if (error) throw error;
        io.to(roomId).emit('message_edited', message);
      } catch (err) {
        console.error('[Socket] edit_message error:', err);
      }
    });

    socket.on('delete_message', async ({ messageId, roomId, userId }: DeleteMessagePayload) => {
      try {
        // Soft delete: keep the row, but nullify content and flag it
        const { data: message, error } = await supabase
          .from('messages')
          .update({ 
            is_deleted: true, 
            deleted_at: new Date().toISOString(),
            content: null,
            file_url: null,
            file_type: null
          })
          .eq('id', messageId)
          .eq('sender_id', userId)
          .select('id, room_id, sender_id')
          .single();

        if (error) throw error;
        io.to(roomId).emit('message_deleted', { messageId, roomId });
      } catch (err) {
        console.error('[Socket] delete_message error:', err);
      }
    });

function parseMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const matches = content.match(mentionRegex);
  if (!matches) return [];
  // Remove the '@' prefix and return unique usernames
  return Array.from(new Set(matches.map(m => m.substring(1).toLowerCase())));
}

async function handleMentions(usernames: string[], messageId: string, roomId: string, senderId: string, io: Server) {
  try {
    // 1. Get user IDs for these usernames
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username')
      .in('username', usernames);

    if (profileError || !profiles) return;

    // 2. Filter out the sender (can't mention yourself for notifications)
    const targetProfiles = profiles.filter(p => p.id !== senderId);
    if (targetProfiles.length === 0) return;

    // 3. Insert notifications
    const notifications = targetProfiles.map(p => ({
      user_id: p.id,
      sender_id: senderId,
      message_id: messageId,
      room_id: roomId,
      type: 'mention'
    }));

    const { data: inserted, error: notifError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select('*, profiles:sender_id(name, avatar_url, username)');

    if (notifError || !inserted) return;

    // 4. Emit real-time notification to specific users
    // We assuming user is in a private 'user:userId' room or similar
    // For now, we emit to the general Room but frontend will filter
    inserted.forEach(notif => {
      io.emit(`new_notification:${notif.user_id}`, notif);
    });

  } catch (err) {
    console.error('[Socket] handleMentions error:', err);
  }
}

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
      console.log(`[Socket] Session ended: ${socket.id}`);
    });
  });
}
