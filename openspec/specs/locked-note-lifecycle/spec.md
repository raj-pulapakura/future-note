# locked-note-lifecycle Specification

## Purpose
TBD - created by archiving change add-locked-reveal-notes. Update Purpose after archive.
## Requirements
### Requirement: Sender can send a locked note
The system SHALL allow an unauthenticated creator to submit note content and generate a locked note share URL, where URL visitors cannot read the message body until sender unlock.

#### Scenario: Successful locked note creation with share URL
- **WHEN** a creator submits a valid note from the minimal input flow
- **THEN** the system stores the note with status `locked_sent` and returns a share URL for recipients

#### Scenario: Share URL visitor receives locked placeholder
- **WHEN** a visitor opens the share URL for a note still in `locked_sent`
- **THEN** the system shows locked status metadata without message content

### Requirement: Locked note content is immutable after send
The system MUST preserve the exact message content at lock time and MUST reject any content edits once note status is `locked_sent`, including attempts using management credentials.

#### Scenario: Creator attempts edit after lock
- **WHEN** a creator or any caller attempts to modify message content for a note in `locked_sent`
- **THEN** the system rejects the request and preserves the originally stored content

### Requirement: Send-time proof metadata is persisted
The system SHALL persist immutable proof metadata at creation/send time for link-based notes, including `created_at`, `sent_at`, and `content_hash`.

#### Scenario: Proof metadata recorded on link note creation
- **WHEN** a note is created and locked for URL sharing
- **THEN** the system stores non-null proof timestamps and integrity fingerprint fields for that note

