# ADR-010 — STM Core Architecture

Version: 1.0  
Status: Accepted  
Date: 2026-07-18

---

# 1. Context

STM V2 is a standalone sports competition management product designed for web, Android and iOS delivery.

The first version of the Tournament Manager proved the sporting rules and operational workflows, but it concentrated competition data, tournament type, match generation, live management and reporting around a single tournament module.

STM V2 must support:

- personal and business organizations;
- multiple users collaborating in the same organization;
- competitions composed of one or more independent stages;
- several competition formats;
- future formats without repeated changes to the application core;
- mobile-first use during live events;
- strict separation between domain rules, persistence and interface code.

The architecture therefore requires a stable core and replaceable format-specific engines.

---

# 2. Decision

STM V2 adopts the following domain hierarchy:

```text
Organization
    └── Competition
            ├── Entries
            └── Stages
                    └── Stage Engine
```

The main responsibilities are separated as follows:

```text
Core        = identity, ownership, state, permissions and orchestration
Stage       = one sporting phase inside a competition
Engine      = rules and algorithms of a specific competition format
Repository  = persistence access
Service     = reusable cross-engine capability
UI          = presentation and user interaction
```

A Competition is an administrative container. A Stage is the unit that owns sporting configuration, generated structure, matches, ranking and reports. A Stage Engine implements the rules of the selected format.

---

# 3. Architectural principles

## 3.1 Organization-based model

Every Competition belongs to exactly one Organization.

Organizations can be:

- `personal`: owned by one authenticated user;
- `business`: shared by multiple active members.

Access is granted through organization membership and role, not through shared credentials.

## 3.2 Competition as container

A Competition owns:

- title and description;
- organization;
- creator and owner member;
- dates and global status;
- entries;
- ordered stages;
- competition-level metadata and reports.

A Competition does not directly generate matches, calculate a stage ranking or implement bracket rules.

## 3.3 Stage as sporting unit

A Stage owns:

- name and order;
- engine identifier and engine version;
- lifecycle status;
- typed settings stored as JSONB;
- generated structure;
- matches and results;
- stage ranking;
- stage reports.

A Competition can contain one or many Stages. Each Stage can use a different Engine.

## 3.4 Engine as domain algorithm

An Engine contains only format-specific rules, for example:

- round-robin scheduling;
- elimination bracket generation;
- winner propagation;
- individual rotation pairing;
- Swiss round generation.

An Engine must not know Supabase, SQL, React, Next.js routing or server-action implementation details.

## 3.5 Repository as persistence boundary

Repositories are the only application components that know how data is stored.

A Repository may use:

- Supabase queries;
- RPC calls;
- database views;
- transactions exposed through database functions.

A Repository must not implement sporting rules.

The governing rule is:

> An Engine must not know where data is stored. A Repository must not know how a competition format works.

## 3.6 Shared services

Reusable behavior that is not unique to one format belongs to a shared service.

Initial service boundaries are:

- seeding;
- scheduling;
- court assignment;
- ranking utilities;
- fairness analysis;
- printing and export;
- statistics.

A service is introduced only when at least one clear reusable contract exists. Empty abstraction layers must be avoided.

## 3.7 Engine Registry

Available Engines are declared in a central Engine Registry.

The Registry maps a stable engine identifier to an Engine Manifest and implementation factory.

Example identifiers:

```text
round_robin
elimination
individual_rotation
swiss
```

The Stage Manager resolves an Engine through the Registry. It does not import concrete engines directly.

## 3.8 Capability-driven interface

Each Engine declares supported capabilities through its Manifest.

The UI uses these declarations to determine which sections and actions are meaningful.

Capabilities centralize feature discovery, but they do not remove all domain decisions. Format-specific behavior remains inside the Engine and its UI adapter.

## 3.9 Workflow as engine metadata and rules

Workflow is not a separate persisted domain level.

It is the combination of:

- Stage lifecycle state;
- Engine capabilities;
- transition rules;
- currently available actions.

The Engine Manifest can declare workflow characteristics, while lifecycle validation remains centralized.

## 3.10 DB-first security

Authorization must be enforced by Supabase Row Level Security and security-aware database functions.

Frontend visibility is not an authorization mechanism.

The server must validate:

- authenticated user;
- active organization membership;
- role permission;
- Competition and Stage ownership scope;
- lifecycle constraints.

## 3.11 Mobile application first

All operational screens must be usable on a smartphone during a live competition.

