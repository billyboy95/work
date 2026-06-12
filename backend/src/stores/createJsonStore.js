const fs = require("fs");
const path = require("path");

function createJsonStore(filePath) {
  let cache = new Map();
  let loaded = false;

  function ensureDirectory() {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  function writeFile() {
    ensureDirectory();

    const tempFilePath = `${filePath}.tmp`;
    const records = JSON.stringify(Array.from(cache.values()), null, 2);

    fs.writeFileSync(tempFilePath, records);
    fs.renameSync(tempFilePath, filePath);
  }

  function load() {
    ensureDirectory();

    if (!fs.existsSync(filePath)) {
      cache = new Map();
      loaded = true;
      return;
    }

    const raw = fs.readFileSync(filePath, "utf8").trim();

    if (!raw) {
      cache = new Map();
      loaded = true;
      return;
    }

    const records = JSON.parse(raw);
    cache = new Map(records.map((record) => [record.id, record]));
    loaded = true;
  }

  function ensureLoaded() {
    if (!loaded) {
      load();
    }
  }

  return {
    load,
    getAll() {
      ensureLoaded();
      return Array.from(cache.values());
    },
    get(id) {
      ensureLoaded();
      return cache.get(id);
    },
    set(record) {
      ensureLoaded();
      cache.set(record.id, record);
      writeFile();
      return record;
    },
    delete(id) {
      ensureLoaded();

      if (!cache.has(id)) {
        return false;
      }

      cache.delete(id);
      writeFile();
      return true;
    },
    clear() {
      cache = new Map();
      loaded = true;
      writeFile();
    },
  };
}

module.exports = createJsonStore;
