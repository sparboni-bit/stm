import { createClient } from "@/lib/supabase/server"

import type {
  AddRosterEntryInput,
  BulkRosterPairInput,
  CreateRosterInput,
  Roster,
  RosterEntry,
  RosterPair,
  RosterWithEntries,
} from "../types"

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

function nameKey(value: string) {
  return normalizeName(value).toLowerCase()
}

export async function listRosters(
  organizationId: string,
): Promise<Roster[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("rosters")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Roster[]
}

export async function getRoster(
  rosterId: string,
): Promise<RosterWithEntries> {
  const supabase = await createClient()

  const { data: roster, error: rosterError } = await supabase
    .from("rosters")
    .select("*")
    .eq("id", rosterId)
    .single()

  if (rosterError || !roster) {
    throw new Error(rosterError?.message ?? "Roster not found")
  }

  const [
    { data: entries, error: entriesError },
    { data: pairs, error: pairsError },
  ] = await Promise.all([
    supabase
      .from("roster_entries")
      .select("*")
      .eq("roster_id", rosterId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("roster_pairs")
      .select("*")
      .eq("roster_id", rosterId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ])

  if (entriesError) throw new Error(entriesError.message)
  if (pairsError) throw new Error(pairsError.message)

  return {
    ...(roster as Roster),
    entries: (entries ?? []) as RosterEntry[],
    pairs: (pairs ?? []) as RosterPair[],
  }
}

export async function createRoster(
  input: CreateRosterInput,
): Promise<Roster> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("rosters")
    .insert({
      organization_id: input.organizationId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      created_by: input.createdBy,
      metadata: {},
    })
    .select("*")
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create roster")
  }

  return data as Roster
}

