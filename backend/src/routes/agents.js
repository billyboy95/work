const { Router } = require("express");
const { v4: uuidv4 } = require("uuid");

function createAgentRoutes(runtime) {
  const router = Router();
  const { agentsStore } = runtime;

  router.get("/", (_req, res) => {
    const agents = agentsStore
      .list()
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    res.json({ agents });
  });

  router.get("/:id", (req, res) => {
    const agent = agentsStore.get(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    res.json(agent);
  });

  router.post("/", (req, res) => {
    const { name, description, model } = req.body;
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }

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
    return res.status(201).json(agent);
  });

  router.put("/:id", (req, res) => {
    const agent = agentsStore.get(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    const { name, description, model, status } = req.body;
    const nextAgent = {
      ...agent,
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) nextAgent.name = name;
    if (description !== undefined) nextAgent.description = description;
    if (model !== undefined) nextAgent.model = model;
    if (status !== undefined) nextAgent.status = status;

    agentsStore.set(nextAgent);
    return res.json(nextAgent);
  });

  router.delete("/:id", (req, res) => {
    const deleted = agentsStore.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Agent not found" });
    }

    return res.status(204).end();
  });

  return router;
}

module.exports = createAgentRoutes;
