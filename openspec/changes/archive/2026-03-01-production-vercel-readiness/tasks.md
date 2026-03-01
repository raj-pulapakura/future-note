## 1. Runtime and Persistence Foundation

- [x] 1.1 Add environment configuration module that validates production requirements (`PUBLIC_BASE_URL`, storage adapter selection, provider credentials).
- [x] 1.2 Introduce a storage adapter interface and refactor note persistence calls to depend on the interface instead of direct JSON file access.
- [x] 1.3 Keep existing file-backed adapter for local development and tests.
- [x] 1.4 Implement one durable production adapter suitable for Vercel and wire it through app startup.
- [x] 1.5 Fail startup in production when durable storage requirements are not satisfied.

## 2. Vercel Deployment Wiring

- [x] 2.1 Add Vercel deployment configuration for API routing and SPA deep-link rewrites.
- [x] 2.2 Ensure `/api/*` endpoints are served by backend handlers in Vercel runtime.
- [x] 2.3 Ensure `/`, `/n/:shareToken`, and `/m/:noteId` resolve to the SPA entrypoint when directly loaded.
- [x] 2.4 Update URL generation logic so `share_url` uses canonical `PUBLIC_BASE_URL` in production.

## 3. Operational Readiness and Testing

- [x] 3.1 Expand `/api/health` to report readiness based on storage dependency availability.
- [x] 3.2 Standardize persistence-failure responses to stable domain error codes without leaking internal stack traces.
- [x] 3.3 Add automated tests for startup validation, canonical share URL origin, health readiness, and dependency-failure error behavior.
- [x] 3.4 Add production deployment documentation for Vercel setup, required env vars, and verification checklist.
- [x] 3.5 Run local test suite and a Vercel preview verification pass before rollout.
