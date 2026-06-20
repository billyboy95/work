"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

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
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
};

type Stats = {
  generatedAt: string;
  uptimeSeconds: number;
  tasks: {
    total: number;
    byStatus: {
      pending: number;
      running: number;
      completed: number;
      failed: number;
    };
    stale: {
      pendingOlderThan5m: number;
      runningOlderThan15m: number;
    };
  };
  agents: {
    total: number;
    byStatus: {
      idle: number;
      busy: number;
    };
  };
};

const emptyStats: Stats = {
  generatedAt: "",
  uptimeSeconds: 0,
  tasks: {
    total: 0,
    byStatus: {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
    },
    stale: {
      pendingOlderThan5m: 0,
      runningOlderThan15m: 0,
    },
  },
  agents: {
    total: 0,
    byStatus: {
      idle: 0,
      busy: 0,
    },
  },
};

function formatTimestamp(timestamp?: string | null) {
  if (!timestamp) {
    return "n/a";
  }

  return new Date(timestamp).toLocaleString();
}

function formatUptime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function getAgentStatusClassName(status: string) {
  return status === "idle" ? "bg-zinc-800" : "bg-emerald-900 text-emerald-300";
}

function getTaskStatusClassName(status: string) {
  if (status === "completed") {
    return "bg-emerald-900 text-emerald-300";
  }

  if (status === "running") {
    return "bg-blue-900 text-blue-300";
  }

  if (status === "failed") {
    return "bg-red-900 text-red-300";
  }

  return "bg-zinc-800 text-zinc-400";
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentDesc, setNewAgentDesc] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshDashboard = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const [healthRes, agentsRes, tasksRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/health`),
        fetch(`${API_BASE}/api/agents`),
        fetch(`${API_BASE}/api/tasks`),
        fetch(`${API_BASE}/api/stats`),
      ]);

      if (!healthRes.ok || !agentsRes.ok || !tasksRes.ok || !statsRes.ok) {
        throw new Error("Failed to refresh dashboard");
      }

      const [agentsData, tasksData, statsData] = await Promise.all([
        agentsRes.json(),
        tasksRes.json(),
        statsRes.json(),
      ]);

      setApiStatus("online");
      setAgents(agentsData.agents);
      setTasks(tasksData.tasks);
      setStats(statsData);
      setLastRefreshed(new Date().toISOString());
    } catch {
      setApiStatus("offline");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const runRefresh = () => {
      void refreshDashboard();
    };

    const timeoutId = window.setTimeout(runRefresh, 0);
    const intervalId = window.setInterval(runRefresh, 10000);

    return () => {
      window.clearTimeout(timeoutId);
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
    await refreshDashboard();
  };

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;
    await fetch(`${API_BASE}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTaskTitle }),
    });
    setNewTaskTitle("");
    await refreshDashboard();
  };

  const deleteAgent = async (id: string) => {
    await fetch(`${API_BASE}/api/agents/${id}`, { method: "DELETE" });
    await refreshDashboard();
  };

  const agentNames = useMemo(
    () => new Map(agents.map((agent) => [agent.id, agent.name])),
    [agents]
  );

  const staleTaskCount =
    stats.tasks.stale.pendingOlderThan5m + stats.tasks.stale.runningOlderThan15m;

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

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Operations Summary</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Monitor live workflow health, stale work, and agent capacity without
                checking each list manually.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
              <span>Last refreshed: {formatTimestamp(lastRefreshed)}</span>
              <span>Uptime: {formatUptime(stats.uptimeSeconds)}</span>
              <button
                onClick={() => void refreshDashboard()}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-200 transition-colors hover:border-indigo-500 hover:text-indigo-300"
              >
                {isRefreshing ? "Refreshing..." : "Refresh now"}
              </button>
            </div>
          </div>

          {staleTaskCount > 0 ? (
            <div className="mt-4 rounded-lg border border-amber-700 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
              {stats.tasks.stale.pendingOlderThan5m} pending task(s) older than 5 minutes and{" "}
              {stats.tasks.stale.runningOlderThan15m} running task(s) older than 15 minutes
              need review.
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-sm text-zinc-400">Total tasks</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-100">{stats.tasks.total}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-sm text-zinc-400">Running tasks</p>
              <p className="mt-2 text-2xl font-semibold text-blue-300">
                {stats.tasks.byStatus.running}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-sm text-zinc-400">Pending tasks</p>
              <p className="mt-2 text-2xl font-semibold text-amber-300">
                {stats.tasks.byStatus.pending}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-sm text-zinc-400">Completed / Failed</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-100">
                {stats.tasks.byStatus.completed} / {stats.tasks.byStatus.failed}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-sm text-zinc-400">Agents idle / busy</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-100">
                {stats.agents.byStatus.idle} / {stats.agents.byStatus.busy}
              </p>
            </div>
          </div>
        </section>

        {/* Agents Section */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">Agents</h2>
          <div className="mb-4 flex gap-3">
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
                      className={`rounded px-2 py-0.5 ${getAgentStatusClassName(agent.status)}`}
                    >
                      {agent.status}
                    </span>
                    <span className="rounded bg-zinc-800 px-2 py-0.5">
                      {tasks.filter((task) => task.agentId === agent.id).length} assigned
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
          <div className="mb-4 flex gap-3">
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={createTask}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition-colors"
            >
              Add Task
            </button>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-zinc-500">No tasks yet. Add one above.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <span className="font-medium text-zinc-200">{task.title}</span>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span>
                        Assigned:{" "}
                        {task.agentId ? agentNames.get(task.agentId) || "Unknown agent" : "Unassigned"}
                      </span>
                      <span>Created: {formatTimestamp(task.createdAt)}</span>
                      <span>Updated: {formatTimestamp(task.updatedAt)}</span>
                      {task.result ? <span>Result: {task.result}</span> : null}
                    </div>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-xs ${getTaskStatusClassName(task.status)}`}>
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
