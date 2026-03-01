## Why

People often want to record a prediction, warning, or sentiment at a specific moment without revealing it immediately. This change introduces a credible way to prove "I wrote this then" while keeping social context intact until the sender chooses to reveal.

## What Changes

- Add a lock-and-send flow where a sender creates a note, chooses recipient(s), and sends it as unreadable while preserving immutable sent metadata.
- Add sender-controlled reveal so only the sender can unlock a previously sent note, after which recipients can read the original unchanged content.
- Add proof metadata (created timestamp, sent timestamp, revealed timestamp, and integrity fingerprint) surfaced in UI to support trust in "written then, revealed now" claims.
- Add an experience-first product shell with cinematic transitions, timeline moments, and intentional typography/color language so the app feels like an emotional interaction, not a generic SaaS dashboard.

## Capabilities

### New Capabilities
- `locked-note-lifecycle`: Create, lock, send, and persist notes in a hidden state visible to recipients only as metadata until reveal.
- `sender-controlled-reveal`: Allow only the original sender to unlock a locked note; expose exact reveal time and original message content to recipients after unlock.
- `proof-and-moment-ui`: Present immutable proof metadata and a premium, narrative interface around "sent", "locked", and "revealed" moments.

### Modified Capabilities
- None.

## Impact

- Frontend: new compose, inbox, and reveal experiences; motion/visual system; state handling for lock/reveal states.
- Backend/API: note lifecycle model updates; send/reveal endpoints; authorization checks for sender-only reveal.
- Data: note status fields, immutable content storage, timestamps, and integrity fingerprint persistence.
- Product behavior: recipient notifications for locked receipt and later reveal, plus audit-friendly metadata display.
