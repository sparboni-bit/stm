# Pickleball Arena App
## Competition Management Platform

# ADR-011 – Guest Mode Persistence

---

**Document ID:** ADR-011

**Category:** Architecture Decision Record

**Title:** Guest Mode Persistence

**Version:** 1.0.0

**Status:** Approved

**Owner:** Software Architecture

**Last Updated:** 2026-08-17

---

# 1. Context

Pickleball Arena App must allow a user to create and manage a tournament without registering.

The existing cloud architecture is Organization-based: persistent competitions belong to an Organization and authenticated users collaborate through membership and permissions.

Creating artificial permanent Organizations or Members for anonymous visitors would weaken this ownership model and introduce unnecessary persistent data.

---

# 2. Decision

Guest tournaments shall be persisted locally on the user's device/browser.

Guest Mode shall remain outside the persistent Organization and Member model until the user explicitly signs in or creates an account and chooses to save a tournament online.

The local Guest model shall represent the tournament data required by the same product workflow used by authenticated tournaments.

---

# 3. Rationale

This decision provides:

- zero-friction product entry;
- no anonymous permanent database accounts;
- no artificial Guest Organizations;
- a clean separation between local and cloud ownership;
- a future migration path to a Personal Workspace;
- reduced security and RLS complexity for anonymous use.

It also preserves the principle that cloud competitions belong to workspaces rather than individual users.

---

# 4. Consequences

## Positive

Guest users can use the core tournament workflow immediately.

The Supabase Organization/Member model remains clean.

Organization RLS rules do not need to be weakened for anonymous users.

## Negative

Guest tournaments are initially device-specific.

Clearing browser/application storage may remove local tournaments.

Cross-device synchronization and collaboration are unavailable until the tournament is saved online.

The UI must communicate these limitations clearly.

---

# 5. Implementation Constraints

The Guest persistence layer shall be isolated behind an interface so that UI and competition engines do not depend directly on browser storage APIs.

Guest data shall use stable identifiers and a serializable representation suitable for future migration.

Guest Mode shall not require changes to Organization RLS policies.

A later migration service may translate local Guest data into the persistent cloud repositories.

---

# 6. Alternatives Rejected

## Anonymous permanent Supabase users

Rejected because it creates persistent authentication identities for users who explicitly chose not to register.

## Shared Guest Organization

Rejected because unrelated guest tournaments must never share an ownership boundary.

## Temporary cloud competitions without membership

Rejected because it weakens the Organization-first authorization model and complicates RLS.

---

# 7. Status

Approved for implementation.

---

# Related Documents

- SPEC-100 – Foundation
- SPEC-200 – Core Data Model
- SPEC-203 – Access Modes and Tournament Ownership
