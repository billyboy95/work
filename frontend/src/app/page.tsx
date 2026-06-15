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
  updatedAt: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  agentId: string | null;
  status: string;
  result: string | null;
  lastError: string | null;
  attemptCount: number;
  maxAttempts: number;
  startedAt: string | null;
  completedAt: string | null;
  nextRetryAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentDesc, setNewAgentDesc] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
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

  const fetchHealth = useCallback(async () => {
    try {
      const healthRes = await fetch(`${API_BASE}/api/health`);
      await healthRes.json();
      setApiStatus("online");
    } catch {
      setApiStatus("offline");
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    await Promise.all([fetchHealth(), fetchAgents(), fetchTasks()]);
  }, [fetchAgents, fetchHealth, fetchTasks]);

  useEffect(() => {
    void refreshDashboard();
    const intervalId = window.setInterval(() => {
      void refreshDashboard();
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshDashboard]);

  const createAgent = async () => {
    if (!newAgentName.trim()) return;
    await fetch(`${API_BASE}/api/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newAgentName, description: newAgentDesc }),
    });
    setNewAgentName("");
    setNewAgentDesc("");
    await fetchAgents();
  };

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;
    await fetch(`${API_BASE}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTaskTitle,
        description: newTaskDesc,
        agentId: selectedAgentId || null,
      }),
    });
    setNewTaskTitle("");
    setNewTaskDesc("");
    setSelectedAgentId("");
    await fetchTasks();
    await fetchAgents();
  };

  const deleteAgent = async (id: string) => {
    await fetch(`${API_BASE}/api/agents/${id}`, { method: "DELETE" });
    await fetchAgents();
  };

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return "System runner";
    return agents.find((agent) => agent.id === agentId)?.name || "Unknown agent";
  };

  const getTaskStatusClasses = (status: string) => {
    if (status === "completed") return "bg-emerald-900 text-emerald-300";
    if (status === "running") return "bg-blue-900 text-blue-300";
    if (status === "retrying") return "bg-amber-900 text-amber-300";
    if (status === "failed") return "bg-red-900 text-red-300";
    return "bg-zinc-800 text-zinc-400";
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-indigo-400">Zentrix</span> Agent Platform
          </h1>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              apiStatus === "online"
                ? "bg-emerald-900 text-emerald-300"
                : apiStatus === "offline"
                ? "bg-red-900 text-red-300"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            API {apiStatus}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Agents Section */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">Agents</h2>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row">
            <input
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              placeholder="Agent name"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
            <input
              value={newAgentDesc}
              onChange={(e) => setNewAgentDesc(e.target.value)}
              placeholder="Description (optional)"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={createAgent}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition-colors"
            >
              Create Agent
            </button>
          </div>
          {agents.length === 0 ? (
            <p className="text-sm text-zinc-500">No agents yet. Create one above.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-zinc-100">{agent.name}</h3>
                      <p className="mt-1 text-xs text-zinc-500">{agent.description}</p>
                    </div>
                    <button
                      onClick={() => deleteAgent(agent.id)}
                      className="text-zinc-600 hover:text-red-400 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                    <span className="rounded bg-zinc-800 px-2 py-0.5">{agent.model}</span>
                    <span
                      className={`rounded px-2 py-0.5 ${
                        agent.status === "idle"
                          ? "bg-zinc-800"
                          : "bg-emerald-900 text-emerald-300"
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
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">Tasks</h2>
          <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_auto]">
              <input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title"
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Assign to system runner</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <button
                onClick={createTask}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium transition-colors hover:bg-indigo-500"
              >
                Add Task
              </button>
            </div>
            <textarea
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              placeholder="Task description or execution notes"
              rows={3}
              className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-zinc-500">No tasks yet. Add one above.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-zinc-200">{task.title}</span>
                        <span className="text-xs text-zinc-500">
                          Created {new Date(task.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {task.description ? (
                        <p className="max-w-3xl text-sm text-zinc-400">{task.description}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
                        <span className="rounded bg-zinc-800 px-2 py-1">
                          Runner: {getAgentName(task.agentId)}
                        </span>
                        <span className="rounded bg-zinc-800 px-2 py-1">
                          Attempts: {task.attemptCount}/{task.maxAttempts}
                        </span>
                        {task.startedAt ? (
                          <span className="rounded bg-zinc-800 px-2 py-1">
                            Started: {new Date(task.startedAt).toLocaleString()}
                          </span>
                        ) : null}
                        {task.completedAt ? (
                          <span className="rounded bg-zinc-800 px-2 py-1">
                            Finished: {new Date(task.completedAt).toLocaleString()}
                          </span>
                        ) : null}
                        {task.nextRetryAt ? (
                          <span className="rounded bg-zinc-800 px-2 py-1">
                            Retry at: {new Date(task.nextRetryAt).toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                      {task.result ? (
                        <p className="rounded-lg border border-emerald-900 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
                          {task.result}
                        </p>
                      ) : null}
                      {task.lastError ? (
                        <p className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                          {task.lastError}
                        </p>
                      ) : null}
                    </div>
                    <span className={`h-fit rounded px-2 py-1 text-xs ${getTaskStatusClasses(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
