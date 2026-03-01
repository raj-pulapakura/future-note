## ADDED Requirements

### Requirement: Sender can send a locked note
The system SHALL allow an authenticated sender to create a note, select at least one recipient, and send the note in a locked state where recipients cannot read the message body.

#### Scenario: Successful locked send
- **WHEN** a sender submits a valid note with recipient selection and confirms send
- **THEN** the system stores the note with status `locked_sent` and marks the message body as hidden from recipients

#### Scenario: Recipient receives locked placeholder
- **WHEN** a recipient opens their inbox after a locked note is sent to them
- **THEN** the system shows a locked note card with sender identity and sent metadata but without message content

### Requirement: Locked note content is immutable after send
The system MUST preserve the exact message content that existed at send time and MUST reject any content edits once note status is `locked_sent`.

#### Scenario: Sender attempts edit after locked send
- **WHEN** a sender tries to update message text for a note already in `locked_sent`
- **THEN** the system rejects the request and keeps the originally stored content unchanged

### Requirement: Send-time proof metadata is persisted
The system SHALL persist `created_at`, `sent_at`, and `content_hash` at send time for every locked note.

#### Scenario: Proof metadata recorded on send
- **WHEN** a locked note transitions from draft to `locked_sent`
- **THEN** the system records non-null timestamps and integrity fingerprint fields for that note
