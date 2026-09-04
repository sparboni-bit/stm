"use server"

import { revalidatePath } from "next/cache"

import {
  listCompetitionEntries,
} from "../../../competition-entries/repositories/competition-entry.repository"

import {
  listCompetitionStageEntries,
} from "../../../competition-stage-entries/repositories/competition-stage-entry.repository"

import {
  getCompetitionStage,
} from "../../../competition-stages/repositories/competition-stage.repository"

import {
  loadStageEngine,
  type StageGenerationEntry,
} from ".."

import type {
  BracketTree,
} from "../../engines/elimination/domain"

import {
  BracketMapper,
} from "../../engines/elimination/mappers"

import {
  persistEliminationBracket,
} from "../../engines/elimination/repositories"

import {
  IndividualRotationMapper,
  persistIndividualRotationSchedule,
  type IndividualRotationSchedule,
} from "../../engines/individual-rotation"

import {
  getIndividualRotationTemplate,
} from "../../engines/individual-rotation/templates/TemplateRepository"

import {
  INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION,
} from "../../engines/individual-rotation/templates/types"

import {
  RoundRobinMapper,
  persistRoundRobinSchedule,
  type RoundRobinSchedule,
} from "../../engines/round-robin"

export type GenerateCompetitionStageActionResult =
  | {
      success: true
      message: string
      generation: {
        engineId: string
        entryCount: number
        roundCount: number
        matchCount: number
        artifactId: string
      }
    }
  | {
      success: false
      message: string
    }

/**
 * Generates and persists a Competition Stage.
 *
 * Flow:
 *
 * stage
 *   -> active Stage Entries
 *   -> Competition Entries
 *   -> StageGenerationEntry[]
 *   -> Stage Engine
 *   -> BracketTree
 *   -> BracketMapper
 *   -> PostgreSQL RPC
 *   -> persisted matches
 *
 * Participation and seed are Stage-specific.
 * Identity/display data remains Competition-level.
 */
