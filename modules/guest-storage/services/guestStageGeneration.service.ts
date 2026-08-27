import type { CompetitionStageEntry } from "@/modules/competition-stage-entries/types"
import type { MatchRow } from "@/modules/matches/types"
import type { StageGenerationEntry } from "@/modules/stage-engines/core/types"
import { getRegisteredStageEngine } from "@/modules/stage-engines/core/EngineRegistry"
import { ensureEliminationEngineRegistered } from "@/modules/stage-engines/engines/elimination/register"
import type { BracketTree } from "@/modules/stage-engines/engines/elimination/domain"
import { BracketMapper } from "@/modules/stage-engines/engines/elimination/mappers"
import { ensureRoundRobinEngineRegistered } from "@/modules/stage-engines/engines/round-robin/register"
import { ensureIndividualRotationEngineRegistered } from "@/modules/stage-engines/engines/individual-rotation/register"
import type { IndividualRotationSchedule } from "@/modules/stage-engines/engines/individual-rotation/domain/IndividualRotationSchedule"
import { IndividualRotationMapper } from "@/modules/stage-engines/engines/individual-rotation/mappers/IndividualRotationMapper"
import { getGuestIndividualRotationTemplateAction } from "@/modules/guest-storage/actions/getGuestIndividualRotationTemplate.action"
import { INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION } from "@/modules/stage-engines/engines/individual-rotation/templates/types"
import type { RoundRobinSchedule } from "@/modules/stage-engines/engines/round-robin/domain/RoundRobinSchedule"
import { RoundRobinMapper } from "@/modules/stage-engines/engines/round-robin/mappers/RoundRobinMapper"

import { localStorageGuestAdapter, touchGuestDocument } from "../index"
import type { GuestTournamentDocument } from "../types"

export type GuestStageGenerationSummary = {
  engineId: "elimination" | "round_robin" | "individual_rotation"
  entryCount: number
  roundCount: number
  matchCount: number
  artifactId: string
}

function requireDocument(document: GuestTournamentDocument | null) {
  if (!document) throw new Error("Guest competition not found.")
  return document
}

function readGroupKey(entry: CompetitionStageEntry): string | null {
  const value = entry.metadata?.groupKey
  return typeof value === "string" ? value : null
}

function groupKeys(groupCount: number) {
  return Array.from({ length: groupCount }, (_, index) =>
    String.fromCharCode(65 + index),
  )
}

function validateGroupCount(groupCount: number) {
  if (!Number.isInteger(groupCount) || groupCount < 1 || groupCount > 4) {
    throw new Error("Round Robin group count must be between 1 and 4.")
  }
}

export async function saveGuestRoundRobinGroups(input: {
  competitionId: string
  stageId: string
  groupCount: number
  assignments: Array<{ stageEntryId: string; groupKey: string }>
}): Promise<void> {
  validateGroupCount(input.groupCount)

  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )
  const stage = document.stages.find((item) => item.id === input.stageId)
  if (!stage) throw new Error("Guest stage not found.")
  if (stage.stageType !== "round_robin") {
    throw new Error("Group assignment is only available for Round Robin.")
  }
  if (stage.status !== "draft" && stage.status !== "configured") {
    throw new Error("Groups are locked after phase generation.")
  }

  const active = document.stageEntries.filter(
    (item) => item.stage_id === stage.id && item.status === "active",
  )
  if (active.length < 2) {
    throw new Error("Assign at least two active participants to this phase.")
  }

  const allowed = new Set(groupKeys(input.groupCount))
  const assignmentById = new Map(
    input.assignments.map((item) => [item.stageEntryId, item.groupKey]),
  )

  for (const entry of active) {
    const key = assignmentById.get(entry.id)
    if (!key || !allowed.has(key)) {
      throw new Error("Every active participant must be assigned to a valid group.")
    }
  }

  for (const key of allowed) {
    const count = active.filter(
      (entry) => assignmentById.get(entry.id) === key,
    ).length
    if (count < 2) {
      throw new Error(`Group ${key} must contain at least two participants.`)
    }
  }

  const now = new Date().toISOString()
  const nextStageEntries = document.stageEntries.map((entry) => {
    if (entry.stage_id !== stage.id || !assignmentById.has(entry.id)) return entry
    return {
      ...entry,
      metadata: {
        ...(entry.metadata ?? {}),
        groupKey: assignmentById.get(entry.id)!,
      },
      updated_at: now,
    }
  })

  const nextStages = document.stages.map((item) =>
    item.id === stage.id
      ? {
          ...item,
          settings: { ...item.settings, groupCount: input.groupCount },
          updatedAt: now,
        }
      : item,
  )

  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      stages: nextStages,
      stageEntries: nextStageEntries,
    }),
  )
}

