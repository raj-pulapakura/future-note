## Context

The app currently runs as a single Node HTTP server that serves static assets from `public/` and persists notes to `data/db.json`. That model works locally, but Vercel production deployments run in stateless/ephemeral serverless environments where local filesystem writes are not durable between invocations. We need a deployment-ready architecture that preserves current product behavior (anonymous locked notes, sender unlock, recipient reveal) while making runtime, persistence, and deployment validation explicit.

## Goals / Non-Goals

**Goals:**
- Keep current user-facing flows unchanged while making deployment behavior production-safe.
- Support Vercel hosting for both SPA routes and API endpoints.
- Require durable persistence in production and fail fast on invalid runtime configuration.
- Ensure generated share links use a canonical public origin.
- Add operational checks for readiness and controlled failure behavior.

**Non-Goals:**
- Adding authentication, accounts, or authorization model changes.
- Reworking existing UI/animation direction.
- Introducing multi-region data replication or advanced SRE features.
- Changing note domain semantics (lock/reveal lifecycle remains the same).

## Decisions

### 1. Introduce environment-aware storage adapters
Use a storage adapter contract for note persistence:
- `file` adapter for local/dev (`data/db.json`), preserving current workflows.
- `durable` adapter for production (external managed store suitable for Vercel, selected during implementation).

Rationale:
- Decouples domain logic from storage medium.
- Enables Vercel-safe persistence without changing note lifecycle APIs.

Alternatives considered:
- Keep JSON file persistence in production: rejected because Vercel filesystem is not durable.
- Rewrite entire app around a new framework/database now: rejected as too disruptive for this milestone.

### 2. Fail fast on production misconfiguration
At startup, validate required production settings (storage provider credentials, canonical public base URL, and adapter selection). If invalid, fail startup with actionable logs instead of accepting traffic in a bad state.

Rationale:
- Prevents silent data loss or broken share links after deploy.
- Makes deployment failures obvious during CI/preview checks.

Alternatives considered:
- Best-effort fallback to file storage in production: rejected because it hides risk and can lose data.

### 3. Separate runtime concerns for local Node server vs Vercel deployment
Retain `node server.js` for local development, but add deployment configuration for Vercel:
- API paths route to serverless handler(s).
- SPA routes (`/`, `/n/:shareToken`, `/m/:noteId`) resolve to the client entrypoint.
- Static assets served directly by Vercel edge/static layer.

Rationale:
- Minimizes local dev disruption.
- Aligns hosted runtime with Vercel’s execution model.

Alternatives considered:
- Force local dev to use Vercel CLI only: rejected to keep contributor friction low.

### 4. Canonical URL generation via explicit public base URL
Generated `share_url` values must use a configured canonical origin (for example `https://future-note.app`) instead of relying only on incoming host headers.

Rationale:
- Ensures links shared from previews/proxies remain stable and production-correct.

Alternatives considered:
- Build URLs only from `Host` / `X-Forwarded-*`: rejected due to preview-domain leakage and inconsistent origins.

### 5. Add production-ready health/readiness semantics
`/api/health` should reflect basic service and storage readiness (not just process liveness). API errors from dependency failures must return controlled domain responses without stack traces.

Rationale:
- Supports deployment verification and incident detection.
- Keeps failure modes user-safe and diagnosable.

Alternatives considered:
- Keep static `{ ok: true }` health response: rejected because it cannot detect backing-store failure.

## Risks / Trade-offs

- **[Risk] External durable store adds latency and operational dependency** → Mitigation: use connection pooling/retry policy and keep payloads small; monitor read/write latency.
- **[Risk] Provider lock-in if tied to one vendor SDK** → Mitigation: keep adapter interface provider-agnostic and isolate provider code behind one module.
- **[Risk] Startup validation may block deploys on misconfigured envs** → Mitigation: document required vars and add pre-deploy checklist.
- **[Risk] Different local/prod runtimes can drift** → Mitigation: share core domain/service modules and cover both paths in tests.

## Migration Plan

1. Add storage adapter abstraction and migrate note service wiring to use adapter interface.
2. Implement one durable production adapter and keep file adapter for local mode.
3. Add runtime config validation for production boot.
4. Add Vercel deployment config (API routing + SPA rewrites) and deployment docs.
5. Update tests for adapter-backed persistence, health semantics, and share URL origin behavior.
6. Validate in Vercel preview, then production rollout.

Rollback:
- Re-deploy previous version.
- Restore previous environment values.
- Keep durable data untouched to avoid data loss during rollback.

## Open Questions

- Which durable store is preferred for first production launch (Vercel KV, Postgres, or another managed option)?
- Do we require preview deployments to generate preview-host links, or always force canonical production origin?
