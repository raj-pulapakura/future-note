import assert from "node:assert/strict";
import test from "node:test";
import { hashValue } from "../../backend/security.js";
import { NoteService } from "../../backend/services/note-service.js";

function createServiceFixture(databaseOverride = null) {
  const timestamps = [
    "2026-03-01T10:00:00.000Z",
    "2026-03-01T10:01:00.000Z",
    "2026-03-01T10:02:00.000Z",
    "2026-03-01T10:03:00.000Z",
    "2026-03-01T10:04:00.000Z",
    "2026-03-01T10:05:00.000Z",
  ];

  let idCounter = 0;
  const database = databaseOverride ?? {
    schema_version: 1,
    notes: [],
    notifications: [],
  };

  const service = new NoteService({
    database,
    nowFn: () => timestamps.shift() ?? "2026-03-01T11:00:00.000Z",
    idFn: () => `id-${++idCounter}`,
  });

  return { service, database };
}

test("createLockedNote returns URL credentials and stores token hashes", () => {
  const { service, database } = createServiceFixture();
  const created = service.createLockedNote({
    message: "Prediction text",
    origin: "https://future-note.test",
  });

  assert.equal(created.note.status, "locked_sent");
  assert.ok(created.share_token.length > 10);
  assert.ok(created.manage_token.length > 10);
  assert.equal(
    created.share_url,
    `https://future-note.test/n/${encodeURIComponent(created.share_token)}`
  );

  const stored = database.notes[0];
  assert.equal(stored.locked_content, "Prediction text");
  assert.equal(stored.manage_token_hash, hashValue(created.manage_token));
  assert.equal(stored.content_hash.length, 64);
});

test("sender unlock requires valid management token", () => {
  const { service } = createServiceFixture();
  const created = service.createLockedNote({
    message: "Locked message",
    origin: "https://future-note.test",
  });

  assert.throws(
    () => {
      service.senderUnlock({ note_id: created.note.id, manage_token: "invalid" });
    },
    (error) => error.code === "invalid_manage_token" && error.status === 403
  );
});

test("sender unlock is idempotent and preserves reveal timestamp", () => {
  const { service } = createServiceFixture();
  const created = service.createLockedNote({
    message: "I knew this",
    origin: "https://future-note.test",
  });

  const first = service.senderUnlock({
    note_id: created.note.id,
    manage_token: created.manage_token,
  });
  const second = service.senderUnlock({
    note_id: created.note.id,
    manage_token: created.manage_token,
  });

  assert.equal(first.idempotent, false);
  assert.equal(second.idempotent, true);
  assert.equal(first.note.revealed_at, "2026-03-01T10:01:00.000Z");
  assert.equal(second.note.revealed_at, first.note.revealed_at);
});

test("recipient unlock is blocked until sender unlock and then reveals original content", () => {
  const { service } = createServiceFixture();
  const created = service.createLockedNote({
    message: "Hidden prediction",
    origin: "https://future-note.test",
  });

  assert.throws(
    () => {
      service.recipientUnlock({ share_token: created.share_token });
    },
    (error) => error.code === "note_still_locked" && error.status === 409
  );

  service.senderUnlock({
    note_id: created.note.id,
    manage_token: created.manage_token,
  });

  const beforeRecipientUnlock = service.getSharedNote({
    share_token: created.share_token,
  });

  assert.equal(beforeRecipientUnlock.content, null);
  assert.equal(beforeRecipientUnlock.content_visible, false);
  assert.equal(beforeRecipientUnlock.recipient_can_unlock, true);

  const firstUnlock = service.recipientUnlock({ share_token: created.share_token });
  const secondUnlock = service.recipientUnlock({ share_token: created.share_token });

  assert.equal(firstUnlock.content, "Hidden prediction");
  assert.equal(firstUnlock.content_visible, true);
  assert.equal(secondUnlock.recipient_unlocked_at, firstUnlock.recipient_unlocked_at);
});

test("migration keeps legacy notes readable under token model", () => {
  const legacyDatabase = {
    schema_version: 1,
    notes: [
      {
        id: "legacy-1",
        sender_id: "ava",
        recipient_ids: ["noah"],
        status: "locked_sent",
        draft_content: "legacy message",
        locked_content: "legacy message",
        content_hash: null,
        created_at: "2026-02-01T10:00:00.000Z",
        sent_at: "2026-02-01T10:00:00.000Z",
        revealed_at: null,
      },
    ],
    notifications: [],
  };

  const { service } = createServiceFixture(legacyDatabase);
  const migrated = service.db.notes[0];

  assert.ok(migrated.share_token.startsWith("legacy_"));
  assert.ok(migrated.manage_token_hash);

  const view = service.getSharedNote({ share_token: migrated.share_token });
  assert.equal(view.status, "locked_sent");
  assert.equal(view.content, null);
});
