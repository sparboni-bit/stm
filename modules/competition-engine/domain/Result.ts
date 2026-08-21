import { ResultType } from "../types"

export interface Result {
  id: string

  matchId: string

  type: ResultType

  winnerEntryId?: string | null

  score: Record<string, unknown>

  metadata: Record<string, unknown>

  createdAt: string
}