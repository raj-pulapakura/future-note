## 1. Token-Based Note Model

- [x] 1.1 Replace account-centric note fields with token-centric fields (`share_token`, `manage_token_hash`, `recipient_unlocked_at`) in persistence schema.
- [x] 1.2 Implement migration logic that keeps existing note records readable while moving to token-based lifecycle constraints.
- [x] 1.3 Add secure token generation + hashing utilities and integrate them into note creation flow.

## 2. Anonymous URL API Surface

- [x] 2.1 Implement minimal create-note endpoint that returns `share_url` and sender management credential.
- [x] 2.2 Implement share-URL status/read endpoint that reports locked/unlocked state and proof metadata without requiring auth.
- [x] 2.3 Implement sender unlock endpoint gated by management token and recipient unlock endpoint for explicit content reveal.
- [x] 2.4 Remove or deprecate recipient-account and auth-dependent note routes no longer used by the new flow.

## 3. Local Sender History

- [x] 3.1 Implement localStorage module for sent-note history with schema versioning and corruption-safe parsing.
- [x] 3.2 Persist created note references (share URL + management credential reference + metadata) to local history.
- [x] 3.3 Wire local history unlock actions to sender unlock API and keep local lock/unlock status synchronized.

## 4. Hyper-Minimal UI Overhaul

- [x] 4.1 Replace existing home layout with a central single-input note creation surface and share-url output controls.
- [x] 4.2 Build recipient URL view that shows locked state by default and unlock CTA only after sender unlock.
- [x] 4.3 Add minimal sender “notes I sent” panel sourced from localStorage without introducing account concepts.
- [x] 4.4 Simplify visual system to minimal typography, spacing, and state labels while keeping lock state clarity.

## 5. Proof Metadata Consistency

- [x] 5.1 Ensure `created_at`, `sent_at`, `revealed_at`, and fingerprint summary are returned by backend for both sender and recipient contexts.
- [x] 5.2 Render the same proof metadata fields in sender local history and recipient URL view.
- [x] 5.3 Verify locked notes never expose message content until sender unlock and recipient unlock action both occur.

## 6. Validation And Cleanup

- [x] 6.1 Add backend tests for token authorization, locked-content immutability, idempotent sender unlock, and recipient unlock gating.
- [x] 6.2 Add frontend tests for minimal create flow, local history persistence behavior, and recipient lock/unlock rendering.
- [x] 6.3 Update docs/readme flow to describe URL sharing model and no-auth local-history behavior.
