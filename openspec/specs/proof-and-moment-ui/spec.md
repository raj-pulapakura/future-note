# proof-and-moment-ui Specification

## Purpose
TBD - created by archiving change add-locked-reveal-notes. Update Purpose after archive.
## Requirements
### Requirement: Locked notes present metadata without content disclosure
The interface SHALL present locked notes with message-first composition and minimal lock-state copy while keeping note text hidden; supporting metadata SHALL be available via unobtrusive, non-dominant disclosure.

#### Scenario: URL viewer sees locked state
- **WHEN** a visitor opens a locked note URL
- **THEN** the UI emphasizes lock status and anticipation state without revealing message content, and secondary proof metadata appears de-emphasized

### Requirement: Reveal flow delivers a distinct narrative moment
The interface MUST deliver a warm, journal-like reveal sequence that builds anticipation before content appears and resolves into a stable readable state focused on the message.

#### Scenario: Minimal recipient unlock flow
- **WHEN** sender has unlocked the note and recipient selects unlock in the URL view
- **THEN** the UI executes the defined reveal choreography and lands on message-first readable content in the same surface

### Requirement: Proof metadata is consistently visible across views
The interface SHALL keep proof metadata values consistent between sender and recipient views while permitting progressive disclosure patterns that reduce visual noise.

#### Scenario: Sender history and URL view metadata comparison
- **WHEN** sender checks a note in local history and recipient checks the same note URL
- **THEN** both surfaces expose matching `created_at`, `sent_at`, `revealed_at`, and fingerprint summary values when metadata sections are viewed

### Requirement: Emotional interaction feedback is state-aware
The interface SHALL apply distinct emotional feedback patterns for send, locked waiting, and reveal moments, with equivalent reduced-motion alternatives.

#### Scenario: Send relief feedback
- **WHEN** a sender successfully creates a locked note
- **THEN** the UI provides a brief relief-style confirmation interaction that resolves into a calm resting state

#### Scenario: Reduced-motion compatibility
- **WHEN** a user has reduced-motion preference enabled
- **THEN** the UI replaces animated emotional transitions with low-motion or static equivalents while preserving state clarity

