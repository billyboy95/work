const { Router } = require("express");
const { v4: uuidv4 } = require("uuid");
const { agents } = require("../stores/agentsStore");
const { tasks } = require("../stores/tasksStore");
const { syncAgentStatuses } = require("../utils/syncAgentStatuses");

const router = Router();

const allowedStatuses = new Set(["pending", "running", "completed", "failed"]);

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
  if (!title) return res.status(400).json({ error: "title is required" });
  if (agentId && !agents.has(agentId)) {
    return res.status(400).json({ error: "agentId must reference an existing agent" });
  }

  const now = new Date().toISOString();

  const task = {
    id: uuidv4(),
    title,
    description: description || "",
    agentId: agentId || null,
    status: "pending",
    result: null,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    completedAt: null,
    failedAt: null,
    statusHistory: [{ status: "pending", timestamp: now }],
  };

  tasks.set(task.id, task);
  syncAgentStatuses(agents, tasks);
  res.status(201).json(task);
});

router.put("/:id/status", (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const { status, result } = req.body;
  if (status && !allowedStatuses.has(status)) {
    return res.status(400).json({ error: "status must be one of pending, running, completed, failed" });
  }

  const now = new Date().toISOString();

  if (status && status !== task.status) {
    task.status = status;
    task.statusHistory.push({ status, timestamp: now });

    if (status === "running") {
      task.startedAt = now;
      task.completedAt = null;
      task.failedAt = null;
    }

    if (status === "completed") {
      task.completedAt = now;
      task.failedAt = null;
    }

    if (status === "failed") {
      task.failedAt = now;
      task.completedAt = null;
    }

    if (status === "pending") {
      task.startedAt = null;
      task.completedAt = null;
      task.failedAt = null;
    }
  }

  if (result !== undefined) task.result = result;
  task.updatedAt = now;

  tasks.set(task.id, task);
  syncAgentStatuses(agents, tasks);
  res.json(task);
});

module.exports = router;
