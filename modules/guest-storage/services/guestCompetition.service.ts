import type {
  CompetitionEntry,
  CompetitionEntryType,
} from "@/modules/competition-entries/types"
import type {
  CompetitionStage,
  CompetitionStageType,
} from "@/modules/competition-stages/types"

import {
  createGuestId,
  localStorageGuestAdapter,
  touchGuestDocument,
} from "../index"
import type {
  GuestCompetition,
  GuestTournamentDocument,
} from "../types"

function requireDocument(
  document: GuestTournamentDocument | null,
): GuestTournamentDocument {
  if (!document) {
    throw new Error("Guest competition not found.")
  }
  return document
}

export async function getGuestCompetitionWorkspace(
  competitionId: string,
): Promise<GuestTournamentDocument | null> {
  return localStorageGuestAdapter.get(competitionId)
}

export async function listGuestCompetitionWorkspaces(): Promise<
  GuestTournamentDocument[]
> {
  return localStorageGuestAdapter.list()
}

export async function addGuestCompetitionEntry(input: {
  competitionId: string
  displayName: string
  entryType?: CompetitionEntryType
}): Promise<CompetitionEntry> {
  const displayName = input.displayName.trim()
  if (!displayName) {
    throw new Error("Entry name is required.")
  }
  if ((input.entryType ?? "player") !== "player") {
    throw new Error("Guest roster accepts players only. Use createGuestTeam() to build doubles teams.")
  }

  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )
  const now = new Date().toISOString()
  const nextSortOrder =
    document.entries.reduce(
      (max, entry) => Math.max(max, entry.sort_order),
      0,
    ) + 1

  const entry: CompetitionEntry = {
    id: createGuestId("entry"),
    competition_id: input.competitionId,
    player_id: null,
    team_id: null,
    entry_type: input.entryType ?? "player",
    display_name: displayName,
    source: "guest",
    status: "active",
    sort_order: nextSortOrder,
    metadata: { persistence: "guest" },
    created_at: now,
    updated_at: now,
  }

  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      entries: [...document.entries, entry],
    }),
  )

  return entry
}

export async function bulkAddGuestCompetitionEntries(input: {
  competitionId: string
  entries: Array<{
    displayName: string
    entryType: CompetitionEntryType
  }>
}): Promise<CompetitionEntry[]> {
  if (input.entries.length === 0) return []
  if (input.entries.length > 256) {
    throw new Error("A maximum of 256 entries can be imported at once.")
  }

  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )
  const now = new Date().toISOString()
  const firstSortOrder =
    document.entries.reduce(
      (max, entry) => Math.max(max, entry.sort_order),
      0,
    ) + 1

  const entries = input.entries.map((item, index): CompetitionEntry => {
    const displayName = item.displayName.trim()
    if (!displayName) {
      throw new Error(`Row ${index + 1}: entry name is required.`)
    }
    if (item.entryType !== "player") {
      throw new Error(`Row ${index + 1}: Guest bulk import accepts players only.`)
    }
    return {
      id: createGuestId("entry"),
      competition_id: input.competitionId,
      player_id: null,
      team_id: null,
      entry_type: item.entryType,
      display_name: displayName,
      source: "guest_bulk",
      status: "active",
      sort_order: firstSortOrder + index,
      metadata: { persistence: "guest" },
      created_at: now,
      updated_at: now,
    }
  })

  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      entries: [...document.entries, ...entries],
    }),
  )

  return entries
}

function readTeamPlayerEntryIds(
  entry: CompetitionEntry,
): [string, string] | null {
  const value = entry.metadata?.playerEntryIds
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    typeof value[0] !== "string" ||
    typeof value[1] !== "string"
  ) {
    return null
  }
  return [value[0], value[1]]
}

function isEntryUsedInStage(
  document: GuestTournamentDocument,
  entryId: string,
) {
  return document.stageEntries.some(
    (stageEntry) =>
      stageEntry.competition_entry_id === entryId &&
      stageEntry.status === "active",
  )
}

