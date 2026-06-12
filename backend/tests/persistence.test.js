const fs = require("fs");
const os = require("os");
const path = require("path");

describe("JSON store persistence", () => {
  let dataDir;

  beforeEach(() => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "zentrix-persistence-"));
    process.env.DATA_DIR = dataDir;
    jest.resetModules();
  });

  afterEach(() => {
    fs.rmSync(dataDir, { recursive: true, force: true });
    delete process.env.DATA_DIR;
    jest.resetModules();
  });

  it("reloads persisted agents and tasks after module restart", () => {
    const agentsStore = require("../src/stores/agentsStore");
    const tasksStore = require("../src/stores/tasksStore");

    const agent = {
      id: "agent-1",
      name: "Persistent Agent",
      description: "Stored on disk",
      model: "gpt-4",
      status: "idle",
      createdAt: "2026-06-12T00:00:00.000Z",
      updatedAt: "2026-06-12T00:00:00.000Z",
    };

    const task = {
      id: "task-1",
      title: "Persistent Task",
      description: "Stored on disk",
      agentId: agent.id,
      status: "pending",
      result: null,
      createdAt: "2026-06-12T00:00:00.000Z",
      updatedAt: "2026-06-12T00:00:00.000Z",
    };

    agentsStore.set(agent);
    tasksStore.set(task);

    jest.resetModules();

    const reloadedAgentsStore = require("../src/stores/agentsStore");
    const reloadedTasksStore = require("../src/stores/tasksStore");

    expect(reloadedAgentsStore.getAll()).toEqual([agent]);
    expect(reloadedTasksStore.getAll()).toEqual([task]);
  });
});
