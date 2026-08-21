export const CompetitionStatus = {
  Draft: "draft",
  Configure: "configure",
  Ready: "ready",
  Generated: "generated",
  Running: "running",
  Completed: "completed",
  Archived: "archived",
} as const

export type CompetitionStatus =
  (typeof CompetitionStatus)[keyof typeof CompetitionStatus]