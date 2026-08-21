"use server"

import { revalidatePath } from "next/cache"

import { renameCompetitionEntry } from "../repositories/competition-entry.repository"

export async function renameCompetitionEntryAction(
  competitionId: string,
  entryId: string,
  displayName: string
) {
  const name = displayName.trim()

  if (!name) {
    throw new Error("Entry name is required")
  }

  await renameCompetitionEntry(entryId, name)

  revalidatePath(`/competitions/${competitionId}`)
}