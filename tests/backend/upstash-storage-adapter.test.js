import assert from "node:assert/strict";
import test from "node:test";
import { UpstashStorageAdapter } from "../../backend/storage/adapters/upstash-storage-adapter.js";

function createUpstashFetchStub() {
  const memory = new Map();

  const fetchStub = async (_url, options) => {
    const command = JSON.parse(String(options?.body ?? "[]"));
    const [op, key, value] = command;

    if (op === "PING") {
      return new Response(JSON.stringify({ result: "PONG" }), { status: 200 });
    }

    if (op === "GET") {
      return new Response(JSON.stringify({ result: memory.has(key) ? memory.get(key) : null }), {
        status: 200,
      });
    }

    if (op === "SET") {
      memory.set(key, value);
      return new Response(JSON.stringify({ result: "OK" }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "unsupported command" }), { status: 400 });
  };

  return { fetchStub, memory };
}

test("upstash adapter loads default schema when key does not exist", async () => {
  const { fetchStub } = createUpstashFetchStub();
  const adapter = new UpstashStorageAdapter({
    restUrl: "https://example.upstash.io",
    restToken: "token",
    key: "future-note:db",
    fetchFn: fetchStub,
  });

  const database = await adapter.loadDatabase();
  assert.equal(database.schema_version, 2);
  assert.deepEqual(database.notes, []);
});

test("upstash adapter saves and reloads database payload", async () => {
  const { fetchStub } = createUpstashFetchStub();
  const adapter = new UpstashStorageAdapter({
    restUrl: "https://example.upstash.io",
    restToken: "token",
    key: "future-note:db",
    fetchFn: fetchStub,
  });

  await adapter.saveDatabase({
    schema_version: 2,
    notes: [
      {
        id: "note-1",
        status: "locked_sent",
        locked_content: "hello",
        content_hash: "hash",
        created_at: "2026-03-01T00:00:00.000Z",
        sent_at: "2026-03-01T00:00:00.000Z",
        revealed_at: null,
        recipient_unlocked_at: null,
        share_token: "share",
        manage_token_hash: "manage-hash",
        legacy_sender_id: null,
        legacy_recipient_ids: [],
      },
    ],
    notifications: [],
  });

  const loaded = await adapter.loadDatabase();
  assert.equal(loaded.notes.length, 1);
  assert.equal(loaded.notes[0].locked_content, "hello");
});

test("upstash adapter health check reports unavailable on fetch failure", async () => {
  const adapter = new UpstashStorageAdapter({
    restUrl: "https://example.upstash.io",
    restToken: "token",
    key: "future-note:db",
    fetchFn: async () => {
      throw new Error("network down");
    },
  });

  const health = await adapter.healthCheck();
  assert.equal(health.ok, false);
  assert.equal(health.code, "persistence_unavailable");
});
