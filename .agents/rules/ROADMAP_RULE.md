---
name: roadmap-enforcement
description: Forces all AI agents to read the ROADMAP.md before any implementation work.
trigger: always_on
---
# Roadmap Enforcement Rule

> **⚠️ MANDATORY: Before writing ANY implementation code, you MUST read `ROADMAP.md` in the project root.**

## Rules

1. **ALWAYS read `ROADMAP.md`** at the project root before starting any feature work.
2. **ALWAYS read `.agents/rules/CODING_STANDARDS.md`** — it defines the architecture, patterns, naming, and rules you MUST follow. No exceptions.
3. **Identify the CURRENT PHASE** — find the first phase with status `⬜ NOT STARTED` or `🔄 IN PROGRESS`.
4. **NEVER skip phases.** Complete the current phase fully before moving to the next.
5. **NEVER work on tasks from a future phase** unless the current phase is `✅ COMPLETED`.
6. **NEVER rewrite existing functions.** Search the codebase FIRST. If a utility, hook, service, middleware, or component exists — import and reuse it. The `ROADMAP.md` has a "What Already Exists" section listing all reusable infrastructure.
7. **NEVER break existing code.** Your new code must integrate cleanly with what's already built. Run `pnpm build` to verify.
8. **UPDATE `ROADMAP.md`** as you work:
   - Mark tasks `[/]` when you start working on them
   - Mark tasks `[x]` when they are completed and verified
   - Update phase status to `🔄 IN PROGRESS` when you start the first task
   - Update phase status to `✅ COMPLETED` only when ALL tasks in the phase are `[x]`
9. **Follow the exact file structure and patterns** specified in each task and in `CODING_STANDARDS.md`.
10. **Verify your work** using the Verification checklist at the end of each phase before marking it complete.

## Quick Reference — Where To Find Things

| Document | Location | Purpose |
|---|---|---|
| Implementation Roadmap | `ROADMAP.md` (project root) | What to build, in what order |
| Coding Standards | `.agents/rules/CODING_STANDARDS.md` | How to build it (architecture, patterns, conventions) |

## How To Start Work

1. Read `ROADMAP.md`
2. Find the current active phase (first non-completed phase)
3. Pick the next unchecked `[ ]` task within that phase
4. Mark it `[/]` in `ROADMAP.md`
5. Implement following `CODING_STANDARDS.md` patterns
6. Verify the task works
7. Mark it `[x]` in `ROADMAP.md`
8. Repeat until phase is complete
