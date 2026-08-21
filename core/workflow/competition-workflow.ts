import {
  CompetitionStatus,
  type CompetitionStatus as CompetitionStatusType,
} from "@/core/constants"

export const CompetitionWorkflowSteps = [
  "configuration",
  "entries",
  "structure",
  "generate",
  "play",
  "reports",
] as const

export type CompetitionWorkflowStep =
  (typeof CompetitionWorkflowSteps)[number]

export function getCurrentWorkflowStep(
  status: CompetitionStatusType,
): CompetitionWorkflowStep {
  switch (status) {
    case CompetitionStatus.Draft:
      return "configuration"

    case CompetitionStatus.Configure:
      return "entries"

    case CompetitionStatus.Ready:
      return "structure"

    case CompetitionStatus.Generated:
      return "generate"

    case CompetitionStatus.Running:
      return "play"

    case CompetitionStatus.Completed:
    case CompetitionStatus.Archived:
      return "reports"
  }
}