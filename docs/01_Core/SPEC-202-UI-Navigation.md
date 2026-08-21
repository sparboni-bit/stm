# STM V2
## Competition Execution Platform

# SPEC-202 – UI Navigation

---

**Document ID:** SPEC-202

**Category:** Product Specification

**Title:** UI Navigation

**Version:** 1.0.0

**Status:** Approved

**Owner:** Software Architecture

**Last Updated:** 2026-07-07

---

# 1. Purpose

This specification defines the primary navigation structure of STM V2.

The objective is to keep navigation simple, predictable and optimized for smartphone usage.

The navigation follows the Competition Workflow defined in SPEC-201.

---

# 2. Navigation Principles

STM V2 is designed Mobile First.

The user should always understand:

- where they are;
- what they can do;
- what the next logical action is.

The application should guide the user through the lifecycle of a Competition.

---

# 3. Main Navigation

```text
Home
│
├── Organizations
│
├── Competitions
│
└── Settings
```

For most users, **Competitions** will be the primary working area.

---

# 4. Competition Navigation

Opening a Competition displays the Competition Dashboard.

```text
Competition
│
├── Dashboard
├── Configuration
├── Entries
├── Generate
├── Matches
├── Rankings
├── Reports
└── Archive
```

Not every section is always available.

Visibility depends on the Competition state.

---

# 5. Dashboard

The Dashboard is the entry point for every Competition.

It summarizes:

- Competition status
- Number of entries
- Number of matches
- Progress
- Current action

The Dashboard always highlights the next recommended action.

Example:

```text
Competition Ready

↓

Generate Competition
```

---

# 6. State Driven Navigation

Navigation changes according to the Competition lifecycle.

## Draft

Visible:

- Configuration

---

## Configure

Visible:

- Configuration
- Entries

---

## Ready

Visible:

- Configuration
- Entries
- Generate

---

## Running

Visible:

- Dashboard
- Matches
- Rankings
- Reports

---

## Completed

Visible:

- Dashboard
- Rankings
- Reports
- Archive

---

## Archived

Read-only navigation.

---

# 7. Match Management

The Matches section is the operational center of STM.

Typical actions include:

- assign courts
- enter scores
- record retirements
- print score sheets
- monitor progress

Most user interaction occurs in this area.

---

# 8. Navigation Rules

The interface should expose only the actions that are currently valid.

Unavailable operations should not be shown.

The interface should always encourage the next logical step.

---

# 9. Mobile First

Every screen shall be fully usable on a smartphone.

The desktop interface extends the mobile experience but does not introduce different workflows.

Navigation should remain consistent across all platforms.

---

# 10. Summary

STM V2 follows a workflow-driven navigation model.

The user is guided through the competition lifecycle by progressively exposing only the functionality required at each stage.

This minimizes complexity while reducing user errors.

---

# Related Documents

SPEC-200 – Core Data Model

SPEC-201 – Competition Workflow

SPEC-100 – Foundation