export const SENT_HISTORY_KEY = "future-note/sent-history";
export const SENT_HISTORY_VERSION = 1;

function normalizeEntry(entry = {}) {
  const noteId = String(entry.note_id ?? "").trim();
  const shareToken = String(entry.share_token ?? "").trim();
  const shareUrl = String(entry.share_url ?? "").trim();
  const manageToken = String(entry.manage_token ?? "").trim();
  const message = typeof entry.message === "string" ? entry.message.trim() : "";

  if (!noteId || !shareToken || !shareUrl || !manageToken) {
    return null;
  }

  return {
    note_id: noteId,
    share_token: shareToken,
    share_url: shareUrl,
    manage_token: manageToken,
    status: entry.status === "revealed" ? "revealed" : "locked_sent",
    created_at: entry.created_at ?? null,
    sent_at: entry.sent_at ?? null,
    revealed_at: entry.revealed_at ?? null,
    recipient_unlocked_at: entry.recipient_unlocked_at ?? null,
    content_hash: entry.content_hash ?? null,
    fingerprint_summary: entry.fingerprint_summary ?? null,
    message: message || null,
  };
}

export function parseSentHistory(rawValue) {
  if (!rawValue) {
    return { entries: [], recovered: false };
  }

  try {
    const parsed = JSON.parse(rawValue);
    const rawEntries = Array.isArray(parsed) ? parsed : Array.isArray(parsed.entries) ? parsed.entries : [];
    const normalized = rawEntries.map((entry) => normalizeEntry(entry)).filter(Boolean);
    const deduped = [];
    const seen = new Set();

    for (const entry of normalized) {
      if (!seen.has(entry.note_id)) {
        seen.add(entry.note_id);
        deduped.push(entry);
      }
    }

    const recovered =
      !parsed ||
      parsed.version !== SENT_HISTORY_VERSION ||
      rawEntries.length !== deduped.length ||
      !Array.isArray(parsed.entries);

    return { entries: deduped, recovered };
  } catch {
    return { entries: [], recovered: true };
  }
}

export function loadSentHistory(storage = globalThis.localStorage) {
  const raw = storage?.getItem?.(SENT_HISTORY_KEY) ?? "";
  return parseSentHistory(raw);
}

export function saveSentHistory(entries, storage = globalThis.localStorage) {
  const normalized = Array.isArray(entries)
    ? entries.map((entry) => normalizeEntry(entry)).filter(Boolean)
    : [];

  const payload = {
    version: SENT_HISTORY_VERSION,
    entries: normalized,
  };

  storage?.setItem?.(SENT_HISTORY_KEY, JSON.stringify(payload));
  return normalized;
}

export function upsertSentHistoryEntry(entry, storage = globalThis.localStorage) {
  const candidate = normalizeEntry(entry);
  if (!candidate) {
    return loadSentHistory(storage).entries;
  }

  const { entries } = loadSentHistory(storage);
  const next = entries.filter((item) => item.note_id !== candidate.note_id);
  next.unshift(candidate);
  return saveSentHistory(next, storage);
}

export function patchSentHistoryEntry(noteId, patch, storage = globalThis.localStorage) {
  const normalizedId = String(noteId ?? "").trim();
  const { entries } = loadSentHistory(storage);

  const next = entries.map((entry) => {
    if (entry.note_id !== normalizedId) {
      return entry;
    }

    return normalizeEntry({ ...entry, ...patch }) ?? entry;
  });

  return saveSentHistory(next, storage);
}
