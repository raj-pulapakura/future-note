import { handleApiRequest } from "../backend/api/router.js";
import { loadRuntimeConfig } from "../backend/config/runtime.js";
import { createStorageAdapter } from "../backend/storage/create-storage-adapter.js";

let cachedContext = null;

function getRuntimeContext() {
  if (cachedContext) {
    return cachedContext;
  }

  const runtimeConfig = loadRuntimeConfig(process.env);
  const storage = createStorageAdapter(runtimeConfig);
  cachedContext = { runtimeConfig, storage };
  return cachedContext;
}

export default async function handler(req, res) {
  let runtimeContext;
  try {
    runtimeContext = getRuntimeContext();
  } catch (error) {
    console.error("Runtime configuration failed:", error);
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(
      `${JSON.stringify({
        error: {
          code: error?.code ?? "runtime_misconfigured",
          message:
            typeof error?.message === "string" && error.message
              ? error.message
              : "Runtime configuration is invalid.",
        },
      })}\n`
    );
    return;
  }

  const handled = await handleApiRequest(req, res, {
    storage: runtimeContext.storage,
    publicBaseUrl: runtimeContext.runtimeConfig.publicBaseUrl,
  });

  if (handled) {
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  res.end(
    `${JSON.stringify({
      error: {
        code: "not_found",
        message: `No route for ${req.method} ${req.url}.`,
      },
    })}\n`
  );
}
