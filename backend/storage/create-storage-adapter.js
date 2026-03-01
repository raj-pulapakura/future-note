import { assertStorageAdapter } from "./adapter-interface.js";
import { FileStorageAdapter } from "./adapters/file-storage-adapter.js";
import { UpstashStorageAdapter } from "./adapters/upstash-storage-adapter.js";

export function createStorageAdapter(runtimeConfig, { fetchFn = globalThis.fetch } = {}) {
  const adapterName = runtimeConfig?.storage?.adapter;

  if (adapterName === "file") {
    return assertStorageAdapter(
      new FileStorageAdapter({
        filePath: runtimeConfig.storage.file.filePath,
      })
    );
  }

  if (adapterName === "upstash") {
    return assertStorageAdapter(
      new UpstashStorageAdapter({
        restUrl: runtimeConfig.storage.upstash.restUrl,
        restToken: runtimeConfig.storage.upstash.restToken,
        key: runtimeConfig.storage.upstash.key,
        fetchFn,
      })
    );
  }

  throw new Error(`Unsupported storage adapter '${String(adapterName ?? "")}'.`);
}
