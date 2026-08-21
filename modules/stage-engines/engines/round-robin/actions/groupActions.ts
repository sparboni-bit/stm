"use server"

import { revalidatePath } from "next/cache"

import { listCompetitionEntries } from "@/modules/competition-entries/repositories/competition-entry.repository"
import {
  listCompetitionStageEntries,
  setCompetitionStageEntryMetadata,
} from "@/modules/competition-stage-entries/repositories/competition-stage-entry.repository"
import { getCompetitionStage } from "@/modules/competition-stages/repositories/competition-stage.repository"

export type RoundRobinGroupEntryView = {
  stageEntryId: string
  competitionEntryId: string
  displayName: string
  seed: number | null
  sortOrder: number
}

export type RoundRobinGroupView = {
  key: string
  name: string
  entries: RoundRobinGroupEntryView[]
}

function readGroupCount(settings: Record<string, unknown>) {
  const value = settings.groupCount

  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 4
  ) {
    throw new Error(
      "Configure the Round Robin group count before assigning groups.",
    )
  }

  return value
}

function groupKeys(groupCount: number) {
  return Array.from(
    { length: groupCount },
    (_, index) => String.fromCharCode(65 + index),
  )
}

function snakeGroupIndex(position: number, groupCount: number) {
  const row = Math.floor(position / groupCount)
  const column = position % groupCount

  return row % 2 === 0
    ? column
    : groupCount - 1 - column
}

async function requireRoundRobinStage(stageId: string) {
  const stage = await getCompetitionStage(stageId)

  if (!stage) {
    throw new Error("Competition Stage not found.")
  }

  if (stage.stageType !== "round_robin") {
    throw new Error(
      "This action is only available for Round Robin.",
    )
  }

  return stage
}

export async function assignRoundRobinGroupsAction(
  stageId: string,
) {
  const stage = await requireRoundRobinStage(stageId)

  if (
    stage.status !== "draft" &&
    stage.status !== "configured"
  ) {
    throw new Error(
      "Groups can only be assigned before Stage generation.",
    )
  }

  const groupCount = readGroupCount(stage.settings)
  const stageEntries =
    (await listCompetitionStageEntries(stage.id))
      .filter((entry) => entry.status === "active")

  if (stageEntries.length < 2) {
    throw new Error(
      "Add at least two active Stage Entries before assigning groups.",
    )
  }

  if (groupCount > stageEntries.length) {
    throw new Error(
      "The number of groups cannot exceed the number of active entries.",
    )
  }

  const keys = groupKeys(groupCount)
  const sizes = Array.from(
    { length: groupCount },
    () => 0,
  )

  const seeded = stageEntries
    .filter(
      (entry) =>
        typeof entry.seed === "number" &&
        entry.seed > 0,
    )
    .sort(
      (a, b) =>
        (a.seed ?? Number.MAX_SAFE_INTEGER) -
          (b.seed ?? Number.MAX_SAFE_INTEGER) ||
        a.sort_order - b.sort_order,
    )

  const unseeded = stageEntries
    .filter(
      (entry) =>
        typeof entry.seed !== "number" ||
        entry.seed <= 0,
    )
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order ||
        a.created_at.localeCompare(b.created_at),
    )

  const assignments = new Map<string, string>()

  seeded.forEach((entry, index) => {
    const groupIndex =
      snakeGroupIndex(index, groupCount)

    assignments.set(
      entry.id,
      keys[groupIndex],
    )
    sizes[groupIndex] += 1
  })

  for (const entry of unseeded) {
    let targetIndex = 0

    for (let index = 1; index < sizes.length; index += 1) {
      if (sizes[index] < sizes[targetIndex]) {
        targetIndex = index
      }
    }

    assignments.set(
      entry.id,
      keys[targetIndex],
    )
    sizes[targetIndex] += 1
  }

  for (const entry of stageEntries) {
    const groupKey = assignments.get(entry.id)

    if (!groupKey) {
      throw new Error(
        `Unable to assign Stage Entry ${entry.id}.`,
      )
    }

    await setCompetitionStageEntryMetadata(
      stage.id,
      entry.id,
      {
        ...(entry.metadata ?? {}),
        groupKey,
      },
    )
  }

  revalidatePath(
    `/competitions/${stage.competitionId}/stages/${stage.id}`,
  )

  return {
    success: true as const,
    groupCount,
    entryCount: stageEntries.length,
    sizes,
  }
}

