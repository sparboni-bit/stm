import { CompetitionStatus } from "../types"

export interface Competition {
  id: string

  organizationId: string

  title: string

  description?: string

  status: CompetitionStatus

  startAt?: string | null

  endAt?: string | null

  settings: Record<string, unknown>

  metadata: Record<string, unknown>

  createdAt: string

  updatedAt: string
}