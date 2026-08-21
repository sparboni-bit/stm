# STM V2
## Competition Management Platform

# ADR-800 – What is STM?

---

**Document ID:** ADR-800

**Category:** Architecture Decision Record

**Title:** What is STM?

**Version:** 1.0.0

**Status:** Approved

**Decision Date:** 2026-07-07

**Owner:** Software Architecture

---

# Status

Approved

---

# Context

During the initial design phase of STM V2, the project required a clear definition of its identity.

The first generation of STM was developed as a Tournament Manager integrated into a broader event platform.

The second generation is being designed as an independent product.

Before defining the domain model, the software architecture or the user experience, it was necessary to answer one fundamental question:

> **What is STM?**

The answer to this question influences every architectural decision that follows.

---

# Decision

STM is **not** a Tournament Manager.

STM is a **Competition Management Platform**.

Tournament Management represents the first major capability of the platform, but it does not define the platform itself.

The platform is designed around the broader concept of **Competition**, allowing future support for multiple competition models without requiring architectural redesign.

---

# Motivation

Tournament management was the initial business need.

However, experience gained during STM V1 demonstrated that organizations require support for many different types of sporting activities.

Restricting the platform to tournaments would unnecessarily limit its evolution.

Designing STM around the concept of Competition provides a stable and extensible foundation.

---

# Architectural Consequences

The platform domain will be centered on the concept of **Competition** rather than **Tournament**.

Tournament becomes one specialization of Competition.

Future competition formats can be introduced without changing the platform foundation.

Examples include:

- Tournament
- League
- Ladder
- Swiss Competition
- Team Competition
- Training Session
- King's Court
- DUPR Session
- Future competition models

The architecture shall remain open for future extensions.

---

# Alternatives Considered

## Alternative A

STM as a Tournament Manager.

Advantages:

- Simpler initial implementation.
- Smaller domain model.

Disadvantages:

- Artificial limitations.
- Difficult long-term evolution.
- Future competition formats would require structural redesign.

This alternative was rejected.

---

## Alternative B

STM as a Competition Management Platform.

Advantages:

- Stable domain model.
- Better scalability.
- Easier long-term evolution.
- Consistent architecture.

Disadvantages:

- Slightly broader initial abstraction.

This alternative was accepted.

---

# Implications

The following concepts become fundamental platform entities:

- Organization
- Competition
- Participant
- Team
- Match
- Court
- Competition Template
- Schedule
- Ranking

Tournament is modeled as one possible Competition type.

The platform architecture shall never assume that every Competition is necessarily a Tournament.

---

# Guiding Principle

> Design for the platform you want to have in ten years, not only for the features you need today.

---

# Consequences

Future specifications shall use the term **Competition** whenever referring to the general domain.

The term **Tournament** shall only be used when referring to the specific tournament competition model.

This distinction shall remain consistent throughout the entire documentation.

---

# Related Specifications

- SPEC-100 Foundation
- SPEC-101 Product Manifesto
- SPEC-102 Design Philosophy

---

# Related ADRs

- ADR-801 Competition Platform
- ADR-802 Organization First

---

# Decision Summary

STM V2 is officially defined as a **Competition Management Platform**.

Tournament Management is the first supported capability of the platform, not its architectural identity.