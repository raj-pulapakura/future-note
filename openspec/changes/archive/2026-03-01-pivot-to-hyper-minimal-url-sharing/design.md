## Context

The current implementation and specs assume authenticated actors, recipient assignment, and a rich multi-surface UI. The new direction removes account identity from the core flow and reduces the product to a hyper-minimal interaction: write note, get URL, share URL, and control reveal from locally stored sent notes.

## Goals / Non-Goals

**Goals:**
- Replace recipient-account delivery with anonymous URL sharing.
- Preserve lock/unlock semantics with immutable original content.
- Introduce sender management without authentication by using a private management token stored only in sender localStorage.
- Provide a minimal UI centered on one note input and URL copy/share output.
- Provide a recipient URL view that clearly shows locked state and only allows viewing message after sender unlock.

**Non-Goals:**
- User registration, login, or identity verification.
- Multi-recipient in-app targeting or inbox concepts.
- High-motion cinematic UI treatments.
- Cross-device sender history sync (local device storage only).

## Decisions

### Decision: Use dual-token access model
- Choice: Generate `share_token` (recipient URL) and `manage_token` (sender control secret) at note creation.
- Rationale: Replaces authentication while preserving sender-only reveal control.
- Alternatives considered:
  - Single token for both sender/recipient: rejected because anyone with URL could reveal.
  - Signed auth sessions: rejected because it conflicts with no-auth requirement.

### Decision: Persist sender history in browser localStorage
- Choice: Store sender note references (`note_id`, `share_url`, `manage_token`, timestamps, lock state) under a versioned localStorage key.
- Rationale: Satisfies “notes I sent” requirement with minimal backend complexity.
- Alternatives considered:
  - Server-side per-user history: rejected because it requires identity/account modeling.
  - Session storage only: rejected because history disappears between browser restarts.

### Decision: Keep recipient unlock as explicit two-step interaction
- Choice: Recipient link page first shows note status. If sender has unlocked, recipient gets an explicit “Unlock and view” action that reveals content.
- Rationale: Matches requested behavior and keeps reveal moment intentional.
- Alternatives considered:
  - Auto-show content immediately after sender unlock: rejected because it removes explicit recipient action.
  - Password prompt: rejected as unnecessary friction for v1.

### Decision: Reduce interface to two minimal surfaces
- Choice: Home page has central note input + compact sent-notes list. Recipient page is a single status/view card keyed by URL.
- Rationale: Enforces hyper-minimal product identity and lowers implementation surface area.
- Alternatives considered:
  - Keep existing multi-panel dashboard with styling changes: rejected as too heavy for desired UX.

## Risks / Trade-offs

- [Risk] Anyone with manage token could unlock notes -> Mitigation: never include manage token in share URL; store/manage token only in sender localStorage and copy controls separated.
- [Risk] localStorage can be cleared, losing sender control history -> Mitigation: show warning after creation that sender should keep/manage URL metadata; allow manual manage-token re-entry if needed.
- [Risk] Anonymous links may be brute-forced -> Mitigation: use high-entropy random tokens and rate-limit lookup endpoints.
- [Risk] Minimal UI may hide critical state context -> Mitigation: include clear lock/unlock labels and timestamp metadata on both sender and recipient views.

## Migration Plan

1. Add token-based note model fields (`share_token`, `manage_token_hash`, `recipient_unlocked_at`) and remove reliance on sender/recipient account ids.
2. Replace authenticated note routes with token-based create/view/unlock endpoints.
3. Replace existing frontend shell with minimal home + recipient URL route and localStorage sent-history module.
4. Add backward-compatibility path for previously stored local notes by migrating localStorage schema on app load.
5. Rollback strategy: restore previous spec baseline and routes if token model causes blocking regressions.

## Open Questions

- Should sender be able to regenerate a new share URL for the same note if the original URL is leaked?
- Should recipient unlock action be one-time (persist `recipient_unlocked_at`) or always re-click on each visit?
- Should we provide optional sender export/import for local history backup in v1.1?
