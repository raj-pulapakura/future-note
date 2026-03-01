import { createDefaultDatabase, DATABASE_SCHEMA_VERSION, ensureNoteRecordShape } from "./schema.js";

function ensureNotificationShape(notification = {}) {
  return {
    id: notification.id ?? null,
    event_type: notification.event_type ?? "unknown",
    note_id: notification.note_id ?? null,
    for_user_id: notification.for_user_id ?? null,
    triggered_by: notification.triggered_by ?? null,
    created_at: notification.created_at ?? null,
    payload: notification.payload ?? {},
  };
}

export function migrateDatabase(rawDatabase) {
  const base = createDefaultDatabase();
  const merged = rawDatabase && typeof rawDatabase === "object" ? { ...base, ...rawDatabase } : base;

  const notes = Array.isArray(merged.notes) ? merged.notes : [];
  const notifications = Array.isArray(merged.notifications) ? merged.notifications : [];

  return {
    schema_version: DATABASE_SCHEMA_VERSION,
    notes: notes.map((note) => ensureNoteRecordShape(note)),
    notifications: notifications.map((notification) => ensureNotificationShape(notification)),
  };
}
