## MODIFIED Requirements

### Requirement: Locked notes present metadata without content disclosure
The interface SHALL present locked-state metadata in the share URL view and SHALL keep note text hidden until sender unlock plus recipient unlock action.

#### Scenario: URL viewer sees locked state
- **WHEN** a visitor opens a locked note URL
- **THEN** the UI shows lock status and proof metadata while hiding message content

### Requirement: Reveal flow delivers a distinct narrative moment
The interface MUST provide a minimal reveal interaction where recipient explicitly taps unlock to reveal content after sender release.

#### Scenario: Minimal recipient unlock flow
- **WHEN** sender has unlocked the note and recipient selects unlock in the URL view
- **THEN** the UI transitions from locked status to readable content in the same minimal surface

### Requirement: Proof metadata is consistently visible across views
The interface SHALL display consistent proof fields in both sender local history entries and recipient URL note view.

#### Scenario: Sender history and URL view metadata comparison
- **WHEN** sender checks a note in local history and recipient checks the same note URL
- **THEN** both surfaces show matching `created_at`, `sent_at`, `revealed_at`, and fingerprint summary values
