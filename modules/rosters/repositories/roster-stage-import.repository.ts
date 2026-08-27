import { createClient } from "@/lib/supabase/server"

type RosterEntryForImport = {
  id: string
  roster_id: string
  display_name: string
  status: string
}

export type ImportRosterEntriesToStageResult = {
  requested: number
  imported: number
  alreadyPresent: number
}

export async function importRosterEntriesToStage(
  competitionId: string,
  stageId: string,
  rosterId: string,
  rosterEntryIds: string[],
): Promise<ImportRosterEntriesToStageResult> {
  const uniqueIds = [...new Set(rosterEntryIds)]

  if (uniqueIds.length === 0) {
    return { requested: 0, imported: 0, alreadyPresent: 0 }
  }

  const supabase = await createClient()

  // Verify that the stage really belongs to the requested competition.
  const { data: stage, error: stageError } = await supabase
    .from("competition_stages")
    .select("id")
    .eq("id", stageId)
    .eq("competition_id", competitionId)
    .maybeSingle()

  if (stageError) throw new Error(stageError.message)
  if (!stage) throw new Error("Stage not found in this event.")

  // Load only active entries from the selected roster.
  const { data: rosterEntries, error: rosterEntriesError } = await supabase
    .from("roster_entries")
    .select("id, roster_id, display_name, status")
    .eq("roster_id", rosterId)
    .eq("status", "active")
    .in("id", uniqueIds)

  if (rosterEntriesError) throw new Error(rosterEntriesError.message)

  const sourceEntries = (rosterEntries ?? []) as RosterEntryForImport[]

  if (sourceEntries.length !== uniqueIds.length) {
    throw new Error(
      "One or more selected players do not belong to the selected roster or are inactive.",
    )
  }

  // Existing event entries imported from these roster players.
  const { data: existingCompetitionEntries, error: existingCompetitionEntriesError } =
    await supabase
      .from("competition_entries")
      .select("id, source_roster_entry_id")
      .eq("competition_id", competitionId)
      .in("source_roster_entry_id", uniqueIds)

  if (existingCompetitionEntriesError) {
    throw new Error(existingCompetitionEntriesError.message)
  }

  const eventEntryByRosterEntry = new Map<string, string>()

  for (const entry of existingCompetitionEntries ?? []) {
    if (entry.source_roster_entry_id) {
      eventEntryByRosterEntry.set(entry.source_roster_entry_id, entry.id)
    }
  }

  // Create only the event entries that do not exist yet.
  const missingSourceEntries = sourceEntries.filter(
    (entry) => !eventEntryByRosterEntry.has(entry.id),
  )

  if (missingSourceEntries.length > 0) {
    const { data: lastEntry, error: lastEntryError } = await supabase
      .from("competition_entries")
      .select("sort_order")
      .eq("competition_id", competitionId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastEntryError) throw new Error(lastEntryError.message)

    const firstSortOrder = (lastEntry?.sort_order ?? 0) + 1

    const rows = missingSourceEntries.map((entry, index) => ({
      competition_id: competitionId,
      entry_type: "player",
      display_name: entry.display_name.trim(),
      source: "roster",
      status: "active",
      sort_order: firstSortOrder + index,
      metadata: {},
      source_roster_id: rosterId,
      source_roster_entry_id: entry.id,
    }))

    const { data: createdEntries, error: createEntriesError } = await supabase
      .from("competition_entries")
      .insert(rows)
      .select("id, source_roster_entry_id")

    if (createEntriesError) throw new Error(createEntriesError.message)

    for (const entry of createdEntries ?? []) {
      if (entry.source_roster_entry_id) {
        eventEntryByRosterEntry.set(entry.source_roster_entry_id, entry.id)
      }
    }
  }

  const competitionEntryIds = uniqueIds.map((sourceId) => {
    const competitionEntryId = eventEntryByRosterEntry.get(sourceId)

    if (!competitionEntryId) {
      throw new Error("Unable to resolve imported player.")
    }

    return competitionEntryId
  })

  // Determine which of those event entries are already assigned to the stage.
  const { data: existingStageEntries, error: existingStageEntriesError } =
    await supabase
      .from("competition_stage_entries")
      .select("competition_entry_id")
      .eq("stage_id", stageId)
      .in("competition_entry_id", competitionEntryIds)

  if (existingStageEntriesError) {
    throw new Error(existingStageEntriesError.message)
  }

  const alreadyAssigned = new Set(
    (existingStageEntries ?? []).map((entry) => entry.competition_entry_id),
  )

  const idsToAssign = competitionEntryIds.filter(
    (entryId) => !alreadyAssigned.has(entryId),
  )

  if (idsToAssign.length > 0) {
    const { data: lastStageEntry, error: lastStageEntryError } = await supabase
      .from("competition_stage_entries")
      .select("sort_order")
      .eq("stage_id", stageId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastStageEntryError) throw new Error(lastStageEntryError.message)

    const firstStageSortOrder = (lastStageEntry?.sort_order ?? 0) + 1

    const stageRows = idsToAssign.map((competitionEntryId, index) => ({
      competition_id: competitionId,
      stage_id: stageId,
      competition_entry_id: competitionEntryId,
      sort_order: firstStageSortOrder + index,
      status: "active",
      metadata: {},
    }))

    const { error: assignError } = await supabase
      .from("competition_stage_entries")
      .upsert(stageRows, {
        onConflict: "stage_id,competition_entry_id",
        ignoreDuplicates: true,
      })

    if (assignError) throw new Error(assignError.message)
  }

  return {
    requested: uniqueIds.length,
    imported: idsToAssign.length,
    alreadyPresent: uniqueIds.length - idsToAssign.length,
  }
}
