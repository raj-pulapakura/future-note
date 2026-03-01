## ADDED Requirements

### Requirement: Only sender can reveal a locked note
The system MUST allow reveal actions only from the original sender of a note that is currently in `locked_sent` status.

#### Scenario: Authorized sender reveals note
- **WHEN** the original sender requests reveal for their own `locked_sent` note
- **THEN** the system transitions the note to `revealed` and records `revealed_at`

#### Scenario: Non-sender reveal attempt is denied
- **WHEN** a recipient or unrelated user requests reveal for a note they did not send
- **THEN** the system denies the request with an authorization error and leaves note state unchanged

### Requirement: Reveal exposes original unchanged content
The system SHALL display the exact send-time message content to recipients after reveal and SHALL not substitute any modified version.

#### Scenario: Recipient reads content after reveal
- **WHEN** a recipient opens a note after sender-triggered reveal completes
- **THEN** the system returns the original locked content together with reveal metadata

### Requirement: Reveal operation is idempotent
The system MUST treat repeated reveal requests for an already `revealed` note as non-mutating.

#### Scenario: Sender retries reveal on revealed note
- **WHEN** a sender sends a second reveal request for a note already in `revealed`
- **THEN** the system returns success state without altering stored content or overwriting original `revealed_at`