export async function getRoundRobinGroupsAction(
  stageId: string,
): Promise<RoundRobinGroupView[]> {
  const stage = await requireRoundRobinStage(stageId)
  const groupCount = readGroupCount(stage.settings)

  const [stageEntries, competitionEntries] =
    await Promise.all([
      listCompetitionStageEntries(stage.id),
      listCompetitionEntries(stage.competitionId),
    ])

  const names = new Map(
    competitionEntries.map((entry) => [
      entry.id,
      entry.display_name,
    ]),
  )

  const groups = groupKeys(groupCount).map(
    (key) => ({
      key,
      name: `Group ${key}`,
      entries: [] as RoundRobinGroupEntryView[],
    }),
  )

  const groupByKey = new Map(
    groups.map((group) => [group.key, group]),
  )

  for (const entry of stageEntries) {
    if (entry.status !== "active") {
      continue
    }

    const groupKey =
      typeof entry.metadata?.groupKey === "string"
        ? entry.metadata.groupKey
        : null

    if (!groupKey) {
      continue
    }

    const group = groupByKey.get(groupKey)

    if (!group) {
      continue
    }

    group.entries.push({
      stageEntryId: entry.id,
      competitionEntryId:
        entry.competition_entry_id,
      displayName:
        names.get(entry.competition_entry_id) ??
        "Unknown entry",
      seed: entry.seed,
      sortOrder: entry.sort_order,
    })
  }

  for (const group of groups) {
    group.entries.sort(
      (a, b) =>
        (a.seed ?? Number.MAX_SAFE_INTEGER) -
          (b.seed ?? Number.MAX_SAFE_INTEGER) ||
        a.sortOrder - b.sortOrder,
    )
  }

  return groups
}


export async function swapRoundRobinGroupEntriesAction(
  stageId: string,
  firstStageEntryId: string,
  secondStageEntryId: string,
) {
  const stage = await requireRoundRobinStage(stageId)

  if (
    stage.status !== "draft" &&
    stage.status !== "configured"
  ) {
    throw new Error(
      "Players can only be swapped before Stage generation.",
    )
  }

  if (
    !firstStageEntryId ||
    !secondStageEntryId ||
    firstStageEntryId === secondStageEntryId
  ) {
    throw new Error("Select two different players.")
  }

  const stageEntries =
    await listCompetitionStageEntries(stage.id)

  const first = stageEntries.find(
    (entry) => entry.id === firstStageEntryId,
  )
  const second = stageEntries.find(
    (entry) => entry.id === secondStageEntryId,
  )

  if (!first || !second) {
    throw new Error(
      "One or both selected Stage Entries no longer exist.",
    )
  }

  if (
    first.status !== "active" ||
    second.status !== "active"
  ) {
    throw new Error(
      "Only active Stage Entries can be swapped.",
    )
  }

  const firstGroupKey =
    typeof first.metadata?.groupKey === "string"
      ? first.metadata.groupKey
      : null
  const secondGroupKey =
    typeof second.metadata?.groupKey === "string"
      ? second.metadata.groupKey
      : null

  if (!firstGroupKey || !secondGroupKey) {
    throw new Error(
      "Both players must already be assigned to a group.",
    )
  }

  if (firstGroupKey === secondGroupKey) {
    throw new Error(
      "Select players from two different groups.",
    )
  }

  await setCompetitionStageEntryMetadata(
    stage.id,
    first.id,
    {
      ...(first.metadata ?? {}),
      groupKey: secondGroupKey,
      groupAssignmentEdited: true,
    },
  )

  try {
    await setCompetitionStageEntryMetadata(
      stage.id,
      second.id,
      {
        ...(second.metadata ?? {}),
        groupKey: firstGroupKey,
        groupAssignmentEdited: true,
      },
    )
  } catch (error) {
    // Best-effort rollback so a failed second update does not leave
    // the group sizes changed.
    await setCompetitionStageEntryMetadata(
      stage.id,
      first.id,
      first.metadata ?? {},
    )

    throw error
  }

  revalidatePath(
    `/competitions/${stage.competitionId}/stages/${stage.id}`,
  )

  return {
    success: true as const,
    firstGroupKey: secondGroupKey,
    secondGroupKey: firstGroupKey,
  }
}
