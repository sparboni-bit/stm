import { MatchStatus } from "../types"

export interface Match {
  id: string

  stageId: string

  roundId?: string | null

  entryAId: string

  entryBId: string

  courtId?: string | null

  status: MatchStatus

  scheduledAt?: string | null

  startedAt?: string | null

  completedAt?: string | null

  metadata: Record<string, unknown>
}