export async function saveGuestIndividualRotationSettings(input: {
  competitionId: string
  stageId: string
  courtCount: number
  requestedRounds: number
  availableTimeMinutes?: number
  matchDurationMinutes?: number
}): Promise<void> {
  if (!Number.isInteger(input.courtCount) || input.courtCount < 1 || input.courtCount > 5) {
    throw new Error("Individual Rotation court count must be between 1 and 5.")
  }
  if (!Number.isInteger(input.requestedRounds) || input.requestedRounds < 1 || input.requestedRounds > 20) {
    throw new Error("Individual Rotation rounds must be between 1 and 12.")
  }
  if (
    input.availableTimeMinutes !== undefined &&
    (!Number.isInteger(input.availableTimeMinutes) || input.availableTimeMinutes < 1)
  ) {
    throw new Error("Available time must be a positive integer.")
  }
  if (
    input.matchDurationMinutes !== undefined &&
    (!Number.isInteger(input.matchDurationMinutes) || input.matchDurationMinutes < 1)
  ) {
    throw new Error("Match duration must be a positive integer.")
  }

  const document = requireDocument(await localStorageGuestAdapter.get(input.competitionId))
  const stage = document.stages.find((item) => item.id === input.stageId)
  if (!stage) throw new Error("Guest stage not found.")
  if (stage.stageType !== "individual_rotation") {
    throw new Error("These settings are only available for Individual Rotation.")
  }
  if (stage.status !== "draft" && stage.status !== "configured") {
    throw new Error("Individual Rotation settings are locked after phase generation.")
  }

  const now = new Date().toISOString()
  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      stages: document.stages.map((item) =>
        item.id === stage.id
          ? {
              ...item,
              settings: {
                ...item.settings,
                courtCount: input.courtCount,
                requestedRounds: input.requestedRounds,
                ...(input.availableTimeMinutes !== undefined
                  ? { availableTimeMinutes: input.availableTimeMinutes }
                  : {}),
                ...(input.matchDurationMinutes !== undefined
                  ? { matchDurationMinutes: input.matchDurationMinutes }
                  : {}),
              },
              updatedAt: now,
            }
          : item,
      ),
    }),
  )
}

function isIndividualRotationSchedule(value: unknown): value is IndividualRotationSchedule {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as Partial<IndividualRotationSchedule>
  return (
    typeof candidate.id === "string" &&
    typeof candidate.roundCount === "number" &&
    typeof candidate.matchCount === "number" &&
    typeof candidate.fairnessRawPenalty === "number" &&
    typeof candidate.schedule === "object" &&
    candidate.schedule !== null &&
    Array.isArray(candidate.schedule.rounds)
  )
}

function buildGenerationEntries(document: GuestTournamentDocument, stageId: string) {
  const rosterById = new Map(document.entries.map((entry) => [entry.id, entry]))
  const activeStageEntries = document.stageEntries
    .filter((entry) => entry.stage_id === stageId && entry.status === "active")
    .sort((a, b) => a.sort_order - b.sort_order)

  if (activeStageEntries.length < 2) {
    throw new Error("At least two active phase participants are required.")
  }

  const generationEntries: StageGenerationEntry[] = activeStageEntries.map(
    (stageEntry) => {
      const entry = rosterById.get(stageEntry.competition_entry_id)
      if (!entry) {
        throw new Error("A phase participant references a tournament participant that no longer exists.")
      }
      if (entry.status !== "active") {
        throw new Error(`Tournament participant \"${entry.display_name}\" is not active.`)
      }

      return {
        id: entry.id,
        displayName: entry.display_name,
        entryType: entry.entry_type,
        seed: stageEntry.seed,
        metadata: {
          ...(entry.metadata ?? {}),
          ...(stageEntry.metadata ?? {}),
        },
      }
    },
  )

  return { activeStageEntries, generationEntries }
}

function isBracketTree(value: unknown): value is BracketTree {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as Partial<BracketTree>
  return (
    typeof candidate.id === "string" &&
    typeof candidate.size === "number" &&
    Array.isArray(candidate.rounds) &&
    Array.isArray(candidate.matches)
  )
}

function isRoundRobinSchedule(value: unknown): value is RoundRobinSchedule {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as Partial<RoundRobinSchedule>
  return (
    typeof candidate.id === "string" &&
    typeof candidate.groupCount === "number" &&
    typeof candidate.roundCount === "number" &&
    typeof candidate.matchCount === "number" &&
    Array.isArray(candidate.groups)
  )
}

