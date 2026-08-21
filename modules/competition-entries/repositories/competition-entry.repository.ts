import { createClient } from "@/lib/supabase/server"

import type {
  CompetitionEntry,
  CreateCompetitionEntryInput,
} from "../types"

export async function listCompetitionEntries(
  competitionId: string,
): Promise<CompetitionEntry[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("competition_entries")
    .select("*")
    .eq("competition_id", competitionId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []) as CompetitionEntry[]
}

export async function createCompetitionEntry(
  input: CreateCompetitionEntryInput,
): Promise<CompetitionEntry> {
  const supabase = await createClient()

  const { data: lastEntry, error: lastEntryError } =
    await supabase
      .from("competition_entries")
      .select("sort_order")
      .eq("competition_id", input.competitionId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()

  if (lastEntryError) throw new Error(lastEntryError.message)

  const nextSortOrder = (lastEntry?.sort_order ?? 0) + 1

  const { data, error } = await supabase
    .from("competition_entries")
    .insert({
      competition_id: input.competitionId,
      entry_type: input.entryType ?? "player",
      display_name: input.displayName.trim(),
      source: "manual",
      status: "active",
      sort_order: nextSortOrder,
      metadata: {},
    })
    .select("*")
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create competition entry")
  }

  return data as CompetitionEntry
}

export async function renameCompetitionEntry(
  entryId: string,
  displayName: string,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("competition_entries")
    .update({ display_name: displayName.trim() })
    .eq("id", entryId)

  if (error) throw new Error(error.message)
}

export async function removeCompetitionEntry(
  entryId: string,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("competition_entries")
    .delete()
    .eq("id", entryId)

  if (error) throw new Error(error.message)
}

export type BulkCreateCompetitionEntryInput = {
  displayName: string
  entryType: "player" | "team"
}

export async function createCompetitionEntriesBulk(
  competitionId: string,
  entries: BulkCreateCompetitionEntryInput[],
): Promise<void> {
  if (entries.length === 0) return

  const supabase = await createClient()

  const { data: lastEntry, error: lastEntryError } =
    await supabase
      .from("competition_entries")
      .select("sort_order")
      .eq("competition_id", competitionId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()

  if (lastEntryError) throw new Error(lastEntryError.message)

  const firstSortOrder = (lastEntry?.sort_order ?? 0) + 1

  const rows = entries.map((entry, index) => ({
    competition_id: competitionId,
    entry_type: entry.entryType,
    display_name: entry.displayName.trim(),
    source: "bulk",
    status: "active",
    sort_order: firstSortOrder + index,
    metadata: {},
  }))

  const { error } = await supabase
    .from("competition_entries")
    .insert(rows)

  if (error) throw new Error(error.message)
}
