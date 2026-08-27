"use server"

import { revalidatePath } from "next/cache"

import { importRosterEntriesToStage } from "../repositories/roster-stage-import.repository"

export async function importRosterEntriesToStageAction(
  competitionId: string,
  stageId: string,
  rosterId: string,
  rosterEntryIds: string[],
) {
  if (!competitionId) throw new Error("Event is required.")
  if (!stageId) throw new Error("Stage is required.")
  if (!rosterId) throw new Error("Roster is required.")

  const uniqueIds = [
    ...new Set(
      rosterEntryIds
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ]

  if (uniqueIds.length === 0) {
    throw new Error("Select at least one player.")
  }

  if (uniqueIds.length > 256) {
    throw new Error("A maximum of 256 players can be imported at once.")
  }

  const result = await importRosterEntriesToStage(
    competitionId,
    stageId,
    rosterId,
    uniqueIds,
  )

  revalidatePath(`/competitions/${competitionId}`)
  revalidatePath(`/competitions/${competitionId}/stages/${stageId}`)

  return result
}