type GuestGeneratedMatchInput =
  Omit<
    Partial<MatchRow>,
    "status"
  > &
  Pick<
    MatchRow,
    | "competition_id"
    | "stage_id"
    | "match_number"
    | "round_number"
    | "match_order"
    | "match_type"
    | "side_a"
    | "side_b"
  > & {
    status?: MatchRow["status"] | "cancelled"
  }

function normalizeGeneratedMatchStatus(
  status: GuestGeneratedMatchInput["status"],
): MatchRow["status"] {
  if (
    status === "pending" ||
    status === "ready" ||
    status === "on_court" ||
    status === "completed"
  ) {
    return status
  }

  /*
   * The Elimination mapper's insert type also allows
   * "cancelled", while the shared MatchRow domain
   * currently does not. A freshly generated Guest match
   * must therefore fall back to the pre-play state.
   */
  return "pending"
}

function completeMatchRows(
  matches: readonly GuestGeneratedMatchInput[],
): MatchRow[] {
  const now = new Date().toISOString()
  return matches.map((match) => ({
    id: match.id ?? `match_${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${match.match_number}`}`,
    competition_id: match.competition_id,
    stage_id: match.stage_id,
    match_number: match.match_number,
    visible_match_number: match.visible_match_number ?? match.match_number,
    status: normalizeGeneratedMatchStatus(match.status),
    phase_key: match.phase_key ?? null,
    group_key: match.group_key ?? null,
    round_number: match.round_number,
    match_order: match.match_order,
    match_type: match.match_type,
    court_id: match.court_id ?? null,
    court_label: match.court_label ?? null,
    side_a: match.side_a,
    side_b: match.side_b,
    score: match.score ?? {},
    winner_side: match.winner_side ?? null,
    loser_side: match.loser_side ?? null,
    is_bye: match.is_bye ?? false,
    next_match_id: match.next_match_id ?? null,
    next_match_slot: match.next_match_slot ?? null,
    finish_type: match.finish_type ?? "normal",
    retired_side: match.retired_side ?? null,
    scheduled_at: match.scheduled_at ?? null,
    started_at: match.started_at ?? null,
    completed_at: match.completed_at ?? null,
    metadata: match.metadata ?? {},
    created_at: match.created_at ?? now,
    updated_at: match.updated_at ?? now,
  }))
}

export async function generateGuestCompetitionStage(input: {
  competitionId: string
  stageId: string
}): Promise<GuestStageGenerationSummary> {
  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )
  const stage = document.stages.find((item) => item.id === input.stageId)
  if (!stage) throw new Error("Guest stage not found.")
  if (stage.status === "generated" || stage.status === "running" || stage.status === "completed") {
    throw new Error("This phase has already been generated.")
  }
  if (
    stage.stageType !== "elimination" &&
    stage.stageType !== "round_robin" &&
    stage.stageType !== "individual_rotation"
  ) {
    throw new Error("Guest generation for this phase format will be enabled in the next step.")
  }

  const { activeStageEntries, generationEntries } = buildGenerationEntries(document, stage.id)

  if (stage.stageType === "round_robin") {
    const groupCount = stage.settings.groupCount
    if (typeof groupCount !== "number") {
      throw new Error("Configure and save the Round Robin groups before generation.")
    }
    validateGroupCount(groupCount)
    const allowed = new Set(groupKeys(groupCount))
    for (const entry of activeStageEntries) {
      const key = readGroupKey(entry)
      if (!key || !allowed.has(key)) {
        throw new Error("Every Round Robin participant must be assigned to a valid group before generation.")
      }
    }
    ensureRoundRobinEngineRegistered()
  } else if (stage.stageType === "individual_rotation") {
    const courtCount = stage.settings.courtCount
    const requestedRounds = stage.settings.requestedRounds

    if (typeof courtCount !== "number" || !Number.isInteger(courtCount) || courtCount < 1 || courtCount > 5) {
      throw new Error("Configure between 1 and 4 courts before generation.")
    }
    if (typeof requestedRounds !== "number" || !Number.isInteger(requestedRounds) || requestedRounds < 1 || requestedRounds > 20) {
      throw new Error("Choose between 1 and 12 rounds before generation.")
    }
    if (generationEntries.length < 4 || generationEntries.length > 20) {
      throw new Error("Individual Rotation requires between 4 and 20 active players.")
    }
    if (generationEntries.some((entry) => entry.entryType !== "player")) {
      throw new Error("Individual Rotation supports player entries only.")
    }

    const seedCount = generationEntries.filter(
      (entry) => typeof entry.seed === "number" && entry.seed > 0,
    ).length
    if (
      seedCount !== 0 &&
      seedCount !== 2 &&
      seedCount !== 4
    ) {
      throw new Error(
        "Individual Rotation templates support 0, 2 or 4 seeded players.",
      )
    }

    ensureIndividualRotationEngineRegistered()
  } else {
    ensureEliminationEngineRegistered()
  }

  const engine = getRegisteredStageEngine(stage.stageType)
  if (!engine?.generate) {
    throw new Error(`Stage Engine \"${stage.stageType}\" does not support generation.`)
  }

  let generationOptions: Record<string, unknown> = {
    drawMode: generationEntries.some((entry) => typeof entry.seed === "number")
      ? "seeded"
      : "random",
  }

  if (stage.stageType === "individual_rotation") {
    const courtCount = stage.settings.courtCount as number
    const requestedRounds = stage.settings.requestedRounds as number
    const usableCourtCount = Math.min(courtCount, Math.floor(generationEntries.length / 4))
    const seedCount = generationEntries.filter(
      (entry) => typeof entry.seed === "number" && entry.seed > 0,
    ).length

    const individualRotationTemplate = await getGuestIndividualRotationTemplateAction({
      playerCount: generationEntries.length,
      usableCourtCount,
      seedCount,
      roundCount: requestedRounds,
    })

    if (!individualRotationTemplate) {
      throw new Error(
        `No precomputed Individual Rotation template is available for ${generationEntries.length} players, ${usableCourtCount} usable court(s), ${seedCount} seed(s), and ${requestedRounds} round(s).`,
      )
    }

    generationOptions = {
      ...generationOptions,
      individualRotationTemplate,
    }
  }

  const result = await engine.generate({
    stage,
    entries: generationEntries,
    options: generationOptions,
  })

  if (!result.success) throw new Error(result.message ?? "Phase generation failed.")

  let matches: MatchRow[]
  let stageMetadata: Record<string, unknown>
  let summary: GuestStageGenerationSummary

  if (stage.stageType === "elimination") {
    if (!isBracketTree(result.output)) throw new Error("The Elimination Engine returned an invalid bracket.")
    const mapped = new BracketMapper().map({
      competitionId: stage.competitionId,
      stageId: stage.id,
      tree: result.output,
    })
    matches = completeMatchRows(mapped.matches)
    stageMetadata = { ...stage.metadata, ...mapped.stageMetadata, persistence: "guest" }
    summary = {
      engineId: "elimination",
      entryCount: generationEntries.length,
      roundCount: result.output.rounds.length,
      matchCount: matches.length,
      artifactId: result.output.id,
    }
  } else if (stage.stageType === "round_robin") {
    if (!isRoundRobinSchedule(result.output)) throw new Error("The Round Robin Engine returned an invalid schedule.")
    const mapped = new RoundRobinMapper().map({
      competitionId: stage.competitionId,
      stageId: stage.id,
      schedule: result.output,
    })
    matches = completeMatchRows(mapped.matches)
    stageMetadata = {
      ...stage.metadata,
      persistence: "guest",
      scheduleId: result.output.id,
      groupCount: result.output.groupCount,
      roundCount: result.output.roundCount,
      matchCount: result.output.matchCount,
      engineType: "round_robin",
    }
    summary = {
      engineId: "round_robin",
      entryCount: generationEntries.length,
      roundCount: result.output.roundCount,
      matchCount: matches.length,
      artifactId: result.output.id,
    }
  } else {
    if (!isIndividualRotationSchedule(result.output)) {
      throw new Error("The Individual Rotation Engine returned an invalid schedule.")
    }

    const mapped = new IndividualRotationMapper().map(result.output)
    matches = completeMatchRows(
      mapped.matches.map((match) => ({
        ...match,
        competition_id: stage.competitionId,
        stage_id: stage.id,
      })),
    )
    stageMetadata = {
      ...stage.metadata,
      ...mapped.stageMetadata,
      persistence: "guest",
      scheduleId: result.output.id,
      roundCount: result.output.roundCount,
      matchCount: result.output.matchCount,
      fairnessRawPenalty: result.output.fairnessRawPenalty,
      engineType: "individual_rotation",
    }
    summary = {
      engineId: "individual_rotation",
      entryCount: generationEntries.length,
      roundCount: result.output.roundCount,
      matchCount: matches.length,
      artifactId: result.output.id,
    }
  }

  const now = new Date().toISOString()
  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      stages: document.stages.map((item) =>
        item.id === stage.id
          ? { ...item, status: "generated", metadata: stageMetadata, updatedAt: now }
          : item,
      ),
      matches: [
        ...document.matches.filter((match) => match.stage_id !== stage.id),
        ...matches,
      ],
    }),
  )

  return summary
}
