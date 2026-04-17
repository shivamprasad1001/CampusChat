export type UserRole = 'student' | 'professor' | 'admin' | 'superadmin';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  year?: number;
  avatar_url?: string;
  username?: string;
  created_at: string;
}

export type RoomType = 'public' | 'private' | 'dm';

export interface Room {
  id: string;
  name: string;
  description?: string;
  type: RoomType;
  created_by?: string;
  created_at: string;
  member_count?: number;
}

export interface RoomMember {
  room_id: string;
  user_id: string;
  role: 'member' | 'admin';
  joined_at: string;
  profiles?: Profile;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content?: string;
  file_url?: string;
  file_type?: string;
  edited: boolean;
  is_pinned?: boolean;
  parent_id?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  reply_count?: number;
  duration?: number;
  created_at: string;
  profiles?: Profile;
  reactions?: Reaction[];
  parent?: {
    id: string;
    content: string;
    sender_id: string;
    is_deleted?: boolean;
    profiles?: Profile;
  };
}

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at?: string;
}
