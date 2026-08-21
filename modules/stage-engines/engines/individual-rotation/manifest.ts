import type { StageEngineManifest } from "../../core/types"

export const individualRotationEngineManifest: StageEngineManifest = {
  id: "individual_rotation",
  name: "Individual Rotation",
  description:
    "Individual ranking competition based on rotating doubles pairings optimized for participation, partner and opponent fairness.",
  version: "0.1.0",
  defaultSection: "overview",
  capabilities: {
    supportsEntries: true,
    supportsGeneration: true,
    supportsMatches: true,
    supportsRanking: true,
    supportsReports: true,
    supportsCourts: true,
    supportsOptimizer: true,
  },
  workflow: [
    {
      id: "overview",
      label: "Overview",
      description:
        "Stage information, lifecycle status and Individual Rotation capabilities.",
      milestone: "overview",
    },
    {
      id: "entries",
      label: "Entries",
      description:
        "Assign individual players to this Stage and define Stage-specific seeds.",
      milestone: "entries",
    },
    {
      id: "planner",
      label: "Planner",
      description:
        "Configure courts, timing and round targets, then select the rotation schedule.",
      milestone: "configure",
    },
    {
      id: "fairness",
      label: "Fairness",
      description:
        "Preview the selected schedule before generation, then audit the generated schedule.",
      milestone: "generate",
    },
    {
      id: "play",
      label: "Play",
      description:
        "Run generated rounds, manage courts and enter match results.",
      milestone: "play",
    },
    {
      id: "ranking",
      label: "Ranking",
      description:
        "View the individual standings calculated from completed doubles matches.",
      milestone: "play",
    },
    {
      id: "reports",
      label: "Reports",
      description:
        "Print and export rounds, standings and fairness information.",
      milestone: "play",
    },
  ]
}
