## MODIFIED Requirements

### Requirement: Only sender can reveal a locked note
The system MUST allow sender unlock actions only when a valid note management token is provided for a note currently in `locked_sent` status.

#### Scenario: Authorized management-token unlock
- **WHEN** a caller submits a valid management token for a `locked_sent` note
- **THEN** the system transitions the note to `revealed` and records `revealed_at`

#### Scenario: Invalid management-token reveal attempt is denied
- **WHEN** a caller submits an absent or invalid management token for reveal
- **THEN** the system denies the request and leaves note state unchanged

### Requirement: Reveal exposes original unchanged content
The system SHALL expose exactly the original locked message content through the share URL after sender unlock and recipient unlock action.

#### Scenario: URL visitor reads content after sender unlock
- **WHEN** sender unlock has completed and a share URL visitor performs recipient unlock
- **THEN** the system returns the original locked content with reveal metadata

### Requirement: Reveal operation is idempotent
The system MUST treat repeated sender unlock requests for an already `revealed` note as non-mutating.

#### Scenario: Repeated sender unlock request
- **WHEN** a valid management token is used to unlock a note already in `revealed`
- **THEN** the system returns success state without overwriting original `revealed_at` or mutating content
