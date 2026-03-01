import fs from "node:fs/promises";
import path from "node:path";
import { migrateDatabase } from "./migrations.js";

export const DEFAULT_DB_PATH = path.resolve(process.cwd(), "data/db.json");

export async function loadDatabase(filePath = DEFAULT_DB_PATH) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return migrateDatabase(JSON.parse(raw));
  } catch (error) {
    if (error && error.code !== "ENOENT") {
      throw error;
    }

    const initial = migrateDatabase(null);
    await saveDatabase(initial, filePath);
    return initial;
  }
}

export async function saveDatabase(database, filePath = DEFAULT_DB_PATH) {
  const migrated = migrateDatabase(database);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(migrated, null, 2)}\n`, "utf8");
}
