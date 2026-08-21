"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { autoCompleteCompetitionIfReady } from "../../competitions/actions/competitionCompletion"

type RawSlot = {
  type?: string
  entryId?: string
  sourceMatchId?: string
  label?: string
}

type StageMatchRow = {
  id: string
  match_number: number
  round_number: number
  status: string
  is_bye: boolean
  side_a: RawSlot | null
  side_b: RawSlot | null
  winner_side: "A" | "B" | null
  next_match_id: string | null
}

type StageRow = {
  id: string
  competition_id: string
  stage_type: string
  status: string
  metadata: Record<string, unknown> | null
}

export type StageCompletionState = {
  stageId: string
  competitionId: string
  stageStatus: string
  alreadyCompleted: boolean
  canComplete: boolean
  totalMatches: number
  byeMatches: number
  playableMatches: number
  completedMatches: number
  pendingMatches: number
  readyMatches: number
  onCourtMatches: number
  cancelledMatches: number
  finalMatchId: string | null
  championEntryId: string | null
  championDisplayName: string | null
  blockers: string[]
}

async function loadStage(stageId: string): Promise<StageRow> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("competition_stages")
    .select("id,competition_id,stage_type,status,metadata")
    .eq("id", stageId)
    .single()

  if (error) throw new Error(error.message)

  return {
    id: data.id,
    competition_id: data.competition_id,
    stage_type: data.stage_type,
    status: data.status,
    metadata:
      typeof data.metadata === "object" && data.metadata !== null
        ? (data.metadata as Record<string, unknown>)
        : {},
  }
}

async function loadStageMatches(stageId: string): Promise<StageMatchRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id,match_number,round_number,status,is_bye,side_a,side_b,winner_side,next_match_id",
    )
    .eq("stage_id", stageId)
    .order("round_number", { ascending: true })
    .order("match_number", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as StageMatchRow[]
}

function winnerEntryId(match: StageMatchRow): string | null {
  if (match.winner_side === "A") {
    return match.side_a?.type === "entry"
      ? match.side_a.entryId ?? null
      : null
  }

  if (match.winner_side === "B") {
    return match.side_b?.type === "entry"
      ? match.side_b.entryId ?? null
      : null
  }

  return null
}

async function loadEntryName(
  competitionId: string,
  entryId: string | null,
): Promise<string | null> {
  if (!entryId) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("competition_entries")
    .select("display_name")
    .eq("competition_id", competitionId)
    .eq("id", entryId)
    .maybeSingle()

  if (error) throw new Error(error.message)

  return typeof data?.display_name === "string"
    ? data.display_name
    : null
}

