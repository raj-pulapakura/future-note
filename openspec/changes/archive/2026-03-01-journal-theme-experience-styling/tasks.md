## 1. Theme Foundations

- [x] 1.1 Define journal-style design tokens for typography (serif + cursive accents), color palette, spacing, and texture.
- [x] 1.2 Replace current global CSS variables/styles with the new warm, minimal visual system.
- [x] 1.3 Add motion token presets for `send_relief`, `locked_anticipation`, and `reveal_release` with reduced-motion fallbacks.

## 2. Message-First Layout Pass

- [x] 2.1 Refactor compose screen hierarchy so message input area is dominant and supporting controls are secondary.
- [x] 2.2 Refactor recipient note view to prioritize message stage over metadata and helper text.
- [x] 2.3 Reduce copy density across headings/labels/helpers to concise, emotionally aligned phrasing.

## 3. Emotional Interaction Choreography

- [x] 3.1 Implement send success interaction that communicates relief and settles quickly.
- [x] 3.2 Implement locked-state anticipation interaction cues without revealing content.
- [x] 3.3 Implement reveal interaction sequence that builds anticipation then resolves to stable readable message state.

## 4. Metadata Disclosure Refinement

- [x] 4.1 Move proof metadata into unobtrusive progressive-disclosure UI patterns on sender and recipient surfaces.
- [x] 4.2 Ensure disclosed metadata values remain consistent across local history and shared URL views.
- [x] 4.3 Verify metadata disclosure does not visually compete with primary message content.

## 5. Validation

- [x] 5.1 Update frontend unit/integration tests for message-first rendering and reduced-copy expectations.
- [x] 5.2 Add/adjust tests for emotional interaction states including reduced-motion behavior.
- [x] 5.3 Run full test suite and manually sanity-check mobile + desktop rendering for readability and pacing.
