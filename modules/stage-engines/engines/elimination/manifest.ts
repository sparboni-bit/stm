import type { StageEngineManifest } from "../../core/types"

export const eliminationEngineManifest: StageEngineManifest = {
  id: "elimination",
  name: "Single Elimination",
  description:
    "Knockout competition in which the winner of each match advances to the next round.",
  version: "0.1.0",
  defaultSection: "overview",
  capabilities: {
    supportsEntries: true,
    supportsGeneration: true,
    supportsMatches: true,
    supportsRanking: false,
    supportsReports: true,
    supportsCourts: true,
    supportsOptimizer: false,
  },
  workflow: [
    {
      id: "overview",
      label: "Overview",
      description: "Stage information, lifecycle status and engine capabilities.",
      milestone: "overview",
    },
    {
      id: "structure",
      label: "Structure",
      description: "Configure the elimination bracket before generation.",
      milestone: "configure",
    },
    {
      id: "entries",
      label: "Entries",
      description: "Review the competition entries assigned to this stage.",
      milestone: "entries",
    },
    {
      id: "bracket",
      label: "Bracket",
      description: "Generate and inspect the single-elimination bracket.",
      milestone: "generate",
    },
    {
      id: "matches",
      label: "Matches",
      description: "Manage generated matches, courts and results.",
      milestone: "play",
    },
    {
      id: "order-of-play",
      label: "Order of Play",
      description: "View the tournament schedule by day, time and court.",
      milestone: "play",
    },
    {
      id: "reports",
      label: "Reports",
      description: "Print and export bracket and match information.",
      milestone: "results",
    },
  ],
}
