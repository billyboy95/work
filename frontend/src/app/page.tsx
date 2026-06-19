"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const TASK_STATUSES = ["pending", "running", "completed", "failed"] as const;

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
  result: string | null;
  createdAt: string;
  updatedAt: string;
};

type Feedback = {
  type: "success" | "error";
  message: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

async function requestApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? ((await response.json()) as T & { error?: string })
    : null;

  if (!response.ok) {
    throw new Error((data && "error" in data && data.error) || `Request failed (${response.status})`);
  }

  return data as T;
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentDesc, setNewAgentDesc] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAgentId, setNewTaskAgentId] = useState("");
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const refreshDashboard = useCallback(async (silent = false) => {
    setIsRefreshing(true);

    try {
      const [healthData, agentsData, tasksData] = await Promise.all([
        requestApi<{ status: string }>("/api/health"),
        requestApi<{ agents: Agent[] }>("/api/agents"),
        requestApi<{ tasks: Task[] }>("/api/tasks"),
      ]);

      setApiStatus(healthData.status === "ok" ? "online" : "offline");
      setAgents(agentsData.agents);
      setTasks(tasksData.tasks);
      setLastRefreshedAt(new Date().toISOString());

      if (!silent) {
        setFeedback(null);
      }
    } catch (error) {
      setApiStatus("offline");

      if (!silent) {
        setFeedback({
          type: "error",
          message: getErrorMessage(error),
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshDashboard(true);

    const intervalId = window.setInterval(() => {
      void refreshDashboard(true);
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshDashboard]);

  const createAgent = async () => {
    if (!newAgentName.trim()) return;

    setIsCreatingAgent(true);

    try {
      await requestApi<Agent>("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAgentName.trim(),
          description: newAgentDesc.trim(),
        }),
      });
      setNewAgentName("");
      setNewAgentDesc("");
      setFeedback({ type: "success", message: "Agent created." });
      await refreshDashboard(true);
    } catch (error) {
      setFeedback({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;

    setIsCreatingTask(true);

    try {
      await requestApi<Task>("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          agentId: newTaskAgentId || null,
        }),
      });
      setNewTaskTitle("");
      setNewTaskAgentId("");
      setFeedback({ type: "success", message: "Task created." });
      await refreshDashboard(true);
    } catch (error) {
      setFeedback({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsCreatingTask(false);
    }
  };

  const deleteAgent = async (id: string) => {
    setActiveAgentId(id);

    try {
      await requestApi<void>(`/api/agents/${id}`, { method: "DELETE" });
      setFeedback({ type: "success", message: "Agent deleted. Linked tasks were unassigned." });
      await refreshDashboard(true);
    } catch (error) {
      setFeedback({ type: "error", message: getErrorMessage(error) });
    } finally {
      setActiveAgentId(null);
    }
  };

  const updateTaskAssignment = async (taskId: string, agentId: string) => {
    setActiveTaskId(taskId);

    try {
      await requestApi<Task>(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agentId || null }),
      });
      setFeedback({
        type: "success",
        message: agentId ? "Task assignment updated." : "Task unassigned.",
      });
      await refreshDashboard(true);
    } catch (error) {
      setFeedback({ type: "error", message: getErrorMessage(error) });
    } finally {
      setActiveTaskId(null);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    setActiveTaskId(taskId);

    try {
      await requestApi<Task>(`/api/tasks/${taskId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setFeedback({ type: "success", message: `Task marked ${status}.` });
      await refreshDashboard(true);
    } catch (error) {
      setFeedback({ type: "error", message: getErrorMessage(error) });
    } finally {
      setActiveTaskId(null);
    }
  };

  const taskCountsByAgent = tasks.reduce<Record<string, number>>((counts, task) => {
    if (task.agentId) {
      counts[task.agentId] = (counts[task.agentId] || 0) + 1;
    }

    return counts;
  }, {});

  const getAgentName = (agentId: string | null) =>
    agents.find((agent) => agent.id === agentId)?.name || "Unassigned";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-indigo-400">Zentrix</span> Agent Platform
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Assign work, update task state, and keep operators aligned from one dashboard.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void refreshDashboard()}
              disabled={isRefreshing}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
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
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
              Agents: {agents.length}
            </span>
            <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
              Tasks: {tasks.length}
            </span>
          </div>
          <span>
            Last refreshed: {lastRefreshedAt ? new Date(lastRefreshedAt).toLocaleString() : "Waiting for API"}
          </span>
        </section>

        {feedback ? (
          <section
            className={`rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-emerald-800 bg-emerald-950/60 text-emerald-200"
                : "border-red-800 bg-red-950/60 text-red-200"
            }`}
          >
            {feedback.message}
          </section>
        ) : null}

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
              onClick={() => void createAgent()}
              disabled={isCreatingAgent}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatingAgent ? "Creating..." : "Create Agent"}
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
                      <p className="mt-1 text-xs text-zinc-500">
                        {agent.description || "No description provided."}
                      </p>
                    </div>
                    <button
                      onClick={() => void deleteAgent(agent.id)}
                      disabled={activeAgentId === agent.id}
                      className="text-sm text-zinc-600 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {activeAgentId === agent.id ? "..." : "✕"}
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
                    <span className="rounded bg-zinc-800 px-2 py-0.5">
                      {taskCountsByAgent[agent.id] || 0} assigned
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
          <div className="mb-4 flex flex-col gap-3 lg:flex-row">
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
            <select
              value={newTaskAgentId}
              onChange={(e) => setNewTaskAgentId(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Unassigned</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => void createTask()}
              disabled={isCreatingTask}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatingTask ? "Adding..." : "Add Task"}
            </button>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-zinc-500">No tasks yet. Add one above.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="grid gap-4 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-4 lg:grid-cols-[minmax(0,1.8fr)_220px_190px]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-zinc-200">{task.title}</span>
                      <span className="text-xs text-zinc-500">
                        Created {new Date(task.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-400">
                      <span className="rounded bg-zinc-800 px-2 py-1">
                        Assigned: {getAgentName(task.agentId)}
                      </span>
                      <span className="rounded bg-zinc-800 px-2 py-1">
                        Updated: {new Date(task.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    {task.result ? (
                      <p className="mt-2 text-sm text-zinc-400">Result: {task.result}</p>
                    ) : null}
                  </div>
                  <label className="space-y-2 text-sm text-zinc-400">
                    <span className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Agent Assignment
                    </span>
                    <select
                      value={task.agentId ?? ""}
                      onChange={(e) => void updateTaskAssignment(task.id, e.target.value)}
                      disabled={activeTaskId === task.id}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Unassigned</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 text-sm text-zinc-400">
                    <span className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Task Status
                    </span>
                    <select
                      value={task.status}
                      onChange={(e) => void updateTaskStatus(task.id, e.target.value)}
                      disabled={activeTaskId === task.id}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                        task.status === "completed"
                          ? "border-emerald-800 bg-emerald-950/40 text-emerald-200"
                          : task.status === "running"
                            ? "border-blue-800 bg-blue-950/40 text-blue-200"
                            : task.status === "failed"
                              ? "border-red-800 bg-red-950/40 text-red-200"
                              : "border-zinc-700 bg-zinc-950 text-zinc-300"
                      }`}
                    >
                      {TASK_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
