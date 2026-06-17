const agents = new Map();

const listAgents = () => Array.from(agents.values());

const getAgent = (id) => agents.get(id);

const setAgent = (agent) => {
  agents.set(agent.id, agent);
  return agent;
};

const deleteAgent = (id) => agents.delete(id);

const hasAgent = (id) => agents.has(id);

const resetAgentsStore = () => {
  agents.clear();
};

module.exports = {
  listAgents,
  getAgent,
  setAgent,
  deleteAgent,
  hasAgent,
  resetAgentsStore,
};
