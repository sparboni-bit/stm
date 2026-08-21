"use server"

import { revalidatePath } from "next/cache"
import { createCompetitionEntriesBulk } from "../repositories/competition-entry.repository"

export type BulkCompetitionEntryInput = {
  displayName: string
  entryType: "player" | "team"
}

export async function bulkAddCompetitionEntriesAction(
  competitionId: string,
  entries: BulkCompetitionEntryInput[],
) {
  if (!competitionId) throw new Error("Competition is required.")
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error("No entries to import.")
  }
  if (entries.length > 256) {
    throw new Error("A maximum of 256 entries can be imported at once.")
  }

  const normalized = entries.map((entry, index) => {
    const displayName = entry.displayName.trim()
    if (!displayName) {
      throw new Error(`Row ${index + 1}: entry name is required.`)
    }
    if (entry.entryType !== "player" && entry.entryType !== "team") {
      throw new Error(`Row ${index + 1}: invalid entry type.`)
    }
    return { displayName, entryType: entry.entryType }
  })

  await createCompetitionEntriesBulk(competitionId, normalized)
  revalidatePath(`/competitions/${competitionId}`)
}
