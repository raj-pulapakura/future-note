export function assertStorageAdapter(adapter) {
  const hasLoad = typeof adapter?.loadDatabase === "function";
  const hasSave = typeof adapter?.saveDatabase === "function";
  const hasHealth = typeof adapter?.healthCheck === "function";

  if (!hasLoad || !hasSave || !hasHealth) {
    throw new Error(
      "Storage adapter must implement loadDatabase(), saveDatabase(database), and healthCheck()."
    );
  }

  return adapter;
}
