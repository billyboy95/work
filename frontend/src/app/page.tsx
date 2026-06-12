"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Agent = {
  id: string;
  name: string;
  description: string;
  model: string;
  status: string;
  createdAt: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  agentId: string | null;
  status: string;
  createdAt: string;
};

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentDesc, setNewAgentDesc] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agents`);
      const data = await res.json();
      setAgents(data.agents);
    } catch {
      /* API may be offline */
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks`);
      const data = await res.json();
      setTasks(data.tasks);
    } catch {
      /* API may be offline */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const healthRes = await fetch(`${API_BASE}/api/health`);
        await healthRes.json();
        if (!cancelled) setApiStatus("online");
      } catch {
        if (!cancelled) setApiStatus("offline");
      }

      try {
        const agentsRes = await fetch(`${API_BASE}/api/agents`);
        const agentsData = await agentsRes.json();
        if (!cancelled) setAgents(agentsData.agents);
      } catch {
        /* API may be offline */
      }

      try {
        const tasksRes = await fetch(`${API_BASE}/api/tasks`);
        const tasksData = await tasksRes.json();
        if (!cancelled) setTasks(tasksData.tasks);
      } catch {
        /* API may be offline */
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const createAgent = async () => {
    if (!newAgentName.trim()) return;
    await fetch(`${API_BASE}/api/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newAgentName, description: newAgentDesc }),
    });
    setNewAgentName("");
    setNewAgentDesc("");
    fetchAgents();
  };

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;
    await fetch(`${API_BASE}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTaskTitle }),
    });
    setNewTaskTitle("");
    fetchTasks();
  };

  const deleteAgent = async (id: string) => {
    await fetch(`${API_BASE}/api/agents/${id}`, { method: "DELETE" });
    fetchAgents();
  };

  return (
    <div className="min-h-screen carbon-bg text-zinc-100">
      <header className="border-b border-zinc-800/80 px-6 py-4 backdrop-blur-sm bg-black/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-black uppercase tracking-widest">
            <span className="text-red-500">Zentrix</span>
            <span className="text-zinc-400 font-light ml-2 text-sm tracking-wider">AGENT PLATFORM</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${
              apiStatus === "online" ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
              : apiStatus === "offline" ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]"
              : "bg-zinc-600"
            }`} />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              {apiStatus}
            </span>
          </div>
        </div>
      </header>
      <div className="glow-line" />

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {/* Agents Section */}
        <section>
          <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 border-l-2 border-red-600 pl-3">
            Agents
          </h2>
          <div className="mb-5 flex gap-2">
            <input
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              placeholder="Agent name"
              className="flex-1 rounded-sm border border-zinc-700/60 bg-zinc-900/80 px-4 py-2.5 text-sm placeholder-zinc-600 focus:border-red-500/60 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all"
            />
            <input
              value={newAgentDesc}
              onChange={(e) => setNewAgentDesc(e.target.value)}
              placeholder="Description (optional)"
              className="flex-1 rounded-sm border border-zinc-700/60 bg-zinc-900/80 px-4 py-2.5 text-sm placeholder-zinc-600 focus:border-red-500/60 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all"
            />
            <button
              onClick={createAgent}
              className="rounded-sm bg-red-600 px-5 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all"
            >
              Deploy
            </button>
          </div>
          {agents.length === 0 ? (
            <p className="text-sm text-zinc-600 font-mono">{"// No agents deployed"}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="rounded-sm border border-zinc-800/80 carbon-surface p-4 hover:border-zinc-700 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-zinc-100 text-sm">{agent.name}</h3>
                      <p className="mt-1 text-xs text-zinc-500 font-mono">{agent.description}</p>
                    </div>
                    <button
                      onClick={() => deleteAgent(agent.id)}
                      className="text-zinc-700 hover:text-red-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="rounded-sm bg-zinc-800/80 border border-zinc-700/50 px-2 py-0.5 font-mono text-zinc-400">{agent.model}</span>
                    <span
                      className={`rounded-sm px-2 py-0.5 font-mono ${
                        agent.status === "idle"
                          ? "bg-zinc-800/80 border border-zinc-700/50 text-zinc-500"
                          : "bg-emerald-950 border border-emerald-800/50 text-emerald-400"
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Tasks Section */}
        <section>
          <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 border-l-2 border-red-600 pl-3">
            Tasks
          </h2>
          <div className="mb-5 flex gap-2">
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title"
              className="flex-1 rounded-sm border border-zinc-700/60 bg-zinc-900/80 px-4 py-2.5 text-sm placeholder-zinc-600 focus:border-red-500/60 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all"
            />
            <button
              onClick={createTask}
              className="rounded-sm bg-red-600 px-5 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all"
            >
              Execute
            </button>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-zinc-600 font-mono">{"// No tasks queued"}</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-sm border border-zinc-800/80 carbon-surface px-4 py-3 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500/60" />
                    <span className="font-medium text-zinc-200 text-sm">{task.title}</span>
                    <span className="text-xs text-zinc-600 font-mono">
                      {new Date(task.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span
                    className={`rounded-sm px-2 py-0.5 text-xs font-mono uppercase ${
                      task.status === "completed"
                        ? "bg-emerald-950 border border-emerald-800/50 text-emerald-400"
                        : task.status === "running"
                        ? "bg-amber-950 border border-amber-800/50 text-amber-400"
                        : "bg-zinc-800/80 border border-zinc-700/50 text-zinc-500"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
