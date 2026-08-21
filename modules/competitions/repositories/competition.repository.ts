import { createClient } from "@/lib/supabase/server"
import type { Competition } from "../types"

export async function createCompetition(data: {
  organization_id: string
  owner_member_id: string
  created_by: string
  title: string
  description?: string | null
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

      // Stage-based competitions no longer define these values
      // at Competition level.
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
