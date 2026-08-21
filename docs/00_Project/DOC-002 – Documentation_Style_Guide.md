# STM V2
## Competition Management Platform

# DOC-002 – Documentation Style Guide

---

**Document ID:** DOC-002

**Category:** Project

**Title:** Documentation Style Guide

**Version:** 1.0.0

**Status:** Approved

**Owner:** Software Architecture

**Audience:** Product Owner, Software Architects, Developers, UX Designers, QA Engineers

**Last Updated:** 2026-07-07

---

# 1. Purpose

This document defines the editorial standards used throughout the STM V2 documentation.

Its objective is to ensure that every specification is written with a consistent structure, terminology, and level of detail.

Documentation consistency is considered a fundamental quality attribute of the project.

---

# 2. Scope

This guide applies to every official STM V2 document, including:

- DOC (Project Documents)
- SPEC (Product Specifications)
- ADR (Architecture Decision Records)
- REF (Reference Documents)

The rules defined here shall be followed for all future documentation.

---

# 3. Documentation Principles

Every document shall follow these principles.

## Clarity

Documentation shall be understandable without requiring verbal explanations.

---

## Consistency

The same concept shall always be described using the same terminology.

Synonyms shall be avoided.

---

## Precision

Requirements shall be specific.

Ambiguous wording shall be avoided.

---

## Independence

Whenever possible, each document shall be readable independently.

Cross references shall replace duplicated content.

---

## Maintainability

Documents shall remain easy to update over the lifetime of the project.

---

# 4. Language

The official documentation language is English.

Reasons:

- source code uses English
- database objects use English
- APIs use English
- documentation should be internationally accessible

User manuals may be translated separately.

---

# 5. Terminology

Only approved terminology defined in the Product Glossary may be used.

If a new concept is introduced, it shall first be added to the Product Glossary.

Documentation shall never introduce undefined terminology.

---

# 6. Writing Style

Documentation shall use technical and objective language.

Avoid:

- maybe
- probably
- usually
- hopefully
- etc.
- and so on

Prefer explicit statements.

---

# 7. Requirement Keywords

The following keywords shall follow the intent defined by RFC 2119.

## MUST

Mandatory requirement.

---

## MUST NOT

Forbidden behavior.

---

## SHALL

Formal specification requirement.

---

## SHALL NOT

Formal prohibition.

---

## SHOULD

Strong recommendation.

Alternative implementations are possible but discouraged.

---

## SHOULD NOT

Generally discouraged.

---

## MAY

Optional behavior.

---

## OPTIONAL

Implementation choice.

---

# 8. Document Structure

Specifications shall follow a common structure whenever applicable.

Typical sections include:

1. Purpose
2. Scope
3. Design Goals
4. Principles
5. Specification
6. Constraints
7. Future Evolution
8. Related Documents
9. Related ADRs

Project documents may use simplified structures.

---

# 9. Formatting Rules

Use Markdown only.

Use ATX headings.

Maximum heading depth:

```
#
##
###
####
```

Avoid deeper nesting.

---

# 10. Lists

Use unordered lists whenever order is not important.

Use numbered lists only for sequential processes.

Keep list items concise.

---

# 11. Tables

Use tables for:

- comparisons
- classifications
- responsibilities
- permissions
- state transitions

Avoid large tables containing descriptive text.

---

# 12. Diagrams

Simple ASCII diagrams are preferred during the design phase.

Example:

```
Organization
      │
      ▼
Competition
      │
      ▼
Tournament
      │
      ▼
Match
```

More formal UML diagrams may be added later.

---

# 13. Examples

Examples illustrate concepts.

Examples are informative.

Specifications are normative.

Examples shall never define requirements.

---

# 14. Cross References

Documents shall reference other documents instead of repeating information.

Example:

```
See SPEC-100 Foundation.
```

Example:

```
See ADR-003 Mobile First.
```

---

# 15. Naming Convention

Documents shall use the following prefixes.

DOC

Project Documentation

SPEC

Product Specifications

ADR

Architecture Decision Records

REF

Reference Documents

---

# 16. Versioning

Documentation follows Semantic Versioning.

Major

Breaking structural changes.

Minor

Approved additions.

Patch

Corrections.

---

# 17. Review Process

Every specification follows the same lifecycle.

```
Draft

↓

Review

↓

Approved

↓

Deprecated
```

No implementation shall begin from a Draft document.

---

# 18. Open Decisions

If a topic has not yet been decided, it shall be documented explicitly.

Placeholder sections such as:

- TODO
- To Be Defined
- Coming Soon

are not permitted.

Open decisions shall be recorded as design questions.

---

# 19. Documentation Quality

Before approval every document shall satisfy the following checklist.

✓ Purpose is clear

✓ Scope is complete

✓ No duplicated information

✓ Terminology is consistent

✓ Cross references are correct

✓ Requirements are unambiguous

✓ Formatting follows this guide

✓ Future evolution is documented when appropriate

---

# 20. Guiding Statement

> Good documentation is not written for today's developers.

> It is written for the developers who will join the project years from now.

STM V2 documentation is intended to remain clear, maintainable and authoritative throughout the entire lifecycle of the platform.