export async function renameGuestCompetitionEntry(input: {
  competitionId: string
  entryId: string
  displayName: string
}): Promise<void> {
  const displayName = input.displayName.trim()
  if (!displayName) throw new Error("Entry name is required.")

  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )
  const now = new Date().toISOString()
  const current = document.entries.find((entry) => entry.id === input.entryId)
  if (!current) throw new Error("Guest entry not found.")
  if (current.entry_type !== "player") {
    throw new Error("Teams are named automatically from their players.")
  }

  const renamedEntries = document.entries.map((entry) =>
    entry.id === input.entryId
      ? { ...entry, display_name: displayName, updated_at: now }
      : entry,
  )

  const playerNames = new Map(
    renamedEntries
      .filter((entry) => entry.entry_type === "player")
      .map((entry) => [entry.id, entry.display_name]),
  )

  const entries = renamedEntries.map((entry) => {
    if (entry.entry_type !== "team") return entry
    const ids = readTeamPlayerEntryIds(entry)
    if (!ids || !ids.includes(input.entryId)) return entry

    const firstName = playerNames.get(ids[0])
    const secondName = playerNames.get(ids[1])
    if (!firstName || !secondName) return entry

    return {
      ...entry,
      display_name: `${firstName} / ${secondName}`,
      updated_at: now,
    }
  })

  await localStorageGuestAdapter.save(
    touchGuestDocument({ ...document, entries }),
  )
}

export async function removeGuestCompetitionEntry(input: {
  competitionId: string
  entryId: string
}): Promise<void> {
  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )

  const entry = document.entries.find((item) => item.id === input.entryId)
  if (!entry) throw new Error("Guest entry not found.")
  if (entry.entry_type === "team") {
    throw new Error("Use removeGuestTeam() to remove a doubles team.")
  }

  const linkedTeam = document.entries.find((item) =>
    item.entry_type === "team" &&
    (readTeamPlayerEntryIds(item)?.includes(input.entryId) ?? false),
  )
  if (linkedTeam) {
    throw new Error(
      `This player belongs to team "${linkedTeam.display_name}". Remove the team first.`,
    )
  }

  if (isEntryUsedInStage(document, input.entryId)) {
    throw new Error("This player is already used in a stage. Remove it from the stage first.")
  }

  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      entries: document.entries.filter((item) => item.id !== input.entryId),
      stageEntries: document.stageEntries.filter(
        (item) => item.competition_entry_id !== input.entryId,
      ),
    }),
  )
}


export async function clearGuestCompetitionRoster(input: {
  competitionId: string
}): Promise<void> {
  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )

  const referencedEntryIds = new Set(
    document.stageEntries.map((entry) => entry.competition_entry_id),
  )
  const now = new Date().toISOString()

  const entries = document.entries
    .filter((entry) => referencedEntryIds.has(entry.id))
    .map((entry) => ({
      ...entry,
      metadata: {
        ...entry.metadata,
        hiddenFromRoster: true,
      },
      updated_at: now,
    }))

  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      entries,
    }),
  )
}

export async function createGuestTeam(input: {
  competitionId: string
  playerEntryIds: [string, string]
}): Promise<CompetitionEntry> {
  const [firstPlayerId, secondPlayerId] = input.playerEntryIds
  if (firstPlayerId === secondPlayerId) {
    throw new Error("A doubles team requires two different players.")
  }

  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )
  const firstPlayer = document.entries.find((entry) => entry.id === firstPlayerId)
  const secondPlayer = document.entries.find((entry) => entry.id === secondPlayerId)

  if (!firstPlayer || firstPlayer.entry_type !== "player" || firstPlayer.status !== "active") {
    throw new Error("The first selected player is not available.")
  }
  if (!secondPlayer || secondPlayer.entry_type !== "player" || secondPlayer.status !== "active") {
    throw new Error("The second selected player is not available.")
  }

  const usedPlayerIds = new Set<string>()
  for (const entry of document.entries) {
    if (entry.entry_type !== "team" || entry.status !== "active") continue
    readTeamPlayerEntryIds(entry)?.forEach((id) => usedPlayerIds.add(id))
  }
  if (usedPlayerIds.has(firstPlayerId) || usedPlayerIds.has(secondPlayerId)) {
    throw new Error("One of the selected players already belongs to a team.")
  }

  const now = new Date().toISOString()
  const nextSortOrder =
    document.entries.reduce((max, entry) => Math.max(max, entry.sort_order), 0) + 1

  const team: CompetitionEntry = {
    id: createGuestId("entry"),
    competition_id: input.competitionId,
    player_id: null,
    team_id: null,
    entry_type: "team",
    display_name: `${firstPlayer.display_name} / ${secondPlayer.display_name}`,
    source: "guest_team_builder",
    status: "active",
    sort_order: nextSortOrder,
    metadata: {
      persistence: "guest",
      playerEntryIds: [firstPlayerId, secondPlayerId],
    },
    created_at: now,
    updated_at: now,
  }

  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      entries: [...document.entries, team],
    }),
  )
  return team
}

