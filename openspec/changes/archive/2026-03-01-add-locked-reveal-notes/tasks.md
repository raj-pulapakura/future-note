## 1. Data Model And Persistence

- [x] 1.1 Add note lifecycle fields (`status`, `locked_content`, `content_hash`, `created_at`, `sent_at`, `revealed_at`, `sender_id`) in storage schema.
- [x] 1.2 Implement migration and model constraints to enforce forward-only status transitions.
- [x] 1.3 Add persistence logic that computes and stores `content_hash` when draft transitions to `locked_sent`.

## 2. Locked Send And Read APIs

- [x] 2.1 Implement endpoint/service flow to create draft notes and send them as `locked_sent` with recipient assignment.
- [x] 2.2 Implement inbox/timeline query endpoints that return locked-note metadata while withholding content for unrevealed notes.
- [x] 2.3 Add server-side validation for minimum recipient selection and immutable content after send.

## 3. Sender-Controlled Reveal APIs

- [x] 3.1 Implement sender-only reveal endpoint that transitions `locked_sent` -> `revealed` and stores `revealed_at`.
- [x] 3.2 Add authorization guards to reject reveal attempts from non-senders.
- [x] 3.3 Make reveal idempotent so repeated requests do not mutate content or overwrite original `revealed_at`.

## 4. Experience-First UI Foundation

- [x] 4.1 Define visual tokens (typography, color roles, motion curves, depth) for the lock/reveal product language.
- [x] 4.2 Build reusable UI primitives for locked cards, proof metadata blocks, and reveal-stage transitions.
- [x] 4.3 Implement reduced-motion accessibility behavior and responsive layout rules for mobile and desktop.

## 5. Core Product Flows

- [x] 5.1 Build compose/send flow with explicit irreversible-send confirmation before locking.
- [x] 5.2 Build recipient locked inbox/timeline view that surfaces sender and sent metadata without content.
- [x] 5.3 Build sender reveal flow and recipient revealed-note experience with emphasized reveal moment.
- [x] 5.4 Surface consistent proof metadata (`created_at`, `sent_at`, `revealed_at`, fingerprint summary) in sender and recipient views.

## 6. Notifications And Verification

- [x] 6.1 Implement notification events for locked-note receipt and note reveal.
- [x] 6.2 Add automated backend tests for lifecycle transitions, immutability, authorization, and reveal idempotency.
- [x] 6.3 Add frontend tests for locked-state rendering, reveal-state rendering, and proof metadata consistency across roles.
