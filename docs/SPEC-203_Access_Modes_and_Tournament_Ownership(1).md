# Pickleball Arena App
## Competition Management Platform

# SPEC-203 – Access Modes and Tournament Ownership

---

**Document ID:** SPEC-203

**Category:** Product Specification

**Title:** Access Modes and Tournament Ownership

**Version:** 1.0.0

**Status:** Approved

**Owner:** Software Architecture

**Last Updated:** 2026-08-17

---

# 1. Purpose

This specification defines how users enter Pickleball Arena App, how tournament ownership is determined, and how access differs between guest users, individual coaches and organization coaches.

The objective is to provide immediate access with minimal friction while preserving a clear ownership and collaboration model.

---

# 2. Product Access Modes

Pickleball Arena App supports three usage modes.

```text
Pickleball Arena App
        │
        ├── Guest
        │     └── Local tournaments
        │
        └── Authenticated User
              │
              ├── Personal Workspace
              │     └── Private tournaments
              │
              └── Organization Workspace
                    └── Shared tournaments
```

These are usage modes, not three separate authentication systems.

---

# 3. Guest Mode

Guest Mode allows a user to start using the application without creating an account.

A guest user may:

- create a tournament;
- configure its competition format;
- add participants;
- generate competition structures;
- manage matches and results;
- complete the tournament.

Guest tournaments are stored locally on the device or browser.

Guest Mode does not provide:

- cloud synchronization;
- cross-device access;
- organization collaboration;
- cloud backup.

The interface shall clearly communicate that guest tournaments remain on the current device until the user creates an account and saves them online.

Guest Mode shall not create a permanent Organization or Member in the core database.

---

# 4. Individual Coach

An authenticated user may work through a Personal Workspace.

```text
User
  ↓
Personal Workspace
  ↓
Private Tournaments
```

Tournaments created in a Personal Workspace belong to that workspace.

They are persistent in the cloud and may be accessed by the authenticated user from supported devices.

They are not automatically visible to other coaches.

---

# 5. Organization Coach

An authenticated user may belong to one or more Organization Workspaces.

```text
Organization
     │
     ├── Owner
     ├── Manager
     ├── Coach
     └── Viewer
          │
          ↓
    Shared Tournaments
```

A tournament created inside an Organization Workspace belongs to the Organization.

It does not belong to the individual coach who created it for visibility purposes.

All active members of the Organization may see or manage Organization tournaments according to their assigned role and permissions.

This enables multiple coaches to manage the same tournaments without sharing credentials.

---

# 6. Authentication Model

Pickleball Arena App shall use one authentication flow for registered users.

The entry experience shall distinguish only between:

```text
Continue without an account
              or
           Sign in
```

After authentication, workspace selection determines the operating context.

An authenticated user may therefore work as an individual coach in a Personal Workspace and as an organization coach in one or more Organization Workspaces using the same account.

---

# 7. Ownership Rules

Tournament ownership is determined by its operating context.

| Context | Persistence | Ownership | Visibility |
| --- | --- | --- | --- |
| Guest | Local | Current local guest context | Current device/browser |
| Personal Workspace | Cloud | Personal Workspace | Individual coach |
| Organization Workspace | Cloud | Organization | Authorized organization members |

The creator may be recorded for audit purposes, but creator identity shall not redefine workspace ownership or visibility.

---

# 8. Guest to Account Migration

Guest Mode shall support a future conversion path.

```text
Guest Tournament
       ↓
Save online
       ↓
Create account / Sign in
       ↓
Personal Workspace
       ↓
Imported Tournament
```

The migration shall preserve the tournament state as far as technically possible.

The initial Guest Mode implementation may precede migration support, but the local data model shall not prevent future migration.

---

# 9. User Experience Principles

Access shall follow the Foundation principles of simplicity, mobile-first design and progressive disclosure.

The initial screen shall prioritize two clear actions:

- Continue without an account
- Sign in

Account and workspace concepts shall not be exposed before they are required.

Guest limitations shall be communicated clearly but shall not interrupt normal tournament operation.

---

# 10. Commercial Independence

Access mode and commercial plan are separate concepts.

This specification does not define pricing.

Future product policy may assign different capabilities or limits to Guest, Personal and Organization usage without changing the ownership model defined here.

---

# 11. Success Criteria

This specification is successfully implemented when:

- a new user can start a tournament without registration;
- a registered individual coach can manage private cloud tournaments;
- organization coaches can see and manage the same Organization tournaments according to permissions;
- one authenticated account can operate in multiple workspaces;
- Guest Mode does not pollute the persistent Organization/Member model;
- the architecture permits future migration of a guest tournament to a Personal Workspace.

---

# Related Documents

- SPEC-100 – Foundation
- SPEC-200 – Core Data Model
- SPEC-201 – Competition Workflow
- SPEC-202 – UI Navigation
- ADR-011 – Guest Mode Persistence
