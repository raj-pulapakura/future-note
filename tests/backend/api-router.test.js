import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import { handleApiRequest } from "../../backend/api/router.js";
import { createDefaultDatabase } from "../../backend/storage/schema.js";

function createInMemoryStorage({
  initialDatabase = createDefaultDatabase(),
  healthReport = { ok: true, adapter: "memory" },
  failLoad = false,
  failSave = false,
} = {}) {
  let snapshot = structuredClone(initialDatabase);

  return {
    async loadDatabase() {
      if (failLoad) {
        throw new Error("load unavailable");
      }

      return structuredClone(snapshot);
    },
    async saveDatabase(database) {
      if (failSave) {
        throw new Error("save unavailable");
      }

      snapshot = structuredClone(database);
    },
    async healthCheck() {
      return typeof healthReport === "function" ? healthReport() : healthReport;
    },
  };
}

function createMockRequest({ method = "GET", url = "/api/health", headers = {}, body = null } = {}) {
  const request = new EventEmitter();
  request.method = method;
  request.url = url;
  request.headers = headers;

  process.nextTick(() => {
    if (body !== null && body !== undefined) {
      const raw = typeof body === "string" ? body : JSON.stringify(body);
      request.emit("data", raw);
    }

    request.emit("end");
  });

  return request;
}

function createMockResponse() {
  const response = {
    statusCode: null,
    headers: {},
    body: "",
  };

  let resolveDone;
  response.done = new Promise((resolve) => {
    resolveDone = resolve;
  });

  response.writeHead = (statusCode, headers = {}) => {
    response.statusCode = statusCode;
    response.headers = headers;
  };

  response.end = (chunk = "") => {
    response.body += String(chunk);
    resolveDone();
  };

  return response;
}

async function sendApiRequest({ storage, publicBaseUrl = null, reqOptions }) {
  const req = createMockRequest(reqOptions);
  const res = createMockResponse();
  const handled = await handleApiRequest(req, res, { storage, publicBaseUrl });
  await res.done;
  return {
    handled,
    statusCode: res.statusCode,
    body: res.body ? JSON.parse(res.body) : null,
    headers: res.headers,
  };
}

test("create note uses canonical PUBLIC_BASE_URL when provided", async () => {
  const storage = createInMemoryStorage();

  const response = await sendApiRequest({
    storage,
    publicBaseUrl: "https://future-note.app",
    reqOptions: {
      method: "POST",
      url: "/api/notes",
      headers: {
        host: "127.0.0.1:4173",
      },
      body: {
        message: "Production origin test",
      },
    },
  });

  assert.equal(response.handled, true);
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.share_url.startsWith("https://future-note.app/n/"), true);
});

test("health endpoint reflects persistence readiness", async () => {
  const storage = createInMemoryStorage({
    healthReport: { ok: false, adapter: "memory", code: "persistence_unavailable" },
  });

  const response = await sendApiRequest({
    storage,
    reqOptions: {
      method: "GET",
      url: "/api/health",
    },
  });

  assert.equal(response.statusCode, 503);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.storage.code, "persistence_unavailable");
});

test("persistence dependency failure returns stable domain error response", async () => {
  const storage = createInMemoryStorage({ failLoad: true });

  const response = await sendApiRequest({
    storage,
    reqOptions: {
      method: "POST",
      url: "/api/notes",
      body: {
        message: "Will fail",
      },
    },
  });

  assert.equal(response.statusCode, 503);
  assert.equal(response.body.error.code, "persistence_unavailable");
  assert.equal(response.body.error.message, "Persistence dependency unavailable.");
});
