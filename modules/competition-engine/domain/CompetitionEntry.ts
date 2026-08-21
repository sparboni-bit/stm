import { EntryType } from "../types"

export interface CompetitionEntry {
  id: string

  competitionId: string

  type: EntryType

  displayName: string

  seed?: number | null

  referenceId?: string | null

  metadata: Record<string, unknown>

  createdAt: string

  updatedAt: string
}