export async function removeGuestTeam(input: {
  competitionId: string
  teamEntryId: string
}): Promise<void> {
  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )
  const team = document.entries.find((entry) => entry.id === input.teamEntryId)
  if (!team || team.entry_type !== "team") {
    throw new Error("Guest team not found.")
  }
  if (isEntryUsedInStage(document, team.id)) {
    throw new Error("This team is already used in a stage. Remove it from the stage first.")
  }

  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      entries: document.entries.filter((entry) => entry.id !== team.id),
      stageEntries: document.stageEntries.filter(
        (entry) => entry.competition_entry_id !== team.id,
      ),
    }),
  )
}

export async function createGuestCompetitionStage(input: {
  competitionId: string
  name: string
  stageType: CompetitionStageType
  playMode?: "singles" | "doubles"
}): Promise<CompetitionStage> {
  const name = input.name.trim()
  if (!name) throw new Error("Stage name is required.")

  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )
  const now = new Date().toISOString()
  const nextSortOrder =
    document.stages.reduce(
      (max, stage) => Math.max(max, stage.sortOrder),
      0,
    ) + 1

  const stage: CompetitionStage = {
    id: createGuestId("stage"),
    competitionId: input.competitionId,
    name,
    stageType: input.stageType,
    status: "draft",
    sortOrder: nextSortOrder,
    settings: {
      playMode:
        input.stageType === "individual_rotation"
          ? "singles"
          : input.playMode ?? "singles",
    },
    metadata: { persistence: "guest" },
    createdAt: now,
    updatedAt: now,
  }

  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      stages: [...document.stages, stage],
    }),
  )

  return stage
}


export async function updateGuestCompetitionStagePlayMode(input: {
  competitionId: string
  stageId: string
  playMode: "singles" | "doubles"
}): Promise<CompetitionStage> {
  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )

  const current = document.stages.find((stage) => stage.id === input.stageId)
  if (!current) throw new Error("Guest stage not found.")
  if (current.stageType === "individual_rotation") {
    throw new Error("Individual Rotation only supports singles.")
  }

  const hasGeneratedMatches = document.matches.some(
    (match) => match.stage_id === input.stageId,
  )
  if (hasGeneratedMatches) {
    throw new Error("Play mode cannot be changed after match generation.")
  }

  if (current.settings?.playMode === input.playMode) return current

  const expectedEntryType = input.playMode === "doubles" ? "team" : "player"
  const compatibleEntryIds = new Set(
    document.entries
      .filter(
        (entry) =>
          entry.status === "active" &&
          entry.entry_type === expectedEntryType,
      )
      .map((entry) => entry.id),
  )

  const now = new Date().toISOString()
  const updated: CompetitionStage = {
    ...current,
    settings: {
      ...current.settings,
      playMode: input.playMode,
    },
    updatedAt: now,
  }

  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      stages: document.stages.map((stage) =>
        stage.id === input.stageId ? updated : stage,
      ),
      // Changing Singles/Doubles invalidates incompatible selections.
      // Keep only entries that belong to the newly selected play mode.
      stageEntries: document.stageEntries.filter(
        (stageEntry) =>
          stageEntry.stage_id !== input.stageId ||
          compatibleEntryIds.has(stageEntry.competition_entry_id),
      ),
    }),
  )

  return updated
}


