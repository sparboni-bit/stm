import type { FairnessMetrics, FairnessSchedule } from "../fairness/types"
export const INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION = "1.0.0"
export type IndividualRotationTemplateRecord = {
  playerCount:number; usableCourtCount:number; seedCount:number; roundCount:number; engineVersion:string
  schedule:FairnessSchedule; metrics:FairnessMetrics
  rawPenalty:number; theoreticalFloor:number; fairnessScore:number
}
