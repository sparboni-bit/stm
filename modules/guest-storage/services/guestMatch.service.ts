import type { CompetitionCourt } from "@/modules/competition-courts/types"
import type { MatchRow, MatchSide, MatchSlot } from "@/modules/matches/types"

import {
  createGuestId,
  localStorageGuestAdapter,
  touchGuestDocument,
} from "../index"
import type { GuestTournamentDocument } from "../types"

function requireDocument(
  document: GuestTournamentDocument | null,
): GuestTournamentDocument {
  if (!document) throw new Error("Guest competition not found.")
  return document
}

function requireMatch(
  document: GuestTournamentDocument,
  matchId: string,
): MatchRow {
  const match = document.matches.find((item) => item.id === matchId)
  if (!match) throw new Error("Guest match not found.")
  return match
}

function entryIdsFromSlot(slot: MatchSlot): string[] {
  if (slot.type === "entry" && typeof slot.entryId === "string") {
    return [slot.entryId]
  }

  if (
    slot.type === "rotation_team" &&
    Array.isArray(slot.entryIds) &&
    slot.entryIds.length === 2 &&
    slot.entryIds.every((id) => typeof id === "string" && id.length > 0)
  ) {
    return [...slot.entryIds]
  }

  return []
}

function requireResolvedSlot(slot: MatchSlot): string[] {
  const ids = entryIdsFromSlot(slot)
  if (!ids.length) {
    throw new Error("Both participants must be resolved before saving a result.")
  }
  return ids
}

function winnerEntryId(match: MatchRow, side: MatchSide): string {
  const slot = side === "A" ? match.side_a : match.side_b
  const ids = entryIdsFromSlot(slot)

  /*
   * Winner propagation is only meaningful for single-entry bracket slots.
   * Rotation teams do not propagate to a downstream bracket match.
   */
  if (ids.length !== 1) {
    throw new Error("Winner propagation requires a single resolved participant.")
  }

  return ids[0]
}

function normalizeCourt(
  court: CompetitionCourt,
  status: CompetitionCourt["status"],
): CompetitionCourt {
  return {
    ...court,
    status,
    updatedAt: new Date().toISOString(),
  }
}

function finalizeDocument(
  document: GuestTournamentDocument,
  matches: MatchRow[],
  courts = document.courts,
): GuestTournamentDocument {
  const now = new Date().toISOString()
  const nonBye = matches.filter((match) => !match.is_bye)
  const allCompleted =
    nonBye.length > 0 &&
    nonBye.every((match) => match.status === "completed")
  const anyStarted = matches.some(
    (match) => match.status === "on_court" || match.status === "completed",
  )

  const stageIds = new Set(matches.map((match) => match.stage_id))
  const stages = document.stages.map((stage) => {
    if (!stageIds.has(stage.id)) return stage
    const stageMatches = matches.filter((match) => match.stage_id === stage.id)
    const stagePlayable = stageMatches.filter((match) => !match.is_bye)
    const stageCompleted =
      stagePlayable.length > 0 &&
      stagePlayable.every((match) => match.status === "completed")
    const stageRunning = stageMatches.some(
      (match) => match.status === "on_court" || match.status === "completed",
    )
    return {
      ...stage,
      status: stageCompleted
        ? "completed"
        : stageRunning
          ? "running"
          : stage.status,
      updatedAt: now,
    }
  })

  return touchGuestDocument({
    ...document,
    competition: {
      ...document.competition,
      status: allCompleted
        ? "completed"
        : anyStarted
          ? "running"
          : document.competition.status,
    },
    stages,
    matches,
    courts,
  })
}

export async function listGuestMatches(
  competitionId: string,
): Promise<MatchRow[]> {
  const document = requireDocument(
    await localStorageGuestAdapter.get(competitionId),
  )
  return [...document.matches].sort(
    (a, b) =>
      a.round_number - b.round_number ||
      a.match_order - b.match_order ||
      a.match_number - b.match_number,
  )
}

export async function createGuestCourt(input: {
  competitionId: string
  name: string
}): Promise<CompetitionCourt> {
  const name = input.name.trim()
  if (!name) throw new Error("Court name is required.")

  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )
  const now = new Date().toISOString()
  const nextNumber =
    document.courts.reduce(
      (max, court) => Math.max(max, court.courtNumber),
      0,
    ) + 1

  const court: CompetitionCourt = {
    id: createGuestId("court"),
    competitionId: input.competitionId,
    courtNumber: nextNumber,
    name,
    status: "available",
    sortOrder: nextNumber,
    metadata: { persistence: "guest" },
    createdAt: now,
    updatedAt: now,
  }

  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      courts: [...document.courts, court],
    }),
  )
  return court
}

