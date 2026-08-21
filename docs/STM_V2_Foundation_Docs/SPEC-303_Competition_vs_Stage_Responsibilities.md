# SPEC-303 — Competition vs Stage Responsibilities

Version: 1.0  
Status: Accepted design baseline  
Date: 2026-07-18

---

# 1. Purpose

This specification defines the boundary between Competition and Stage in STM V2.

The boundary is required to avoid recreating the V1 model in which one tournament entity accumulated configuration, participants, format rules, generation, matches, ranking and reports.

---

# 2. Definitions

## 2.1 Competition

A Competition is the administrative and collaborative container owned by an Organization.

Examples:

- Club Championship 2026;
- Summer Pickleball Open;
- Corporate Games;
- Weekly Training Competition.

## 2.2 Stage

A Stage is one ordered sporting phase inside a Competition.

Examples:

- Qualification groups;
- Main bracket;
- Consolation bracket;
- Swiss rounds;
- Individual rotation session;
- Final placement round.

## 2.3 Entry

A Competition Entry is a participant registered in the Competition.

An Entry can represent a player, pair or team according to the Competition play mode and data model.

Stages consume Competition Entries directly or through Stage assignments/qualification links.

---

# 3. Competition responsibilities

The Competition owns:

## 3.1 Identity and ownership

- `organization_id`;
- creator;
- owner member;
- title;
- description;
- visibility and administrative metadata.

## 3.2 Global timing

- planned start and end;
- Competition-level status;
- optional venue or general location reference;
- general schedule metadata.

Stage-specific match scheduling remains inside the Stage domain.

## 3.3 Entries

- adding participants;
- renaming participants;
- removing participants before protected use;
- importing participants;
- duplicate detection;
- participant identity and contact references when present.

The Competition is the canonical owner of entries.

## 3.4 Stage collection

- creating a Stage;
- ordering Stages;
- listing Stage summaries;
- defining high-level Stage relationships;
- navigating to the Stage Manager.

## 3.5 Competition workflow

The Competition status summarizes the overall administrative workflow, for example:

```text
draft
configure
ready
generated
running
completed
archived
```

It does not replace individual Stage statuses.

## 3.6 Aggregate reporting

- Competition summary;
- list of Stage winners and placements;
- aggregate statistics;
- consolidated exports;
- audit history.

---

# 4. Stage responsibilities

The Stage owns:

## 4.1 Engine selection

- Engine identifier;
- Engine version;
- settings schema version.

Engine selection becomes protected after generated data exists.

## 4.2 Sporting configuration

Examples:

- number of groups;
- match format;
- target score;
- timed match duration;
- seeding mode;
- number of rounds;
- qualification rules;
- fairness profile.

## 4.3 Entry usage

A Stage defines which Competition Entries participate and in what role.

It may use:

- all active Competition Entries;
- a manual subset;
- qualified entries from an upstream Stage;
- seeded assignments;
- generated teams or pairings where the Engine permits it.

The Stage does not duplicate the canonical participant identity.

## 4.4 Generated structure

Examples:

- groups;
- rounds;
- brackets;
- pairings;
- byes;
- sit-outs;
- qualification slots.

## 4.5 Live play

- match status;
- court assignment;
- timers;
- scores;
- retirement;
- draw handling;
- result undo;
- winner propagation;
- incremental round generation.

## 4.6 Ranking

- standings;
- tie-break application;
- individual or team ranking;
- manual override when supported;
- final Stage placements.

## 4.7 Stage reports

- printable structure;
- match list;
- ranking;
- player report;
- fairness report;
- Engine-specific statistics.

---

# 5. Responsibility matrix

| Concern | Competition | Stage | Engine | Shared service |
|---|---:|---:|---:|---:|
| Organization ownership | owner | reference | no | no |
| Members and permissions | owner/orchestrator | scoped use | no | no |
| Participant identity | owner | reference/use | validates compatibility | no |
| Stage ordering | owner | item | no | no |
| Engine selection | orchestrates | owner | identifies implementation | Registry |
| Match generation | no | owns output | algorithm | scheduling/seeding optional |
| Match results | no | owns | rules | no |
| Court assignment | aggregate resources optional | owns assignment | constraints | court service |
| Ranking | aggregate only | owns | rules | ranking utilities |
| Fairness | aggregate summary optional | owns report | format rules | fairness service |
| Printing | aggregate report | Stage report | report model | printing service |
| Database access | through repositories | through repositories | never direct | never direct unless adapter |

