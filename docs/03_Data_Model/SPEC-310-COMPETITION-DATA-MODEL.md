# SPEC-310 – Competition Data Model

**Version:** 1.0

**Status:** Approved

**Applies to:** STM V2

---

# Purpose

This document defines the logical data model of the STM Competition Engine.

It represents the canonical model from which database tables, repositories and business logic are derived.

The model is intentionally independent from implementation details.

---

# Design Principles

The Competition Data Model follows these principles.

- Workspace First
- Competition First
- Aggregate Root
- Database First
- Repository Pattern
- Stateless UI
- Extensible
- Sport Independent

---

# Aggregate Root

The aggregate root is:

```
Competition
```

Everything belongs to a Competition.

No object exists independently.

---

# Global Model

```
Workspace
│
├── Members
│
└── Competitions
      │
      ├── Configuration
      │
      ├── Entries
      │
      ├── Structure
      │
      ├── Courts
      │
      ├── Matches
      │
      ├── Rankings
      │
      ├── Reports
      │
      └── Optimizer
```

---

# Workspace

Workspace owns every Competition.

One Workspace

↓

Many Competitions

---

# Competition

Competition is the central entity.

Contains:

- metadata
- configuration
- workflow state
- settings
- structure

Every Competition belongs to one Workspace.

---

# Configuration

Configuration describes the competition.

Examples

- play mode
- structure
- scoring
- seeding
- timing
- courts

Configuration is immutable after generation.

---

# Entries

Entries represent competitors.

Depending on Play Mode they become:

Player

or

Team

Entries are immutable after Generation.

---

# Teams

Teams exist only when required.

Singles competitions do not create Teams.

Doubles competitions create Teams.

Individual Doubles create temporary Teams.

---

# Structure

Structure represents the generated competition.

Possible objects:

Groups

Stages

Brackets

Qualification Rules

Ranking Tables

Structure exists only after Generation.

---

# Courts

Courts represent physical resources.

They know:

- name
- number
- status

They never know competition rules.

---

# Matches

A Match is the smallest executable unit.

Contains:

Participants

Court

Status

Score

Winner

Scheduling

Timing

Every competition eventually becomes a collection of Matches.

---

# Rankings

Rankings are generated.

They are never manually edited except explicit overrides.

Ranking algorithms belong to RPC.

---

# Reports

Reports are projections.

They never own data.

They aggregate existing information.

---

# Optimizer

Optimizer stores only configuration.

Generated schedules belong to the Competition.

The Optimizer does not own matches.

---

# Ownership

```
Workspace

↓

Competition

↓

Everything else
```

Every entity belongs to exactly one Competition.

---

# Lifecycle

Competition

↓

Configuration

↓

Entries

↓

Generation

↓

Execution

↓

Reports

↓

Archive

---

# State Model

Competition

```
draft

configure

ready

generated

running

completed

archived
```

Match

```
scheduled

ready

running

completed

cancelled
```

Court

```
available

occupied

disabled
```

Member

```
pending

active

disabled
```

---

# JSON Configuration

Variable configuration belongs inside JSON.

Examples

```
settings

metadata

structure
```

Avoid creating columns for evolving options.

Columns are reserved for stable business data.

---

# Repository Responsibilities

Repositories expose CRUD.

Repositories never execute algorithms.

---

# RPC Responsibilities

RPC owns:

Generation

Ranking

Scheduling

Optimizer

Statistics

Fairness

Every algorithm belongs to PostgreSQL.

---

# Server Actions

Server Actions coordinate workflows.

They never contain business algorithms.

---

# Future Extensions

The model supports:

Swiss

League

Season

Championship

Multi Stage

Team Championship

AI Optimizer

Public APIs

without redesigning the database.

---

# Relationships

```
Workspace

1

↓

N

Competition

1

↓

N

Entries

1

↓

N

Matches

Competition

1

↓

N

Courts

Competition

1

↓

N

Rankings

Competition

1

↓

N

Reports
```

---

# Naming Conventions

Use singular entity names.

Examples

Competition

Entry

Court

Match

Stage

Group

Ranking

Repository names follow the entity.

```
CompetitionRepository

MatchRepository

CourtRepository
```

---

# Final Objective

The STM Data Model is designed to support every future competition engine while keeping the database simple, normalized and maintainable.

Every future implementation must remain compatible with this document.