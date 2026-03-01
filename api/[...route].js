import { handleApiRequest } from "../backend/api/router.js";
import { loadRuntimeConfig } from "../backend/config/runtime.js";
import { createStorageAdapter } from "../backend/storage/create-storage-adapter.js";

const runtimeConfig = loadRuntimeConfig(process.env);
const storage = createStorageAdapter(runtimeConfig);

export default async function handler(req, res) {
  const handled = await handleApiRequest(req, res, {
    storage,
    publicBaseUrl: runtimeConfig.publicBaseUrl,
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
