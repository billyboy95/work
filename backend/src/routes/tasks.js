const { Router } = require("express");
const { v4: uuidv4 } = require("uuid");

function createTaskRoutes({ taskRepository }) {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      const tasks = await taskRepository.list();
      res.json({ tasks });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const task = await taskRepository.getById(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json(task);
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const { title, description, agentId } = req.body;
      if (!title) {
        return res.status(400).json({ error: "title is required" });
      }

      const timestamp = new Date().toISOString();
      const task = await taskRepository.create({
        id: uuidv4(),
        title,
        description: description || "",
        agentId: agentId || null,
        status: "pending",
        result: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id/status", async (req, res, next) => {
    try {
      const { status, result } = req.body;
      const task = await taskRepository.updateStatus(req.params.id, {
        ...(status !== undefined ? { status } : {}),
        ...(Object.prototype.hasOwnProperty.call(req.body, "result") ? { result } : {}),
      });

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json(task);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createTaskRoutes;
