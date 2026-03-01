import assert from "node:assert/strict";
import test from "node:test";
import { buildCreatePayload } from "../../public/create-flow.js";
import {
  SENT_HISTORY_KEY,
  loadSentHistory,
  parseSentHistory,
  upsertSentHistoryEntry,
} from "../../public/local-history.js";
import {
  formatMoment,
  renderRecipientCard,
  renderSentHistoryItem,
  resolveEmotionPreset,
} from "../../public/ui.js";

function createMemoryStorage() {
  const data = new Map();

  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

test("minimal create flow trims and validates input", () => {
  const payload = buildCreatePayload("  hello future  ");
  assert.deepEqual(payload, { message: "hello future" });

  assert.throws(
    () => buildCreatePayload("   "),
    (error) => error.message === "Message is required."
  );
});

test("local history persistence is versioned and resilient to corruption", () => {
  const storage = createMemoryStorage();

  upsertSentHistoryEntry(
    {
      note_id: "note-1",
      share_token: "share-token-1",
      share_url: "https://future-note.test/n/share-token-1",
      manage_token: "manage-token-1",
      status: "locked_sent",
      created_at: "2026-03-01T10:00:00.000Z",
      sent_at: "2026-03-01T10:00:00.000Z",
      revealed_at: null,
      recipient_unlocked_at: null,
      content_hash: "abc",
      message: "i knew this would happen",
    },
    storage
  );

  const loaded = loadSentHistory(storage);
  assert.equal(loaded.recovered, false);
  assert.equal(loaded.entries.length, 1);
  assert.equal(loaded.entries[0].message, "i knew this would happen");

  storage.setItem(SENT_HISTORY_KEY, "{broken json");
  const recovered = loadSentHistory(storage);
  assert.equal(recovered.recovered, true);
  assert.equal(recovered.entries.length, 0);

  const fromParser = parseSentHistory("[]");
  assert.equal(fromParser.recovered, true);
});

test("sender view keeps proof disclosure while recipient view stays minimal", () => {
  const proofNote = {
    created_at: "2026-03-01T10:00:00.000Z",
    sent_at: "2026-03-01T10:01:00.000Z",
    revealed_at: "2026-03-01T10:02:00.000Z",
    content_hash: "3f54e37f7aa6d0047d98fd63f7f4ffec",
    fingerprint_summary: "3f54e37f7a...f4ffec",
  };

  const senderHtml = renderSentHistoryItem({
    note_id: "note-1",
    share_url: "https://future-note.test/n/share-token-1",
    status: "revealed",
    message: "I wrote this first.",
    ...proofNote,
  });

  const recipientHtml = renderRecipientCard(
    {
      status: "revealed",
      content_visible: false,
      content: null,
      ...proofNote,
    },
    { reducedMotion: true }
  );

  assert.ok(senderHtml.includes("<details"));
  assert.ok(!recipientHtml.includes("<details"));
  assert.ok(!recipientHtml.includes("proof-grid"));
  assert.ok(senderHtml.includes(formatMoment(proofNote.created_at)));
  assert.ok(senderHtml.includes(formatMoment(proofNote.revealed_at)));
  assert.ok(senderHtml.includes(proofNote.fingerprint_summary));
  assert.ok(senderHtml.includes("I wrote this first."));
});

test("recipient rendering reflects locked, ready, and visible message-first stages", () => {
  const lockedHtml = renderRecipientCard({
    status: "locked_sent",
    content_visible: false,
    content: null,
    created_at: "2026-03-01T10:00:00.000Z",
    sent_at: "2026-03-01T10:01:00.000Z",
    revealed_at: null,
    content_hash: "abc",
  });

  assert.ok(!lockedHtml.includes("Sealed"));
  assert.ok(lockedHtml.includes('data-stage="locked"'));
  assert.ok(!lockedHtml.includes("recipient-unlock"));
  assert.ok(!lockedHtml.includes("proof-grid"));

  const unlockableHtml = renderRecipientCard(
    {
      status: "revealed",
      content_visible: false,
      content: null,
      created_at: "2026-03-01T10:00:00.000Z",
      sent_at: "2026-03-01T10:01:00.000Z",
      revealed_at: "2026-03-01T10:02:00.000Z",
      content_hash: "abc",
    },
    { reducedMotion: true }
  );

  assert.ok(unlockableHtml.includes('data-stage="ready"'));
  assert.ok(unlockableHtml.includes('data-motion="reduced"'));
  assert.ok(unlockableHtml.includes("recipient-unlock"));
  assert.ok(unlockableHtml.includes("Open note"));

  const visibleHtml = renderRecipientCard({
    status: "revealed",
    content_visible: true,
    content: "I told you so",
    created_at: "2026-03-01T10:00:00.000Z",
    sent_at: "2026-03-01T10:01:00.000Z",
    revealed_at: "2026-03-01T10:02:00.000Z",
    content_hash: "abc",
  });

  assert.ok(visibleHtml.includes('data-stage="visible"'));
  assert.ok(visibleHtml.includes("I told you so"));
  assert.ok(!visibleHtml.includes("recipient-unlock"));
  assert.ok(!visibleHtml.includes("Message is hidden until sender unlock"));
});

test("emotion presets support reduced-motion variants", () => {
  const sendRelief = resolveEmotionPreset("send_relief");
  assert.deepEqual(sendRelief, {
    preset: "send_relief",
    className: "emotion-send-relief",
    motionMode: "full",
  });

  const revealReduced = resolveEmotionPreset("reveal_release", { reducedMotion: true });
  assert.equal(revealReduced.className, "emotion-reveal-release");
  assert.equal(revealReduced.motionMode, "reduced");

  const fallback = resolveEmotionPreset("unsupported");
  assert.equal(fallback.preset, "locked_anticipation");
});
