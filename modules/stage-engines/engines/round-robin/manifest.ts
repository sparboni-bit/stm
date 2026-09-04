import type { StageEngineManifest } from "../../core/types"

export const roundRobinEngineManifest: StageEngineManifest = {
  id: "round_robin",
  name: "Round Robin",
  description: "Group-based competition with ranking support.",
  version: "1.0.0",
  defaultSection: "structure",
  capabilities: {
    supportsEntries: true,
    supportsGeneration: true,
    supportsMatches: true,
    supportsReports: true,
    supportsCourts: true,
    supportsRanking: true,
    supportsOptimizer: false,
  },
  workflow: [
    {
      id: "structure",
      milestone: "configure",
      label: "Setup",
      description: "Configure the Round Robin Stage.",
    },
    {
      id: "entries",
      milestone: "entries",
      label: "Players",
      description: "Select the players taking part in this stage.",
    },
    {
      id: "groups",
      milestone: "generate",
      label: "Groups",
      description: "Review group assignment before generation.",
    },
    {
      id: "matches",
      milestone: "play",
      label: "Matches",
      description: "Play and manage generated Round Robin matches.",
    },
    {
      id: "ranking",
      milestone: "play",
      label: "Standings",
      description: "Group standings calculated from completed matches.",
    },
  ],
}
