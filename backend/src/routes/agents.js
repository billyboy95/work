const { Router } = require("express");
const { v4: uuidv4 } = require("uuid");

function createAgentsRouter({ agentsStore }) {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({ agents: agentsStore.list() });
  });

  router.get("/:id", (req, res) => {
    const agent = agentsStore.get(req.params.id);
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    res.json(agent);
  });

  router.post("/", (req, res) => {
    const { name, description, model } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const timestamp = new Date().toISOString();
    const agent = {
      id: uuidv4(),
      name,
      description: description || "",
      model: model || "gpt-4",
      status: "idle",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    agentsStore.set(agent);
    res.status(201).json(agent);
  });

  router.put("/:id", (req, res) => {
    const agent = agentsStore.get(req.params.id);
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    const { name, description, model, status } = req.body;
    const updatedAgent = {
      ...agent,
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updatedAgent.name = name;
    if (description !== undefined) updatedAgent.description = description;
    if (model !== undefined) updatedAgent.model = model;
    if (status !== undefined) updatedAgent.status = status;

    agentsStore.set(updatedAgent);
    res.json(updatedAgent);
  });

  router.delete("/:id", (req, res) => {
    const deleted = agentsStore.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Agent not found" });
    res.status(204).end();
  });

  return router;
}

module.exports = createAgentsRouter;
