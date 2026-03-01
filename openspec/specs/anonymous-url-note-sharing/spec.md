# anonymous-url-note-sharing Specification

## Purpose
TBD - created by archiving change pivot-to-hyper-minimal-url-sharing. Update Purpose after archive.
## Requirements
### Requirement: Note creation issues shareable URL and private management token
The system SHALL create locked notes without authentication and SHALL return both a recipient share URL and a sender-only management token.

#### Scenario: Create note and receive URL credentials
- **WHEN** a user submits note content from the create surface
- **THEN** the system stores the note in locked state and returns `share_url` plus `manage_token`

### Requirement: Share URL resolves note status without exposing locked content
The system SHALL allow any holder of the share URL to view note status metadata while the note is locked and SHALL not expose message content before sender unlock.

#### Scenario: Recipient opens locked share URL
- **WHEN** a recipient loads a valid share URL for a note that has not been sender-unlocked
- **THEN** the system returns locked status and hides message content

### Requirement: Recipient can explicitly unlock view after sender release
The system SHALL present an explicit recipient unlock action after sender release and SHALL reveal original message content only after that recipient action.

#### Scenario: Recipient unlocks after sender release
- **WHEN** a recipient opens a share URL where sender release has already occurred and clicks unlock
- **THEN** the system reveals the original locked message and records recipient unlock timestamp

