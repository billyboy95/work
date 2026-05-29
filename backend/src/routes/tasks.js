const { Router } = require("express");
const { v4: uuidv4 } = require("uuid");

const router = Router();

const tasks = new Map();

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

  const task = {
    id: uuidv4(),
    title,
    description: description || "",
    agentId: agentId || null,
    status: "pending",
    result: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tasks.set(task.id, task);
  res.status(201).json(task);
});

router.put("/:id/status", (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const { status, result } = req.body;
  if (status) task.status = status;
  if (result !== undefined) task.result = result;
  task.updatedAt = new Date().toISOString();

  tasks.set(task.id, task);
  res.json(task);
});

module.exports = router;
