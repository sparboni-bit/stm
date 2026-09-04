import type { StageEngineManifest } from "../../core/types"

export const individualRotationEngineManifest: StageEngineManifest = {
  id: "individual_rotation",
  name: "Individual Rotation",
  description:
    "Individual ranking competition based on rotating doubles pairings optimized for participation, partner and opponent fairness.",
  version: "0.1.0",
  defaultSection: "planner",
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
      id: "planner",
      label: "Stage Setup",
      description:
        "Configure courts, timing and the number of rounds for the Individual Rotation Stage.",
      milestone: "configure",
    },
    {
      id: "entries",
      label: "Select Players",
      description:
        "Choose a Saved Roster, select the Stage players and mark Keep Apart players.",
      milestone: "configure",
    },
    {
      id: "fairness",
      label: "Rotation",
      description:
        "See who plays and who rests in every generated round.",
      milestone: "play",
    },
    {
      id: "play",
      label: "Matches",
      description:
        "Run generated rounds and enter match results.",
      milestone: "play",
    },
    {
      id: "ranking",
      label: "Standings",
      description:
        "View the individual standings calculated from completed doubles matches.",
      milestone: "play",
    },
  ],
}
