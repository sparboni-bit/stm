import { createClient } from "@/lib/supabase/server"
import type { Competition } from "../types"

export async function createCompetition(data: {
  organization_id: string
  owner_member_id: string
  created_by: string
  title: string
  description?: string | null
  start_at?: string | null
  end_at?: string | null
  settings?: object
  structure?: object
}) {
  const supabase = await createClient()

  return supabase
    .from("competitions")
    .insert({
      organization_id: data.organization_id,
      owner_member_id: data.owner_member_id,
      created_by: data.created_by,
      title: data.title,
      description: data.description ?? null,
      start_at: data.start_at ?? null,
      end_at: data.end_at ?? null,
      play_mode: null,
      structure_type: null,
      settings: data.settings ?? {},
      structure: data.structure ?? {},
      status: "draft",
      metadata: {},
    })
    .select("id")
    .single()
}

export async function getCompetition(id: string) {
  const supabase = await createClient()

  return supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .single<Competition>()
}

export async function listCompetitions(
  organizationId: string,
) {
  const supabase = await createClient()

  return supabase
    .from("competitions")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
}

export async function updateCompetition(
  competitionId: string,
  data: {
    title: string
    description: string | null
    start_at: string
    end_at: string
  },
): Promise<void> {
  const supabase = await createClient()

  const { data: updated, error } = await supabase
    .from("competitions")
    .update({
      title: data.title,
      description: data.description,
      start_at: data.start_at,
      end_at: data.end_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", competitionId)
    .select("id")

  if (error) {
    throw new Error(error.message)
  }

  if (!updated || updated.length === 0) {
    throw new Error(
      "Event could not be updated. Check update permissions.",
    )
  }
}

export async function deleteCompetition(
  competitionId: string,
): Promise<void> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("competitions")
    .delete()
    .eq("id", competitionId)
    .select("id")

  if (error) {
    console.error("Unable to delete competition:", error)
    throw new Error(error.message)
  }

  if (!data || data.length === 0) {
    throw new Error(
      "Event could not be deleted. Check delete permissions.",
    )
  }
}
