"use server"

import { revalidatePath } from "next/cache"

import { createCompetitionEntry } from "../repositories/competition-entry.repository"

export async function addCompetitionEntryAction(
  competitionId: string,
  formData: FormData
) {
  const displayName = String(
    formData.get("displayName") || ""
  ).trim()

  if (!displayName) {
    throw new Error("Entry name is required")
  }

  await createCompetitionEntry({
    competitionId,
    displayName,
    entryType: "player",
  })

  revalidatePath(`/competitions/${competitionId}`)
}