export async function generateCompetitionStage(
  stageId: string,
): Promise<GenerateCompetitionStageActionResult> {
  const normalizedStageId = stageId.trim()

  if (!normalizedStageId) {
    return {
      success: false,
      message: "Stage id is required.",
    }
  }

  try {
    const stage =
      await getCompetitionStage(
        normalizedStageId,
      )

    if (!stage) {
      return {
        success: false,
        message:
          "Competition Stage not found.",
      }
    }

    if (
      stage.status === "generated" ||
      stage.status === "running" ||
      stage.status === "completed"
    ) {
      return {
        success: false,
        message:
          "This Stage has already been generated.",
      }
    }

    /*
     * Load:
     *
     * - Competition roster:
     *   identity, display name, entry type, metadata
     *
     * - Stage roster:
     *   participation, seed, status, sort order
     */
    const [
      competitionEntries,
      stageEntries,
    ] = await Promise.all([
      listCompetitionEntries(
        stage.competitionId,
      ),
      listCompetitionStageEntries(
        stage.id,
      ),
    ])

    const competitionEntriesById =
      new Map(
        competitionEntries.map(
          (entry) => [
            entry.id,
            entry,
          ],
        ),
      )

    const activeStageEntries =
      stageEntries.filter(
        (stageEntry) =>
          stageEntry.status ===
          "active",
      )

    if (activeStageEntries.length < 2) {
      return {
        success: false,
        message:
          "At least two active Stage Entries are required.",
      }
    }

    /*
     * StageGenerationEntry.id intentionally remains
     * the Competition Entry id.
     *
     * Match slots therefore continue to reference
     * competition_entry_id and the existing match,
     * propagation and undo logic remains compatible.
     */
    const generationEntries: StageGenerationEntry[] =
      activeStageEntries.map(
        (stageEntry) => {
          const entry =
            competitionEntriesById.get(
              stageEntry.competition_entry_id,
            )

          if (!entry) {
            throw new Error(
              `Stage Entry ${stageEntry.id} references ` +
                "a Competition Entry that does not exist.",
            )
          }

          if (
            entry.status !== "active"
          ) {
            throw new Error(
              `Competition Entry "${entry.display_name}" ` +
                "is not active.",
            )
          }

          return {
            id: entry.id,
            displayName:
              entry.display_name,
            entryType:
              entry.entry_type,
            seed:
              stageEntry.seed,
            metadata: {
              ...(entry.metadata ?? {}),
              ...(stageEntry.metadata ?? {}),
            },
          }
        },
      )

    const engine =
      loadStageEngine(stage)

    if (!engine.generate) {
      return {
        success: false,
        message:
          `Stage Engine "${engine.manifest.name}" ` +
          "does not support generation.",
      }
    }

    let individualRotationTemplate = undefined

    if (
      engine.manifest.id ===
      "individual_rotation"
    ) {
      const courtCount =
        readIntegerSetting(
          stage.settings,
          "courtCount",
        )

      const requestedRounds =
        readIntegerSetting(
          stage.settings,
          "requestedRounds",
        )

      if (!courtCount || courtCount < 1) {
        return {
          success: false,
          message:
            "Configure at least one court in the Planner before generation.",
        }
      }

      if (
        !requestedRounds ||
        requestedRounds < 1
      ) {
        return {
          success: false,
          message:
            "Choose and save the requested number of rounds in the Planner before generation.",
        }
      }

      const usableCourtCount = Math.min(
        courtCount,
        Math.floor(
          generationEntries.length / 4,
        ),
      )

      const seedCount =
        generationEntries.filter(
          (entry) =>
            typeof entry.seed === "number" &&
            entry.seed > 0,
        ).length

      if (
        seedCount !== 0 &&
        seedCount !== 2 &&
        seedCount !== 3 &&
        seedCount !== 4
      ) {
        return {
          success: false,
          message:
            "Individual Rotation templates support 0, 2, 3 or 4 Keep Apart players. Update the Stage Keep Apart selection before generation.",
        }
      }

      individualRotationTemplate =
        await getIndividualRotationTemplate({
          playerCount:
            generationEntries.length,
          usableCourtCount,
          seedCount,
          roundCount:
            requestedRounds,
          engineVersion:
            INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION,
        })

      if (!individualRotationTemplate) {
        return {
          success: false,
          message:
            `No precomputed Individual Rotation template is available for ${generationEntries.length} players, ${usableCourtCount} usable court(s), ${seedCount} Keep Apart player(s), and ${requestedRounds} round(s). Generate the missing template before generating this Stage.`,
        }
      }
    }

    const generationResult =
      await engine.generate({
        stage,
        entries:
          generationEntries,
        options: {
          drawMode:
            hasSeededEntries(
              generationEntries,
            )
              ? "seeded"
              : "random",
          individualRotationTemplate,
        },
      })

    if (!generationResult.success) {
      return {
        success: false,
        message:
          generationResult.message ??
          "Stage generation failed.",
      }
    }

    if (
      engine.manifest.id === "elimination"
    ) {
      if (
        !isBracketTree(
          generationResult.output,
        )
      ) {
        return {
          success: false,
          message:
            "The Elimination Engine returned an invalid BracketTree.",
        }
      }

      const tree =
        generationResult.output

      const mapped =
        new BracketMapper().map({
          competitionId:
            stage.competitionId,
          stageId:
            stage.id,
          tree,
        })

      await persistEliminationBracket({
        stageId: stage.id,
        mapped,
      })

      revalidatePath(
        `/competitions/${stage.competitionId}`,
      )

      revalidatePath(
        `/competitions/${stage.competitionId}/stages/${stage.id}`,
      )

      return {
        success: true,
        message:
          "Stage generated successfully.",
        generation: {
          engineId:
            engine.manifest.id,
          entryCount:
            generationEntries.length,
          roundCount:
            tree.rounds.length,
          matchCount:
            mapped.matches.length,
          artifactId:
            tree.id,
        },
      }
    }

    if (
      engine.manifest.id ===
      "individual_rotation"
    ) {
      if (
        !isIndividualRotationSchedule(
          generationResult.output,
        )
      ) {
        return {
          success: false,
          message:
            "The Individual Rotation Engine returned an invalid schedule.",
        }
      }

      const schedule =
        generationResult.output

      const mapped =
        new IndividualRotationMapper().map(
          schedule,
        )

      await persistIndividualRotationSchedule({
        stageId: stage.id,
        mapped,
      })

      revalidatePath(
        `/competitions/${stage.competitionId}`,
      )

      revalidatePath(
        `/competitions/${stage.competitionId}/stages/${stage.id}`,
      )

      return {
        success: true,
        message:
          "Individual Rotation schedule generated successfully.",
        generation: {
          engineId:
            engine.manifest.id,
          entryCount:
            generationEntries.length,
          roundCount:
            schedule.roundCount,
          matchCount:
            schedule.matchCount,
          artifactId:
            schedule.id,
        },
      }
    }

    if (
      engine.manifest.id === "round_robin"
    ) {
      if (
        !isRoundRobinSchedule(
          generationResult.output,
        )
      ) {
        return {
          success: false,
          message:
            "The Round Robin Engine returned an invalid schedule.",
        }
      }

      const schedule =
        generationResult.output

      const mapped =
        new RoundRobinMapper().map({
          competitionId:
            stage.competitionId,
          stageId:
            stage.id,
          schedule,
        })

      await persistRoundRobinSchedule({
        stageId: stage.id,
        mapped,
      })

      revalidatePath(
        `/competitions/${stage.competitionId}`,
      )

      revalidatePath(
        `/competitions/${stage.competitionId}/stages/${stage.id}`,
      )

      return {
        success: true,
        message:
          "Round Robin schedule generated successfully.",
        generation: {
          engineId:
            engine.manifest.id,
          entryCount:
            generationEntries.length,
          roundCount:
            schedule.roundCount,
          matchCount:
            schedule.matchCount,
          artifactId:
            schedule.id,
        },
      }
    }

    return {
      success: false,
      message:
        `Generation persistence is not implemented for Stage Engine "${engine.manifest.name}".`,
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to generate the Stage.",
    }
  }
}

