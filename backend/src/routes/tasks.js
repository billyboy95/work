const { Router } = require("express");
const { v4: uuidv4 } = require("uuid");
const { listTasks, getTask, setTask } = require("../stores/tasksStore");

const router = Router();

const applyStatusTransition = (task, nextStatus, changedAt) => {
  if (nextStatus === "pending") {
    task.startedAt = null;
    task.completedAt = null;
    task.failedAt = null;
    return;
  }

  if (nextStatus === "running") {
    task.startedAt = task.startedAt || changedAt;
    task.completedAt = null;
    task.failedAt = null;
    return;
  }

  if (nextStatus === "completed") {
    task.startedAt = task.startedAt || changedAt;
    task.completedAt = changedAt;
    task.failedAt = null;
    return;
  }

  if (nextStatus === "failed") {
    task.startedAt = task.startedAt || changedAt;
    task.failedAt = changedAt;
    task.completedAt = null;
  }
};

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
  const createdAt = new Date().toISOString();

  const task = {
    id: uuidv4(),
    title,
    description: description || "",
    agentId: agentId || null,
    status: "pending",
    result: null,
    startedAt: null,
    completedAt: null,
    failedAt: null,
    createdAt,
    updatedAt: createdAt,
    statusHistory: [{ status: "pending", at: createdAt }],
  };

  setTask(task);
  res.status(201).json(task);
});

router.put("/:id/status", (req, res) => {
  const task = getTask(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const { status, result } = req.body;
  const changedAt = new Date().toISOString();

  if (status && status !== task.status) {
    task.status = status;
    applyStatusTransition(task, status, changedAt);
    task.statusHistory = [
      ...(task.statusHistory || []),
      { status, at: changedAt },
    ];
  }

  if (result !== undefined) task.result = result;
  task.updatedAt = changedAt;

  setTask(task);
  res.json(task);
});

module.exports = router;
