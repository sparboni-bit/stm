# Elimination Stage Engine

This folder contains the dedicated Single Elimination Stage Engine for STM V2.

## Sprint 4A scope

- dedicated engine manifest;
- idempotent engine registration;
- engine-specific section renderer;
- first real Structure section;
- Foundation fallback removed for `elimination`;
- generator, repository and service boundaries prepared.

## Workflow

1. Overview
2. Structure
3. Entries
4. Bracket
5. Matches
6. Reports

## Current behaviour

The `overview` section uses the shared Stage overview. The `structure` section
is rendered by the Elimination Engine. Remaining sections deliberately use the
shared placeholder until their implementation sprint.

## Next sprint

Introduce the bracket domain model without database access:

- BracketTree
- BracketRound
- BracketMatch
- BracketSlot
- advancement links
