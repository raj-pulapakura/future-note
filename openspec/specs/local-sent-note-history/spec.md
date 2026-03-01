# local-sent-note-history Specification

## Purpose
TBD - created by archiving change pivot-to-hyper-minimal-url-sharing. Update Purpose after archive.
## Requirements
### Requirement: Sender note history is stored locally
The client SHALL persist sender-created note references in localStorage so users can revisit notes they created on the same device.

#### Scenario: Persist sent note reference
- **WHEN** a user successfully creates a note and receives URL credentials
- **THEN** the client stores note identifier, share URL, manage token reference, and creation metadata in localStorage

### Requirement: Sender can unlock notes from local history
The client SHALL allow sender unlock actions from local history entries and SHALL call backend unlock using the corresponding management token.

#### Scenario: Unlock from local history
- **WHEN** a user selects unlock on a locally stored sent note
- **THEN** the client submits manage-token unlock request and updates local entry status to sender-unlocked

### Requirement: Local history is resilient to missing or invalid entries
The client SHALL handle corrupted, missing, or stale localStorage entries without blocking note creation or URL viewing flows.

#### Scenario: Corrupted history entry encountered
- **WHEN** local history parsing fails for one or more stored entries
- **THEN** the client skips invalid entries, shows recoverable feedback, and keeps core create/view actions available

