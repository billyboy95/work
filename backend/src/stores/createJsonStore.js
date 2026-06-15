const fs = require("fs");
const path = require("path");

function ensureFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]\n", "utf8");
  }
}

function readRecords(filePath) {
  ensureFile(filePath);

  try {
    const raw = fs.readFileSync(filePath, "utf8").trim();
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    throw new Error(`Unable to read JSON store at ${filePath}: ${error.message}`);
  }
}

function writeRecords(filePath, records) {
  ensureFile(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

function createJsonStore(filePath) {
  return {
    list() {
      return readRecords(filePath);
    },

    get(id) {
      return readRecords(filePath).find((record) => record.id === id) || null;
    },

    set(record) {
      const records = readRecords(filePath);
      const index = records.findIndex((existingRecord) => existingRecord.id === record.id);

      if (index === -1) {
        records.push(record);
      } else {
        records[index] = record;
      }

      writeRecords(filePath, records);
      return record;
    },

    delete(id) {
      const records = readRecords(filePath);
      const nextRecords = records.filter((record) => record.id !== id);
      const deleted = nextRecords.length !== records.length;

      if (deleted) {
        writeRecords(filePath, nextRecords);
      }

      return deleted;
    },

    replaceAll(records) {
      writeRecords(filePath, records);
      return records;
    },
  };
}

module.exports = { createJsonStore };
