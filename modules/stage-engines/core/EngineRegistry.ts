import type { CompetitionStageType } from "../../competition-stages/types"
import type { StageEngine } from "./types"

const engineRegistry = new Map<CompetitionStageType, StageEngine>()

export function registerStageEngine(engine: StageEngine) {
  const engineId = engine.manifest.id

  if (engineRegistry.has(engineId)) {
    throw new Error(`Stage Engine already registered: ${engineId}`)
  }

  engineRegistry.set(engineId, engine)
}

export function getRegisteredStageEngine(
  engineId: CompetitionStageType,
) {
  return engineRegistry.get(engineId) ?? null
}

export function listRegisteredStageEngines() {
  return Array.from(engineRegistry.values())
}
