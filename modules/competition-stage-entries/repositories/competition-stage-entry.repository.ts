import { createClient } from "@/lib/supabase/server"
import type { CompetitionStageEntry } from "../types"

export async function listCompetitionStageEntries(stageId: string): Promise<CompetitionStageEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("competition_stage_entries")
    .select("*")
    .eq("stage_id", stageId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as CompetitionStageEntry[]
}

export async function assignCompetitionStageEntries(
  competitionId: string,
  stageId: string,
  entryIds: string[],
): Promise<void> {
  if (entryIds.length === 0) return
  const supabase = await createClient()

  const { data: last } = await supabase
    .from("competition_stage_entries")
    .select("sort_order")
    .eq("stage_id", stageId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const first = (last?.sort_order ?? 0) + 1
  const rows = entryIds.map((entryId, index) => ({
    competition_id: competitionId,
    stage_id: stageId,
    competition_entry_id: entryId,
    sort_order: first + index,
    status: "active",
    metadata: {},
  }))

  const { error } = await supabase
    .from("competition_stage_entries")
    .upsert(rows, { onConflict: "stage_id,competition_entry_id", ignoreDuplicates: true })

  if (error) throw new Error(error.message)
}

export async function removeCompetitionStageEntry(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("competition_stage_entries").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

export async function removeAllCompetitionStageEntries(stageId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("competition_stage_entries").delete().eq("stage_id", stageId)
  if (error) throw new Error(error.message)
}

export async function setCompetitionStageEntrySeed(
  stageId: string,
  id: string,
  seed: number | null,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("competition_stage_entries")
    .update({ seed })
    .eq("id", id)
    .eq("stage_id", stageId)

  if (error) throw new Error(error.message)
}


export async function setCompetitionStageEntryMetadata(
  stageId: string,
  id: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("competition_stage_entries")
    .update({ metadata })
    .eq("id", id)
    .eq("stage_id", stageId)

  if (error) throw new Error(error.message)
}
