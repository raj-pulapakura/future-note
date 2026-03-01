import assert from "node:assert/strict";
import test from "node:test";
import { loadRuntimeConfig, RuntimeConfigError } from "../../backend/config/runtime.js";

test("runtime config defaults to file adapter in development", () => {
  const config = loadRuntimeConfig({
    NODE_ENV: "development",
  });

  assert.equal(config.isProduction, false);
  assert.equal(config.storage.adapter, "file");
  assert.ok(config.storage.file.filePath);
});

test("runtime config requires PUBLIC_BASE_URL in production", () => {
  assert.throws(
    () => {
      loadRuntimeConfig({
        NODE_ENV: "production",
        STORAGE_ADAPTER: "upstash",
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "token",
      });
    },
    (error) => error instanceof RuntimeConfigError && error.code === "missing_public_base_url"
  );
});

test("runtime config rejects file adapter in production", () => {
  assert.throws(
    () => {
      loadRuntimeConfig({
        NODE_ENV: "production",
        STORAGE_ADAPTER: "file",
        PUBLIC_BASE_URL: "https://future-note.app",
      });
    },
    (error) => error instanceof RuntimeConfigError && error.code === "ephemeral_storage_not_allowed"
  );
});

test("runtime config validates upstash credentials when selected", () => {
  assert.throws(
    () => {
      loadRuntimeConfig({
        NODE_ENV: "production",
        STORAGE_ADAPTER: "upstash",
        PUBLIC_BASE_URL: "https://future-note.app",
      });
    },
    (error) => error instanceof RuntimeConfigError && error.code === "missing_upstash_credentials"
  );
});

test("runtime config returns normalized canonical origin for production", () => {
  const config = loadRuntimeConfig({
    NODE_ENV: "production",
    STORAGE_ADAPTER: "upstash",
    PUBLIC_BASE_URL: "https://future-note.app/",
    UPSTASH_REDIS_REST_URL: "https://example.upstash.io/",
    UPSTASH_REDIS_REST_TOKEN: "token",
  });

  assert.equal(config.publicBaseUrl, "https://future-note.app");
  assert.equal(config.storage.adapter, "upstash");
  assert.equal(config.storage.upstash.restUrl, "https://example.upstash.io");
});
