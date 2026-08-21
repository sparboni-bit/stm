# SPEC-300 — Stage Engine Interface

Version: 1.0  
Status: Draft for implementation  
Date: 2026-07-18

---

# 1. Purpose

This specification defines the common contract between the STM Core and every Stage Engine.

The contract must allow the Stage Manager to load, validate, configure, generate and operate a Stage without embedding rules for a specific competition format.

The interface is an application-domain contract. It is not a React component contract and it does not expose Supabase primitives.

---

# 2. Design goals

The Stage Engine contract must:

- isolate format-specific algorithms;
- be independent from persistence technology;
- support deterministic validation and generation;
- provide typed settings and outputs;
- expose capabilities and available actions;
- support unit testing with in-memory dependencies;
- return structured errors rather than UI strings;
- permit engine versioning and settings migration.

---

# 3. Core types

```ts
export type StageEngineId =
  | "round_robin"
  | "elimination"
  | "individual_rotation"
  | "swiss"
  | (string & {});

export type StageStatus =
  | "draft"
  | "configured"
  | "generated"
  | "running"
  | "completed"
  | "archived";

export interface StageRecord<TSettings = unknown, TStructure = unknown> {
  id: string;
  competitionId: string;
  engineId: StageEngineId;
  engineVersion: string;
  name: string;
  sortOrder: number;
  status: StageStatus;
  settings: TSettings;
  settingsVersion: number;
  structure: TStructure | null;
  metadata: Record<string, unknown>;
}
```

The final status values must match the database enum or validated database constraint.

---

# 4. Engine context

An Engine receives all external dependencies through an explicit context.

```ts
export interface StageEngineContext {
  stageRepository: StageRepository;
  entryRepository: CompetitionEntryRepository;
  matchRepository: StageMatchRepository;
  resultRepository: StageResultRepository;
  services: StageEngineServices;
  clock: Clock;
  idGenerator: IdGenerator;
}
```

The context must not expose a Supabase client.

Repository and service interfaces can be narrowed for each use case. A concrete Engine should depend only on the contracts it actually uses.

---

# 5. Engine Manifest

Every Engine exports one immutable Manifest.

```ts
export interface StageEngineManifest<TSettings = unknown> {
  id: StageEngineId;
  version: string;
  displayNameKey: string;
  descriptionKey: string;
  settingsVersion: number;
  capabilities: StageEngineCapabilities;
  navigation: StageNavigationDefinition;
  workflow: StageWorkflowDefinition;
  createDefaultSettings(): TSettings;
}
```

The Manifest contains metadata and declarations. It must not query the database.

---

# 6. Required Engine contract

```ts
export interface StageEngine<
  TSettings,
  TStructure,
  TRanking,
  TReport
> {
  readonly manifest: StageEngineManifest<TSettings>;

  parseSettings(input: unknown): EngineResult<TSettings>;

  migrateSettings(
    input: unknown,
    fromVersion: number
  ): EngineResult<TSettings>;

  validateConfiguration(
    command: ValidateStageConfigurationCommand<TSettings>,
    context: StageEngineContext
  ): Promise<EngineResult<StageValidationReport>>;

  generate(
    command: GenerateStageCommand<TSettings>,
    context: StageEngineContext
  ): Promise<EngineResult<GeneratedStage<TStructure>>>;

  getAvailableActions(
    query: AvailableStageActionsQuery,
    context: StageEngineContext
  ): Promise<EngineResult<StageAction[]>>;

  calculateRanking(
    query: CalculateStageRankingQuery,
    context: StageEngineContext
  ): Promise<EngineResult<TRanking>>;

  buildReport(
    query: BuildStageReportQuery,
    context: StageEngineContext
  ): Promise<EngineResult<TReport>>;
}
```

Only methods required by all Engines belong to the base interface.

Optional behavior is exposed through capabilities and dedicated optional contracts, not empty methods.

---

# 7. Optional contracts

An Engine can implement additional contracts when the matching capability is enabled.

```ts
export interface LiveScoringEngine {
  submitResult(
    command: SubmitStageResultCommand,
    context: StageEngineContext
  ): Promise<EngineResult<SubmitResultOutcome>>;

  undoResult(
    command: UndoStageResultCommand,
    context: StageEngineContext
  ): Promise<EngineResult<UndoResultOutcome>>;
}

export interface CourtAssignmentEngine {
  assignCourt(
    command: AssignStageCourtCommand,
    context: StageEngineContext
  ): Promise<EngineResult<AssignCourtOutcome>>;
}

export interface IncrementalGenerationEngine {
  generateNextRound(
    command: GenerateNextRoundCommand,
    context: StageEngineContext
  ): Promise<EngineResult<GeneratedRound>>;
}

export interface FairnessAwareEngine {
  analyzeFairness(
    query: AnalyzeFairnessQuery,
    context: StageEngineContext
  ): Promise<EngineResult<FairnessReport>>;
}
```

The Registry must verify that declared capabilities and implemented optional contracts are consistent.

---

# 8. Commands and queries

Commands change state. Queries read or calculate without committing a mutation.

