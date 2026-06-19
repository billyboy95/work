const { Router } = require("express");
const { v4: uuidv4 } = require("uuid");
const { agents } = require("../stores/agentsStore");
const { tasks } = require("../stores/tasksStore");

const router = Router();

router.get("/", (_req, res) => {
  res.json({ agents: Array.from(agents.values()) });
});

router.get("/:id", (req, res) => {
  const agent = agents.get(req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  res.json(agent);
});

router.post("/", (req, res) => {
  const { name, description, model } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });

  const agent = {
    id: uuidv4(),
    name,
    description: description || "",
    model: model || "gpt-4",
    status: "idle",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  agents.set(agent.id, agent);
  res.status(201).json(agent);
});

router.put("/:id", (req, res) => {
  const agent = agents.get(req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });

  const { name, description, model, status } = req.body;
  if (name !== undefined) agent.name = name;
  if (description !== undefined) agent.description = description;
  if (model !== undefined) agent.model = model;
  if (status !== undefined) agent.status = status;
  agent.updatedAt = new Date().toISOString();

  agents.set(agent.id, agent);
  res.json(agent);
});

router.delete("/:id", (req, res) => {
  if (!agents.has(req.params.id)) return res.status(404).json({ error: "Agent not found" });

  const deletedAgentId = req.params.id;
  agents.delete(req.params.id);

  for (const task of tasks.values()) {
    if (task.agentId !== deletedAgentId) {
      continue;
    }

    task.agentId = null;
    task.updatedAt = new Date().toISOString();
    tasks.set(task.id, task);
  }

  res.status(204).end();
});

module.exports = router;
