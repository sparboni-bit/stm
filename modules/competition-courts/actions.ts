"use server"

import { revalidatePath } from "next/cache"
import {
  createCompetitionCourt,
  deleteCompetitionCourt,
  listCompetitionCourts,
  updateCompetitionCourt,
} from "./repositories"

export async function listCompetitionCourtsAction(
  competitionId: string,
) {
  return listCompetitionCourts(competitionId)
}

export async function createCompetitionCourtAction(
  competitionId: string,
  name: string,
): Promise<void> {
  await createCompetitionCourt({ competitionId, name })
  revalidatePath(`/competitions/${competitionId}`)
}

export async function renameCompetitionCourtAction(
  competitionId: string,
  courtId: string,
  name: string,
): Promise<void> {
  await updateCompetitionCourt({ courtId, name })
  revalidatePath(`/competitions/${competitionId}`)
}

export async function setCompetitionCourtAvailabilityAction(
  competitionId: string,
  courtId: string,
  available: boolean,
): Promise<void> {
  await updateCompetitionCourt({
    courtId,
    status: available ? "available" : "unavailable",
  })
  revalidatePath(`/competitions/${competitionId}`)
}

export async function deleteCompetitionCourtAction(
  competitionId: string,
  courtId: string,
): Promise<void> {
  await deleteCompetitionCourt(courtId)
  revalidatePath(`/competitions/${competitionId}`)
}
