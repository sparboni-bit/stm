# ADR-901 — Engine Workflow

## Status
Accepted for Sprint 6A.

## Decision
Each Stage Engine declares an ordered workflow. The Stage framework renders that workflow and does not contain Engine-specific knowledge such as brackets, groups, rankings, optimizers, or consolation paths.

A workflow step declares:

- identifier;
- label and description;
- lifecycle milestone.

At runtime the framework resolves each step to one of these states:

- `not_started`;
- `current`;
- `completed`;
- `locked`;
- `attention`.

## Consequences

- Every Engine can expose a different operational flow.
- Stage navigation becomes mobile-first and task-oriented.
- Locked steps cannot be opened directly.
- The framework remains independent from tournament formats.
- Future dashboards may reuse the same workflow state to show Stage progress.
