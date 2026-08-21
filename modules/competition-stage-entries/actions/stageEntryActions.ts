"use server"

import { revalidatePath } from "next/cache"

import {
  assignCompetitionStageEntries,
  removeAllCompetitionStageEntries,
  removeCompetitionStageEntry,
  setCompetitionStageEntrySeed,
} from "../repositories/competition-stage-entry.repository"

function path(
  competitionId: string,
  stageId: string,
) {
  return `/competitions/${competitionId}/stages/${stageId}`
}

export async function assignStageEntriesAction(
  competitionId: string,
  stageId: string,
  entryIds: string[],
) {
  await assignCompetitionStageEntries(
    competitionId,
    stageId,
    entryIds,
  )

  revalidatePath(
    path(competitionId, stageId),
  )
}

export async function removeStageEntryAction(
  competitionId: string,
  stageId: string,
  stageEntryId: string,
) {
  await removeCompetitionStageEntry(
    stageEntryId,
  )

  revalidatePath(
    path(competitionId, stageId),
  )
}

export async function removeAllStageEntriesAction(
  competitionId: string,
  stageId: string,
) {
  await removeAllCompetitionStageEntries(
    stageId,
  )

  revalidatePath(
    path(competitionId, stageId),
  )
}

export async function setStageEntrySeedAction(
  competitionId: string,
  stageId: string,
  stageEntryId: string,
  seed: number | null,
) {
  if (
    seed !== null &&
    (!Number.isInteger(seed) || seed < 1)
  ) {
    throw new Error(
      "Seed must be a positive integer.",
    )
  }

  await setCompetitionStageEntrySeed(
    stageId,
    stageEntryId,
    seed,
  )

  revalidatePath(
    path(competitionId, stageId),
  )
}

export type StageEntrySeedUpdate = {
  stageEntryId: string
  seed: number | null
}

export async function setStageEntrySeedsAction(
  competitionId: string,
  stageId: string,
  updates: StageEntrySeedUpdate[],
) {
  const seen = new Set<number>()

  for (const update of updates) {
    if (
      update.seed !== null &&
      (!Number.isInteger(update.seed) ||
        update.seed < 1)
    ) {
      throw new Error(
        "Seeds must be positive integers.",
      )
    }

    if (update.seed !== null) {
      if (seen.has(update.seed)) {
        throw new Error(
          `Seed ${update.seed} is assigned more than once.`,
        )
      }

      seen.add(update.seed)
    }
  }

  for (const update of updates) {
    await setCompetitionStageEntrySeed(
      stageId,
      update.stageEntryId,
      update.seed,
    )
  }

  revalidatePath(
    path(competitionId, stageId),
  )
}
