import { createClient } from "@/lib/supabase/server"

import type { CompetitionEntry } from "../../competition-entries/types"
import {listCompetitionStageEntries,
} from "../../competition-stage-entries/repositories/competition-stage-entry.repository"
import type {
  MatchRow,
  MatchSlot,
} from "../types"
import { MatchViewBuilder, type MatchDetailView } from "../view"

const matchSelect = `
  id,
  competition_id,
  stage_id,
  match_number,
  visible_match_number,
  status,
  phase_key,
  group_key,
  round_number,
  match_order,
  match_type,
  court_id,
  court_label,
  side_a,
  side_b,
  score,
  winner_side,
  loser_side,
  is_bye,
  next_match_id,
  next_match_slot,
  finish_type,
  retired_side,
  scheduled_at,
  started_at,
  completed_at,
  metadata,
  created_at,
  updated_at
`

const entrySelect = `
  id,
  competition_id,
  player_id,
  team_id,
  entry_type,
  display_name,
  source,
  status,
  sort_order,
  metadata,
  created_at,
  updated_at
`

async function loadCompetitionEntries(
  competitionId: string,
): Promise<CompetitionEntry[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("competition_entries")
    .select(entrySelect)
    .eq("competition_id", competitionId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as CompetitionEntry[]
}

async function loadStageSeeds(
  stageId: string,
): Promise<
  Map<string, number | null>
> {
  const stageEntries =
    await listCompetitionStageEntries(
      stageId,
    )

  return new Map(
    stageEntries
      .filter(
        (entry) =>
          entry.status ===
          "active",
      )
      .map(
        (entry) => [
          entry.competition_entry_id,
          entry.seed,
        ],
      ),
  )
}

export async function getMatchDetail(
  matchId: string,
): Promise<MatchDetailView | null> {
  const normalizedMatchId = matchId.trim()

  if (!normalizedMatchId) {
    throw new Error("Match id is required.")
  }

  const supabase = await createClient()

  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select(matchSelect)
    .eq("id", normalizedMatchId)
    .maybeSingle()

  if (matchError) {
    throw new Error(matchError.message)
  }

  if (!matchData) {
    return null
  }

  const match =
    matchData as MatchRow

  const [
    entries,
    seedsByEntryId,
  ] = await Promise.all([
    loadCompetitionEntries(
      match.competition_id,
    ),
    loadStageSeeds(
      match.stage_id,
    ),
  ])

  return new MatchViewBuilder().build({
    match,
    entries,
    seedsByEntryId,
  })
}

export async function listStageMatches(
  stageId: string,
): Promise<MatchDetailView[]> {
  const normalizedStageId = stageId.trim()

  if (!normalizedStageId) {
    throw new Error("Stage id is required.")
  }

  const supabase = await createClient()

  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select(matchSelect)
    .eq("stage_id", normalizedStageId)
    .order("round_number", { ascending: true })
    .order("match_order", { ascending: true })
    .order("match_number", { ascending: true })

  if (matchError) {
    throw new Error(matchError.message)
  }

  const matches = (matchData ?? []) as MatchRow[]

  if (matches.length === 0) {
    return []
  }

  const competitionId = matches[0].competition_id

  if (
    matches.some(
      (match) => match.competition_id !== competitionId,
    )
  ) {
    throw new Error(
      "Stage matches contain inconsistent competition ids.",
    )
  }

  const [
    entries,
    seedsByEntryId,
  ] = await Promise.all([
    loadCompetitionEntries(
      competitionId,
    ),
    loadStageSeeds(
      normalizedStageId,
    ),
  ])

  const builder =
    new MatchViewBuilder()

  return matches.map(
    (match) =>
      builder.build({
        match,
        entries,
        seedsByEntryId,
      }),
  )
}


export type MatchScheduleData = {
  courtId: string | null
  courtLabel: string | null
  scheduledAt: string | null
}

export async function getMatchSchedule(
  matchId: string,
): Promise<MatchScheduleData> {
  const normalizedMatchId = matchId.trim()

  if (!normalizedMatchId) {
    throw new Error("Match id is required.")
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("matches")
    .select("court_id,court_label,scheduled_at")
    .eq("id", normalizedMatchId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    courtId:
      typeof data.court_id === "string"
        ? data.court_id
        : null,
    courtLabel:
      typeof data.court_label === "string"
        ? data.court_label
        : null,
    scheduledAt:
      typeof data.scheduled_at === "string"
        ? data.scheduled_at
        : null,
  }
}

export async function saveMatchSchedule(input: {
  matchId: string
  courtId: string | null
  scheduledAt: string | null
}): Promise<void> {
  const matchId = input.matchId.trim()

  if (!matchId) {
    throw new Error("Match id is required.")
  }

  const supabase = await createClient()

  let courtLabel: string | null = null

  if (input.courtId) {
    const { data: court, error: courtError } = await supabase
      .from("competition_courts")
      .select("id,name,status")
      .eq("id", input.courtId)
      .single()

    if (courtError) {
      throw new Error(courtError.message)
    }

    if (court.status !== "available") {
      throw new Error("The selected court is unavailable.")
    }

    courtLabel = court.name
  }

  const { error } = await supabase
    .from("matches")
    .update({
      court_id: input.courtId,
      court_label: courtLabel,
      scheduled_at: input.scheduledAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId)

  if (error) {
    throw new Error(error.message)
  }
}


function isResolvedMatchSlot(
  slot: MatchSlot | null,
): boolean {
  if (!slot) {
    return false
  }

  if (slot.type === "entry") {
    return Boolean(slot.entryId)
  }

  if (slot.type === "rotation_team") {
    return (
      Array.isArray(slot.entryIds) &&
      slot.entryIds.length === 2 &&
      slot.entryIds.every(
        (entryId) =>
          typeof entryId === "string" &&
          entryId.trim().length > 0,
      )
    )
  }

  return false
}


export async function markMatchReady(
  matchId: string,
): Promise<void> {
  const normalizedMatchId = matchId.trim()

  if (!normalizedMatchId) {
    throw new Error("Match id is required.")
  }

  const supabase = await createClient()

  const { data: match, error: loadError } = await supabase
    .from("matches")
    .select("id,status,is_bye,side_a,side_b")
    .eq("id", normalizedMatchId)
    .single()

  if (loadError) {
    throw new Error(loadError.message)
  }

  if (match.is_bye) {
    throw new Error("A BYE match cannot be marked ready.")
  }

  if (match.status !== "pending") {
    throw new Error("Only a pending match can be marked ready.")
  }

  const sideA = match.side_a as MatchSlot | null
  const sideB = match.side_b as MatchSlot | null

  if (
    !isResolvedMatchSlot(sideA) ||
    !isResolvedMatchSlot(sideB)
  ) {
    throw new Error(
      "Both participants must be known before the match can be marked ready.",
    )
  }

  const { error } = await supabase
    .from("matches")
    .update({
      status: "ready",
      updated_at: new Date().toISOString(),
    })
    .eq("id", normalizedMatchId)
    .eq("status", "pending")

  if (error) {
    throw new Error(error.message)
  }
}

export async function startMatch(
  matchId: string,
): Promise<void> {
  const normalizedMatchId = matchId.trim()

  if (!normalizedMatchId) {
    throw new Error("Match id is required.")
  }

  const supabase = await createClient()

  const { data: match, error: loadError } = await supabase
    .from("matches")
    .select("id,competition_id,stage_id,status,is_bye,court_id,court_label,side_a,side_b")
    .eq("id", normalizedMatchId)
    .single()

  if (loadError) {
    throw new Error(loadError.message)
  }

  if (match.is_bye) {
    throw new Error("A BYE match cannot be started.")
  }

  if (match.status !== "pending" && match.status !== "ready") {
    throw new Error("Only a pending or ready match can be started.")
  }

  if (match.status === "pending") {
    const sideA = match.side_a as MatchSlot | null
    const sideB = match.side_b as MatchSlot | null

    if (
      !isResolvedMatchSlot(sideA) ||
      !isResolvedMatchSlot(sideB)
    ) {
      throw new Error(
        "Both participants must be known before the match can be started.",
      )
    }

    const { error: readyError } = await supabase
      .from("matches")
      .update({
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", normalizedMatchId)
      .eq("status", "pending")

    if (readyError) {
      throw new Error(readyError.message)
    }
  }

  if (!match.court_id || !match.court_label) {
    throw new Error("Assign an available court before starting the match.")
  }

  const { data: court, error: courtError } = await supabase
    .from("competition_courts")
    .select("id,status")
    .eq("id", match.court_id)
    .single()

  if (courtError) {
    throw new Error(courtError.message)
  }

  if (court.status !== "available") {
    throw new Error("The assigned court is unavailable.")
  }

  const { data: runningMatch, error: runningError } = await supabase
    .from("matches")
    .select("id,visible_match_number,match_number")
    .eq("competition_id", match.competition_id)
    .eq("court_id", match.court_id)
    .eq("status", "on_court")
    .neq("id", normalizedMatchId)
    .limit(1)
    .maybeSingle()

  if (runningError) {
    throw new Error(runningError.message)
  }

  if (runningMatch) {
    const number =
      runningMatch.visible_match_number ?? runningMatch.match_number
    throw new Error(
      `The selected court is already occupied by Match ${number}.`,
    )
  }

  const now = new Date().toISOString()

  const { error } = await supabase
    .from("matches")
    .update({
      status: "on_court",
      started_at: now,
      updated_at: now,
    })
    .eq("id", normalizedMatchId)
    .eq("status", "ready")

  if (error) {
    throw new Error(error.message)
  }

  const { error: stageError } = await supabase
    .from("competition_stages")
    .update({
      status: "running",
      updated_at: now,
    })
    .eq("id", match.stage_id)
    .eq("status", "generated")

  if (stageError) {
    throw new Error(
      `Match started, but Stage lifecycle update failed: ${stageError.message}`,
    )
  }

  const { error: competitionError } = await supabase
    .from("competitions")
    .update({
      status: "running",
      updated_at: now,
    })
    .eq("id", match.competition_id)
    .in("status", ["draft", "configure", "ready", "generated"])

  if (competitionError) {
    throw new Error(
      `Match started, but Competition lifecycle update failed: ${competitionError.message}`,
    )
  }
}


function unresolvedSlotFromSource(
  slot: {
    type?: string
    entryId?: string
    sourceMatchId?: string
    label?: string
    metadata?: Record<string, unknown>
  } | null,
  sourceMatchId: string,
) {
  if (
    slot?.type === "entry" &&
    slot.sourceMatchId === sourceMatchId
  ) {
    return {
      type: "winner" as const,
      sourceMatchId,
      label: "Winner",
    }
  }

  return slot
}

function statusAfterUndoPropagation(
  sideA: { type?: string } | null,
  sideB: { type?: string } | null,
): "pending" | "ready" {
  return sideA?.type === "entry" && sideB?.type === "entry"
    ? "ready"
    : "pending"
}

export async function undoMatchResult(
  matchId: string,
): Promise<void> {
  const normalizedMatchId = matchId.trim()

  if (!normalizedMatchId) {
    throw new Error("Match id is required.")
  }

  const supabase = await createClient()

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select(
      "id,competition_id,stage_id,status,is_bye,next_match_id,next_match_slot,started_at",
    )
    .eq("id", normalizedMatchId)
    .single()

  if (matchError) {
    throw new Error(matchError.message)
  }

  if (match.is_bye) {
    throw new Error("A BYE match result cannot be undone.")
  }

  if (match.status !== "completed") {
    throw new Error("Only a completed match result can be undone.")
  }

  let downstream:
    | {
        id: string
        status: string
        side_a: any
        side_b: any
      }
    | null = null

  if (match.next_match_id) {
    const { data, error } = await supabase
      .from("matches")
      .select("id,status,side_a,side_b")
      .eq("id", match.next_match_id)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error("Linked next match not found.")
    }

    if (
      data.status === "on_court" ||
      data.status === "completed"
    ) {
      throw new Error(
        "Undo locked: the next match has already started or been completed.",
      )
    }

    downstream = data
  }

  if (downstream) {
    const newA = unresolvedSlotFromSource(
      downstream.side_a,
      normalizedMatchId,
    )
    const newB = unresolvedSlotFromSource(
      downstream.side_b,
      normalizedMatchId,
    )

    const changed =
      newA !== downstream.side_a ||
      newB !== downstream.side_b

    if (!changed) {
      throw new Error(
        "Undo blocked: the propagated winner was not found in the linked match.",
      )
    }

    const { error: downstreamError } = await supabase
      .from("matches")
      .update({
        side_a: newA,
        side_b: newB,
        status: statusAfterUndoPropagation(newA, newB),
        updated_at: new Date().toISOString(),
      })
      .eq("id", downstream.id)

    if (downstreamError) {
      throw new Error(downstreamError.message)
    }
  }

  const now = new Date().toISOString()

  const { error: undoError } = await supabase
    .from("matches")
    .update({
      score: {},
      winner_side: null,
      loser_side: null,
      status: match.started_at ? "on_court" : "ready",
      finish_type: "normal",
      retired_side: null,
      completed_at: null,
      updated_at: now,
    })
    .eq("id", normalizedMatchId)
    .eq("status", "completed")

  if (undoError) {
    throw new Error(undoError.message)
  }

  const { error: stageLifecycleError } = await supabase
    .from("competition_stages")
    .update({
      status: "running",
      updated_at: now,
    })
    .eq("id", match.stage_id)
    .eq("status", "completed")

  if (stageLifecycleError) {
    throw new Error(
      `Result undone, but Stage lifecycle rollback failed: ${stageLifecycleError.message}`,
    )
  }

  const { error: competitionLifecycleError } = await supabase
    .from("competitions")
    .update({
      status: "running",
      updated_at: now,
    })
    .eq("id", match.competition_id)
    .eq("status", "completed")

  if (competitionLifecycleError) {
    throw new Error(
      `Result undone, but Competition lifecycle rollback failed: ${competitionLifecycleError.message}`,
    )
  }
}
