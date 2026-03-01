## Context

Future Note is starting from an empty spec surface and introduces a trust-sensitive interaction: a sender records a message now, proves when it was sent, and reveals content later. The product goal is intentionally experience-first, so technical decisions must preserve both verifiability (immutable message proof) and emotional UX quality (lock/reveal as moments, not utility CRUD screens).

## Goals / Non-Goals

**Goals:**
- Implement a deterministic locked-note lifecycle (`draft` -> `locked_sent` -> `revealed`) with strict state rules.
- Preserve message integrity by storing an immutable content snapshot and integrity fingerprint at send time.
- Enforce sender-only reveal permissions while allowing recipients to see locked-note metadata before reveal.
- Deliver a narrative, high-craft UI for compose, sent, locked inbox, and reveal moments across desktop/mobile.
- Provide metadata transparency (created, sent, revealed timestamps) that supports "written then, revealed now" claims.

**Non-Goals:**
- Automatic time-based unlocks or scheduled reveals.
- Recipient-controlled reveal or collaborative unlock workflows.
- End-to-end cryptographic signature exchange between users in v1.
- Rich collaboration features (threading, reactions, edits after send).
- Enterprise compliance exports beyond in-app metadata display.

## Decisions

### Decision: Model note lifecycle as a finite state machine
- Choice: Persist explicit `status` enum values (`draft`, `locked_sent`, `revealed`) and only allow forward transitions.
- Rationale: Explicit states reduce ambiguity, simplify authorization checks, and make UI mapping straightforward.
- Alternatives considered:
  - Boolean `is_revealed`: rejected because it cannot represent draft vs sent-before-reveal cleanly.
  - Event log only: rejected for v1 complexity and query overhead.

### Decision: Store immutable message snapshot plus integrity fingerprint at send
- Choice: On send, persist canonical message content, `content_hash` (SHA-256), and `sent_at`; disallow content mutation thereafter.
- Rationale: Provides simple, auditable proof the revealed message equals the originally sent message.
- Alternatives considered:
  - Trust timestamps only: rejected because content tampering cannot be detected.
  - Encrypt/decrypt only without hash: rejected because encryption alone does not provide explicit tamper evidence in app-level UX.

### Decision: Enforce sender-only reveal authorization at API boundary
- Choice: `POST /notes/:id/reveal` succeeds only for the original sender while note is `locked_sent`.
- Rationale: Matches product intent and prevents accidental or malicious recipient reveals.
- Alternatives considered:
  - Any participant can reveal: rejected as behaviorally incorrect.
  - Admin reveal fallback in v1: deferred to keep trust model simple.

### Decision: Build an experience-first UI shell with shared visual primitives
- Choice: Define a dedicated token set (type scale, color roles, motion curves, depth layers) and compose flows around scene-like transitions.
- Rationale: The app value is emotional framing; reusable primitives keep this quality consistent while implementation remains maintainable.
- Alternatives considered:
  - Standard dashboard layout: rejected as misaligned with product differentiator.
  - One-off animation per screen: rejected because it creates visual inconsistency and maintenance debt.

### Decision: Expose proof metadata consistently across sender and recipient views
- Choice: Show `created_at`, `sent_at`, `revealed_at` (when available), and fingerprint summary in both timelines.
- Rationale: Shared evidence view increases trust and prevents sender/recipient discrepancy.
- Alternatives considered:
  - Sender-only proof data: rejected because recipients need confidence in claim validity.
  - Raw hash only: rejected for UX opacity; use abbreviated hash with optional expand.

## Risks / Trade-offs

- [Risk] Users may misinterpret lock state as encryption/security guarantee beyond product scope -> Mitigation: clear copy that lock means hidden-until-reveal with integrity proof, not private key exchange.
- [Risk] High-motion UI can hurt accessibility or performance on low-end devices -> Mitigation: respect reduced-motion settings, add lightweight animation fallback, and budget animation duration.
- [Risk] Strict immutability can increase support requests when users send typos -> Mitigation: add pre-send confirmation and explicit warning that content cannot be edited after send.
- [Risk] Hash visibility could confuse non-technical users -> Mitigation: present human-readable proof summary by default with advanced details on demand.

## Migration Plan

1. Add note schema fields: `status`, `locked_content`, `content_hash`, `created_at`, `sent_at`, `revealed_at`, `sender_id`.
2. Implement API endpoints for create draft, send locked note, fetch timeline cards, and sender reveal.
3. Backfill strategy: none required for greenfield; keep migration idempotent for repeated local setup.
4. Rollout in phases: internal feature flag for reveal flow, then open to all users once lifecycle tests and accessibility checks pass.
5. Rollback: disable feature flag and preserve stored notes; state machine fields remain backward compatible with hidden UI.

## Open Questions

- Should sender be allowed to add a short reveal note/comment at unlock time without changing original locked content?
- Should recipients receive push/email notifications immediately on send, reveal, or both?
- Should v1 support single-recipient only, or small recipient groups with identical reveal behavior?
