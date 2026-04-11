-- USERS (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) primary key,
  name text not null,
  email text not null unique,
  role text not null default 'student'
    check (role in ('student','professor','admin','superadmin')),
  department text,
  year int,
  avatar_url text,
  created_at timestamptz default now()
);

-- ROOMS
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  type text not null check (type in ('public','private','dm')),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- ROOM MEMBERS
create table public.room_members (
  room_id uuid references public.rooms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (room_id, user_id)
);

-- MESSAGES
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  sender_id uuid references public.profiles(id),
  content text,
  file_url text,
  file_type text,
  edited boolean default false,
  created_at timestamptz default now()
);

-- REACTIONS
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id) on delete cascade,
  user_id uuid references public.profiles(id),
  emoji text not null,
  unique(message_id, user_id, emoji)
);

-- RLS: enable on all tables and add policies
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;
alter table public.reactions enable row level security;

-- Basic policies
create policy "Public profiles readable" on public.profiles for select using (true);
create policy "Own profile editable" on public.profiles for update using (auth.uid() = id);

-- Rooms policies
create policy "Visible rooms for members" on public.rooms for select
  using (type = 'public' or exists (select 1 from room_members where room_id = rooms.id and user_id = auth.uid()));

-- Room members policies
create policy "Members list readable by members" on public.room_members for select
  using (exists (select 1 from room_members rm where rm.room_id = room_members.room_id and rm.user_id = auth.uid()));

-- Messages policies
create policy "Members can read room messages" on public.messages for select
  using (exists (select 1 from room_members where room_id = messages.room_id and user_id = auth.uid()));
create policy "Members can insert messages" on public.messages for insert
  with check (exists (select 1 from room_members where room_id = messages.room_id and user_id = auth.uid()));

-- Reactions policies
create policy "Reactions readable by room members" on public.reactions for select
  using (exists (
    select 1 from messages m
    join room_members rm on m.room_id = rm.room_id
    where m.id = reactions.message_id and rm.user_id = auth.uid()
  ));
create policy "Members can react" on public.reactions for insert
  with check (exists (
    select 1 from messages m
    join room_members rm on m.room_id = rm.room_id
    where m.id = reactions.message_id and rm.user_id = auth.uid()
  ));
