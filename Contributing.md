# Contributing to CampusChat

First off — thank you for taking the time to contribute! CampusChat is a student-built, open-source project and every contribution matters.

---

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something useful for our campus community.

---

## How to Contribute

### 1. Find something to work on

- Browse [Issues](../../issues) on GitHub
- Issues labeled `good-first-issue` are perfect for newcomers
- Issues labeled `help-wanted` need contributors urgently
- Have an idea? Open a new issue and describe it first before coding

### 2. Fork & Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/campuschat.git
cd campuschat
git remote add upstream https://github.com/ORIGINAL_OWNER/campuschat.git
```

### 3. Create a branch

Use a descriptive branch name:

```bash
git checkout -b feature/private-rooms
git checkout -b fix/message-scroll-bug
git checkout -b docs/update-readme
```

Branch naming convention:
- `feature/` — new features
- `fix/` — bug fixes
- `docs/` — documentation changes
- `chore/` — refactoring, dependency updates

### 4. Make your changes

- Write clean, readable code
- Follow the existing code style
- Add comments where the logic isn't obvious
- Test your changes manually before submitting

### 5. Commit with clear messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add emoji reactions to messages
fix: resolve message duplication on reconnect
docs: add setup instructions for Windows
chore: upgrade supabase-js to v2.39
```

### 6. Open a Pull Request

- Push your branch and open a PR against `main`
- Fill in the PR template (what changed, why, how to test)
- Link the related issue with `Closes #issue_number`
- Wait for review — we'll respond within 48 hours

---

## Project Structure

```
campuschat/
├── app/                  # Next.js app directory
│   ├── (auth)/           # Login, signup pages
│   ├── (chat)/           # Main chat interface
│   └── api/              # API routes
├── components/           # Reusable UI components
├── lib/                  # Supabase client, utilities
├── supabase/
│   └── schema.sql        # Database schema
├── public/               # Static assets
└── README.md
```

---

## Development Setup

See [README.md](./README.md) for full setup instructions.

Quick version:
```bash
npm install
cp .env.example .env.local   # add your Supabase keys
npm run dev
```

---

## What We Need Help With

- **Frontend** — UI components, responsiveness, animations
- **Backend** — API routes, Supabase queries, performance
- **Design** — Figma mockups, icons, branding
- **Testing** — Writing tests, finding bugs
- **Docs** — Improving README, writing guides
- **DevOps** — CI/CD pipelines, deployment configs

---

## Questions?

Open a [Discussion](../../discussions) on GitHub or reach out to the CodSoc team at NITRA.

Happy contributing! 🚀
