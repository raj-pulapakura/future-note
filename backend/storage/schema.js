import { hashValue } from "../security.js";

export const DATABASE_SCHEMA_VERSION = 2;

export const NOTE_SCHEMA_FIELDS = Object.freeze([
  "id",
  "status",
  "locked_content",
  "content_hash",
  "created_at",
  "sent_at",
  "revealed_at",
  "recipient_unlocked_at",
  "share_token",
  "manage_token_hash",
  "legacy_sender_id",
  "legacy_recipient_ids",
]);

function deterministicTokenFromId(id) {
  const seed = String(id ?? "legacy-note");
  return `legacy_${hashValue(seed).slice(0, 24)}`;
}

export function createDefaultDatabase() {
  return {
    schema_version: DATABASE_SCHEMA_VERSION,
    notes: [],
    notifications: [],
  };
}

export function ensureNoteRecordShape(note = {}) {
  const id = note.id ?? null;
  const lockedContent = note.locked_content ?? note.draft_content ?? "";
  const status = note.status === "revealed" ? "revealed" : "locked_sent";

  return {
    id,
    status,
    locked_content: String(lockedContent ?? ""),
    content_hash: note.content_hash ?? hashValue(lockedContent ?? ""),
    created_at: note.created_at ?? note.sent_at ?? null,
    sent_at: note.sent_at ?? note.created_at ?? null,
    revealed_at: status === "revealed" ? note.revealed_at ?? null : null,
    recipient_unlocked_at: note.recipient_unlocked_at ?? null,
    share_token: note.share_token ?? deterministicTokenFromId(id),
    manage_token_hash: note.manage_token_hash ?? hashValue(`legacy-manage:${id ?? "missing"}`),
    legacy_sender_id: note.legacy_sender_id ?? note.sender_id ?? null,
    legacy_recipient_ids: Array.isArray(note.legacy_recipient_ids)
      ? [...note.legacy_recipient_ids]
      : Array.isArray(note.recipient_ids)
        ? [...note.recipient_ids]
        : [],
  };
}
