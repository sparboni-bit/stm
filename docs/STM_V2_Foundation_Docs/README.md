# STM V2 — Foundation Documentation Pack

Version: 1.0  
Date: 2026-07-18

This package defines the architectural baseline required before implementing the STM V2 Stage Manager and the first competition Engine.

## Documents

1. `ADR-010_Core_Architecture.md`  
   Defines the Core, Stage, Engine, Repository and shared-service boundaries.

2. `SPEC-300_Stage_Engine_Interface.md`  
   Defines the common Engine contract, typed results, optional contracts and persistence-independent execution context.

3. `SPEC-301_Engine_Capabilities.md`  
   Defines capability declarations, dynamic navigation and action availability.

4. `SPEC-302_Stage_Lifecycle.md`  
   Defines Stage statuses, transition guards, reset rules and lifecycle protection.

5. `SPEC-303_Competition_vs_Stage_Responsibilities.md`  
   Defines which data and behavior belong to the Competition and which belong to a Stage.

## Implementation order

```text
1. Stage detail route and Stage Manager shell
2. Engine contracts
3. Engine Registry
4. Capability-based navigation
5. Lifecycle validator
6. Test Engine
7. Round Robin Engine V2
```

## Baseline rule

> An Engine must not know where data is stored. A Repository must not know how a competition format works.
