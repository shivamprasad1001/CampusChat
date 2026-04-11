# 🎓 CampusChat

> An open-source, real-time communication platform built for college campuses.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Made with ❤️ at NITRA](https://img.shields.io/badge/Made%20at-NITRA%20Technical%20Campus-blue)](https://nitra.ac.in)

---

## 🌟 Vision

Every campus has a hundred WhatsApp groups, scattered email threads, and zero real infrastructure for community communication.

**CampusChat** fixes that — a unified, campus-scoped platform where students, professors, and staff can communicate in public rooms, private groups, and direct messages. Built by students, for students, open-source forever.

First deployed at **NITRA Technical Campus, Ghaziabad**. Designed so any college can self-host their own instance.

---

## ✨ Features

### V1 (Current)
- 🔐 **Auth** — Sign up with college email, role-based (Student / Professor / Admin)
- 💬 **Public Rooms** — Department, batch, and topic-based open channels
- 🔒 **Private Rooms** — Invite-only rooms for project teams and classes
- 📩 **Direct Messages** — 1-on-1 messaging between any users
- ⚡ **Real-time** — Instant message delivery via WebSockets
- 😄 **Reactions** — Emoji reactions on messages
- 📎 **File Sharing** — Images and file attachments

### Roadmap (V2+)
- 📢 Announcements channel (admin/professor only)
- 🧵 Threaded replies
- 🔔 Push notifications
- 📱 Mobile app (React Native)
- 🏫 Multi-college / self-hosted support
- 🤖 AI-powered campus assistant

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + Tailwind CSS |
| Real-time | Supabase Realtime (WebSockets) |
| Backend | Node.js + Express |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (Email OTP) |
| File Storage | Supabase Storage |
| Hosting | Vercel (frontend) + Railway (backend) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)
- Git

### Installation

```bash
# Clone the repo
git clone https://github.com/shivamprasad1001/CampusChat.git
cd CampusChat

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase URL and anon key

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you're live.

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🗄️ Database Schema (Quick Overview)

```
users         — id, email, name, role, department, avatar_url
rooms         — id, name, type (public/private), created_by
room_members  — room_id, user_id, joined_at
messages      — id, room_id, sender_id, content, created_at
reactions     — message_id, user_id, emoji
```

Full schema SQL in `/supabase/schema.sql`.

---

## 🤝 Contributing

We welcome contributions from everyone — especially NITRA students and the CodSoc community!

See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for full guidelines.

**Quick start for contributors:**
1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

**Good first issues** are labeled `good-first-issue` on the Issues tab.

---

## 👥 Team

Built with ❤️ by the CodSoc team at NITRA Technical Campus.

| Role | Name |
|---|---|
| Project Lead | Shivam |
| Contributors | *You? Open a PR!* |

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

Free to use, fork, and self-host. If you deploy this at your college, we'd love to know!

---

> Built at NITRA Technical Campus · Powered by TriviLabs · Open Source Forever