## 8.1 Validation command

```ts
export interface ValidateStageConfigurationCommand<TSettings> {
  stageId: string;
  competitionId: string;
  settings: TSettings;
  entryIds: string[];
}
```

Validation must cover:

- settings schema;
- number and type of entries;
- compatibility between entries and play mode;
- engine-specific constraints;
- lifecycle constraints relevant to generation.

## 8.2 Generation command

```ts
export interface GenerateStageCommand<TSettings> {
  stageId: string;
  competitionId: string;
  expectedStageVersion: number;
  settings: TSettings;
  entryIds: string[];
  generationSeed?: string;
}
```

`expectedStageVersion` supports optimistic concurrency.

`generationSeed` should be stored when randomization is used, allowing the generated output to be audited or reproduced.

## 8.3 Available actions query

```ts
export interface AvailableStageActionsQuery {
  stageId: string;
  stageStatus: StageStatus;
  userPermissions: StagePermission[];
}
```

Actions are stable machine-readable codes, for example:

```text
configure
validate
generate
regenerate
start
assign_court
submit_result
undo_result
generate_next_round
complete
print
export
archive
```

The UI translates action codes into labels and controls.

---

# 9. Result model

All Engine operations return a structured result.

```ts
export type EngineResult<T> =
  | {
      ok: true;
      value: T;
      warnings: EngineIssue[];
    }
  | {
      ok: false;
      errors: EngineIssue[];
    };

export interface EngineIssue {
  code: string;
  severity: "info" | "warning" | "error";
  path?: string;
  params?: Record<string, string | number | boolean>;
}
```

Error messages are not returned as final localized prose. The UI resolves `code` and `params` through i18n.

Examples:

```text
stage.entries.too_few
stage.settings.invalid_match_duration
stage.generation.already_started
stage.result.downstream_locked
```

---

# 10. Generation result

```ts
export interface GeneratedStage<TStructure> {
  stageId: string;
  engineId: StageEngineId;
  engineVersion: string;
  settingsVersion: number;
  generationSeed?: string;
  structure: TStructure;
  matchesCreated: number;
  roundsCreated: number;
  warnings: EngineIssue[];
}
```

Generation must either complete atomically or fail without leaving a partially generated Stage.

Atomicity can be implemented through a repository transaction boundary or a database RPC, while the Engine remains unaware of the database technology.

---

# 11. Mutation rules

Every mutation must follow this sequence:

```text
Authenticate
→ Authorize
→ Load current Stage
→ Validate lifecycle
→ Parse and validate settings/input
→ Execute Engine rule
→ Persist atomically
→ Return structured outcome
→ Refresh affected UI data
```

The Engine performs domain validation. The server action or application use case performs authentication and authorization.

Critical domain invariants should also be protected at database level where practical.

---

# 12. Idempotency and concurrency

Generation, score submission and round creation are sensitive to repeated requests.

The implementation must use one or more of:

- optimistic version checks;
- idempotency keys;
- unique database constraints;
- transactional RPC functions;
- row locking inside database functions.

A mobile retry or double tap must not create duplicate matches or apply a score twice.

---

# 13. Settings validation and migration

Each Engine must provide:

- compile-time TypeScript types;
- runtime parsing and validation;
- a current `settingsVersion`;
- migration from supported previous versions;
- a clear failure for unsupported versions.

Recommended pattern:

```ts
const parsed = engine.parseSettings(stage.settings);

if (!parsed.ok) {
  return parsed;
}
```

The first implementation may use Zod or an equivalent runtime schema library already accepted by the project.

---

# 14. Engine implementation example

```ts
export const roundRobinEngine: StageEngine<
  RoundRobinSettings,
  RoundRobinStructure,
  RoundRobinStandings,
  RoundRobinReport
> & LiveScoringEngine = {
  manifest: roundRobinManifest,

  parseSettings,
  migrateSettings,
  validateConfiguration,
  generate,
  getAvailableActions,
  calculateRanking,
  buildReport,
  submitResult,
  undoResult,
};
```

The example is illustrative. Final code can use a class or plain object, provided the contract remains explicit and testable.

---

# 15. Testing requirements

Every Engine must include tests for:

- settings parsing;
- default settings;
- configuration validation;
- deterministic generation;
- invalid entry counts;
- lifecycle restrictions;
- ranking calculation;
- capability-to-contract consistency;
- important regression cases inherited from V1.

Persistence integration tests must be separate from pure Engine unit tests.

---

# 16. Non-goals

This interface does not define:

- React components;
- page routing;
- Supabase schemas;
- visual design;
- external third-party plugin loading;
- one universal match table for every possible sport.

Those concerns are governed by separate specifications and implementation decisions.

---

# 17. Acceptance criteria

The contract is ready for implementation when:

1. The Stage Manager can resolve an Engine from a Stage record.
2. A test Engine can return defaults, validate and generate a placeholder structure.
3. No Engine imports Supabase or Next.js modules.
4. Errors are structured and localizable.
5. Capabilities correspond to optional contracts.
6. Round Robin can implement the contract without format-specific changes to the Core.
