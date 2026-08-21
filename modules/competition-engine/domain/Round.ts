export interface Round {
  id: string

  stageId: string

  number: number

  name: string

  metadata: Record<string, unknown>
}