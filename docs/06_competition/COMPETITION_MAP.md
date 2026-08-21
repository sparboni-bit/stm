# STM Competition Map

Version: 1.0

Status: Living Document

---

# STM Overview

```
Workspace
│
├── Members
│
├── Competitions
│      │
│      ├── Configuration
│      ├── Entries
│      ├── Structure
│      ├── Generation
│      ├── Play
│      ├── Reports
│      └── Optimizer
│
├── Players (future)
├── Templates (future)
└── Settings
```

---

# Competition

Competition is the Aggregate Root.

```
Competition
│
├── Metadata
├── Configuration
├── Entries
├── Structure
├── Matches
├── Rankings
├── Reports
└── Optimizer
```

Everything belongs to the Competition.

---

# Competition Lifecycle

```
Create

↓

Configure

↓

Add Entries

↓

Validate

↓

Generate

↓

Play

↓

Complete

↓

Archive
```

---

# Configuration

```
Competition

↓

Structure

↓

Play Mode

↓

Scoring

↓

Courts

↓

Seeding

↓

Settings
```

Configuration is frozen after Generation.

---

# Entries

```
Entries

│

├── Player

├── Team

└── Individual Doubles
```

Entries become locked after Generation.

---

# Structure

```
Structure

│

├── Single Elimination

├── Double Elimination

├── Round Robin

├── RR + Playoff

├── RR + Consolation

├── Individual RR

├── Swiss

└── League
```

---

# Generation Engine

```
Configuration

+

Entries

↓

Validation

↓

Generate Structure

↓

Generate Matches

↓

Generate Rankings

↓

Ready to Play
```

Generation is deterministic.

---

# Match Engine

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
Retired

Cancelled
```

---

# Court Engine

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

# Ranking Engine

```
Results

↓

Ranking Algorithm

↓

Standings

↓

Tie Break

↓

Final Ranking
```

Ranking is always computed.

Manual overrides are exceptions.

---

# Reports

```
Competition

↓

Matches

↓

Rankings

↓

Statistics

↓

Printable Reports

↓

Export
```

Reports are read-only.

---

# Optimizer

The Optimizer knows only:

```
Players

Teams

Courts

Rounds

Matches

Time

Constraints
```

It never knows:

```
Pickleball

Tennis

Padel
```

Sport rules belong elsewhere.

---

# Repository Layer

```
Repositories

↓

CRUD

↓

Database
```

Repositories never execute algorithms.

---

# RPC Layer

```
RPC

↓

Generation

↓

Ranking

↓

Scheduling

↓

Statistics

↓

Optimizer
```

Every algorithm belongs here.

---

# Server Actions

```
UI

↓

Server Actions

↓

Repositories

↓

RPC

↓

Database
```

Server Actions coordinate workflows.

---

# User Interface

```
AppShell

↓

Competition Dashboard

↓

Competition

↓

Configuration

↓

Entries

↓

Structure

↓

Play

↓

Reports
```

Pages compose.

Components render.

Repositories fetch.

RPC calculate.

---

# Data Ownership

```
Workspace

↓

Competition

↓

Everything Else
```

There are no orphan objects.

---

# Future Modules

```
Players Database

↓

Templates

↓

Public API

↓

White Label

↓

Mobile Apps

↓

AI Assistant
```

The architecture already supports them.

---

# Development Workflow

Every feature follows the same path.

```
Idea

↓

Specification

↓

Architecture

↓

Database

↓

Repository

↓

RPC

↓

Server Actions

↓

UI

↓

Testing

↓

Documentation

↓

Build

↓

Commit
```

---

# STM Philosophy

Simple UI.

Powerful Engine.

Deterministic Algorithms.

Reusable Components.

Maintainable Architecture.

Documentation First.