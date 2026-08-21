import { GUEST_STORAGE_SCHEMA_VERSION } from "./constants"
import type { GuestCompetition, GuestTournamentDocument } from "./types"

export function createGuestId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  return uuid ? `${prefix}_${uuid}` : `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export function createGuestTournamentDocument(input: {
  title: string
  description?: string | null
}): GuestTournamentDocument {
  const now = new Date().toISOString()
  const competition: GuestCompetition = {
    id: createGuestId("competition"),
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: "draft",
    startAt: null,
    endAt: null,
    settings: {},
    structure: {},
    metadata: { persistence: "guest" },
    createdAt: now,
    updatedAt: now,
  }

  if (!competition.title) throw new Error("Competition title is required.")

  return {
    schemaVersion: GUEST_STORAGE_SCHEMA_VERSION,
    competition,
    entries: [],
    stages: [],
    stageEntries: [],
    courts: [],
    matches: [],
    metadata: {},
    createdAt: now,
    updatedAt: now,
  }
}

export function touchGuestDocument(document: GuestTournamentDocument): GuestTournamentDocument {
  const now = new Date().toISOString()
  return {
    ...document,
    competition: { ...document.competition, updatedAt: now },
    updatedAt: now,
  }
}
