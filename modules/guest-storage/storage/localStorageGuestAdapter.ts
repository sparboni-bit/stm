import { GUEST_STORAGE_KEY, GUEST_STORAGE_SCHEMA_VERSION } from "../constants"
import type { GuestTournamentDocument, GuestTournamentIndex } from "../types"
import type { GuestStorageAdapter } from "./GuestStorageAdapter"

function storage(): Storage {
  if (typeof window === "undefined") {
    throw new Error("Guest storage is only available in the browser.")
  }
  return window.localStorage
}

function readIndex(): GuestTournamentIndex {
  const raw = storage().getItem(GUEST_STORAGE_KEY)
  if (!raw) return { schemaVersion: GUEST_STORAGE_SCHEMA_VERSION, tournaments: [] }

  const parsed = JSON.parse(raw) as GuestTournamentIndex
  if (parsed.schemaVersion !== GUEST_STORAGE_SCHEMA_VERSION || !Array.isArray(parsed.tournaments)) {
    throw new Error("Unsupported guest storage schema.")
  }
  return parsed
}

function writeIndex(index: GuestTournamentIndex): void {
  storage().setItem(GUEST_STORAGE_KEY, JSON.stringify(index))
}

export const localStorageGuestAdapter: GuestStorageAdapter = {
  async list() {
    return readIndex().tournaments.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },
  async get(competitionId) {
    return readIndex().tournaments.find((item) => item.competition.id === competitionId) ?? null
  },
  async save(document) {
    const index = readIndex()
    const next = index.tournaments.filter((item) => item.competition.id !== document.competition.id)
    next.push(document)
    writeIndex({ ...index, tournaments: next })
  },
  async remove(competitionId) {
    const index = readIndex()
    writeIndex({ ...index, tournaments: index.tournaments.filter((item) => item.competition.id !== competitionId) })
  },
  async clear() {
    storage().removeItem(GUEST_STORAGE_KEY)
  },
}
