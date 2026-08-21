# SPEC-320 – Competition Workflow & State Machine

**Version:** 1.0

**Status:** Approved

**Applies to:** STM V2

---

# Purpose

This document defines the official lifecycle of a Competition.

Every Competition must follow the same workflow.

The workflow guarantees:

- predictable behavior
- data consistency
- simple user experience
- deterministic business rules

---

# Competition Lifecycle

Every Competition follows this sequence.

```
Draft

↓

Configure

↓

Ready

↓

Generated

↓

Running

↓

Completed

↓

Archived
```

A Competition can only move forward.

Backward transitions are intentionally limited.

---

# Draft

## Purpose

Competition has just been created.

No configuration has been completed.

## Allowed

- edit title
- edit description
- change structure
- change play mode
- delete competition

## Forbidden

- generate structure
- play matches
- reports

## UI

Show:

- Configuration
- Delete

Hide:

- Entries
- Matches
- Reports

---

# Configure

## Purpose

Competition configuration is being completed.

## Allowed

- edit settings
- add entries
- remove entries
- import entries
- configure courts
- configure scoring
- configure seeding

## Forbidden

- generate if validation fails

## Exit Condition

Competition is valid.

↓

Ready

---

# Ready

## Purpose

Competition is fully configured.

Waiting for generation.

## Allowed

- edit entries
- edit configuration
- preview settings

- Generate Competition

## Forbidden

- play matches

---

# Generated

## Purpose

Competition structure exists.

Groups

Stages

Matches

Courts

Rankings

have been created.

## Allowed

- assign courts
- inspect structure
- print schedule

## Forbidden

- change entries
- change play mode
- change structure

Configuration becomes locked.

---

# Running

## Purpose

Competition is live.

## Allowed

- submit results
- assign courts
- move matches
- retire players
- update rankings

## Forbidden

- modify entries
- regenerate structure

---

# Completed

## Purpose

Competition finished.

## Allowed

- reports
- statistics
- export
- print

## Forbidden

Any structural modification.

---

# Archived

Competition becomes read-only.

Used only for historical purposes.

No modification is allowed.

---

# State Transitions

Allowed transitions

```
Draft

↓

Configure

↓

Ready

↓

Generated

↓

Running

↓

Completed

↓

Archived
```

Allowed rollback

```
Configure

↓

Draft
```

```
Ready

↓

Configure
```

No rollback is allowed after Generation.

---

# Generation Lock

Generation creates permanent objects.

Examples

- Groups
- Matches
- Rankings
- Qualification Rules

After generation these objects become authoritative.

Changing Entries requires deleting the generated structure.

---

# Match Lifecycle

Each Match follows its own lifecycle.

```
Scheduled

↓

Ready

↓

Running

↓

Completed
```

Optional

```
Cancelled

Retired
```

---

# Court Lifecycle

Court states

```
Available

↓

Occupied

↓

Available
```

Optional

```
Disabled
```

---

# Entry Lifecycle

```
Created

↓

Confirmed

↓

Locked

↓

Eliminated (optional)

↓

Completed
```

Entries become locked after Generation.

---

# User Interface Rules

The interface should expose only actions that are valid for the current state.

Disabled buttons should be preferred over hidden actions when they help explain the workflow.

Dangerous actions must require confirmation.

---

# Validation Rules

Before moving to Ready:

- Competition has title
- Structure selected
- Play Mode selected
- Minimum entries reached

Before Generation:

- Validation successful
- Entries complete
- Courts configured (if required)

Before Running:

- Structure generated
- Matches available

Before Completion:

- Every required match completed

---

# Recovery Strategy

If generation fails:

Competition remains in Ready.

If match submission fails:

Match remains unchanged.

If ranking computation fails:

Ranking is recalculated automatically.

---

# Future States

Reserved for future versions.

- Suspended
- Cancelled
- Published
- Live Streaming

---

# Design Principles

The workflow must remain:

- Linear
- Predictable
- Easy to understand
- Easy to validate

Business rules should depend on the workflow state instead of scattered boolean flags.

---

# Final Objective

The Competition Workflow defines the only valid lifecycle of a Competition.

Every module of STM must respect this state machine.