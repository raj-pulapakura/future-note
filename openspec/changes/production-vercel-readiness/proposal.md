## Why

The app currently runs well in local development, but production deployment on Vercel needs explicit requirements for runtime behavior, persistence, and operational guardrails. Defining this now prevents data-loss and deployment regressions as the project moves from prototype to live usage.

## What Changes

- Define a production deployment contract for Vercel, including environment configuration, API routing, and static asset delivery.
- Introduce explicit persistence requirements for hosted environments where local filesystem writes are not durable.
- Add operational readiness requirements (health behavior, startup validation, and safe error responses) for production.
- Document a minimal release and verification checklist for deployment confidence.

## Capabilities

### New Capabilities
- `production-deployment-readiness`: Production hosting requirements for Vercel, including runtime configuration, durable persistence expectations, and deployment validation signals.

### Modified Capabilities
- None.

## Impact

- Affected code: runtime bootstrapping (`server.js`), API wiring (`backend/api/router.js`), storage configuration (`backend/storage/*`), and deployment config/docs (`README.md`, `vercel.json` or equivalent).
- Affected systems: Vercel hosting configuration, environment variable management, and persistent data backing strategy.
- Dependencies: Vercel platform settings and one durable data/storage option suitable for serverless execution.
