# Zentrix Agent Platform

Autonomous agent orchestration and management platform. Build, deploy, and manage teams of AI agents that work together to complete complex tasks.

## Features

- **Agent Management**: Create, configure, and deploy autonomous agents
- **Team Workflows**: Set up multi-agent workflows and task chains
- **Real-time Monitoring**: Live execution tracking and logs
- **API Integrations**: Connect external services and APIs
- **LLM Integration**: OpenAI/Claude support for agent intelligence
- **Task Execution**: Queue and execute complex tasks
- **Dashboard**: Comprehensive management UI

## Tech Stack

- **Frontend**: Next.js + React + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Queue**: Redis
- **Containers**: Docker
- **CI/CD**: GitHub Actions

## Quick Start

```bash
# Clone and setup
git clone <repo>
cd zentrix-agent-platform

# Start PostgreSQL for durable agent/task storage
docker compose up postgres -d

# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev

# Visit http://localhost:3000
```

## Project Structure

```
zentrix-agent-platform/
├── backend/              # Node.js API server
├── frontend/             # Next.js dashboard
├── docker-compose.yml    # Local development services
├── AGENTS.md             # Cloud agent instructions
├── README.md             # Project overview
└── LICENSE
```

## Storage Model

- Agents and tasks are stored in PostgreSQL and survive backend restarts.
- The backend initializes its core tables automatically on startup.
- Redis remains available in `docker-compose.yml` for future queue and worker work, but it is not required for the current CRUD APIs.