This implies:

- touch-friendly controls;
- no critical hover-only interaction;
- explicit loading and error states;
- resilient numeric inputs;
- minimal horizontal scrolling;
- safe confirmation for destructive actions;
- layouts compatible with future native wrappers.

## 3.12 Internationalization

User-facing text must be prepared for localization from the beginning.

Engine identifiers, status codes and capability keys remain language-neutral. Labels are resolved by the UI translation layer.

---

# 4. Target module boundaries

```text
modules/
    organizations/
    organization-members/
    competitions/
    competition-entries/
    competition-stages/
    stage-manager/

    engines/
        core/
        round-robin/
        elimination/
        individual-rotation/
        swiss/

    services/
        seeding/
        scheduling/
        court-assignment/
        ranking/
        fairness/
        printing/
        statistics/
```

The exact folder structure may evolve, but dependency direction must remain stable:

```text
UI
 ↓
Application actions / use cases
 ↓
Engine contracts + domain services
 ↓
Repositories
 ↓
Supabase / PostgreSQL
```

Concrete Engine modules may depend on Engine contracts and shared service contracts. The Core must not depend on a concrete Engine.

---

# 5. Data ownership

## 5.1 Core-owned data

The Core owns:

- organizations;
- memberships and roles;
- competitions;
- competition entries;
- stages;
- generic lifecycle state;
- audit metadata.

## 5.2 Engine-owned data

An Engine owns the meaning and validation of:

- stage settings;
- generated structure;
- format-specific matches;
- format-specific ranking rules;
- format-specific reports.

Physical database tables may be shared or specialized. Logical ownership remains with the Engine contract.

## 5.3 JSONB settings

Stage settings may be stored as JSONB for flexibility, but every Engine must provide:

- a TypeScript settings type;
- runtime validation;
- default values;
- a settings schema version;
- migration handling when the schema changes.

Unvalidated JSONB must never enter Engine logic.

---

# 6. Consequences

## 6.1 Positive consequences

- New formats can be added without redesigning the Core.
- Competition and Stage responsibilities remain clear.
- Engines can be unit-tested without Supabase.
- Persistence can evolve without rewriting algorithms.
- Mobile UI can be driven by capabilities and lifecycle state.
- Multi-stage competitions become a native concept.
- V1 knowledge can be ported selectively rather than copied structurally.

## 6.2 Costs and constraints

- More interfaces and mapping code are required at the beginning.
- Registry, validation and lifecycle rules must remain disciplined.
- Capability declarations can become inaccurate if not tested.
- JSONB requires explicit versioning and runtime validation.
- Shared services must not become a generic dumping ground.

---

# 7. Rejected alternatives

## 7.1 One large Tournament module

Rejected because every new format would increase branching, coupling and regression risk.

## 7.2 One table and one UI per tournament type without a common contract

Rejected because navigation, lifecycle, permissions and reporting would be duplicated.

## 7.3 Engines calling Supabase directly

Rejected because algorithms would be hard to test, persistence-specific and tightly coupled to server infrastructure.

## 7.4 Fully dynamic third-party plugins in the first release

Rejected for the initial product because runtime code loading, security and compatibility would add unnecessary complexity.

The Registry is an internal modular architecture first. External plugin distribution is a possible future evolution, not a current requirement.

---

# 8. Implementation rules

1. No concrete Engine imports inside generic Stage Manager components.
2. No Supabase client inside Engine domain logic.
3. No sporting algorithm inside repositories.
4. Every Stage mutation must validate authorization and lifecycle state.
5. Every Engine settings object must pass runtime validation.
6. Every capability exposed in the Manifest must be covered by tests.
7. Generated structures must be reproducible or carry a generation version and audit metadata.
8. Destructive regeneration must be explicitly protected after play has started.

---

# 9. Initial implementation sequence

1. Stage detail route and permanent Stage Manager shell.
2. Engine contracts and types.
3. Engine Registry.
4. Capability and navigation mapping.
5. Stage lifecycle validation.
6. Round Robin Engine V2 as the first real Engine.
7. Elimination Engine.
8. Individual Rotation Engine.

---

# 10. Decision summary

STM V2 is built around a stable Organization and Competition Core, independent Stages and modular Stage Engines.

The Core orchestrates and secures state. Engines implement sporting algorithms. Repositories persist data. Shared services provide genuinely reusable behavior. The Stage Manager is driven by Engine metadata, capabilities and lifecycle rules.
