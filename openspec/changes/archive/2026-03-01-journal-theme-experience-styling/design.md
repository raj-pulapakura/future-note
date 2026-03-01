## Context

The app now has the correct product mechanics (anonymous URL notes, sender unlock, recipient unlock), but the current visual system is neutral and utility-first. The requested direction is a warm, journal-like experience that feels bespoke and emotionally timed while reducing text density and preserving message-first focus.

## Goals / Non-Goals

**Goals:**
- Introduce a writing/journal aesthetic with expressive serif and cursive accents, tactile paper-inspired surfaces, and warm color harmonies.
- Reorder visual hierarchy so message content dominates and supporting metadata/copy is intentionally de-emphasized.
- Add emotional motion choreography mapped to key moments: relief on send, anticipation while locked, excitement at reveal.
- Keep interactions minimal and legible across desktop/mobile with reduced-motion accessibility fallback.

**Non-Goals:**
- Any backend API/data-model changes.
- Additional product flows, settings panels, or feature expansion.
- Overly verbose instructional text blocks.
- Heavy animation that competes with readability.

## Decisions

### Decision: Use a two-tier typography system (literary + utility)
- Choice: Apply serif display typography and selective cursive accents for emotional cues, while keeping body and metadata in restrained serif/sans combinations.
- Rationale: Delivers “journal-esque” tone without sacrificing readability for primary message content.
- Alternatives considered:
  - Full cursive UI: rejected due to readability/accessibility issues.
  - System sans-only minimalism: rejected as emotionally flat.

### Decision: Message-first composition with progressive disclosure for metadata
- Choice: Give the message region dominant size/contrast and collapse secondary metadata behind subtle expandable affordances.
- Rationale: Aligns with “message is king” while still keeping proof details available when needed.
- Alternatives considered:
  - Always-visible full metadata: rejected for visual noise.
  - Hiding metadata completely: rejected because trust/proof context remains important.

### Decision: Emotional state machine for motion language
- Choice: Define motion presets by note state and action: `send_relief`, `locked_anticipation`, `reveal_release`, each with duration/easing caps and reduced-motion equivalents.
- Rationale: Makes emotion intentional and repeatable instead of ad-hoc animation.
- Alternatives considered:
  - Generic uniform transitions: rejected for low emotional payoff.
  - High-intensity effects: rejected as distracting and potentially fatiguing.

### Decision: Copy austerity policy
- Choice: Enforce short-copy components (headings, labels, helper text) with explicit max-length rules and fewer instructional blocks.
- Rationale: Prevents UI from drifting back into explanatory clutter.
- Alternatives considered:
  - Keep current copy volume: rejected because it weakens minimal/bespoke feel.

## Risks / Trade-offs

- [Risk] Stylized typography may reduce readability for some users -> Mitigation: maintain readable base font for long text and enforce contrast/size minimums.
- [Risk] Emotion-focused animations may feel slow -> Mitigation: cap durations, prioritize content readiness, and provide reduced-motion variants.
- [Risk] Reduced copy may lower clarity for first-time users -> Mitigation: keep concise but explicit action labels and contextual microcopy.
- [Risk] Journal theme may feel decorative if overdone -> Mitigation: constrain ornamentation to accents and keep layout minimal.

## Migration Plan

1. Replace current theme tokens with journal-style typography/color/spacing/motion tokens.
2. Refactor key UI surfaces (compose, sent history, recipient reveal card) to message-first hierarchy and reduced text density.
3. Implement state-based motion presets and reduced-motion alternatives.
4. Update frontend tests and snapshots for new hierarchy/copy/motion hooks.
5. Validate on mobile/desktop and ship behind normal release flow (no backend migration needed).

## Open Questions

- Should cursive accents appear only on state labels or also on key action buttons?
- Should metadata disclosure default to collapsed in both sender and recipient views, or only recipient views?
- Is a subtle sound cue desirable in the future, or should this remain visual-only?
