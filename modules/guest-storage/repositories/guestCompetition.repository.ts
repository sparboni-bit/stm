import { createGuestTournamentDocument, touchGuestDocument } from "../GuestTournamentDocument"
import { localStorageGuestAdapter } from "../storage/localStorageGuestAdapter"
import type { GuestCompetition, GuestTournamentDocument } from "../types"

export async function listGuestCompetitions(): Promise<GuestCompetition[]> {
  return (await localStorageGuestAdapter.list()).map((item) => item.competition)
}

export async function getGuestTournament(competitionId: string): Promise<GuestTournamentDocument | null> {
  return localStorageGuestAdapter.get(competitionId)
}

export async function createGuestCompetition(input: { title: string; description?: string | null }) {
  const document = createGuestTournamentDocument(input)
  await localStorageGuestAdapter.save(document)
  return document.competition
}

export async function updateGuestCompetition(competitionId: string, patch: Partial<Pick<GuestCompetition, "title" | "description" | "status" | "startAt" | "endAt" | "settings" | "structure" | "metadata">>) {
  const current = await localStorageGuestAdapter.get(competitionId)
  if (!current) throw new Error("Guest competition not found.")
  const document = touchGuestDocument({ ...current, competition: { ...current.competition, ...patch } })
  await localStorageGuestAdapter.save(document)
  return document.competition
}

export async function deleteGuestCompetition(competitionId: string) {
  await localStorageGuestAdapter.remove(competitionId)
}
