import { registerStageEngine } from "../../core/EngineRegistry"

import type {
  StageEngine,
  StageGenerationContext,
  StageGenerationResult,
} from "../../core/types"

import {
  RandomDrawStrategy,
  SeededDrawStrategy,
  type DrawStrategy,
} from "./draw"

import type { BracketEntry } from "./domain"
import { BracketBuilder } from "./generator"
import { eliminationEngineManifest } from "./manifest"
import { renderEliminationEngineSection } from "./renderSection"

let registered = false

type EliminationDrawMode =
  | "random"
  | "seeded"

function resolveDrawMode(
  context: StageGenerationContext,
): EliminationDrawMode {
  const requestedMode =
    context.options?.drawMode

  if (
    requestedMode === "random" ||
    requestedMode === "seeded"
  ) {
    return requestedMode
  }

  const hasSeeds = context.entries.some(
    (entry) =>
      entry.seed !== null &&
      entry.seed !== undefined,
  )

  return hasSeeds ? "seeded" : "random"
}

function createDrawStrategy(
  mode: EliminationDrawMode,
): DrawStrategy {
  switch (mode) {
    case "seeded":
      return new SeededDrawStrategy()

    case "random":
      return new RandomDrawStrategy()
  }
}

function mapEntries(
  context: StageGenerationContext,
): BracketEntry[] {
  return context.entries.map((entry) => ({
    id: entry.id,
    name: entry.displayName,
    type: entry.entryType,
    seed: entry.seed ?? undefined,
    metadata: entry.metadata ?? {},
  }))
}

function generateEliminationStage(
  context: StageGenerationContext,
): StageGenerationResult {
  if (context.stage.stageType !== "elimination") {
    return {
      success: false,
      message:
        "The Elimination Engine cannot generate this stage type.",
    }
  }

  if (context.entries.length < 2) {
    return {
      success: false,
      message:
        "At least two active entries are required.",
    }
  }

  try {
    const entries = mapEntries(context)
    const drawMode = resolveDrawMode(context)
    const drawStrategy =
      createDrawStrategy(drawMode)

    const tree = new BracketBuilder().build(
      entries,
      drawStrategy,
    )

    return {
      success: true,
      message:
        `Bracket generated in memory with ` +
        `${tree.rounds.length} rounds and ` +
        `${tree.matches.length} matches.`,
      output: tree,
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to generate the bracket.",
    }
  }
}

export function ensureEliminationEngineRegistered() {
  if (registered) {
    return
  }

  const engine: StageEngine = {
    manifest: eliminationEngineManifest,
    renderSection:
      renderEliminationEngineSection,
    generate: generateEliminationStage,
  }

  registerStageEngine(engine)

  registered = true
}