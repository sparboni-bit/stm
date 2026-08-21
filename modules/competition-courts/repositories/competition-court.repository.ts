import { createClient } from "@/lib/supabase/server"
import type { CompetitionCourt, CompetitionCourtRow, CompetitionCourtStatus } from "../types"

const select = `
  id,
  competition_id,
  court_number,
  name,
  status,
  sort_order,
  metadata,
  created_at,
  updated_at
`

function map(row: CompetitionCourtRow): CompetitionCourt {
  return {
    id: row.id,
    competitionId: row.competition_id,
    courtNumber: row.court_number,
    name: row.name,
    status: row.status,
    sortOrder: row.sort_order,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listCompetitionCourts(
  competitionId: string,
): Promise<CompetitionCourt[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("competition_courts")
    .select(select)
    .eq("competition_id", competitionId)
    .order("sort_order", { ascending: true })
    .order("court_number", { ascending: true })

  if (error) throw new Error(error.message)
  return ((data ?? []) as CompetitionCourtRow[]).map(map)
}

export async function createCompetitionCourt(input: {
  competitionId: string
  name: string
}): Promise<void> {
  const name = input.name.trim()
  if (!name) throw new Error("Court name is required.")

  const supabase = await createClient()

  const { data: last, error: lastError } = await supabase
    .from("competition_courts")
    .select("court_number")
    .eq("competition_id", input.competitionId)
    .order("court_number", { ascending: false })
    .limit(1)

  if (lastError) throw new Error(lastError.message)

  const courtNumber =
    Array.isArray(last) && last.length > 0
      ? Number(last[0].court_number) + 1
      : 1

  const { error } = await supabase
    .from("competition_courts")
    .insert({
      competition_id: input.competitionId,
      court_number: courtNumber,
      name,
      status: "available",
      sort_order: courtNumber,
      metadata: {},
    })

  if (error) throw new Error(error.message)
}

export async function updateCompetitionCourt(input: {
  courtId: string
  name?: string
  status?: CompetitionCourtStatus
}): Promise<void> {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.name !== undefined) {
    const name = input.name.trim()
    if (!name) throw new Error("Court name is required.")
    patch.name = name
  }

  if (input.status !== undefined) {
    patch.status = input.status
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("competition_courts")
    .update(patch)
    .eq("id", input.courtId)

  if (error) throw new Error(error.message)
}

export async function deleteCompetitionCourt(
  courtId: string,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("competition_courts")
    .delete()
    .eq("id", courtId)

  if (error) throw new Error(error.message)
}
