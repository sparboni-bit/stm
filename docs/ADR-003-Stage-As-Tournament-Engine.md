# ADR-003

# Stage as Tournament Engine

Status

Accepted

Date

2026-07-16

---

# Context

STM V2 is designed as a Competition Management Platform rather than a traditional Tournament Manager.

A Competition may contain one or more independent competitive phases.

Examples:

- Qualification Round Robin
- Main Elimination Bracket
- Consolation Bracket
- Individual Rotation
- Swiss System

In STM V1 the Tournament entity was responsible for every aspect of the competition.

This approach became increasingly complex because multiple tournament formats had to coexist inside the same object.

---

# Decision

The Tournament concept is replaced by the Stage.

A Competition becomes an orchestration container.

Each Stage represents a complete Tournament Engine.

The Competition is responsible for:

- general information
- participants
- organization
- overall reports
- final standings

Each Stage is responsible for:

- configuration
- structure generation
- scheduling
- matches
- rankings
- reports

Every Stage operates independently from the others.

---

# Architecture

Competition

    Overview

    Entries

    Stages

        Stage 1

            Tournament Engine

        Stage 2

            Tournament Engine

        Stage 3

            Tournament Engine

    Final Reports

---

# Stage Manager

Each Stage exposes the same functional workflow.

Overview

↓

Configuration

↓

Structure

↓

Generate

↓

Play

↓

Ranking

↓

Reports

The Stage Manager becomes the direct evolution of the Tournament Manager implemented in STM V1.

---

# Stage Engines

Each Stage loads a specific Tournament Engine.

Examples:

Round Robin Engine

Single Elimination Engine

Consolation Engine

Swiss Engine

Individual Rotation Engine

Future tournament systems can be added without modifying existing engines.

Each engine is implemented as an independent module.

---

# Benefits

This architecture provides:

- complete separation of tournament formats
- reusable engines
- simpler maintenance
- isolated testing
- easier future extensions
- reduced coupling
- direct migration path from STM V1

---

# Consequences

Competition remains a lightweight orchestration object.

Business logic moves into Stage Engines.

The majority of STM V1 Tournament Manager can be progressively migrated into dedicated Stage Engines.

This architecture becomes the reference model for all future STM development.