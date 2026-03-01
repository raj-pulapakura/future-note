import { DomainError } from "../errors.js";
import { NoteService } from "../services/note-service.js";

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(`${JSON.stringify(payload)}\n`);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new DomainError("Payload too large.", { status: 413, code: "payload_too_large" }));
      }
    });

    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new DomainError("Invalid JSON payload.", { status: 400, code: "invalid_json" }));
      }
    });

    req.on("error", reject);
  });
}

function requestOrigin(req) {
  const forwardedProto = String(req.headers["x-forwarded-proto"] ?? "").split(",")[0].trim();
  const protocol = forwardedProto || "http";
  const host = String(req.headers.host ?? "localhost:4173");
  return `${protocol}://${host}`;
}

function resolvePublicOrigin(req, publicBaseUrl = null) {
  const explicit = String(publicBaseUrl ?? "").trim();
  if (explicit) {
    return explicit;
  }

  return requestOrigin(req);
}

function parseSharePath(pathname) {
  const match = /^\/api\/share\/([^/]+?)(?:\/(unlock))?$/.exec(pathname);
  if (!match) {
    return null;
  }

  return {
    shareToken: decodeURIComponent(match[1]),
    action: match[2] ?? null,
  };
}

function parseManagePath(pathname) {
  const match = /^\/api\/manage\/([^/]+?)(?:\/(unlock))?$/.exec(pathname);
  if (!match) {
    return null;
  }

  return {
    noteId: decodeURIComponent(match[1]),
    action: match[2] ?? null,
  };
}

function toPersistenceError(error) {
  if (error instanceof DomainError) {
    return error;
  }

  return new DomainError("Persistence dependency unavailable.", {
    status: 503,
    code: "persistence_unavailable",
  });
}

async function withNoteService(storage, { persist = false } = {}, execute) {
  let database;
  try {
    database = await storage.loadDatabase();
  } catch (error) {
    throw toPersistenceError(error);
  }

  const noteService = new NoteService({ database });
  const result = await execute(noteService);

  if (persist) {
    try {
      await storage.saveDatabase(database);
    } catch (error) {
      throw toPersistenceError(error);
    }
  }

  return result;
}

async function getHealth(storage) {
  try {
    const report = await storage.healthCheck();
    if (report && typeof report === "object") {
      return {
        ok: Boolean(report.ok),
        ...report,
      };
    }

    return { ok: false, code: "persistence_unavailable" };
  } catch {
    return { ok: false, code: "persistence_unavailable" };
  }
}

export async function handleApiRequest(req, res, { storage, publicBaseUrl = null } = {}) {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;

  if (!pathname.startsWith("/api/")) {
    return false;
  }

  if (!storage) {
    throw new Error("handleApiRequest requires a storage adapter context.");
  }

  try {
    if (req.method === "GET" && pathname === "/api/health") {
      const health = await getHealth(storage);
      json(res, health.ok ? 200 : 503, {
        ok: health.ok,
        storage: health,
      });
      return true;
    }

    if (req.method === "POST" && pathname === "/api/notes") {
      const body = await readJsonBody(req);
      const payload = await withNoteService(storage, { persist: true }, (noteService) =>
        noteService.createLockedNote({
          message: body.message,
          origin: resolvePublicOrigin(req, publicBaseUrl),
        })
      );
      json(res, 201, payload);
      return true;
    }

    const sharePath = parseSharePath(pathname);
    if (sharePath && req.method === "GET" && !sharePath.action) {
      const note = await withNoteService(storage, { persist: false }, (noteService) =>
        noteService.getSharedNote({ share_token: sharePath.shareToken })
      );
      json(res, 200, { note });
      return true;
    }

    if (sharePath && req.method === "POST" && sharePath.action === "unlock") {
      const note = await withNoteService(storage, { persist: true }, (noteService) =>
        noteService.recipientUnlock({ share_token: sharePath.shareToken })
      );
      json(res, 200, { note });
      return true;
    }

    const managePath = parseManagePath(pathname);
    if (managePath && req.method === "POST" && managePath.action === "unlock") {
      const body = await readJsonBody(req);
      const result = await withNoteService(storage, { persist: true }, (noteService) =>
        noteService.senderUnlock({
          note_id: managePath.noteId,
          manage_token: body.manage_token,
        })
      );
      json(res, 200, result);
      return true;
    }

    if (managePath && req.method === "GET" && !managePath.action) {
      const manageToken = url.searchParams.get("manage_token") ?? "";
      const note = await withNoteService(storage, { persist: false }, (noteService) =>
        noteService.getManageView({
          note_id: managePath.noteId,
          manage_token: manageToken,
        })
      );
      json(res, 200, { note });
      return true;
    }

    json(res, 404, {
      error: {
        code: "not_found",
        message: `No route for ${req.method} ${pathname}.`,
      },
    });
    return true;
  } catch (error) {
    if (error instanceof DomainError) {
      json(res, error.status, {
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return true;
    }

    console.error(error);
    json(res, 500, {
      error: {
        code: "internal_error",
        message: "Unexpected server failure.",
      },
    });
    return true;
  }
}
