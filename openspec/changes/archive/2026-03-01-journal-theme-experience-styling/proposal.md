## Why

The product flow is now functionally aligned, but the current presentation feels utilitarian and undercuts the emotional intent of sending and revealing a note. This change reframes the interface as a warm, journal-like experience that keeps the message as the center of attention.

## What Changes

- Renovate visual language to a journal-inspired aesthetic (serif/cursive emphasis, paper-like warmth, restrained ornamentation).
- Introduce bespoke motion choreography for key emotional moments: send relief, locked anticipation, and reveal excitement.
- Reduce non-essential on-screen copy and metadata prominence so the message remains dominant.
- Tune interaction timing and micro-feedback (button states, transitions, reveals) to feel intentional and lasting rather than transactional.
- Preserve existing URL-sharing behavior and no-auth product model while upgrading only UX/presentation behavior.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `proof-and-moment-ui`: Refine visual hierarchy, motion behavior, and information density to prioritize message-first journaling experience and emotional reveal flow.

## Impact

- Frontend: substantial updates to typography, color tokens, spacing, animation system, and component rendering hierarchy.
- Interaction model: emotional-state transitions become first-class UX behaviors (send, waiting, reveal).
- Testing: frontend visual/behavioral tests need updates for new rendering priorities and motion-state logic.
- Backend/API: no required contract changes expected.
