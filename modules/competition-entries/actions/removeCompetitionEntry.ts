"use server"

import { revalidatePath } from "next/cache"

import { removeCompetitionEntry } from "../repositories/competition-entry.repository"

export async function removeCompetitionEntryAction(
  competitionId: string,
  entryId: string
) {
  await removeCompetitionEntry(entryId)

  revalidatePath(`/competitions/${competitionId}`)
}