async function computeStageCompletionState(
  stageId: string,
): Promise<StageCompletionState> {
  const id = stageId.trim()
  if (!id) throw new Error("Stage id is required.")

  const [stage, matches] = await Promise.all([
    loadStage(id),
    loadStageMatches(id),
  ])

  const playable = matches.filter((match) => !match.is_bye)
  const completed = playable.filter((match) => match.status === "completed")
  const pending = playable.filter((match) => match.status === "pending")
  const ready = playable.filter((match) => match.status === "ready")
  const onCourt = playable.filter((match) => match.status === "on_court")
  const cancelled = playable.filter((match) => match.status === "cancelled")

  const isRoundRobin =
    stage.stage_type === "round_robin"

  const finalCandidates = isRoundRobin
    ? []
    : matches
        .filter((match) => match.next_match_id === null)
        .sort(
          (a, b) =>
            b.round_number - a.round_number ||
            b.match_number - a.match_number,
        )

  const finalMatch = isRoundRobin
    ? null
    : finalCandidates.length === 1
      ? finalCandidates[0]
      : finalCandidates.find(
          (match) =>
            !match.is_bye &&
            match.status === "completed",
        ) ?? null

  const championId =
    !isRoundRobin &&
    finalMatch &&
    !finalMatch.is_bye &&
    finalMatch.status === "completed"
      ? winnerEntryId(finalMatch)
      : null

  const championName = isRoundRobin
    ? null
    : await loadEntryName(
        stage.competition_id,
        championId,
      )

  const blockers: string[] = []

  if (matches.length === 0) {
    blockers.push("The Stage has no generated matches.")
  }

  if (playable.length === 0) {
    blockers.push("The Stage has no playable matches.")
  }

  if (pending.length > 0) {
    blockers.push(
      `${pending.length} match${pending.length === 1 ? "" : "es"} still pending.`,
    )
  }

  if (ready.length > 0) {
    blockers.push(
      `${ready.length} match${ready.length === 1 ? "" : "es"} ready but not completed.`,
    )
  }

  if (onCourt.length > 0) {
    blockers.push(
      `${onCourt.length} match${onCourt.length === 1 ? "" : "es"} currently live.`,
    )
  }

  if (cancelled.length > 0) {
    blockers.push(
      `${cancelled.length} cancelled match${cancelled.length === 1 ? "" : "es"} require resolution.`,
    )
  }

  // Elimination requires a resolved final and champion.
  // Round Robin has no single final match: completion is determined
  // exclusively by all playable matches being completed.
  if (!isRoundRobin) {
    if (!finalMatch) {
      blockers.push("The final match could not be identified.")
    } else if (finalMatch.is_bye) {
      blockers.push("The final match cannot be a BYE.")
    } else if (finalMatch.status !== "completed") {
      blockers.push("The final match is not completed.")
    } else if (!championId) {
      blockers.push("The final match has no resolved winner.")
    }
  }

  const alreadyCompleted =
    stage.status === "completed"

  return {
    stageId: stage.id,
    competitionId: stage.competition_id,
    stageStatus: stage.status,
    alreadyCompleted,
    canComplete:
      !alreadyCompleted &&
      blockers.length === 0 &&
      completed.length === playable.length,
    totalMatches: matches.length,
    byeMatches: matches.length - playable.length,
    playableMatches: playable.length,
    completedMatches: completed.length,
    pendingMatches: pending.length,
    readyMatches: ready.length,
    onCourtMatches: onCourt.length,
    cancelledMatches: cancelled.length,
    finalMatchId: finalMatch?.id ?? null,
    championEntryId: championId,
    championDisplayName: championName,
    blockers,
  }
}

export async function getStageCompletionStateAction(
  stageId: string,
): Promise<StageCompletionState> {
  return computeStageCompletionState(stageId)
}

async function persistStageCompletion(
  state: StageCompletionState,
): Promise<StageCompletionState> {
  const stage = await loadStage(state.stageId)
  const now = new Date().toISOString()
  const previousMetadata = stage.metadata ?? {}

  const supabase = await createClient()

  const {
    data: updatedStage,
    error,
  } = await supabase
    .from("competition_stages")
    .update({
      status: "completed",
      metadata: {
        ...previousMetadata,
        completion: {
          completedAt: now,
          finalMatchId: state.finalMatchId,
          championEntryId: state.championEntryId,
          championDisplayName: state.championDisplayName,
        },
      },
      updated_at: now,
    })
    .eq("id", stage.id)
    .neq("status", "completed")
    .select("id,status")
    .single()

  if (error) {
    throw new Error(
      `Stage completion update failed: ${error.message}`,
    )
  }

  if (
    !updatedStage ||
    updatedStage.status !== "completed"
  ) {
    throw new Error(
      "Stage completion update did not persist.",
    )
  }

  await autoCompleteCompetitionIfReady(
    state.competitionId,
  )

  revalidatePath(`/competitions/${state.competitionId}`)
  revalidatePath(
    `/competitions/${state.competitionId}/stages/${stage.id}`,
  )

  return computeStageCompletionState(stage.id)
}

/**
 * Lifecycle hook used after a result is saved.
 * It is intentionally idempotent: if the Stage is not ready, nothing changes.
 */
export async function autoCompleteStageIfReady(
  stageId: string,
): Promise<StageCompletionState> {
  const state = await computeStageCompletionState(stageId)

  if (state.alreadyCompleted || !state.canComplete) {
    return state
  }

  return persistStageCompletion(state)
}

export async function completeStageAction(
  stageId: string,
): Promise<StageCompletionState> {
  const state = await computeStageCompletionState(stageId)

  if (state.alreadyCompleted) return state

  if (!state.canComplete) {
    throw new Error(
      state.blockers[0] ?? "This Stage cannot be completed yet.",
    )
  }

  return persistStageCompletion(state)
}
