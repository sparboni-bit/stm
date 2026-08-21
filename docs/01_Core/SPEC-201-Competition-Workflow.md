# STM V2
## Competition Execution Platform

# SPEC-201 – Competition Workflow

---

**Document ID:** SPEC-201

**Category:** Product Specification

**Title:** Competition Workflow

**Version:** 1.0.0

**Status:** Approved

**Owner:** Software Architecture

**Last Updated:** 2026-07-07

---

# 1. Purpose

This specification defines the lifecycle of a Competition.

The workflow represents the operational flow followed by every Competition managed by STM V2.

Every user interface and backend process shall remain consistent with this workflow.

---

# 2. Competition Lifecycle

Every Competition moves through the following states.

```text
Draft

↓

Configure

↓

Import Entries

↓

Generate

↓

Running

↓

Completed

↓

Archived
```

Backward transitions are intentionally limited.

---

# 3. State Description

## Draft

The Competition has been created.

Available actions:

- edit general information
- delete competition

No participants or structure exist.

---

## Configure

The coach configures the competition.

Examples:

- competition type
- scoring mode
- number of courts
- timing
- options

The competition structure is still editable.

---

## Import Entries

Participants are imported or entered manually.

Supported modes:

- manual entry
- copy & paste
- future external integrations

No competition structure exists yet.

---

## Generate

STM generates the competition.

Examples:

- bracket
- groups
- matches
- schedule
- initial rankings

After generation, the competition structure becomes locked.

Only operational changes are allowed.

---

## Running

The competition is active.

Available actions:

- assign courts
- enter scores
- modify schedules
- handle retirements
- print reports
- manage live matches

The competition engine updates standings and progress automatically.

---

## Completed

All matches have been completed.

Final standings and reports become available.

No structural changes are allowed.

---

## Archived

The competition becomes read-only.

Historical information remains available.

---

# 4. Lock Rules

STM protects competition integrity.

After generation:

- competition format cannot change
- structure cannot change
- entries cannot change

Operational data remains editable when allowed.

---

# 5. Automatic Operations

STM automatically performs:

- match generation
- bracket propagation
- standings calculation
- ranking calculation
- qualification
- winner determination
- next match activation

The coach supervises.

The engine executes.

---

# 6. Manual Operations

The coach may:

- change court assignment
- enter results
- record retirements
- print reports
- archive competition

Manual intervention should remain minimal.

---

# 7. Error Recovery

Whenever possible STM allows safe recovery.

Examples:

- undo last result
- regenerate before competition starts
- restore draft configuration

Once downstream matches have been completed, protected results cannot be modified.

---

# 8. Design Principle

The Competition Workflow is intentionally linear.

Complex workflows increase operational errors.

STM favors predictable execution over unlimited flexibility.

---

# 9. Summary

The Competition progresses through a small number of well-defined states.

Every state enables only the actions that are meaningful at that moment.

This minimizes user errors while simplifying the user interface.

---

# Related Documents

SPEC-100 Foundation

SPEC-200 Core Data Model

ADR-800 What Is STM?