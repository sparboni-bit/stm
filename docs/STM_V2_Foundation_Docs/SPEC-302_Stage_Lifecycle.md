# SPEC-302 — Stage Lifecycle

Version: 1.0  
Status: Draft for implementation  
Date: 2026-07-18

---

# 1. Purpose

This specification defines the lifecycle of a Stage, allowed transitions and the operational rules that protect generated structures and recorded results.

The lifecycle belongs to the STM Core. Engines can add validation requirements and available actions, but they cannot invent incompatible Stage statuses.

---

# 2. Status model

```text
Draft
  ↓
Configured
  ↓
Generated
  ↓
Running
  ↓
Completed
  ↓
Archived
```

Machine-readable values:

```text
draft
configured
generated
running
completed
archived
```

---

# 3. Status definitions

## 3.1 Draft

The Stage exists but its settings or entry selection may be incomplete.

Allowed operations normally include:

- edit name and order;
- select Engine only when no protected data exists;
- edit settings;
- choose Competition entries;
- delete the Stage;
- validate configuration.

No generated matches should exist.

## 3.2 Configured

Settings and entries have passed Engine validation and the Stage is ready to generate.

Allowed operations normally include:

- edit settings;
- revalidate;
- generate;
- return to Draft after an invalidating change;
- delete.

The Stage can automatically return to `draft` when a configuration-changing operation invalidates the previous validation.

## 3.3 Generated

The Engine has created the Stage structure and matches, but active play has not begun.

Allowed operations depend on capabilities and data state:

- inspect structure;
- print structure;
- assign courts;
- regenerate when permitted and no protected results exist;
- start the Stage;
- return to Configured only through a controlled reset.

## 3.4 Running

At least one match has started or a result has been recorded, or the Stage was explicitly started.

Allowed operations may include:

- assign or change courts;
- start matches;
- submit results;
- undo eligible results;
- generate an additional round for incremental Engines;
- recalculate ranking;
- complete the Stage.

Destructive regeneration is forbidden unless an explicit, audited reset workflow is introduced.

## 3.5 Completed

The sporting activity is finished and final Stage outputs are available.

Allowed operations normally include:

- view and print final structure;
- view final ranking;
- produce reports and exports;
- reopen through an explicit privileged action if supported by product policy;
- archive.

Normal score entry and generation are disabled.

## 3.6 Archived

The Stage is retained for historical access and is read-only for normal users.

Allowed operations:

- view;
- print or export, subject to permission;
- restore to Completed through an explicit privileged action if product policy allows it.

---

# 4. Transition matrix

| From | To | Standard | Conditions |
|---|---|---:|---|
| draft | configured | yes | configuration validates |
| configured | draft | yes | settings or entries become invalid/incomplete |
| configured | generated | yes | generation succeeds atomically |
| generated | configured | controlled | generated data reset; no protected play data |
| generated | running | yes | explicit start or first match activity |
| running | completed | yes | Engine completion rules pass |
| completed | running | privileged | explicit reopen and audit record |
| completed | archived | yes | archive permission |
| archived | completed | privileged | explicit restore policy |

Direct transitions not listed are forbidden.

---

# 5. Transition guards

## 5.1 Draft to Configured

Required:

- authenticated and authorized user;
- Engine exists in Registry;
- settings parse successfully;
- settings version supported;
- entry selection valid;
- Engine validation has no errors.

Warnings do not necessarily block transition.

## 5.2 Configured to Generated

Required:

- Stage version matches expected version;
- configuration remains valid;
- no generated structure already exists, unless controlled regeneration is requested;
- generation completes atomically;
- Engine and settings versions are recorded.

## 5.3 Generated to Running

Triggered by either:

- explicit `start_stage`; or
- first persisted match start/result, according to product policy.

The implementation should prefer an explicit start action if operational clarity benefits from it.

## 5.4 Running to Completed

Required:

- Engine completion validation succeeds;
- no unresolved required matches remain;
- rankings and final outputs are recalculated;
- completion timestamp is stored.

An Engine can define special completion conditions, such as a sufficient number of Swiss rounds.

## 5.5 Completed to Running

This is not a normal undo button.

It requires:

- elevated permission;
- explicit confirmation;
- reason or audit note;
- validation that reopening will not corrupt dependent Stages;
- invalidation or refresh of Competition-level reports.

---

# 6. Configuration invalidation

Changes to the following normally invalidate `configured` status:

- Engine identifier;
- entry selection;
- number of groups;
- match format;
- seeding rules;
- scoring rules;
- generation constraints;
- settings that affect generated structure.

The Engine settings schema should classify fields as:

```ts
export type SettingImpact =
  | "presentation_only"
  | "runtime_only"
  | "ranking"
  | "structure";
```

A `structure` change after generation requires controlled reset or is blocked.

---

# 7. Reset and regeneration

Reset is a destructive application use case, not a normal lifecycle transition.

Possible reset levels:

```text
Clear generated structure
Clear results but preserve structure
Clear complete Stage data and return to Draft
```

Each level must define:

- required permission;
- allowed current statuses;
- data deleted;
- downstream effects;
- audit information;
- confirmation text.

No reset should be implemented as a generic client-side delete sequence. It must run atomically through a repository transaction or database function.

---

# 8. Downstream Stage dependencies

A Stage may consume qualified entries or placements from another Stage.

When such links exist:

- upstream result changes can invalidate downstream assignments;
- completed downstream matches protect upstream results from ordinary undo;
- reopening or resetting an upstream Stage requires dependency validation;
- dependency state must be visible to the user.

Initial STM V2 can introduce Stage dependency support incrementally, but lifecycle APIs must leave room for it.

---

# 9. Match state and Stage state

Stage status and match status are related but distinct.

A Stage should not infer all lifecycle behavior by scanning matches on every request. The Stage stores its explicit status, while consistency checks validate match data when necessary.

Typical match statuses:

```text
scheduled
started
completed
cancelled
```

An Engine may require additional internal states, but shared UI should map them to a stable operational model.

---

# 10. Authorization

Suggested permission codes:

```text
stage.view
stage.configure
stage.generate
stage.start
stage.score
stage.manage_courts
stage.undo_result
stage.complete
stage.reopen
stage.archive
stage.reset
```

Roles map to permissions at the Organization/application layer.

The database must enforce scope and membership. Engine logic must never trust permission data supplied by the client.

---

# 11. Audit fields

Recommended Stage fields or audit records include:

- `configured_at`;
- `generated_at`;
- `started_at`;
- `completed_at`;
- `archived_at`;
- `updated_at`;
- `version`;
- `engine_version`;
- `settings_version`;
- generation seed and generation metadata;
- actor for privileged reset, reopen or archive operations.

Not every timestamp must be added immediately, but destructive and privileged operations must be traceable.

---

# 12. UI behavior

- Display the current Stage status prominently.
- Show only valid actions for current status and permission.
- When an action is supported but blocked, show a precise reason.
- Do not silently reset generated data after a settings change.
- Require explicit confirmation for reset, reopen and archive.
- Keep mobile action controls reachable without horizontal scrolling.

---

# 13. Acceptance criteria

1. Every Stage has one valid Core status.
2. All mutations pass through centralized transition validation.
3. Engines can add guards but cannot create arbitrary statuses.
4. Generation moves a Stage to `generated` only after atomic success.
5. First active play moves the Stage to `running` according to defined policy.
6. Completed and archived Stages reject normal scoring and generation.
7. Controlled resets and reopen operations are explicit, authorized and auditable.
