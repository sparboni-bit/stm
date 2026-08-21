export const CompetitionSection = {
  Overview: "overview",
  Configuration: "configuration",
  Entries: "entries",
  Structure: "structure",
  Generate: "generate",
  Play: "play",
  Reports: "reports",
} as const

export type CompetitionSection =
  (typeof CompetitionSection)[keyof typeof CompetitionSection]