export async function saveGuestMatchSchedule(input: {
  competitionId: string
  matchId: string
  courtId: string | null
  scheduledAt: string | null
}): Promise<void> {
  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )
  const match = requireMatch(document, input.matchId)
  if (match.status === "completed") {
    throw new Error("A completed match cannot be rescheduled.")
  }

  const court = input.courtId
    ? document.courts.find((item) => item.id === input.courtId)
    : null
  if (input.courtId && !court) throw new Error("Court not found.")

  const now = new Date().toISOString()
  const matches = document.matches.map((item) =>
    item.id === match.id
      ? {
          ...item,
          court_id: court?.id ?? null,
          court_label: court?.name ?? null,
          scheduled_at: input.scheduledAt,
          updated_at: now,
        }
      : item,
  )

  await localStorageGuestAdapter.save(
    touchGuestDocument({ ...document, matches }),
  )
}

export async function startGuestMatch(input: {
  competitionId: string
  matchId: string
}): Promise<void> {
  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )
  const match = requireMatch(document, input.matchId)
  if (match.is_bye) throw new Error("A BYE match cannot be started.")
  if (match.status === "completed") throw new Error("This match is already completed.")
  if (!match.court_id) throw new Error("Assign an available court before starting the match.")

  const court = document.courts.find((item) => item.id === match.court_id)
  if (!court) throw new Error("Assigned court not found.")

  const occupied = document.matches.some(
    (item) =>
      item.id !== match.id &&
      item.status === "on_court" &&
      item.court_id === court.id,
  )
  if (occupied) throw new Error(`${court.name} is already in use.`)

  const now = new Date().toISOString()
  const matches = document.matches.map((item) =>
    item.id === match.id
      ? { ...item, status: "on_court" as const, started_at: now, updated_at: now }
      : item,
  )
  const courts = document.courts.map((item) =>
    item.id === court.id ? normalizeCourt(item, "unavailable") : item,
  )

  await localStorageGuestAdapter.save(
    finalizeDocument(document, matches, courts),
  )
}

function propagateWinner(
  matches: MatchRow[],
  source: MatchRow,
  winnerSide: MatchSide,
): MatchRow[] {
  if (!source.next_match_id || !source.next_match_slot) return matches
  const winnerId = winnerEntryId(source, winnerSide)
  const now = new Date().toISOString()

  return matches.map((match) => {
    if (match.id !== source.next_match_id) return match
    if (match.status === "on_court" || match.status === "completed") {
      throw new Error("Result is locked because the next match has already started or is completed.")
    }
    const slot: MatchSlot = {
      type: "entry",
      entryId: winnerId,
      sourceMatchId: source.id,
    }
    return source.next_match_slot === "A"
      ? { ...match, side_a: slot, updated_at: now }
      : { ...match, side_b: slot, updated_at: now }
  })
}

async function saveCompletedResult(input: {
  competitionId: string
  matchId: string
  winnerSide: MatchSide
  score: Record<string, unknown>
  finishType: "normal" | "retirement"
  retiredSide: MatchSide | null
}): Promise<void> {
  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )
  const match = requireMatch(document, input.matchId)
  if (match.is_bye) throw new Error("BYE matches do not require a result.")

  const sideAEntryIds = requireResolvedSlot(match.side_a)
  const sideBEntryIds = requireResolvedSlot(match.side_b)

  const next = match.next_match_id
    ? document.matches.find((item) => item.id === match.next_match_id)
    : null
  if (next && (next.status === "on_court" || next.status === "completed")) {
    throw new Error("Result is locked because the next match has already started or is completed.")
  }

  const now = new Date().toISOString()
  let matches = document.matches.map((item) =>
    item.id === match.id
      ? {
          ...item,
          status: "completed" as const,
          score: input.score,
          winner_side: input.winnerSide,
          loser_side: input.winnerSide === "A" ? ("B" as const) : ("A" as const),
          finish_type: input.finishType,
          retired_side: input.retiredSide,
          completed_at: now,
          updated_at: now,
          metadata: {
            ...item.metadata,
            winnerEntryId:
              input.winnerSide === "A" && sideAEntryIds.length === 1
                ? sideAEntryIds[0]
                : input.winnerSide === "B" && sideBEntryIds.length === 1
                  ? sideBEntryIds[0]
                  : null,
            winnerEntryIds:
              input.winnerSide === "A"
                ? sideAEntryIds
                : sideBEntryIds,
          },
        }
      : item,
  )

  matches = propagateWinner(matches, match, input.winnerSide)

  const courts = document.courts.map((court) =>
    court.id === match.court_id ? normalizeCourt(court, "available") : court,
  )

  await localStorageGuestAdapter.save(
    finalizeDocument(document, matches, courts),
  )
}

