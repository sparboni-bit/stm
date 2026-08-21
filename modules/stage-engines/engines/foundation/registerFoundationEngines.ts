import { registerStageEngine } from "../../core/EngineRegistry"
import type { StageEngine } from "../../core/types"
import { renderFoundationEngineSection } from "./FoundationEngineSection"
import { foundationEngineManifests } from "./manifests"

let registered = false

export function ensureFoundationEnginesRegistered() {
  if (registered) {
    return
  }

  foundationEngineManifests
    .filter(
      (manifest) =>
        manifest.id !== "elimination" &&
        manifest.id !== "individual_rotation" &&
        manifest.id !== "round_robin",
    )
    .forEach((manifest) => {
      const engine: StageEngine = {
        manifest,
        renderSection: renderFoundationEngineSection,
      }

      registerStageEngine(engine)
    })

  registered = true
}