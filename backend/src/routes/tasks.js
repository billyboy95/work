const { Router } = require("express");

function createTasksRouter({ taskService }) {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({ tasks: taskService.listTasks() });
  });

  router.get("/:id", (req, res) => {
    const task = taskService.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  });

  router.post("/", (req, res, next) => {
    try {
      const task = taskService.createTask(req.body);
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id/status", (req, res, next) => {
    try {
      const task = taskService.updateTask(req.params.id, req.body);
      res.json(task);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createTasksRouter;
