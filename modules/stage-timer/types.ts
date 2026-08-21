export type StageRoundTimerStatus =
  | "stopped"
  | "running"
  | "paused"
  | "expired"

export type StageRoundTimer = {
  id: string
  competitionId: string
  stageId: string
  roundNumber: number | null
  status: StageRoundTimerStatus
  durationSeconds: number
  startedAt: string | null
  endsAt: string | null
  pausedRemainingSeconds: number | null
  createdAt: string
  updatedAt: string
}
