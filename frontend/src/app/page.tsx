"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const POLL_INTERVAL_MS = 10_000;

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
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
};

type Stats = {
  generatedAt: string;
  uptimeSeconds: number;
  tasks: {
    total: number;
    byStatus: Record<string, number>;
    stale: {
      pendingOlderThan5m: number;
      runningOlderThan15m: number;
    };
  };
  agents: {
    total: number;
    byStatus: Record<string, number>;
  };
};

const formatTimestamp = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "—";

const getStatusClasses = (status: string) => {
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
};

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentDesc, setNewAgentDesc] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);

  const agentLookup = useMemo(
    () => new Map(agents.map((agent) => [agent.id, agent.name])),
    [agents],
  );

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort(
        (left, right) =>
          new Date(right.updatedAt).valueOf() - new Date(left.updatedAt).valueOf(),
      ),
    [tasks],
  );

  const checkApiHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/health`);

      if (!res.ok) {
        throw new Error("Health check failed");
      }

      await res.json();
      setApiStatus("online");
    } catch {
      setApiStatus("offline");
    }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agents`);

      if (!res.ok) {
        throw new Error("Failed to load agents");
      }

      const data = await res.json();
      setAgents(data.agents);
    } catch {
      /* API may be offline */
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks`);

      if (!res.ok) {
        throw new Error("Failed to load tasks");
      }

      const data = await res.json();
      setTasks(data.tasks);
    } catch {
      /* API may be offline */
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stats`);

      if (!res.ok) {
        throw new Error("Failed to load stats");
      }

      const data = await res.json();
      setStats(data);
    } catch {
      /* API may be offline */
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    await Promise.allSettled([
      checkApiHealth(),
      fetchAgents(),
      fetchTasks(),
      fetchStats(),
    ]);

    setLastRefreshAt(new Date().toISOString());
  }, [checkApiHealth, fetchAgents, fetchTasks, fetchStats]);

  useEffect(() => {
    const initialRefreshId = window.setTimeout(() => {
      void refreshDashboard();
    }, 0);

    const intervalId = window.setInterval(() => {
      void refreshDashboard();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialRefreshId);
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

  const activeTasks =
    (stats?.tasks.byStatus.pending ?? 0) + (stats?.tasks.byStatus.running ?? 0);
  const staleTasks =
    (stats?.tasks.stale.pendingOlderThan5m ?? 0) +
    (stats?.tasks.stale.runningOlderThan15m ?? 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-indigo-400">Zentrix</span> Agent Platform
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Operational overview refreshes every 10 seconds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void refreshDashboard()}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
            >
              Refresh now
            </button>
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
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Operations Summary</h2>
              <p className="text-sm text-zinc-500">
                Generated {formatTimestamp(stats?.generatedAt)} • Last refreshed{" "}
                {formatTimestamp(lastRefreshAt)}
              </p>
            </div>
            <p className="text-sm text-zinc-500">
              Service uptime: {stats?.uptimeSeconds ?? 0}s
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-sm text-zinc-500">Total tasks</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">
                {stats?.tasks.total ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-sm text-zinc-500">Active queue</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">{activeTasks}</p>
              <p className="mt-2 text-xs text-zinc-500">
                Pending {stats?.tasks.byStatus.pending ?? 0} • Running{" "}
                {stats?.tasks.byStatus.running ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-sm text-zinc-500">Failed tasks</p>
              <p className="mt-2 text-3xl font-semibold text-red-300">
                {stats?.tasks.byStatus.failed ?? 0}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Completed {stats?.tasks.byStatus.completed ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-sm text-zinc-500">Agent utilization</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">
                {stats?.agents.byStatus.busy ?? 0}/{stats?.agents.total ?? 0}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Busy {stats?.agents.byStatus.busy ?? 0} • Idle{" "}
                {stats?.agents.byStatus.idle ?? 0}
              </p>
            </div>
          </div>

          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              staleTasks > 0
                ? "border-amber-800 bg-amber-950/40 text-amber-200"
                : "border-emerald-900 bg-emerald-950/30 text-emerald-200"
            }`}
          >
            {staleTasks > 0 ? (
              <>
                Attention needed: {stats?.tasks.stale.pendingOlderThan5m ?? 0} pending tasks are
                older than 5 minutes and {stats?.tasks.stale.runningOlderThan15m ?? 0} running
                tasks are older than 15 minutes.
              </>
            ) : (
              <>No stale tasks detected in the current queue window.</>
            )}
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
                      className={`rounded px-2 py-0.5 ${getStatusClasses(agent.status)}`}
                    >
                      {agent.status}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">
                    Updated {formatTimestamp(agent.updatedAt)}
                  </p>
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
              {sortedTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-zinc-200">{task.title}</span>
                        <span className="ml-2 text-xs text-zinc-500">
                          Created {formatTimestamp(task.createdAt)}
                        </span>
                      </div>

                      {task.description ? (
                        <p className="text-sm text-zinc-400">{task.description}</p>
                      ) : null}

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                        <span>
                          Assigned to{" "}
                          {task.agentId ? agentLookup.get(task.agentId) || task.agentId : "Unassigned"}
                        </span>
                        <span>Updated {formatTimestamp(task.updatedAt)}</span>
                        <span>Started {formatTimestamp(task.startedAt)}</span>
                        <span>Completed {formatTimestamp(task.completedAt)}</span>
                        <span>Failed {formatTimestamp(task.failedAt)}</span>
                      </div>

                      {task.result ? (
                        <p className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-300">
                          Result: {task.result}
                        </p>
                      ) : null}
                    </div>

                    <span
                      className={`self-start rounded px-2 py-0.5 text-xs ${getStatusClasses(
                        task.status,
                      )}`}
                    >
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