---

# 6. Entries and Stage assignments

Competition Entries are stable participant records.

A Stage should not copy names into its settings as the primary reference. Generated data references Entry IDs or Stage-assignment IDs.

Recommended conceptual model:

```text
Competition Entry
      ↓
Stage Entry Assignment
      ↓
Generated Match Slot
```

A Stage Entry Assignment can store Stage-specific information such as:

- seed;
- group assignment;
- qualification source;
- active/withdrawn state;
- display order;
- Engine-specific assignment metadata.

This prevents Stage data from modifying canonical Competition Entry identity.

---

# 7. Multi-stage examples

## 7.1 Groups followed by main bracket

```text
Competition
├── Entries
├── Stage 1: Round Robin Groups
└── Stage 2: Elimination Main Bracket
```

Stage 2 receives qualified Entry IDs from Stage 1.

The Competition does not become a special `groups_plus_bracket` tournament type.

## 7.2 Main bracket and consolation

```text
Competition
├── Stage 1: Elimination Main Bracket
└── Stage 2: Elimination Consolation
```

The consolation Stage can receive losing entries according to an explicit dependency rule.

## 7.3 Individual rotation only

```text
Competition
└── Stage 1: Individual Rotation
```

A single-Stage Competition is fully valid.

## 7.4 Swiss followed by top-four playoff

```text
Competition
├── Stage 1: Swiss
└── Stage 2: Elimination
```

No change to the Competition Core is required.

---

# 8. Competition status derivation

Competition status is explicit, but it may be assisted by Stage state.

Suggested rules:

- Competition cannot become `generated` unless at least one Stage is generated.
- Competition becomes `running` when any Stage is running.
- Competition can become `completed` only when all required Stages are completed.
- Archived Competition makes all included Stages read-only for normal operations.

These are orchestration rules, not Engine rules.

A future specification should define exact Competition transition semantics.

---

# 9. Deletion rules

## 9.1 Competition Entry deletion

Removing a Competition Entry is allowed only when it is not protected by generated or historical Stage data.

When protected, supported alternatives may include:

- withdrawal;
- replacement workflow;
- display-name correction;
- Stage-specific deactivation.

## 9.2 Stage deletion

A Draft or Configured Stage can normally be deleted.

A Generated or later Stage requires explicit reset/delete policy and dependency checks.

## 9.3 Competition deletion

Competition deletion is allowed only under strict policy. Archiving is preferred after meaningful sporting data exists.

---

# 10. Navigation boundary

## 10.1 Competition navigation

Recommended sections:

```text
Overview
Configuration
Entries
Stages
Reports
```

The Competition page should not become the live match manager.

## 10.2 Stage navigation

Permanent Stage Manager sections:

```text
Overview
Configuration
Structure
Generate
Play
Ranking
Reports
```

Visible sections and actions are resolved from Engine capabilities and Stage lifecycle.

Entries are not edited as canonical participant records inside the Stage Manager. The Stage can manage assignments from existing Competition Entries.

---

# 11. Anti-patterns

Avoid storing these directly on Competition as primary sporting configuration:

```text
number_of_groups
bracket_size
match_duration
seed_count
round_count
```

They belong to Stage settings.

Avoid creating Competition types such as:

```text
round_robin_plus_bracket_plus_consolation
```

Use multiple Stages instead.

Avoid duplicating Competition Entry names inside every Stage as independent participant records.

Avoid allowing a Stage Engine to update Organization membership or Competition ownership.

---

# 12. Acceptance criteria

1. A Competition can exist before any Stage is created.
2. A Competition can contain multiple ordered Stages using different Engines.
3. Entries are owned by the Competition and referenced by Stages.
4. Match generation and ranking occur only within a Stage.
5. The Competition detail page remains an administrative container.
6. The Stage Manager owns sporting operations.
7. Groups plus bracket is represented as two linked Stages, not one special Competition type.
