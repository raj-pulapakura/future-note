## ADDED Requirements

### Requirement: Production runtime MUST use durable note storage
The system MUST use a durable persistence adapter for note data when running in production mode and MUST NOT use ephemeral local filesystem storage for production write paths.

#### Scenario: Production boot rejects ephemeral storage
- **WHEN** the application starts with production mode enabled and storage configuration resolves to local file persistence
- **THEN** startup fails with a configuration error before serving traffic

#### Scenario: Production boot accepts durable storage
- **WHEN** the application starts with production mode enabled and a valid durable storage adapter is configured
- **THEN** startup succeeds and note create/read/unlock operations use the durable adapter

### Requirement: Vercel deployment SHALL preserve API and SPA route behavior
The deployment configuration SHALL expose note APIs on `/api/*` and SHALL resolve client routes (`/`, `/n/:shareToken`, `/m/:noteId`) to the single-page application entrypoint without route-specific server code duplication.

#### Scenario: API route remains reachable in hosted deployment
- **WHEN** a caller requests `GET /api/health` on the deployed Vercel domain
- **THEN** the request is routed to the backend handler and returns a JSON health payload

#### Scenario: Deep link route resolves to SPA shell
- **WHEN** a visitor loads `/n/<shareToken>` or `/m/<noteId>` directly on the deployed domain
- **THEN** the deployment serves the SPA entrypoint so the client can render the note view

### Requirement: Share URLs SHALL use canonical public origin
The system SHALL generate `share_url` values from an explicit canonical public base URL configuration in production, ensuring links are stable regardless of proxy or preview host headers.

#### Scenario: Create note returns canonical share URL
- **WHEN** note creation succeeds in production with `PUBLIC_BASE_URL` configured
- **THEN** the returned `share_url` begins with the configured canonical origin and ends with `/n/<share_token>`

#### Scenario: Missing canonical origin blocks production start
- **WHEN** production mode is enabled and canonical public origin configuration is absent
- **THEN** startup fails with a configuration error before any note creation endpoint is served

### Requirement: Health and failure responses SHALL reflect dependency readiness
The system SHALL report dependency readiness in health responses and SHALL return controlled, non-sensitive API errors when persistence dependencies fail at runtime.

#### Scenario: Health reports ready state
- **WHEN** API and persistence dependencies are reachable
- **THEN** `GET /api/health` returns success readiness status

#### Scenario: Dependency outage returns controlled API error
- **WHEN** note operations fail because the persistence dependency is unavailable
- **THEN** the API returns a non-2xx error with a stable domain error code and without internal stack traces
