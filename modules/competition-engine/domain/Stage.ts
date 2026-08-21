import {
  StageStatus,
  StageType,
} from "../types"

export interface Stage {
  id: string

  competitionId: string

  order: number

  name: string

  type: StageType

  status: StageStatus

  settings: Record<string, unknown>

  metadata: Record<string, unknown>

  createdAt: string

  updatedAt: string
}