import path from "node:path";
import { DEFAULT_DB_PATH } from "../storage/database.js";

const SUPPORTED_STORAGE_ADAPTERS = new Set(["file", "upstash"]);
const DEFAULT_UPSTASH_KEY = "future-note:db";

export class RuntimeConfigError extends Error {
  constructor(message, { code = "invalid_runtime_config" } = {}) {
    super(message);
    this.name = "RuntimeConfigError";
    this.code = code;
  }
}

function normalizeAdapterName(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized || "file";
}

function normalizePublicBaseUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new RuntimeConfigError("PUBLIC_BASE_URL must be a valid absolute URL.", {
      code: "invalid_public_base_url",
    });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new RuntimeConfigError("PUBLIC_BASE_URL must use http or https.", {
      code: "invalid_public_base_url_protocol",
    });
  }

  parsed.pathname = "";
  parsed.search = "";
  parsed.hash = "";
  const normalized = parsed.toString();
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function resolveRuntimeMode(env) {
  const nodeEnv = String(env.NODE_ENV ?? "development").trim().toLowerCase();
  const isProduction = nodeEnv === "production";
  return { nodeEnv: nodeEnv || "development", isProduction };
}

export function loadRuntimeConfig(env = process.env) {
  const mode = resolveRuntimeMode(env);
  const requestedAdapter = normalizeAdapterName(
    env.STORAGE_ADAPTER ?? (mode.isProduction ? "upstash" : "file")
  );

  if (!SUPPORTED_STORAGE_ADAPTERS.has(requestedAdapter)) {
    throw new RuntimeConfigError(
      `Unsupported STORAGE_ADAPTER '${requestedAdapter}'. Use one of: ${Array.from(
        SUPPORTED_STORAGE_ADAPTERS
      ).join(", ")}.`,
      { code: "unsupported_storage_adapter" }
    );
  }

  const publicBaseUrl = normalizePublicBaseUrl(env.PUBLIC_BASE_URL);
  if (mode.isProduction && !publicBaseUrl) {
    throw new RuntimeConfigError("PUBLIC_BASE_URL is required when NODE_ENV=production.", {
      code: "missing_public_base_url",
    });
  }

  if (mode.isProduction && requestedAdapter === "file") {
    throw new RuntimeConfigError(
      "STORAGE_ADAPTER=file is not allowed in production. Configure a durable adapter.",
      { code: "ephemeral_storage_not_allowed" }
    );
  }

  if (requestedAdapter === "upstash") {
    const restUrl = String(env.UPSTASH_REDIS_REST_URL ?? "").trim();
    const restToken = String(env.UPSTASH_REDIS_REST_TOKEN ?? "").trim();
    const key = String(env.UPSTASH_REDIS_KEY ?? DEFAULT_UPSTASH_KEY).trim() || DEFAULT_UPSTASH_KEY;

    if (!restUrl || !restToken) {
      throw new RuntimeConfigError(
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required for STORAGE_ADAPTER=upstash.",
        { code: "missing_upstash_credentials" }
      );
    }

    return {
      ...mode,
      publicBaseUrl,
      storage: {
        adapter: "upstash",
        upstash: {
          restUrl: restUrl.endsWith("/") ? restUrl.slice(0, -1) : restUrl,
          restToken,
          key,
        },
      },
    };
  }

  const filePathRaw = String(env.FILE_DB_PATH ?? DEFAULT_DB_PATH).trim() || DEFAULT_DB_PATH;
  const filePath = path.resolve(filePathRaw);

  return {
    ...mode,
    publicBaseUrl,
    storage: {
      adapter: "file",
      file: {
        filePath,
      },
    },
  };
}
