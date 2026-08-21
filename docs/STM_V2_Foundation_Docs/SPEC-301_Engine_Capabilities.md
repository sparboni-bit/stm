# SPEC-301 — Engine Capabilities

Version: 1.0  
Status: Draft for implementation  
Date: 2026-07-18

---

# 1. Purpose

This specification defines how a Stage Engine declares the features it supports and how STM uses those declarations to build navigation and available actions.

Capabilities are stable machine-readable facts about an Engine. They are not translated labels and they are not a replacement for lifecycle or authorization checks.

---

# 2. Principles

1. A capability describes supported behavior, not current availability.
2. Current availability depends on capability, Stage status, data state and user permission.
3. Capability keys are centralized and typed.
4. The Manifest is the single source of truth for Engine capabilities.
5. A declared capability must correspond to a real implementation.
6. The UI must not infer capabilities from the Engine identifier.

Example:

```text
supports live scoring = true
```

means that the Engine can perform live scoring.

It does not mean that score entry is currently allowed. A completed or archived Stage may still hide or disable the action.

---

# 3. Capability model

```ts
export interface StageEngineCapabilities {
  configuration: boolean;
  generation: GenerationCapabilities;
  structure: StructureCapabilities;
  play: PlayCapabilities;
  ranking: RankingCapabilities;
  reports: ReportCapabilities;
  fairness: FairnessCapabilities;
}
```

Nested groups avoid an unstructured collection of unrelated booleans.

---

# 4. Capability definitions

## 4.1 Generation

```ts
export interface GenerationCapabilities {
  supported: boolean;
  deterministic: boolean;
  regeneration: "none" | "before_play" | "controlled";
  incrementalRounds: boolean;
  randomSeed: boolean;
}
```

- `supported`: Engine generates a sporting structure.
- `deterministic`: equal validated input and seed produce equal output.
- `regeneration`: permitted regeneration model.
- `incrementalRounds`: additional rounds can be generated after initial generation.
- `randomSeed`: Engine supports explicit generation seed storage.

## 4.2 Structure

```ts
export interface StructureCapabilities {
  groups: boolean;
  bracket: boolean;
  byes: boolean;
  seeding: boolean;
  qualificationLinks: boolean;
  consolation: boolean;
  manualEntrySwap: boolean;
}
```

## 4.3 Play

```ts
export interface PlayCapabilities {
  liveScoring: boolean;
  resultUndo: boolean;
  retirement: boolean;
  draws: boolean;
  timer: boolean;
  courtAssignment: boolean;
  courtChangeWithoutScore: boolean;
  saveAll: boolean;
}
```

`draws` means the Engine supports a drawn match result when enabled by settings. The settings schema may still disable draws for a specific Stage.

## 4.4 Ranking

```ts
export interface RankingCapabilities {
  supported: boolean;
  liveRecalculation: boolean;
  manualOverride: boolean;
  tieBreakRules: boolean;
  finalPlacements: boolean;
}
```

## 4.5 Reports

```ts
export interface ReportCapabilities {
  printableStructure: boolean;
  printableMatches: boolean;
  printableRanking: boolean;
  playerReport: boolean;
  csvExport: boolean;
  pdfExport: boolean;
}
```

Export implementation can be delegated to a shared service.

## 4.6 Fairness

```ts
export interface FairnessCapabilities {
  analysis: boolean;
  optimization: boolean;
  partnerDistribution: boolean;
  opponentDistribution: boolean;
  sitOutBalance: boolean;
  courtBalance: boolean;
  seedBalance: boolean;
}
```

---

# 5. Navigation declaration

Capabilities are accompanied by an explicit navigation declaration.

```ts
export type StageSectionId =
  | "overview"
  | "configuration"
  | "structure"
  | "generate"
  | "play"
  | "ranking"
  | "reports";

export interface StageNavigationItem {
  id: StageSectionId;
  labelKey: string;
  capabilityPath?: string;
  visibleWhen?: StageStatus[];
}

export interface StageNavigationDefinition {
  items: StageNavigationItem[];
}
```

The initial permanent Stage Manager sections are:

```text
Overview
Configuration
Structure
Generate
Play
Ranking
Reports
```

