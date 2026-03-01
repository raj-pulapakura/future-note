## ADDED Requirements

### Requirement: Locked notes present metadata without content disclosure
The interface SHALL present locked notes with sender, recipient context, and sent timestamp while keeping message body unreadable before reveal.

#### Scenario: Recipient sees locked card details
- **WHEN** a recipient views a locked note in inbox or timeline
- **THEN** the UI shows lock state and proof metadata but hides the message text area

### Requirement: Reveal flow delivers a distinct narrative moment
The interface MUST provide a staged reveal interaction that visually transitions from locked to revealed state using the app's motion and typography system.

#### Scenario: Reveal transition executes
- **WHEN** sender confirms reveal and recipients open the note after transition to `revealed`
- **THEN** the UI runs the defined reveal sequence and lands on readable content with reveal timestamp emphasis

### Requirement: Proof metadata is consistently visible across views
The interface SHALL show consistent proof fields (`created_at`, `sent_at`, `revealed_at`, and integrity fingerprint summary) for both sender and recipient perspectives.

#### Scenario: Sender and recipient compare metadata
- **WHEN** both parties open the same revealed note
- **THEN** each view displays matching proof values for shared fields
