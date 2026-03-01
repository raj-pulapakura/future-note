import { migrateDatabase } from "../migrations.js";
import { createDefaultDatabase } from "../schema.js";

function normalizeFetchResponse(responsePayload) {
  if (!responsePayload || typeof responsePayload !== "object") {
    throw new Error("Invalid persistence response payload.");
  }

  if (responsePayload.error) {
    throw new Error(String(responsePayload.error));
  }

  return responsePayload.result;
}

export class UpstashStorageAdapter {
  constructor({ restUrl, restToken, key, fetchFn = globalThis.fetch } = {}) {
    if (typeof fetchFn !== "function") {
      throw new Error("UpstashStorageAdapter requires a fetch implementation.");
    }

    this.kind = "upstash";
    this.restUrl = String(restUrl ?? "").trim().replace(/\/+$/, "");
    this.restToken = String(restToken ?? "").trim();
    this.key = String(key ?? "future-note:db").trim() || "future-note:db";
    this.fetchFn = fetchFn;
  }

  async command(args) {
    if (!this.restUrl || !this.restToken) {
      throw new Error("Upstash adapter credentials are missing.");
    }

    const response = await this.fetchFn(this.restUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.restToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      throw new Error(`Persistence dependency returned HTTP ${response.status}.`);
    }

    const payload = await response.json();
    return normalizeFetchResponse(payload);
  }

  async loadDatabase() {
    const raw = await this.command(["GET", this.key]);
    if (raw === null || raw === undefined) {
      return migrateDatabase(createDefaultDatabase());
    }

    let parsed;
    try {
      parsed = JSON.parse(String(raw));
    } catch {
      throw new Error("Persistence dependency returned malformed database payload.");
    }

    return migrateDatabase(parsed);
  }

  async saveDatabase(database) {
    const payload = JSON.stringify(migrateDatabase(database));
    await this.command(["SET", this.key, payload]);
  }

  async healthCheck() {
    try {
      await this.command(["PING"]);
      return {
        ok: true,
        adapter: this.kind,
      };
    } catch {
      return {
        ok: false,
        adapter: this.kind,
        code: "persistence_unavailable",
      };
    }
  }
}
