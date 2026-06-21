const agents = new Map();

function listAgents() {
  return Array.from(agents.values());
}

function getAgent(id) {
  return agents.get(id);
}

function hasAgent(id) {
  return agents.has(id);
}

function setAgent(agent) {
  agents.set(agent.id, agent);
  return agent;
}

function deleteAgent(id) {
  return agents.delete(id);
}

function clearAgents() {
  agents.clear();
}

module.exports = {
  agents,
  listAgents,
  getAgent,
  hasAgent,
  setAgent,
  deleteAgent,
  clearAgents,
};
