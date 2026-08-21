import { createClient } from "@/lib/supabase/server"

export type ExistingRotationMatch = {
  id: string
  matchNumber: number
  roundNumber: number
  matchOrder: number
  courtLabel: string | null
  sideA: { type?: string; entryIds?: string[] } | null
  sideB: { type?: string; entryIds?: string[] } | null
  metadata: Record<string, unknown>
}

export async function listExistingRotationMatches(stageId: string): Promise<ExistingRotationMatch[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("matches")
    .select("id,match_number,round_number,match_order,court_label,side_a,side_b,metadata")
    .eq("stage_id", stageId)
    .eq("match_type", "individual_rotation")
    .order("round_number", { ascending: true })
    .order("match_order", { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    id: row.id,
    matchNumber: row.match_number,
    roundNumber: row.round_number,
    matchOrder: row.match_order,
    courtLabel: row.court_label,
    sideA: row.side_a as ExistingRotationMatch["sideA"],
    sideB: row.side_b as ExistingRotationMatch["sideB"],
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
  }))
}

export async function appendIndividualRotationRound(input: {
  stageId: string
  roundNumber: number
  matches: unknown[]
  metadata: Record<string, unknown>
}): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("append_individual_rotation_round", {
    p_stage_id: input.stageId,
    p_matches: input.matches,
    p_round_number: input.roundNumber,
    p_metadata: input.metadata,
  })
  if (error) throw new Error(error.message)
}
