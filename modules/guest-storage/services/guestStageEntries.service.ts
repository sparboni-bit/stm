import type {
  CompetitionStageEntry,
} from "@/modules/competition-stage-entries/types"

import {
  createGuestId,
  localStorageGuestAdapter,
  touchGuestDocument,
} from "../index"
import type {
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

function requireEditableStage(
  document: GuestTournamentDocument,
  stageId: string,
) {
  const stage = document.stages.find(
    (item) => item.id === stageId,
  )

  if (!stage) {
    throw new Error("Guest stage not found.")
  }

  if (
    stage.status !== "draft" &&
    stage.status !== "configured"
  ) {
    throw new Error(
      "Roster and seeds are locked after stage generation.",
    )
  }

  return stage
}

export async function listGuestStageEntries(
  competitionId: string,
  stageId: string,
): Promise<CompetitionStageEntry[]> {
  const document = requireDocument(
    await localStorageGuestAdapter.get(
      competitionId,
    ),
  )

  return document.stageEntries
    .filter(
      (item) =>
        item.stage_id === stageId,
    )
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order,
    )
}

export async function assignGuestStageEntries(input: {
  competitionId: string
  stageId: string
  entryIds: string[]
}): Promise<void> {
  if (input.entryIds.length === 0) return

  const document = requireDocument(
    await localStorageGuestAdapter.get(
      input.competitionId,
    ),
  )

  requireEditableStage(
    document,
    input.stageId,
  )

  const uniqueIds = [
    ...new Set(input.entryIds),
  ]

  const rosterById = new Map(
    document.entries.map((entry) => [
      entry.id,
      entry,
    ]),
  )

  for (const entryId of uniqueIds) {
    const entry = rosterById.get(entryId)

    if (!entry) {
      throw new Error(
        "One or more tournament participants no longer exist.",
      )
    }

    if (entry.status !== "active") {
      throw new Error(
        `"${entry.display_name}" is not active.`,
      )
    }
  }

  const existingForStage =
    document.stageEntries.filter(
      (item) =>
        item.stage_id === input.stageId,
    )

  const existingIds = new Set(
    existingForStage.map(
      (item) =>
        item.competition_entry_id,
    ),
  )

  const idsToAdd = uniqueIds.filter(
    (id) => !existingIds.has(id),
  )

  if (idsToAdd.length === 0) return

  const assignedCompetitionEntries =
    existingForStage
      .filter(
        (item) => item.status === "active",
      )
      .map((item) =>
        rosterById.get(
          item.competition_entry_id,
        ),
      )
      .filter(
        (entry): entry is NonNullable<
          typeof entry
        > => Boolean(entry),
      )

  const existingTypes = new Set(
    assignedCompetitionEntries.map(
      (entry) => entry.entry_type,
    ),
  )

  const incomingTypes = new Set(
    idsToAdd.map(
      (id) =>
        rosterById.get(id)!.entry_type,
    ),
  )

  if (incomingTypes.size > 1) {
    throw new Error(
      "A stage cannot mix Singles and Doubles.",
    )
  }

  if (
    existingTypes.size > 0 &&
    [...incomingTypes].some(
      (type) => !existingTypes.has(type),
    )
  ) {
    throw new Error(
      "A stage cannot mix Singles and Doubles.",
    )
  }

  const firstSortOrder =
    existingForStage.reduce(
      (max, item) =>
        Math.max(
          max,
          item.sort_order,
        ),
      0,
    ) + 1

  const now = new Date().toISOString()

  const newItems: CompetitionStageEntry[] =
    idsToAdd.map(
      (
        competitionEntryId,
        index,
      ) => ({
        id: createGuestId(
          "stage-entry",
        ),
        competition_id:
          input.competitionId,
        stage_id: input.stageId,
        competition_entry_id:
          competitionEntryId,
        seed: null,
        status: "active",
        sort_order:
          firstSortOrder + index,
        metadata: {
          persistence: "guest",
        },
        created_at: now,
        updated_at: now,
      }),
    )

  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      stageEntries: [
        ...document.stageEntries,
        ...newItems,
      ],
    }),
  )
}

