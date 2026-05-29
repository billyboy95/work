# Executive Backlog

This backlog is ordered by expected operational leverage, not implementation convenience.

## P0 - Establish the operating system

### 1. Convert the README blueprint into tracked delivery work

**Why it matters**
- There is no actionable delivery backlog yet.
- Without a backlog, automation cannot prioritize execution or report progress meaningfully.

**Definition of done**
- Create initial Linear projects or issues for backend, frontend, infrastructure, integrations, and reporting.
- Replace onboarding-only issues with real operational or product work.

### 2. Scaffold the platform structure promised in the README

**Why it matters**
- The repo currently cannot support implementation, testing, or deployment work.
- This is the main bottleneck blocking all downstream automations.

**Definition of done**
- Add `backend/`, `frontend/`, `docs/`, and `.github/workflows/`
- Add setup instructions that match the actual repo contents

### 3. Define core business workflows

**Why it matters**
- The business focus areas are known, but the workflows are not yet mapped.
- Automation is only effective once triggers, inputs, outputs, and owners are defined.

**Definition of done**
- Document workflows for:
  - lead generation
  - client onboarding
  - CRM management
  - reporting dashboards
  - Appwrite and external integrations

## P1 - Reduce manual workload

### 4. Build a daily executive reporting pipeline

**Why it matters**
- Current reporting is manual and context is fragmented.
- A repeatable status report improves continuity and decision speed.

**Definition of done**
- Standard report template
- Automated collection of repo, issue, and workflow status
- Stored historical reports for trend review

### 5. Add CI/CD and environment validation

**Why it matters**
- There is no quality gate, no deployment pipeline, and no setup validation.
- This increases execution risk once code starts landing.

**Definition of done**
- Baseline GitHub Actions workflow
- Environment checks
- Fast smoke validation for backend and frontend

## P2 - Revenue and scaling systems

### 6. Define the revenue operations stack

**Why it matters**
- Revenue growth requires clear systems for inbound leads, pipeline visibility, and conversion follow-up.

**Definition of done**
- Document source-of-truth systems
- Define lead stages and handoffs
- Identify automation opportunities across outreach, qualification, and follow-up

### 7. Build an integration inventory

**Why it matters**
- Future automation quality depends on knowing which systems exist, what data they expose, and where duplication happens.

**Definition of done**
- Inventory of connected tools
- Purpose, owner, auth method, and key automations for each integration

## Current blockers

- No implemented product directories
- No active Linear projects
- No non-onboarding issue backlog
- No deployment or reporting infrastructure
- No documented business workflow maps
