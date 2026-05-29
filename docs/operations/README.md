# Zentrix Operations Control Center

This directory is the operational source of truth for autonomous reviews, executive reporting, and follow-up execution.

## Purpose

Use this layer to keep operational context durable across runs, even while the product codebase is still being built.

## Current baseline

### Repository state

- The repository is currently a scaffold with only `README.md` and `LICENSE` at the root.
- The architecture in `README.md` describes a future platform with:
  - `backend/`
  - `frontend/`
  - `docker-compose.yml`
  - `.github/workflows/`
  - `docs/`
- None of the planned application directories or delivery pipelines exist yet.

### Linear state

- Workspace team detected: `Aiautotechza`
- Active project count: `0`
- Active document count: `0`
- Active issues found: `4`
- All current issues are Linear onboarding items:
  - `AIA-1` Get familiar with Linear
  - `AIA-2` Set up your teams
  - `AIA-3` Connect your tools
  - `AIA-4` Import your data
- Available issue labels:
  - `Bug`
  - `Feature`
  - `Improvement`

## Daily operating cadence

1. Inspect persistent memory and previous reports.
2. Review repository changes, open implementation gaps, and missing delivery infrastructure.
3. Review Linear for new projects, issues, blockers, or stale work.
4. Execute one high-leverage improvement when the path is clear.
5. Update the daily report and persistent memory with new findings.

## Priority framework

When choosing work, prioritize in this order:

1. Revenue-enabling systems
2. Manual-work reduction
3. Workflow reliability and observability
4. Backlog clarity and project coordination
5. Documentation that improves future automation performance

## Standard outputs

- Daily executive reports go in `docs/operations/reports/`
- Medium-term priorities live in `docs/operations/executive-backlog.md`
- Durable memory should be mirrored in automation memory as well as repo docs when useful

## Immediate operating priorities

1. Turn the README blueprint into an executable product and operations backlog.
2. Establish real Linear projects and non-onboarding issues.
3. Scaffold the platform directories described in the README.
4. Add CI/CD, environment templates, and setup documentation.
5. Define measurable workflows for onboarding, lead generation, CRM, reporting, and integrations.