export async function updateGuestRoundRobinGroupCount(input: {
  competitionId: string
  stageId: string
  groupCount: number
}): Promise<CompetitionStage> {
  if (!Number.isInteger(input.groupCount) || input.groupCount < 1 || input.groupCount > 4) {
    throw new Error("Round Robin group count must be between 1 and 4.")
  }

  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )

  const current = document.stages.find((stage) => stage.id === input.stageId)
  if (!current) throw new Error("Guest stage not found.")
  if (current.stageType !== "round_robin") {
    throw new Error("Group count can only be changed for Round Robin.")
  }

  const hasGeneratedMatches = document.matches.some(
    (match) => match.stage_id === input.stageId,
  )
  if (hasGeneratedMatches) {
    throw new Error("Group count cannot be changed after match generation.")
  }

  const now = new Date().toISOString()
  const updated: CompetitionStage = {
    ...current,
    settings: {
      ...current.settings,
      groupCount: input.groupCount,
    },
    updatedAt: now,
  }

  const stageEntries = document.stageEntries.map((stageEntry) => {
    if (stageEntry.stage_id !== input.stageId) return stageEntry

    // If the number of groups is reduced, keep only the first N protected entries.
    const protectedEntries = document.stageEntries
      .filter(
        (entry) =>
          entry.stage_id === input.stageId &&
          entry.status === "active" &&
          entry.seed !== null,
      )
      .sort((a, b) => a.sort_order - b.sort_order)

    const allowedProtectedIds = new Set(
      protectedEntries.slice(0, input.groupCount).map((entry) => entry.id),
    )

    const nextMetadata = { ...(stageEntry.metadata ?? {}) }
    delete nextMetadata.groupKey

    return {
      ...stageEntry,
      seed:
        stageEntry.seed !== null && !allowedProtectedIds.has(stageEntry.id)
          ? null
          : stageEntry.seed,
      metadata: nextMetadata,
      updated_at: now,
    }
  })

  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      stages: document.stages.map((stage) =>
        stage.id === input.stageId ? updated : stage,
      ),
      stageEntries,
    }),
  )

  return updated
}

export async function configureGuestCompetitionStage(input: {
  competitionId: string
  stageId: string
}): Promise<CompetitionStage> {
  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )
  const current = document.stages.find((stage) => stage.id === input.stageId)
  if (!current) throw new Error("Guest stage not found.")
  if (current.status === "configured") return current
  if (current.status !== "draft") {
    throw new Error("Only a draft stage can be configured.")
  }

  const updated: CompetitionStage = {
    ...current,
    status: "configured",
    updatedAt: new Date().toISOString(),
  }

  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      stages: document.stages.map((stage) =>
        stage.id === input.stageId ? updated : stage,
      ),
    }),
  )

  return updated
}

export async function deleteGuestCompetitionStage(input: {
  competitionId: string
  stageId: string
}): Promise<void> {
  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )
  const stage = document.stages.find((item) => item.id === input.stageId)
  if (!stage) throw new Error("Guest stage not found.")
  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      stages: document.stages.filter((item) => item.id !== input.stageId),
      stageEntries: document.stageEntries.filter(
        (item) => item.stage_id !== input.stageId,
      ),
      matches: document.matches.filter(
        (item) => item.stage_id !== input.stageId,
      ),
    }),
  )
}

export async function updateGuestCompetitionCore(input: {
  competitionId: string
  patch: Partial<
    Pick<
      GuestCompetition,
      | "title"
      | "description"
      | "status"
      | "startAt"
      | "endAt"
      | "settings"
      | "structure"
      | "metadata"
    >
  >
}): Promise<GuestCompetition> {
  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )
  const next = touchGuestDocument({
    ...document,
    competition: { ...document.competition, ...input.patch },
  })
  await localStorageGuestAdapter.save(next)
  return next.competition
}
