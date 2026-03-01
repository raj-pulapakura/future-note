import { DEFAULT_DB_PATH, loadDatabase, saveDatabase } from "../database.js";

export class FileStorageAdapter {
  constructor({ filePath = DEFAULT_DB_PATH } = {}) {
    this.filePath = filePath;
    this.kind = "file";
  }

  async loadDatabase() {
    return loadDatabase(this.filePath);
  }

  async saveDatabase(database) {
    await saveDatabase(database, this.filePath);
  }

  async healthCheck() {
    try {
      await this.loadDatabase();
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
