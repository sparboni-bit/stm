import type { FairnessSchedule } from "../fairness"

export type IndividualRotationSchedule = {
  id: string
  roundCount: number
  matchCount: number
  fairnessRawPenalty: number
  schedule: FairnessSchedule
}
