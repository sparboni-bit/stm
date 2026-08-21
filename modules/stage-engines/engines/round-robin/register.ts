import { registerStageEngine } from "../../core/EngineRegistry"
import type { StageEngine } from "../../core/types"

import { generateRoundRobinSchedule } from "./generator/RoundRobinGenerator"
import { roundRobinEngineManifest } from "./manifest"
import { renderRoundRobinEngineSection } from "./renderSection"

let registered = false

function readGroupCount(
  settings: Record<string, unknown>,
) {
  const value = settings.groupCount

  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 4
  ) {
    throw new Error(
      "Configure the Round Robin group count before generation.",
    )
  }

  return value
}

export function ensureRoundRobinEngineRegistered() {
  if (registered) {
    return
  }

  const engine: StageEngine = {
    manifest: roundRobinEngineManifest,
    generate: async ({ stage, entries }) => {
      try {
        const schedule =
          generateRoundRobinSchedule({
            entries,
            groupCount:
              readGroupCount(stage.settings),
          })

        return {
          success: true,
          output: schedule,
        }
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Unable to generate the Round Robin schedule.",
        }
      }
    },
    renderSection:
      renderRoundRobinEngineSection,
  }

  registerStageEngine(engine)
  registered = true
}
