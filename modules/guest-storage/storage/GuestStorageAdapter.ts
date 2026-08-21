import type { GuestTournamentDocument } from "../types"

export interface GuestStorageAdapter {
  list(): Promise<GuestTournamentDocument[]>
  get(competitionId: string): Promise<GuestTournamentDocument | null>
  save(document: GuestTournamentDocument): Promise<void>
  remove(competitionId: string): Promise<void>
  clear(): Promise<void>
}
