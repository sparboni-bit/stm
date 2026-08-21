export interface Court {
  id: string
  competitionId: string
  number: number
  name: string
  available: boolean
  sortOrder: number
  metadata: Record<string, unknown>
}
