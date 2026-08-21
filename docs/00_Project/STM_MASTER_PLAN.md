# STM MASTER PLAN

Version: 1.0

Status: Living Document

Last Update: July 2026

---

# Sports Tournament Manager (STM)

## Vision

STM (Sports Tournament Manager) is a professional Competition Management Platform designed to organize, generate and manage sports competitions of any type.

STM is not tied to a specific sport.

It is designed to support multiple sports through a common competition engine.

Initially supported:

- Pickleball

Future sports include:

- Tennis
- Padel
- Beach Tennis
- Badminton
- Table Tennis
- Chess
- Bridge
- Bocce
- Darts
- Any competition-based discipline

The goal is to provide a flexible, modern and professional platform suitable for clubs, tournament organizers and sports organizations.

---

# Project Goals

STM has five primary goals.

## 1. Simplicity

The application should remain easy to use even while supporting complex competition formats.

Complexity belongs inside the engine.

Never inside the user interface.

---

## 2. Flexibility

The competition engine must support:

- Single Elimination
- Double Elimination
- Round Robin
- Round Robin + Playoff
- Consolation
- Team competitions
- Individual competitions
- Timed formats
- Future competition models

without requiring architectural changes.

---

## 3. Scalability

STM must support:

Single Coach

↓

Multiple Coaches

↓

Organizations

↓

Large Clubs

↓

National Federations

without redesigning the data model.

---

## 4. Professional Quality

STM should follow modern software engineering practices.

Every feature should be:

- documented
- tested
- maintainable
- reusable

---

## 5. Long-Term Maintainability

The project should remain understandable years after its initial development.

Documentation is considered part of the source code.

---

# Core Principles

STM is built around the following principles.

- Database First
- Repository Pattern
- Workspace First
- Competition First
- Mobile First
- Documentation First
- Build Always Green
- Incremental Development

---

# Architectural Overview

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
    │      ├── Matches
    │      ├── Reports
    │      └── Optimizer
    │
    ├── Players (future)
    ├── Templates (future)
    ├── Assets (future)
    └── Billing (future)
```

---

# Application Workflow

Every competition follows the same workflow.

```
Competition

↓

Configuration

↓

Entries

↓

Generate

↓

Play

↓

Reports
```

The workflow is intentionally linear.

Each phase has clear responsibilities.

---

# Workspace Model

Every authenticated user owns a Personal Workspace.

Users may also belong to multiple Business Workspaces.

Internally:

Workspace = Organization

The user interface only exposes the concept of Workspace.

---

# Competition Model

Competition is the Aggregate Root of the application.

Every competition belongs to one Workspace.

Every competition contains:

- configuration
- entries
- structure
- matches
- rankings
- reports
- optimizer settings

---

# Technology Stack

Frontend

- Next.js
- TypeScript
- Tailwind CSS

Backend

- Supabase

Architecture

- Repository Pattern
- Server Actions
- PostgreSQL RPC
- Row Level Security

Authentication

- Supabase Auth

---

# Design System

The visual language is defined in:

SPEC-050 – Design System

The Design System is mandatory for every new component.

---

# Documentation Structure

```
docs/

00_Project

01_Architecture

02_Data_Model

03_Workflows

04_SQL

05_API

06_Competition

07_Optimizer

08_UI_UX

09_ADR

10_Porting
```

Documentation evolves together with the code.

---

# Development Workflow

Every feature follows the same sequence.

```
Analysis

↓

Specification

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

# Coding Guidelines

Repositories

→ CRUD only

RPC

→ Algorithms only

Server Actions

→ Business workflows

Components

→ Presentation

Pages

→ Composition

---

# Current Project Status

Completed

- Authentication
- Workspace Model
- Members
- Competition Repository
- Competition Entries
- Workspace Switching
- Repository Layer
- Design System Specification

In Progress

- Application Shell
- Navigation
- Competition Dashboard

Planned

- Competition Engine
- Structure Generator
- Match Engine
- Ranking Engine
- Reports
- Optimizer
- Mobile Improvements

---

# Long-Term Roadmap

Foundation

✓ Authentication

✓ Workspace

✓ Competition

↓

Application Shell

↓

Competition Engine

↓

Optimizer

↓

Reports

↓

Players Database

↓

Templates

↓

Public API

↓

White Label

↓

Mobile Apps

---

# Quality Rules

Every milestone must end with:

- Green Build
- Git Commit
- Updated Documentation

The project should never accumulate undocumented architectural decisions.

---

# Final Objective

STM is intended to become a reusable competition management platform capable of supporting different sports through a common architecture.

The ultimate goal is not simply to build software.

The goal is to build a platform that remains understandable, maintainable and extensible over time.

# Non Goals

STM does not manage:

- Court bookings
- Payments
- Club administration
- Membership management
- Event marketing

These responsibilities belong to external systems.

STM focuses exclusively on competition management.

# STM Manifesto

STM is not an Event Management platform.

STM is not a Club Management platform.

STM is not a Booking platform.

STM is a Competition Engine.

Everything in STM exists to make competitions easier to create, manage and execute.

Complexity belongs to the engine.

Simplicity belongs to the user.

Every architectural decision should move the project closer to these principles.

If a new feature does not improve competition management, it probably belongs to another system.

STM should remain focused.

Focused software is maintainable software.