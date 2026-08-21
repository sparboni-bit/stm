# STM V2
## Competition Execution Platform

# SPEC-200 – Core Data Model

---

**Document ID:** SPEC-200

**Category:** Product Specification

**Title:** Core Data Model

**Version:** 1.0.0

**Status:** Approved

**Owner:** Software Architecture

**Last Updated:** 2026-07-07

---

# 1. Purpose

This specification defines the core persistent data model of STM V2.

Its objective is to identify the minimum set of entities required to manage a sports competition while keeping the database simple, maintainable and extensible.

The model intentionally avoids unnecessary normalization inherited from STM V1.

---

# 2. Design Principles

STM V2 follows four fundamental rules.

## Independent Lifecycle

An object becomes a database table only if it has its own lifecycle.

---

## Competition Owns Everything

Everything related to the execution of a competition belongs to the Competition.

---

## JSON Before Tables

Configuration and generated structures are stored as JSON whenever they do not require an independent lifecycle.

---

## Keep the Core Small

The core database should remain as small as possible.

Complexity belongs to the engine, not to the schema.

---

# 3. Core Entities

STM V2 is built around four primary entities.

```text
Organization
│
├── Members
│
└── Competitions
        │
        └── Matches
```

These entities represent the entire persistent core of STM V2.

---

# 4. Entity Responsibilities

## Organization

Owns all data.

Contains Members and Competitions.

---

## Member

Represents a user inside an Organization.

Permissions depend on the assigned role.

Roles:

- Owner
- Manager
- Coach
- Viewer

---

## Competition

Represents one managed competition.

A Competition contains:

- configuration
- entries
- generated structure
- scheduling information
- rankings
- reports

The Competition is the Aggregate Root of the system.

---

## Match

Represents a playable match.

A Match has its own lifecycle and therefore is stored independently.

---

# 5. Data Ownership

The following objects belong to a Competition and are **not** independent entities.

```text
Entries

Pairs

Courts

Groups

Phases

Standings

Rankings

Results

Structure

Templates
```

They are stored as configuration, generated data or calculated information.

---

# 6. Persistence Strategy

Persistent entities:

```text
organizations

members

competitions

matches
```

Configuration:

```text
settings

entries

structure

metadata
```

shall be stored as JSON.

---

# 7. V1 Simplification

STM V1 introduced several tables that represented internal competition structures.

STM V2 simplifies the model.

Examples:

```text
tournament_players
            ↓
Competition Entries

tournament_teams
            ↓
Competition Entries

tournament_groups
            ↓
Competition Structure

tournament_phases
            ↓
Competition Structure

tournament_courts
            ↓
Competition Settings

tournament_rankings
            ↓
Computed Data

tournament_results
            ↓
Match Data
```

The objective is to reduce the number of persistent entities without reducing functionality.

---

# 8. Out of Scope

The following concepts are intentionally excluded from the STM V2 core model.

- registrations
- payments
- bookings
- marketing
- accommodation
- travel
- federation administration

These belong to external systems.

---

# 9. Summary

STM V2 intentionally keeps its persistent model extremely small.

Everything that has no independent lifecycle belongs to the Competition.

This approach minimizes database complexity while preserving the flexibility required by different competition formats.

---

# Related Documents

SPEC-100 Foundation

ADR-800 What Is STM

REF-700 Product Glossary