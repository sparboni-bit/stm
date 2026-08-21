import {
  getRegisteredStageEngine,
  registerStageEngine,
} from "../../core/EngineRegistry"
import type { StageEngine } from "../../core/types"

import { generateIndividualRotationSchedule } from "./generator/IndividualRotationGenerator"
import { individualRotationEngineManifest } from "./manifest"
import { renderIndividualRotationEngineSection } from "./renderSection"

export function ensureIndividualRotationEngineRegistered() {
  const engineId = individualRotationEngineManifest.id

  /*
   * The registry is the source of truth.
   *
   * Do not use a module-local `registered` flag here:
   * during development Turbopack/HMR can re-evaluate this
   * module while the Engine Registry still contains the
   * previously registered engine.
   */
  if (getRegisteredStageEngine(engineId)) {
    return
  }

  const engine: StageEngine = {
    manifest: individualRotationEngineManifest,
    renderSection: renderIndividualRotationEngineSection,
    generate: generateIndividualRotationSchedule,
  }

  registerStageEngine(engine)
}