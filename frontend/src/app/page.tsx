"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  statusHistory: Array<{
    status: string;
    timestamp: string;
  }>;
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

function formatTimestamp(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function formatUptime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-100">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{detail}</p>
    </div>
  );
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentDesc, setNewAgentDesc] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  const agentNamesById = useMemo(
    () => new Map(agents.map((agent) => [agent.id, agent.name])),
    [agents],
  );

  const assignedTaskCounts = useMemo(() => {
    return tasks.reduce<Record<string, number>>((counts, task) => {
      if (task.agentId) {
        counts[task.agentId] = (counts[task.agentId] || 0) + 1;
      }
      return counts;
    }, {});
  }, [tasks]);

  const refreshDashboard = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const healthRes = await fetch(`${API_BASE}/api/health`);
      if (!healthRes.ok) {
        throw new Error("Health check failed");
      }

      setApiStatus("online");

      const [agentsRes, tasksRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/agents`),
        fetch(`${API_BASE}/api/tasks`),
        fetch(`${API_BASE}/api/stats`),
      ]);

      const [agentsData, tasksData, statsData] = await Promise.all([
        agentsRes.json(),
        tasksRes.json(),
        statsRes.json(),
      ]);

      setAgents(agentsData.agents);
      setTasks(tasksData.tasks);
      setStats(statsData);
      setLastRefreshedAt(new Date().toISOString());
    } catch {
      setApiStatus("offline");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initialRefreshTimeout = window.setTimeout(() => {
      void refreshDashboard();
    }, 0);

    const intervalId = window.setInterval(() => {
      void refreshDashboard();
    }, 10000);

    return () => {
      window.clearTimeout(initialRefreshTimeout);
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

  const stalePendingTasks = stats?.tasks.stale.pendingOlderThan5m ?? 0;
  const staleRunningTasks = stats?.tasks.stale.runningOlderThan15m ?? 0;
  const hasStaleTasks = stalePendingTasks > 0 || staleRunningTasks > 0;

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
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Operations Summary</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Live operational telemetry across agents, task execution, and stale workflow risk.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-xs text-zinc-500">
                <p>Last refreshed</p>
                <p>{formatTimestamp(lastRefreshedAt)}</p>
              </div>
              <button
                onClick={() => void refreshDashboard()}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:border-indigo-500 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isRefreshing}
              >
                {isRefreshing ? "Refreshing..." : "Refresh now"}
              </button>
            </div>
          </div>

          {stats ? (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  label="Tasks"
                  value={stats.tasks.total}
                  detail={`${stats.tasks.byStatus.running} running / ${stats.tasks.byStatus.completed} completed`}
                />
                <SummaryCard
                  label="Agents"
                  value={stats.agents.total}
                  detail={`${stats.agents.byStatus.busy} busy / ${stats.agents.byStatus.idle} idle`}
                />
                <SummaryCard
                  label="Pending backlog"
                  value={stats.tasks.byStatus.pending}
                  detail={`${stalePendingTasks} pending tasks older than 5 minutes`}
                />
                <SummaryCard
                  label="API uptime"
                  value={formatUptime(stats.uptimeSeconds)}
                  detail={`Snapshot generated ${formatTimestamp(stats.generatedAt)}`}
                />
              </div>

              {hasStaleTasks ? (
                <div className="mt-6 rounded-xl border border-amber-800 bg-amber-950/40 p-4 text-sm text-amber-200">
                  <p className="font-medium">Operational attention needed</p>
                  <p className="mt-1 text-amber-300/90">
                    {stalePendingTasks} pending task(s) older than 5 minutes and {staleRunningTasks} running task(s)
                    older than 15 minutes.
                  </p>
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-emerald-800 bg-emerald-950/30 p-4 text-sm text-emerald-200">
                  No stale tasks detected in the latest refresh window.
                </div>
              )}
            </>
          ) : (
            <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
              Stats will appear once the API is reachable.
            </div>
          )}
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
                      className={`rounded px-2 py-0.5 ${
                        agent.status === "idle"
                          ? "bg-zinc-800"
                          : "bg-emerald-900 text-emerald-300"
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">
                    Assigned tasks: {assignedTaskCounts[agent.id] || 0}
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
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-zinc-200">{task.title}</span>
                        <span className="text-xs text-zinc-500">{formatTimestamp(task.createdAt)}</span>
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            task.status === "completed"
                              ? "bg-emerald-900 text-emerald-300"
                              : task.status === "running"
                                ? "bg-blue-900 text-blue-300"
                                : task.status === "failed"
                                  ? "bg-red-900 text-red-300"
                                  : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                      {task.description ? (
                        <p className="mt-2 text-sm text-zinc-400">{task.description}</p>
                      ) : null}
                      <div className="mt-3 grid gap-2 text-xs text-zinc-500 sm:grid-cols-2 xl:grid-cols-4">
                        <p>Assigned agent: {task.agentId ? agentNamesById.get(task.agentId) || task.agentId : "Unassigned"}</p>
                        <p>Started: {formatTimestamp(task.startedAt)}</p>
                        <p>Completed: {formatTimestamp(task.completedAt)}</p>
                        <p>Failed: {formatTimestamp(task.failedAt)}</p>
                      </div>
                    </div>

                    <div className="text-xs text-zinc-500 lg:text-right">
                      <p>History entries: {task.statusHistory.length}</p>
                      <p className="mt-1">Updated: {formatTimestamp(task.updatedAt)}</p>
                      {task.result ? (
                        <p className="mt-2 max-w-sm text-zinc-400">Result: {task.result}</p>
                      ) : null}
                    </div>
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
