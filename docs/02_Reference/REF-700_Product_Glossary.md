# STM V2
## Competition Management Platform

# REF-700 – Product Glossary

---

**Document ID:** REF-700

**Category:** Reference

**Title:** Product Glossary

**Version:** 1.0.0

**Status:** Approved

**Owner:** Software Architecture

**Audience:** Everyone

**Last Updated:** 2026-07-07

---

# Purpose

This glossary defines the official terminology used throughout STM V2.

Every architectural, functional and technical document shall use the definitions contained in this glossary.

A concept shall be defined only once.

This glossary is considered the authoritative source for project terminology.

---

# Core Concepts

## Organization

The legal or operational entity that owns all platform data.

Organizations own competitions, members, players, templates and settings.

Data always belongs to an Organization, never to individual users.

---

## Member

A registered user belonging to an Organization.

Members access STM using their personal account.

Permissions depend on assigned roles.

---

## Role

A set of permissions assigned to a Member within an Organization.

Examples include:

- Owner
- Manager
- Coach
- Viewer

The role model is extensible.

---

## Competition

A structured sporting activity managed by STM.

Competition is the highest-level domain concept.

Tournament is one specific type of Competition.

Future Competition types may include Leagues, Ladders and other formats.

---

## Competition Template

A reusable configuration describing how a Competition should be created.

Templates define rules, defaults and behavior.

They do not contain participants or results.

---

## Participant

An entity registered in a Competition.

Depending on the competition type, a Participant may represent:

- a Player
- a Team

---

## Player

A person eligible to participate in competitions.

Players may participate individually or as members of Teams.

---

## Team

A group of Players participating together as a single Participant.

The number of Players depends on the competition format.

---

## Match

The smallest competitive unit of a Competition.

A Match produces a result.

---

## Court

The physical playing area where Matches take place.

A Match may be assigned to one Court.

---

## Schedule

The chronological organization of Matches within a Competition.

Scheduling includes timing and Court assignment.

---

## Ranking

An ordered classification generated from Competition results.

Ranking rules depend on the Competition format.

---

## Score

The result produced by a Match.

Score interpretation depends on the competition rules.

---

# Supporting Concepts

## Phase

A logical section of a Competition.

Examples:

- Group Stage
- Main Draw
- Consolation

Not every Competition contains Phases.

---

## Round

A collection of Matches played during the same stage of a Competition.

---

## Session

A scheduled period during which Matches are played.

Sessions are mainly used for scheduling purposes.

---

## State

The current lifecycle status of an entity.

Examples:

Draft

Running

Completed

Archived

---

# General Principles

Whenever possible, documentation shall use these terms consistently.

Synonyms should be avoided.

If a new concept is introduced, it shall first be added to this glossary before being used elsewhere.

---

# Related Specifications

SPEC-100 Foundation

ADR-800 What is STM?