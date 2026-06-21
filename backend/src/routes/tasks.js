const { Router } = require("express");
const { v4: uuidv4 } = require("uuid");
const { hasAgent } = require("../stores/agentsStore");
const { listTasks, getTask, setTask } = require("../stores/tasksStore");
const { syncAgentStatuses } = require("../utils/syncAgentStatuses");

const router = Router();

const VALID_TASK_STATUSES = new Set(["pending", "running", "completed", "failed"]);

function appendStatusHistory(task, status, timestamp) {
  return [...task.statusHistory, { status, timestamp }];
}

router.get("/", (_req, res) => {
  res.json({ tasks: listTasks() });
});

router.get("/:id", (req, res) => {
  const task = getTask(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

router.post("/", (req, res) => {
  const { title, description, agentId } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });
  if (agentId && !hasAgent(agentId)) {
    return res.status(400).json({ error: "agentId must reference an existing agent" });
  }

  const timestamp = new Date().toISOString();

  const task = {
    id: uuidv4(),
    title,
    description: description || "",
    agentId: agentId || null,
    status: "pending",
    result: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    startedAt: null,
    completedAt: null,
    failedAt: null,
    statusHistory: [{ status: "pending", timestamp }],
  };

  setTask(task);
  syncAgentStatuses();
  res.status(201).json(task);
});

router.put("/:id/status", (req, res) => {
  const task = getTask(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const { status, result } = req.body;
  if (status && !VALID_TASK_STATUSES.has(status)) {
    return res.status(400).json({ error: "status must be one of pending, running, completed, failed" });
  }

  const timestamp = new Date().toISOString();
  const updatedTask = { ...task };

  if (status && status !== task.status) {
    updatedTask.status = status;
    updatedTask.statusHistory = appendStatusHistory(task, status, timestamp);

    if (status === "running" && !updatedTask.startedAt) {
      updatedTask.startedAt = timestamp;
    }

    if (status === "completed") {
      updatedTask.completedAt = timestamp;
    }

    if (status === "failed") {
      updatedTask.failedAt = timestamp;
    }
  }

  if (result !== undefined) {
    updatedTask.result = result;
  }

  updatedTask.updatedAt = timestamp;

  setTask(updatedTask);
  syncAgentStatuses();
  res.json(updatedTask);
});

module.exports = router;
