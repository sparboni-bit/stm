import { createClient } from "@/lib/supabase/server"

import type {
  CompetitionStage,
  CompetitionStageStatus,
  CompetitionStageType,
  CreateCompetitionStageInput,
} from "../types"

type CompetitionStageRow = {
  id: string
  competition_id: string
  name: string
  stage_type: string
  status: string
  sort_order: number
  settings: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

const competitionStageSelect = `
  id,
  competition_id,
  name,
  stage_type,
  status,
  sort_order,
  settings,
  metadata,
  created_at,
  updated_at
`

function mapCompetitionStage(
  row: CompetitionStageRow,
): CompetitionStage {
  return {
    id: row.id,
    competitionId: row.competition_id,
    name: row.name,
    stageType: row.stage_type as CompetitionStageType,
    status: row.status as CompetitionStageStatus,
    sortOrder: row.sort_order,
    settings: row.settings ?? {},
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listCompetitionStages(
  competitionId: string,
): Promise<CompetitionStage[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("competition_stages")
    .select(competitionStageSelect)
    .eq("competition_id", competitionId)
    .order("sort_order", {
      ascending: true,
    })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as CompetitionStageRow[]).map(
    mapCompetitionStage,
  )
}

export async function getCompetitionStage(
  stageId: string,
): Promise<CompetitionStage | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("competition_stages")
    .select(competitionStageSelect)
    .eq("id", stageId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  return mapCompetitionStage(
    data as CompetitionStageRow,
  )
}

export async function createCompetitionStage(
  input: CreateCompetitionStageInput,
): Promise<CompetitionStage> {
  const supabase = await createClient()

  const { data: lastStage, error: orderError } =
    await supabase
      .from("competition_stages")
      .select("sort_order")
      .eq("competition_id", input.competitionId)
      .order("sort_order", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle()

  if (orderError) {
    throw new Error(orderError.message)
  }

  const nextSortOrder =
    (lastStage?.sort_order ?? 0) + 1

  const { data, error } = await supabase
    .from("competition_stages")
    .insert({
      competition_id: input.competitionId,
      name: input.name,
      stage_type: input.stageType,
      status: "draft",
      sort_order: nextSortOrder,
      settings: {},
      metadata: {},
    })
    .select(competitionStageSelect)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return mapCompetitionStage(
    data as CompetitionStageRow,
  )
}

export async function deleteCompetitionStage(
  stageId: string,
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("competition_stages")
    .delete()
    .eq("id", stageId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function configureCompetitionStage(
  stageId: string,
): Promise<CompetitionStage> {
  const supabase = await createClient()

  const { data: currentStage, error: readError } =
    await supabase
      .from("competition_stages")
      .select(competitionStageSelect)
      .eq("id", stageId)
      .single()

  if (readError) {
    throw new Error(readError.message)
  }

  const current = mapCompetitionStage(
    currentStage as CompetitionStageRow,
  )

  if (current.status === "configured") {
    return current
  }

  if (current.status !== "draft") {
    throw new Error(
      "Only a draft stage can be configured.",
    )
  }

  const { data, error } = await supabase
    .from("competition_stages")
    .update({
      status: "configured",
      updated_at: new Date().toISOString(),
    })
    .eq("id", stageId)
    .eq("status", "draft")
    .select(competitionStageSelect)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return mapCompetitionStage(
    data as CompetitionStageRow,
  )
}

export async function updateCompetitionStageSettings(
  stageId: string,
  settings: Record<string, unknown>,
): Promise<CompetitionStage> {
  const supabase = await createClient()

  const { data: currentStage, error: readError } =
    await supabase
      .from("competition_stages")
      .select(competitionStageSelect)
      .eq("id", stageId)
      .single()

  if (readError) {
    throw new Error(readError.message)
  }

  const current = mapCompetitionStage(
    currentStage as CompetitionStageRow,
  )

  if (
    current.status !== "draft" &&
    current.status !== "configured"
  ) {
    throw new Error(
      "Stage settings can only be changed before generation.",
    )
  }

  const { data, error } = await supabase
    .from("competition_stages")
    .update({
      settings: {
        ...current.settings,
        ...settings,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", stageId)
    .in("status", ["draft", "configured"])
    .select(competitionStageSelect)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return mapCompetitionStage(
    data as CompetitionStageRow,
  )
}
