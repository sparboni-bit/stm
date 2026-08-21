"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type CompetitionRow = {
  id: string
  status: string
  metadata: Record<string, unknown> | null
}

type StageRow = {
  id: string
  name: string
  stage_type: string
  status: string
  sort_order: number
  metadata: Record<string, unknown> | null
}

export type CompetitionCompletionStage = {
  id: string
  name: string
  stageType: string
  status: string
  sortOrder: number
  championEntryId: string | null
  championDisplayName: string | null
}

export type CompetitionCompletionState = {
  competitionId: string
  competitionStatus: string
  alreadyCompleted: boolean
  canComplete: boolean
  totalStages: number
  completedStages: number
  stages: CompetitionCompletionStage[]
  blockers: string[]
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {}
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0
    ? value
    : null
}

async function loadCompetition(
  competitionId: string,
): Promise<CompetitionRow> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("competitions")
    .select("id,status,metadata")
    .eq("id", competitionId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    id: data.id,
    status: data.status,
    metadata: asRecord(data.metadata),
  }
}

async function loadStages(
  competitionId: string,
): Promise<StageRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("competition_stages")
    .select(
      "id,name,stage_type,status,sort_order,metadata",
    )
    .eq("competition_id", competitionId)
    .order("sort_order", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    stage_type: row.stage_type,
    status: row.status,
    sort_order: row.sort_order,
    metadata: asRecord(row.metadata),
  }))
}

async function computeCompetitionCompletionState(
  competitionId: string,
): Promise<CompetitionCompletionState> {
  const id = competitionId.trim()

  if (!id) {
    throw new Error("Competition id is required.")
  }

  const [competition, stageRows] = await Promise.all([
    loadCompetition(id),
    loadStages(id),
  ])

  const stages: CompetitionCompletionStage[] =
    stageRows.map((stage) => {
      const completion = asRecord(
        stage.metadata?.completion,
      )

      return {
        id: stage.id,
        name: stage.name,
        stageType: stage.stage_type,
        status: stage.status,
        sortOrder: stage.sort_order,
        championEntryId: nullableString(
          completion.championEntryId,
        ),
        championDisplayName: nullableString(
          completion.championDisplayName,
        ),
      }
    })

  const completedStages = stages.filter(
    (stage) => stage.status === "completed",
  )

  const blockers: string[] = []

  if (stages.length === 0) {
    blockers.push(
      "The Competition has no configured Stages.",
    )
  }

  const incompleteStages = stages.filter(
    (stage) => stage.status !== "completed",
  )

  if (incompleteStages.length > 0) {
    blockers.push(
      `${incompleteStages.length} Stage${incompleteStages.length === 1 ? "" : "s"} not completed.`,
    )
  }

  const alreadyCompleted =
    competition.status === "completed"

  if (competition.status === "archived") {
    blockers.push(
      "An archived Competition cannot be completed again.",
    )
  }

  return {
    competitionId: competition.id,
    competitionStatus: competition.status,
    alreadyCompleted,
    canComplete:
      !alreadyCompleted &&
      competition.status !== "archived" &&
      stages.length > 0 &&
      completedStages.length === stages.length,
    totalStages: stages.length,
    completedStages: completedStages.length,
    stages,
    blockers,
  }
}

export async function getCompetitionCompletionStateAction(
  competitionId: string,
): Promise<CompetitionCompletionState> {
  return computeCompetitionCompletionState(
    competitionId,
  )
}

async function persistCompetitionCompletion(
  state: CompetitionCompletionState,
): Promise<CompetitionCompletionState> {
  const competition =
    await loadCompetition(state.competitionId)

  const now = new Date().toISOString()
  const previousMetadata =
    competition.metadata ?? {}

  const stageSummary = state.stages.map(
    (stage) => ({
      stageId: stage.id,
      name: stage.name,
      stageType: stage.stageType,
      sortOrder: stage.sortOrder,
      championEntryId: stage.championEntryId,
      championDisplayName:
        stage.championDisplayName,
    }),
  )

  const supabase = await createClient()

  const { error } = await supabase
    .from("competitions")
    .update({
      status: "completed",
      metadata: {
        ...previousMetadata,
        completion: {
          completedAt: now,
          stageCount: state.totalStages,
          stages: stageSummary,
        },
      },
      updated_at: now,
    })
    .eq("id", competition.id)
    .neq("status", "completed")

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(
    `/competitions/${competition.id}`,
  )
  revalidatePath("/competitions")

  return computeCompetitionCompletionState(
    competition.id,
  )
}

/**
 * Lifecycle hook used after a Stage is completed.
 *
 * It is intentionally idempotent:
 * - if the Competition is already completed, nothing changes;
 * - if one or more Stages are still open, nothing changes;
 * - if all Stages are completed, the Competition is completed.
 */
export async function autoCompleteCompetitionIfReady(
  competitionId: string,
): Promise<CompetitionCompletionState> {
  const state =
    await computeCompetitionCompletionState(
      competitionId,
    )

  if (
    state.alreadyCompleted ||
    !state.canComplete
  ) {
    return state
  }

  return persistCompetitionCompletion(state)
}

export async function completeCompetitionAction(
  competitionId: string,
): Promise<CompetitionCompletionState> {
  // Important: re-read all Stages here. The client state is never
  // trusted as proof that the Competition can be completed.
  const state =
    await computeCompetitionCompletionState(
      competitionId,
    )

  if (state.alreadyCompleted) {
    return state
  }

  if (!state.canComplete) {
    throw new Error(
      state.blockers[0] ??
        "This Competition cannot be completed yet.",
    )
  }

  return persistCompetitionCompletion(state)
}
