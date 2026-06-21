const { Router } = require("express");
const { v4: uuidv4 } = require("uuid");
const {
  listAgents,
  getAgent,
  hasAgent,
  setAgent,
  deleteAgent,
} = require("../stores/agentsStore");
const { listTasks, setTask } = require("../stores/tasksStore");
const { syncAgentStatuses } = require("../utils/syncAgentStatuses");

const router = Router();

router.get("/", (_req, res) => {
  syncAgentStatuses();
  res.json({ agents: listAgents() });
});

router.get("/:id", (req, res) => {
  const agent = getAgent(req.params.id);
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

  setAgent(agent);
  res.status(201).json(agent);
});

router.put("/:id", (req, res) => {
  const agent = getAgent(req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });

  const { name, description, model, status } = req.body;
  const updatedAgent = {
    ...agent,
    name: name !== undefined ? name : agent.name,
    description: description !== undefined ? description : agent.description,
    model: model !== undefined ? model : agent.model,
    status: status !== undefined ? status : agent.status,
    updatedAt: new Date().toISOString(),
  };

  setAgent(updatedAgent);
  syncAgentStatuses();
  res.json(getAgent(req.params.id));
});

router.delete("/:id", (req, res) => {
  if (!hasAgent(req.params.id)) return res.status(404).json({ error: "Agent not found" });

  const timestamp = new Date().toISOString();
  for (const task of listTasks()) {
    if (task.agentId === req.params.id) {
      setTask({
        ...task,
        agentId: null,
        updatedAt: timestamp,
      });
    }
  }

  deleteAgent(req.params.id);
  syncAgentStatuses();
  res.status(204).end();
});

module.exports = router;
