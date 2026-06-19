const { Router } = require("express");
const { v4: uuidv4 } = require("uuid");
const { agents } = require("../stores/agentsStore");
const { tasks, agentHasRunningTasks } = require("../stores/tasksStore");

const router = Router();
const VALID_STATUSES = new Set(["pending", "running", "completed", "failed"]);

function normalizeAgentId(agentId) {
  if (agentId === undefined) {
    return undefined;
  }

  return agentId || null;
}

function updateAgentStatus(agentId) {
  if (!agentId) {
    return;
  }

  const agent = agents.get(agentId);
  if (!agent) {
    return;
  }

  agent.status = agentHasRunningTasks(agentId) ? "busy" : "idle";
  agent.updatedAt = new Date().toISOString();
  agents.set(agent.id, agent);
}

router.get("/", (_req, res) => {
  res.json({ tasks: Array.from(tasks.values()) });
});

router.get("/:id", (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

router.post("/", (req, res) => {
  const { title, description, agentId } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }

  const normalizedAgentId = normalizeAgentId(agentId);
  if (normalizedAgentId && !agents.has(normalizedAgentId)) {
    return res.status(400).json({ error: "Agent not found" });
  }

  const task = {
    id: uuidv4(),
    title: title.trim(),
    description: description || "",
    agentId: normalizedAgentId ?? null,
    status: "pending",
    result: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tasks.set(task.id, task);
  res.status(201).json(task);
});

router.put("/:id", (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const { title, description, agentId } = req.body;
  const previousAgentId = task.agentId;
  const normalizedAgentId = normalizeAgentId(agentId);

  if (title !== undefined && !title.trim()) {
    return res.status(400).json({ error: "title cannot be empty" });
  }

  if (normalizedAgentId !== undefined && normalizedAgentId && !agents.has(normalizedAgentId)) {
    return res.status(400).json({ error: "Agent not found" });
  }

  if (title !== undefined) task.title = title.trim();
  if (description !== undefined) task.description = description;
  if (normalizedAgentId !== undefined) task.agentId = normalizedAgentId;
  task.updatedAt = new Date().toISOString();

  tasks.set(task.id, task);
  updateAgentStatus(previousAgentId);
  updateAgentStatus(task.agentId);

  res.json(task);
});

router.put("/:id/status", (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const { status, result } = req.body;
  if (status !== undefined && !VALID_STATUSES.has(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  if (status) task.status = status;
  if (result !== undefined) task.result = result;
  task.updatedAt = new Date().toISOString();

  tasks.set(task.id, task);
  updateAgentStatus(task.agentId);
  res.json(task);
});

module.exports = router;