export async function removeGuestStageEntry(input: {
  competitionId: string
  stageId: string
  stageEntryId: string
}): Promise<void> {
  const document = requireDocument(
    await localStorageGuestAdapter.get(
      input.competitionId,
    ),
  )

  requireEditableStage(
    document,
    input.stageId,
  )

  const exists =
    document.stageEntries.some(
      (item) =>
        item.id ===
          input.stageEntryId &&
        item.stage_id ===
          input.stageId,
    )

  if (!exists) {
    throw new Error(
      "Guest stage participant not found.",
    )
  }

  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      stageEntries:
        document.stageEntries.filter(
          (item) =>
            item.id !==
            input.stageEntryId,
        ),
    }),
  )
}

export async function removeAllGuestStageEntries(
  input: {
    competitionId: string
    stageId: string
  },
): Promise<void> {
  const document = requireDocument(
    await localStorageGuestAdapter.get(
      input.competitionId,
    ),
  )

  requireEditableStage(
    document,
    input.stageId,
  )

  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      stageEntries:
        document.stageEntries.filter(
          (item) =>
            item.stage_id !==
            input.stageId,
        ),
    }),
  )
}

export type GuestStageEntrySeedUpdate = {
  stageEntryId: string
  seed: number | null
}

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null
}

export async function setGuestStageEntrySeeds(input: {
  competitionId: string
  stageId: string
  updates: GuestStageEntrySeedUpdate[]
}): Promise<void> {
  const document = requireDocument(
    await localStorageGuestAdapter.get(input.competitionId),
  )
  const stage = requireEditableStage(document, input.stageId)

  const stageEntryIds = new Set(
    document.stageEntries
      .filter((item) => item.stage_id === input.stageId && item.status === "active")
      .map((item) => item.id),
  )

  for (const update of input.updates) {
    if (!stageEntryIds.has(update.stageEntryId)) {
      throw new Error("Guest stage participant not found.")
    }
    if (
      update.seed !== null &&
      (!Number.isInteger(update.seed) || update.seed < 1)
    ) {
      throw new Error("Seed values must be positive integers.")
    }
  }

  const selected = input.updates.filter((item) => item.seed !== null)

  if (stage.stageType === "individual_rotation") {
    if (selected.length > 4) {
      throw new Error("Keep Apart allows a maximum of 4 players.")
    }
  } else if (stage.stageType === "round_robin") {
    const groupCount =
      positiveInteger(stage.settings?.groupCount) ??
      positiveInteger(stage.settings?.groups) ??
      1

    if (selected.length > groupCount) {
      throw new Error(
        `Round Robin allows at most ${groupCount} protected ${groupCount === 1 ? "entry" : "entries"}.`,
      )
    }
  } else if (stage.stageType === "elimination") {
    const values = selected.map((item) => item.seed as number)
    if (new Set(values).size !== values.length) {
      throw new Error("Elimination seed numbers must be unique.")
    }
    const sorted = [...values].sort((x, y) => x - y)
    if (sorted.some((value, index) => value !== index + 1)) {
      throw new Error("Elimination seeds must be consecutive: 1, 2, 3...")
    }
  }

  const updateById = new Map(
    input.updates.map((item) => [item.stageEntryId, item.seed]),
  )
  const now = new Date().toISOString()

  await localStorageGuestAdapter.save(
    touchGuestDocument({
      ...document,
      stageEntries: document.stageEntries.map((item) =>
        item.stage_id === input.stageId && updateById.has(item.id)
          ? {
              ...item,
              seed: updateById.get(item.id) ?? null,
              updated_at: now,
            }
          : item,
      ),
    }),
  )
}