function readIntegerSetting(
  settings: Record<string, unknown>,
  key: string,
): number | null {
  const value = settings[key]

  return typeof value === "number" &&
    Number.isInteger(value)
    ? value
    : null
}

function hasSeededEntries(
  entries: StageGenerationEntry[],
): boolean {
  return entries.some(
    (entry) =>
      typeof entry.seed === "number",
  )
}

function isIndividualRotationSchedule(
  value: unknown,
): value is IndividualRotationSchedule {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false
  }

  const candidate =
    value as Partial<IndividualRotationSchedule>

  return (
    typeof candidate.id === "string" &&
    typeof candidate.roundCount ===
      "number" &&
    typeof candidate.matchCount ===
      "number" &&
    typeof candidate.fairnessRawPenalty ===
      "number" &&
    typeof candidate.schedule ===
      "object" &&
    candidate.schedule !== null &&
    Array.isArray(
      (
        candidate.schedule as {
          rounds?: unknown
        }
      ).rounds,
    )
  )
}

function isRoundRobinSchedule(
  value: unknown,
): value is RoundRobinSchedule {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false
  }

  const candidate =
    value as Partial<RoundRobinSchedule>

  return (
    typeof candidate.id === "string" &&
    typeof candidate.groupCount ===
      "number" &&
    typeof candidate.roundCount ===
      "number" &&
    typeof candidate.matchCount ===
      "number" &&
    Array.isArray(candidate.groups)
  )
}

function isBracketTree(
  value: unknown,
): value is BracketTree {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false
  }

  const candidate =
    value as Partial<BracketTree>

  return (
    typeof candidate.id ===
      "string" &&
    typeof candidate.size ===
      "number" &&
    Array.isArray(
      candidate.rounds,
    )
  )
}