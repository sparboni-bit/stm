import type { StageEngineManifest } from "../../core/types"

export const eliminationEngineManifest: StageEngineManifest = {
  id: "elimination",
  name: "Single Elimination",
  description:
    "Knockout competition in which the winner of each match advances to the next round.",
  version: "0.1.0",
  defaultSection: "structure",
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
      id: "structure",
      label: "Structure",
      description: "Configure the elimination bracket before generation.",
      milestone: "configure",
    },
    {
      id: "entries",
      label: "Players",
      description: "Select the players taking part in this stage.",
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
  ],
}
