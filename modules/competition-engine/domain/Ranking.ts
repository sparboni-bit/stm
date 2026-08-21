export interface Ranking {
  id: string

  stageId: string

  entryId: string

  position: number

  played: number

  won: number

  lost: number

  pointsFor: number

  pointsAgainst: number

  metadata: Record<string, unknown>
}