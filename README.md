# CampusChat — Production-ready Web Application

CampusChat is a scalable, production-grade real-time messaging platform built for college campuses. It supports role-based access, public and private rooms, direct messaging, file attachments, and horizontal scaling for multi-tenant/self-hosted deployments.

## Production readiness

- Secure authentication and role-based access control
- PostgreSQL-backed persistence with connection pooling
- Stateless API layer suitable for horizontal scaling behind a load balancer
- File storage using Supabase Storage (or S3-compatible stores) with signed URLs
- Observability: structured logs, metrics, and health checks
- CI/CD friendly: tested, linted, and deployable via standard pipelines

## Key Features

- Role-based auth (Student / Professor / Admin)
- Public rooms, private rooms, and direct messages
- Real-time delivery via WebSockets / Supabase Realtime
- File attachments with virus-scanning hook points
- Audit logs and moderation tools for admins

## Architecture (high-level)

- Frontend: Next.js + Tailwind (static + SSR where needed)
- Backend: Node.js + Express, stateless services
- Database: PostgreSQL (Supabase) with read replicas for scale
- Real-time: WebSocket gateway (Supabase Realtime or self-hosted)
- Storage: Supabase Storage or S3
- Deployment: Vercel / Netlify for frontend; containerized backend on Railway, Render, or Kubernetes

## Production deployment notes

- Use an application load balancer and multiple backend replicas
- Configure database replicas and connection poolers (pgbouncer)
- Enable TLS termination at the edge and enforce HTTPS
- Store secrets in a secure vault or provider (e.g., AWS Secrets Manager)
- Configure backups and point-in-time recovery for the database

## Observability & Security

- Emit structured JSON logs and expose Prometheus metrics
- Configure alerting for error rates, latency, and resource exhaustion
- Enforce strong password / SSO policies and rate-limit auth endpoints
- Run periodic dependency scans and container image vulnerability scans

## Getting started (developer)

1. Clone the repo
   git clone <repo-url>
2. Install
   npm install
3. Copy env example and configure Supabase
   cp .env.example .env.local
4. Run locally
   npm run dev

## Environment (important vars)

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

## Contributing

Contributions welcome. Follow CONTRIBUTING.md, open PRs, and include tests for new features.

## License

MIT — see LICENSE.

