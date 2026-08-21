export const competitionStageTypes = [
  "round_robin",
  "elimination",
  "consolation",
  "swiss",
  "ladder",
  "individual_rotation",
] as const

export type CompetitionStageType =
  (typeof competitionStageTypes)[number]

export const competitionStageStatuses = [
  "draft",
  "configured",
  "generated",
  "running",
  "completed",
] as const

export type CompetitionStageStatus =
  (typeof competitionStageStatuses)[number]

export type CompetitionStage = {
  id: string
  competitionId: string
  name: string
  stageType: CompetitionStageType
  status: CompetitionStageStatus
  sortOrder: number
  settings: Record<string, unknown>
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type CreateCompetitionStageInput = {
  competitionId: string
  name: string
  stageType: CompetitionStageType
}