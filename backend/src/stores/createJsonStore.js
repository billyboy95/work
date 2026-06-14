const fs = require("fs");
const path = require("path");

function cloneRecord(record) {
  return JSON.parse(JSON.stringify(record));
}

function createJsonStore({ filePath }) {
  let initialized = false;
  let records = new Map();

  function persist() {
    fs.writeFileSync(
      filePath,
      `${JSON.stringify(Array.from(records.values()), null, 2)}\n`,
      "utf8",
    );
  }

  function init() {
    if (initialized) {
      return;
    }

    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "[]\n", "utf8");
      initialized = true;
      return;
    }

    const raw = fs.readFileSync(filePath, "utf8").trim();
    const items = raw ? JSON.parse(raw) : [];
    records = new Map(items.map((item) => [item.id, item]));
    initialized = true;
  }

  function ensureInitialized() {
    if (!initialized) {
      init();
    }
  }

  return {
    init,
    reload() {
      initialized = false;
      records = new Map();
      init();
    },
    list() {
      ensureInitialized();
      return Array.from(records.values()).map(cloneRecord);
    },
    get(id) {
      ensureInitialized();
      const record = records.get(id);
      return record ? cloneRecord(record) : null;
    },
    set(record) {
      ensureInitialized();
      records.set(record.id, cloneRecord(record));
      persist();
      return cloneRecord(record);
    },
    delete(id) {
      ensureInitialized();
      const existed = records.delete(id);
      if (existed) {
        persist();
      }

      return existed;
    },
    clear() {
      ensureInitialized();
      records = new Map();
      persist();
    },
    getFilePath() {
      return filePath;
    },
  };
}

module.exports = createJsonStore;