An Engine can hide a section that has no meaning, but should preserve consistent order for visible sections.

`Overview` is always visible.

---

# 6. Availability resolution

The Stage Manager resolves visibility and action state through four filters:

```text
Engine capability
AND Stage lifecycle
AND current data state
AND user permission
```

Example:

```text
Capability: regeneration = before_play
Stage status: generated
Completed matches: 0
Permission: stage.manage

Result: Regenerate action enabled
```

Another example:

```text
Capability: resultUndo = true
Stage status: running
Downstream match already completed: true
Permission: stage.score

Result: Undo action disabled with domain reason
```

The UI should receive a resolved action model rather than reimplementing these rules independently.

```ts
export interface ResolvedStageAction {
  id: StageActionId;
  state: "enabled" | "disabled" | "hidden";
  reasonCode?: string;
}
```

---

# 7. Initial Engine profiles

The following matrices are initial design targets, not final implementation guarantees.

## 7.1 Round Robin

```text
Groups                  yes
Bracket                 no
Seeding                 optional
Incremental rounds      no, unless explicitly designed
Live scoring            yes
Draws                   configurable
Court assignment        yes
Ranking                 yes
Fairness analysis       optional scheduler analysis
```

## 7.2 Elimination

```text
Groups                  no
Bracket                 yes
Byes                    yes
Seeding                 yes
Qualification links     yes
Consolation             separate linked Stage or engine feature by design
Live scoring            yes
Draws                   no for advancement matches
Court assignment        yes
Ranking                 placements/results
```

## 7.3 Individual Rotation

```text
Groups                  optional single group
Bracket                 no
Seeding                 optional
Incremental rounds      yes
Live scoring            yes
Draws                   configurable
Timer                   yes
Court assignment        yes
Ranking                 individual
Fairness analysis       yes
Fairness optimization   yes
```

## 7.4 Swiss

```text
Groups                  no
Bracket                 no
Seeding                 optional
Incremental rounds      yes
Live scoring            yes
Draws                   configurable
Court assignment        yes
Ranking                 yes
Fairness analysis       pairing constraints
```

---

# 8. Capability validation

At Registry initialization, the application must validate:

- unique Engine identifier;
- valid semantic version string;
- supported settings version;
- capability object completeness;
- navigation references valid capability paths;
- optional implementation contract exists for each enabled operational capability;
- no duplicate navigation section identifiers.

In development, invalid registration should fail fast.

---

# 9. Versioning

Capability keys are part of the Core contract.

Changes follow these rules:

- adding an optional capability is backward compatible;
- changing the meaning of a capability requires a specification version change;
- deleting or renaming a capability requires migration of all Manifests and consumers;
- Engine version and capability schema version are separate concerns.

Recommended root type:

```ts
export interface VersionedStageEngineCapabilities {
  schemaVersion: 1;
  values: StageEngineCapabilities;
}
```

---

# 10. UI rules

1. Do not check `engineId` to show generic Stage sections.
2. Do not use capability declarations as authorization.
3. Do not show unsupported controls in a disabled state unless the absence requires explanation.
4. Show disabled supported actions when the user needs to understand why they are temporarily unavailable.
5. Resolve all labels through i18n keys.
6. Mobile navigation must remain usable when only a subset of sections is visible.

---

# 11. Anti-patterns

Avoid:

```ts
if (stage.engineId === "round_robin") {
  showRanking();
}
```

Prefer:

```ts
if (manifest.capabilities.ranking.supported) {
  showRanking();
}
```

Avoid declaring generic capabilities that merely mirror an Engine name.

Bad:

```text
isRoundRobin
isSwiss
```

Good:

```text
incrementalRounds
bracket
partnerDistribution
```

Avoid treating capability values as mutable Stage settings. Capabilities describe the Engine implementation; settings configure one Stage.

---

# 12. Acceptance criteria

1. The Registry can expose a complete Manifest for every registered Engine.
2. Stage navigation is generated without checking concrete Engine identifiers.
3. Available actions combine capability, lifecycle, data state and permission.
4. Invalid capability declarations fail during development.
5. Round Robin and Elimination can expose different navigation using the same Stage Manager shell.