export async function saveGuestSingleSetResult(input: {
  competitionId: string
  matchId: string
  scoreA: number
  scoreB: number
}): Promise<void> {
  if (!Number.isSafeInteger(input.scoreA) || input.scoreA < 0 ||
      !Number.isSafeInteger(input.scoreB) || input.scoreB < 0) {
    throw new Error("Scores must be non-negative integers.")
  }
  if (input.scoreA === input.scoreB) {
    throw new Error("A completed match cannot end in a draw.")
  }
  await saveCompletedResult({
    competitionId: input.competitionId,
    matchId: input.matchId,
    winnerSide: input.scoreA > input.scoreB ? "A" : "B",
    score: {
      format: "single_set",
      scoreA: input.scoreA,
      scoreB: input.scoreB,
    },
    finishType: "normal",
    retiredSide: null,
  })
}

export async function saveGuestBestOf3Result(input: {
  competitionId: string
  matchId: string
  sets: Array<{ scoreA: number; scoreB: number }>
}): Promise<void> {
  let setsA = 0
  let setsB = 0
  const normalized: Array<{ a: number; b: number }> = []

  for (const [index, set] of input.sets.entries()) {
    if (setsA === 2 || setsB === 2) {
      throw new Error("Do not enter a set after the match is already decided.")
    }
    if (!Number.isSafeInteger(set.scoreA) || set.scoreA < 0 ||
        !Number.isSafeInteger(set.scoreB) || set.scoreB < 0) {
      throw new Error(`Set ${index + 1} scores must be non-negative integers.`)
    }
    if (set.scoreA === set.scoreB) {
      throw new Error(`Set ${index + 1} cannot end in a draw.`)
    }
    if (set.scoreA > set.scoreB) setsA += 1
    else setsB += 1
    normalized.push({ a: set.scoreA, b: set.scoreB })
  }

  if (setsA !== 2 && setsB !== 2) {
    throw new Error("Best of 3 is incomplete: one player must win two sets.")
  }

  await saveCompletedResult({
    competitionId: input.competitionId,
    matchId: input.matchId,
    winnerSide: setsA === 2 ? "A" : "B",
    score: { format: "best_of_3", sets: normalized },
    finishType: "normal",
    retiredSide: null,
  })
}

export async function saveGuestRetirementResult(input: {
  competitionId: string
  matchId: string
  retiredSide: MatchSide
  scoreFormat: "single_set" | "best_of_3"
  sets: Array<{ scoreA: number; scoreB: number }>
}): Promise<void> {
  const normalized = input.sets.map((set) => ({
    a: set.scoreA,
    b: set.scoreB,
  }))
  await saveCompletedResult({
    competitionId: input.competitionId,
    matchId: input.matchId,
    winnerSide: input.retiredSide === "A" ? "B" : "A",
    score:
      input.scoreFormat === "single_set"
        ? {
            format: "single_set",
            scoreA: normalized[0]?.a ?? null,
            scoreB: normalized[0]?.b ?? null,
            sets: normalized,
          }
        : { format: "best_of_3", sets: normalized },
    finishType: "retirement",
    retiredSide: input.retiredSide,
  })
}

export async function undoGuestMatchResult(input: {
  competitionId: string
  matchId: string
}): Promise<void> {
  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )
  const match = requireMatch(document, input.matchId)
  if (match.status !== "completed" || match.is_bye) {
    throw new Error("Only a completed played match can be undone.")
  }

  const next = match.next_match_id
    ? document.matches.find((item) => item.id === match.next_match_id)
    : null
  if (next && (next.status === "on_court" || next.status === "completed")) {
    throw new Error("Undo is blocked because the next match has already started or is completed.")
  }

  const now = new Date().toISOString()
  let matches = document.matches.map((item) =>
    item.id === match.id
      ? {
          ...item,
          status: "ready" as const,
          score: {},
          winner_side: null,
          loser_side: null,
          finish_type: "normal",
          retired_side: null,
          completed_at: null,
          metadata: { ...item.metadata, winnerEntryId: null },
          updated_at: now,
        }
      : item,
  )

  if (match.next_match_id && match.next_match_slot) {
    matches = matches.map((item) => {
      if (item.id !== match.next_match_id) return item
      const restored: MatchSlot = {
        type: "winner",
        sourceMatchId: match.id,
        label: `Winner of match ${match.visible_match_number ?? match.match_number}`,
      }
      return match.next_match_slot === "A"
        ? { ...item, side_a: restored, updated_at: now }
        : { ...item, side_b: restored, updated_at: now }
    })
  }

  const courts = document.courts.map((court) =>
    court.id === match.court_id ? normalizeCourt(court, "available") : court,
  )
  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      competition: {
        ...document.competition,
        status: "running",
      },
      stages: document.stages.map((stage) =>
        stage.id === match.stage_id
          ? { ...stage, status: "running", updatedAt: now }
          : stage,
      ),
      matches,
      courts,
    }),
  )
}
