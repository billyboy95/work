const { Router } = require("express");
const { v4: uuidv4 } = require("uuid");

function createAgentRoutes({ agentRepository }) {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      const agents = await agentRepository.list();
      res.json({ agents });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const agent = await agentRepository.getById(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      res.json(agent);
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const { name, description, model } = req.body;
      if (!name) {
        return res.status(400).json({ error: "name is required" });
      }

      const timestamp = new Date().toISOString();
      const agent = await agentRepository.create({
        id: uuidv4(),
        name,
        description: description || "",
        model: model || "gpt-4",
        status: "idle",
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      res.status(201).json(agent);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      const { name, description, model, status } = req.body;
      const agent = await agentRepository.update(req.params.id, {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(model !== undefined ? { model } : {}),
        ...(status !== undefined ? { status } : {}),
      });

      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      res.json(agent);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const deleted = await agentRepository.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Agent not found" });
      }

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createAgentRoutes;
