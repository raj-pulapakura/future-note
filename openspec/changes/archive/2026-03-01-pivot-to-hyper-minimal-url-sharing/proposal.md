## Why

The current product direction over-indexes on authenticated sender/recipient flows and a high-craft interface, which does not match the intended use experience. This change pivots the app to a hyper-minimal, link-based model where creating and sharing a locked note is the only primary action.

## What Changes

- **BREAKING** Replace authenticated user/recipient assignment with anonymous URL-based access for note delivery.
- **BREAKING** Replace multi-panel, cinematic UI with a hyper-minimal interface centered on one note input flow.
- Add note URL generation at creation time so senders share links directly outside the app.
- Add link-view behavior: recipients opening a locked note see locked status; once sender unlocks, recipients see an explicit action to unlock and view message content.
- Add sender-side local history using browser localStorage to track notes they created and manage unlock state without server-side accounts.

## Capabilities

### New Capabilities
- `anonymous-url-note-sharing`: Create locked notes that issue shareable URLs with note access tokens and no authenticated account requirement.
- `local-sent-note-history`: Persist sender-created notes in browser localStorage for simple “notes I sent” management and unlock controls.

### Modified Capabilities
- `locked-note-lifecycle`: Transition lifecycle semantics from recipient-account delivery to tokenized link-based access while preserving locked/unlocked states.
- `sender-controlled-reveal`: Update reveal behavior so sender unlocks from local history and recipients can then explicitly unlock/view from shared URL.
- `proof-and-moment-ui`: Replace immersive multi-surface experience with hyper-minimal create/view screens and lock-status-first messaging.

## Impact

- Frontend: significant simplification to minimal creation UI, URL note view route, localStorage-backed sender history, and basic unlock interactions.
- Backend/API: remove auth assumptions from note endpoints; support tokenized share URLs and lock/unlock status checks by note token.
- Data model: shift from sender/recipient identity fields toward public note identifier plus private sender management token and lock state.
- Product behavior: sharing occurs via URL transport (copy/share) instead of in-app recipient targeting.