export async function renameRoster(
  rosterId: string,
  name: string,
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("rosters")
    .update({
      name: name.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", rosterId)

  if (error) throw new Error(error.message)
}

export async function deleteRoster(
  rosterId: string,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("rosters").delete().eq("id", rosterId)
  if (error) throw new Error(error.message)
}

export async function addRosterEntry(
  input: AddRosterEntryInput,
): Promise<RosterEntry> {
  const supabase = await createClient()

  const { data: lastEntry, error: lastEntryError } = await supabase
    .from("roster_entries")
    .select("sort_order")
    .eq("roster_id", input.rosterId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastEntryError) throw new Error(lastEntryError.message)

  const { data, error } = await supabase
    .from("roster_entries")
    .insert({
      roster_id: input.rosterId,
      display_name: normalizeName(input.displayName),
      sort_order: (lastEntry?.sort_order ?? 0) + 1,
      status: "active",
      metadata: {},
    })
    .select("*")
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to add roster entry")
  }

  return data as RosterEntry
}

export async function addRosterEntriesBulk(
  rosterId: string,
  displayNames: string[],
): Promise<number> {
  const normalizedNames = displayNames.map(normalizeName).filter(Boolean)
  if (normalizedNames.length === 0) return 0

  const supabase = await createClient()

  const { data: lastEntry, error: lastEntryError } = await supabase
    .from("roster_entries")
    .select("sort_order")
    .eq("roster_id", rosterId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastEntryError) throw new Error(lastEntryError.message)

  const firstSortOrder = (lastEntry?.sort_order ?? 0) + 1

  const { error } = await supabase.from("roster_entries").insert(
    normalizedNames.map((displayName, index) => ({
      roster_id: rosterId,
      display_name: displayName,
      sort_order: firstSortOrder + index,
      status: "active",
      metadata: {},
    })),
  )

  if (error) throw new Error(error.message)
  return normalizedNames.length
}

export async function addRosterPairsBulk(
  rosterId: string,
  pairs: BulkRosterPairInput[],
): Promise<{
  playersCreated: number
  pairsCreated: number
  pairsAlreadyPresent: number
}> {
  if (pairs.length === 0) {
    return { playersCreated: 0, pairsCreated: 0, pairsAlreadyPresent: 0 }
  }

  const supabase = await createClient()

  const normalizedPairs = pairs.map((pair, index) => {
    const playerAName = normalizeName(pair.playerAName)
    const playerBName = normalizeName(pair.playerBName)

    if (!playerAName || !playerBName) {
      throw new Error(`Row ${index + 1}: both player names are required.`)
    }

    if (nameKey(playerAName) === nameKey(playerBName)) {
      throw new Error(`Row ${index + 1}: a pair cannot contain the same player twice.`)
    }

    return { playerAName, playerBName }
  })

  const requestedNameByKey = new Map<string, string>()

  for (const pair of normalizedPairs) {
    if (!requestedNameByKey.has(nameKey(pair.playerAName))) {
      requestedNameByKey.set(nameKey(pair.playerAName), pair.playerAName)
    }
    if (!requestedNameByKey.has(nameKey(pair.playerBName))) {
      requestedNameByKey.set(nameKey(pair.playerBName), pair.playerBName)
    }
  }

  const { data: existingEntries, error: existingEntriesError } = await supabase
    .from("roster_entries")
    .select("*")
    .eq("roster_id", rosterId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (existingEntriesError) throw new Error(existingEntriesError.message)

  const playerByKey = new Map<string, RosterEntry>()
  for (const entry of (existingEntries ?? []) as RosterEntry[]) {
    const key = nameKey(entry.display_name)
    if (!playerByKey.has(key)) playerByKey.set(key, entry)
  }

  const missingPlayers = [...requestedNameByKey.entries()]
    .filter(([key]) => !playerByKey.has(key))
    .map(([key, displayName]) => ({ key, displayName }))

  let playersCreated = 0

  if (missingPlayers.length > 0) {
    const { data: lastEntry, error: lastEntryError } = await supabase
      .from("roster_entries")
      .select("sort_order")
      .eq("roster_id", rosterId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastEntryError) throw new Error(lastEntryError.message)

    const firstSortOrder = (lastEntry?.sort_order ?? 0) + 1

    const { data: createdEntries, error: createdEntriesError } = await supabase
      .from("roster_entries")
      .insert(
        missingPlayers.map((player, index) => ({
          roster_id: rosterId,
          display_name: player.displayName,
          sort_order: firstSortOrder + index,
          status: "active",
          metadata: {},
        })),
      )
      .select("*")

    if (createdEntriesError) throw new Error(createdEntriesError.message)

    playersCreated = createdEntries?.length ?? 0
    for (const entry of (createdEntries ?? []) as RosterEntry[]) {
      playerByKey.set(nameKey(entry.display_name), entry)
    }
  }

  const resolvedPairs = normalizedPairs.map((pair) => {
    const playerA = playerByKey.get(nameKey(pair.playerAName))
    const playerB = playerByKey.get(nameKey(pair.playerBName))

    if (!playerA || !playerB) {
      throw new Error("Unable to resolve one or more players for pair creation.")
    }

    return { playerA, playerB }
  })

  const { data: existingPairs, error: existingPairsError } = await supabase
    .from("roster_pairs")
    .select("*")
    .eq("roster_id", rosterId)

  if (existingPairsError) throw new Error(existingPairsError.message)

  const pairKey = (a: string, b: string) => [a, b].sort().join("::")

  const existingPairKeys = new Set(
    ((existingPairs ?? []) as RosterPair[]).map((pair) =>
      pairKey(pair.player_a_entry_id, pair.player_b_entry_id),
    ),
  )

  const uniquePairsToCreate = new Map<
    string,
    { playerA: RosterEntry; playerB: RosterEntry }
  >()

  let pairsAlreadyPresent = 0

  for (const pair of resolvedPairs) {
    const key = pairKey(pair.playerA.id, pair.playerB.id)

    if (existingPairKeys.has(key) || uniquePairsToCreate.has(key)) {
      pairsAlreadyPresent += 1
      continue
    }

    uniquePairsToCreate.set(key, pair)
  }

  let pairsCreated = 0

  if (uniquePairsToCreate.size > 0) {
    const { data: lastPair, error: lastPairError } = await supabase
      .from("roster_pairs")
      .select("sort_order")
      .eq("roster_id", rosterId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastPairError) throw new Error(lastPairError.message)

    const firstPairSortOrder = (lastPair?.sort_order ?? 0) + 1
    const rows = [...uniquePairsToCreate.values()].map((pair, index) => ({
      roster_id: rosterId,
      player_a_entry_id: pair.playerA.id,
      player_b_entry_id: pair.playerB.id,
      sort_order: firstPairSortOrder + index,
      metadata: {},
    }))

    const { error } = await supabase.from("roster_pairs").insert(rows)
    if (error) throw new Error(error.message)

    pairsCreated = rows.length
  }

  return { playersCreated, pairsCreated, pairsAlreadyPresent }
}

export async function renameRosterEntry(
  entryId: string,
  displayName: string,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("roster_entries")
    .update({
      display_name: normalizeName(displayName),
      updated_at: new Date().toISOString(),
    })
    .eq("id", entryId)

  if (error) throw new Error(error.message)
}

export async function removeRosterEntry(
  entryId: string,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("roster_entries").delete().eq("id", entryId)
  if (error) throw new Error(error.message)
}

export async function removeRosterPair(
  pairId: string,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("roster_pairs").delete().eq("id", pairId)
  if (error) throw new Error(error.message)
}


export async function duplicateRoster(
  rosterId: string,
  organizationId: string,
  createdBy: string,
  name: string,
): Promise<Roster> {
  const source = await getRoster(rosterId)

  if (source.organization_id !== organizationId) {
    throw new Error(
      "Roster does not belong to the current organization.",
    )
  }

  const copy = await createRoster({
    organizationId,
    createdBy,
    name,
    description: source.description,
  })

  if (source.entries.length === 0) {
    return copy
  }

  const supabase = await createClient()
  const sourceToCopyId = new Map<string, string>()

  for (const [index, entry] of source.entries.entries()) {
    const { data, error } = await supabase
      .from("roster_entries")
      .insert({
        roster_id: copy.id,
        display_name: entry.display_name,
        sort_order: index + 1,
        status: entry.status,
        metadata: entry.metadata ?? {},
      })
      .select("id")
      .single()

    if (error || !data) {
      await supabase
        .from("rosters")
        .delete()
        .eq("id", copy.id)

      throw new Error(
        error?.message ?? "Unable to duplicate roster.",
      )
    }

    sourceToCopyId.set(entry.id, data.id)
  }

  if (source.pairs.length > 0) {
    const rows = source.pairs
      .map((pair, index) => {
        const playerAEntryId =
          sourceToCopyId.get(pair.player_a_entry_id)

        const playerBEntryId =
          sourceToCopyId.get(pair.player_b_entry_id)

        if (!playerAEntryId || !playerBEntryId) {
          return null
        }

        return {
          roster_id: copy.id,
          player_a_entry_id: playerAEntryId,
          player_b_entry_id: playerBEntryId,
          sort_order: index + 1,
          metadata: pair.metadata ?? {},
        }
      })
      .filter(
        (
          row,
        ): row is {
          roster_id: string
          player_a_entry_id: string
          player_b_entry_id: string
          sort_order: number
          metadata: Record<string, unknown>
        } => row !== null,
      )

    if (rows.length > 0) {
      const { error } = await supabase
        .from("roster_pairs")
        .insert(rows)

      if (error) {
        await supabase
          .from("rosters")
          .delete()
          .eq("id", copy.id)

        throw new Error(error.message)
      }
    }
  }

  return copy
}
