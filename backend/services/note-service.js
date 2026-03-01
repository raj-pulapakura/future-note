import crypto from "node:crypto";
import { DomainError } from "../errors.js";
import { NOTE_STATUS, assertTransition } from "../lifecycle.js";
import { generateToken, hashValue, summarizeFingerprint, tokenMatchesHash } from "../security.js";
import { migrateDatabase } from "../storage/migrations.js";

function normalizeOrigin(origin) {
  const fallback = "http://localhost:4173";
  const normalized = String(origin ?? "").trim();
  if (!normalized) {
    return fallback;
  }

  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function buildShareUrl(origin, shareToken) {
  return `${normalizeOrigin(origin)}/n/${encodeURIComponent(shareToken)}`;
}

export class NoteService {
  constructor({ database, nowFn = () => new Date().toISOString(), idFn = () => crypto.randomUUID() } = {}) {
    if (!database) {
      throw new Error("NoteService requires a database object.");
    }

    this.db = migrateDatabase(database);
    database.schema_version = this.db.schema_version;
    database.notes = this.db.notes;
    database.notifications = this.db.notifications;

    this.nowFn = nowFn;
    this.idFn = idFn;
  }

  createLockedNote({ message, origin } = {}) {
    const content = String(message ?? "").trim();
    if (!content) {
      throw new DomainError("message is required.", { status: 422, code: "message_required" });
    }

    const now = this.nowFn();
    const noteId = this.idFn();
    const shareToken = generateToken(18);
    const manageToken = generateToken(24);

    const note = {
      id: noteId,
      status: NOTE_STATUS.LOCKED_SENT,
      locked_content: content,
      content_hash: hashValue(content),
      created_at: now,
      sent_at: now,
      revealed_at: null,
      recipient_unlocked_at: null,
      share_token: shareToken,
      manage_token_hash: hashValue(manageToken),
      legacy_sender_id: null,
      legacy_recipient_ids: [],
    };

    this.db.notes.push(note);

    return {
      note: this.toNoteSummary(note),
      share_token: shareToken,
      share_url: buildShareUrl(origin, shareToken),
      manage_token: manageToken,
    };
  }

  getSharedNote({ share_token } = {}) {
    const note = this.findByShareToken(share_token);
    return this.toSharedView(note);
  }

  senderUnlock({ note_id, manage_token } = {}) {
    const note = this.findById(note_id);
    this.assertManageToken(note, manage_token);

    if (note.status === NOTE_STATUS.REVEALED) {
      return {
        note: this.toNoteSummary(note),
        idempotent: true,
      };
    }

    assertTransition(note.status, NOTE_STATUS.REVEALED);
    note.status = NOTE_STATUS.REVEALED;
    note.revealed_at = note.revealed_at ?? this.nowFn();

    return {
      note: this.toNoteSummary(note),
      idempotent: false,
    };
  }

  getManageView({ note_id, manage_token } = {}) {
    const note = this.findById(note_id);
    this.assertManageToken(note, manage_token);
    return this.toNoteSummary(note);
  }

  recipientUnlock({ share_token } = {}) {
    const note = this.findByShareToken(share_token);

    if (note.status !== NOTE_STATUS.REVEALED) {
      throw new DomainError("Note is still locked by sender.", {
        status: 409,
        code: "note_still_locked",
      });
    }

    note.recipient_unlocked_at = note.recipient_unlocked_at ?? this.nowFn();
    return this.toSharedView(note);
  }

  findById(noteId) {
    const normalized = String(noteId ?? "").trim();
    const note = this.db.notes.find((item) => item.id === normalized);

    if (!note) {
      throw new DomainError(`Note '${normalized}' was not found.`, {
        status: 404,
        code: "note_not_found",
      });
    }

    return note;
  }

  findByShareToken(shareToken) {
    const normalized = String(shareToken ?? "").trim();
    const note = this.db.notes.find((item) => item.share_token === normalized);

    if (!note) {
      throw new DomainError("Share URL is invalid or expired.", {
        status: 404,
        code: "share_not_found",
      });
    }

    return note;
  }

  assertManageToken(note, token) {
    const normalized = String(token ?? "").trim();
    if (!normalized) {
      throw new DomainError("manage_token is required.", {
        status: 422,
        code: "manage_token_required",
      });
    }

    if (!tokenMatchesHash(normalized, note.manage_token_hash)) {
      throw new DomainError("Management token is invalid.", {
        status: 403,
        code: "invalid_manage_token",
      });
    }
  }

  toNoteSummary(note) {
    return {
      id: note.id,
      status: note.status,
      share_token: note.share_token,
      created_at: note.created_at,
      sent_at: note.sent_at,
      revealed_at: note.revealed_at,
      recipient_unlocked_at: note.recipient_unlocked_at,
      content_hash: note.content_hash,
      fingerprint_summary: summarizeFingerprint(note.content_hash),
      content: null,
      content_visible: false,
    };
  }

  toSharedView(note) {
    const contentVisible = note.status === NOTE_STATUS.REVEALED && Boolean(note.recipient_unlocked_at);

    return {
      id: note.id,
      status: note.status,
      share_token: note.share_token,
      created_at: note.created_at,
      sent_at: note.sent_at,
      revealed_at: note.revealed_at,
      recipient_unlocked_at: note.recipient_unlocked_at,
      content_hash: note.content_hash,
      fingerprint_summary: summarizeFingerprint(note.content_hash),
      content: contentVisible ? note.locked_content : null,
      content_visible: contentVisible,
      recipient_can_unlock: note.status === NOTE_STATUS.REVEALED,
    };
  }
}
