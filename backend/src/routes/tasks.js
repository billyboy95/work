const { Router } = require("express");

function createTaskRoutes(runtime) {
  const router = Router();
  const { taskService } = runtime;

  router.get("/", (_req, res) => {
    res.json({ tasks: taskService.listTasks() });
  });

  router.get("/:id", (req, res) => {
    const task = taskService.getTask(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    return res.json(task);
  });

  router.post("/", (req, res) => {
    try {
      const task = taskService.createTask(req.body);
      runtime.flush().catch((error) => {
        console.error("Immediate task flush failed:", error);
      });

      return res.status(201).json(task);
    } catch (error) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  });

  router.put("/:id/status", (req, res) => {
    try {
      const { status, result } = req.body;
      const patch = {};

      if (status !== undefined) {
        patch.status = status;
      }

      if (result !== undefined) {
        patch.result = result;
      }

      const task = taskService.updateTaskStatus(req.params.id, patch);
      return res.json(task);
    } catch (error) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createTaskRoutes;
