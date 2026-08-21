import type { StageEngineManifest } from "../../core/types"

const overview = {
  id: "overview",
  milestone: "overview",
  label: "Overview",
  description: "Common Stage information and lifecycle status.",
} as const

const structure = {
  id: "structure",
  milestone: "configure",
  label: "Structure",
  description:
    "The Stage Engine will expose its configuration and generation controls here.",
} as const

const entries = {
  id: "entries",
  milestone: "entries",
  label: "Entries",
  description:
    "Entry assignment will be connected here while Competition remains the owner of participant data.",
} as const

const matches = {
  id: "matches",
  milestone: "play",
  label: "Matches",
  description:
    "Generated matches and live match management will be implemented inside this Engine.",
} as const

const ranking = {
  id: "ranking",
  milestone: "results",
  label: "Ranking",
  description:
    "Engine-specific ranking and tie-break rules will be exposed here.",
} as const

const reports = {
  id: "reports",
  milestone: "results",
  label: "Reports",
  description:
    "Print, PDF and export features will use the shared Reports layer.",
} as const

const groups = {
  id: "groups",
  milestone: "generate",
  label: "Groups",
  description:
    "Round Robin group configuration and standings will be implemented here.",
} as const

const bracket = {
  id: "bracket",
  milestone: "generate",
  label: "Bracket",
  description:
    "Elimination bracket generation and visualization will be implemented here.",
} as const

const planner = {
  id: "planner",
  milestone: "configure",
  label: "Planner",
  description:
    "The Individual Rotation planner and optimizer will be implemented here.",
} as const

const play = {
  id: "play",
  milestone: "play",
  label: "Play",
  description:
    "Live rounds, court assignment, scoring and timer controls will be implemented here.",
} as const

const fairness = {
  id: "fairness",
  milestone: "results",
  label: "Fairness",
  description:
    "Partner, opponent and participation distribution analysis will be implemented here.",
} as const

const commonCapabilities = {
  supportsEntries: true,
  supportsGeneration: true,
  supportsMatches: true,
  supportsReports: true,
  supportsCourts: true,
} as const

export const foundationEngineManifests: readonly StageEngineManifest[] = [
  {
    id: "round_robin",
    name: "Round Robin",
    description: "Group-based competition with ranking support.",
    version: "0.1.0-foundation",
    defaultSection: "overview",
    capabilities: {
      ...commonCapabilities,
      supportsRanking: true,
      supportsOptimizer: false,
    },
    workflow: [
      overview,
      structure,
      entries,
      groups,
      matches,
      ranking,
      reports,
    ],
  },
  {
    id: "elimination",
    name: "Single Elimination",
    description: "Knockout competition managed through a bracket.",
    version: "0.1.0-foundation",
    defaultSection: "overview",
    capabilities: {
      ...commonCapabilities,
      supportsRanking: false,
      supportsOptimizer: false,
    },
    workflow: [
      overview,
      structure,
      entries,
      bracket,
      matches,
      reports,
    ],
  },
  {
    id: "consolation",
    name: "Consolation",
    description: "Secondary knockout path for eliminated entries.",
    version: "0.1.0-foundation",
    defaultSection: "overview",
    capabilities: {
      ...commonCapabilities,
      supportsRanking: false,
      supportsOptimizer: false,
    },
    workflow: [
      overview,
      structure,
      entries,
      bracket,
      matches,
      reports,
    ],
  },
  {
    id: "swiss",
    name: "Swiss",
    description: "Round-based pairing with cumulative ranking.",
    version: "0.1.0-foundation",
    defaultSection: "overview",
    capabilities: {
      ...commonCapabilities,
      supportsRanking: true,
      supportsOptimizer: false,
    },
    workflow: [
      overview,
      structure,
      entries,
      matches,
      ranking,
      reports,
    ],
  },
  {
    id: "ladder",
    name: "Ladder",
    description: "Ongoing challenge competition with a dynamic ranking.",
    version: "0.1.0-foundation",
    defaultSection: "overview",
    capabilities: {
      ...commonCapabilities,
      supportsRanking: true,
      supportsOptimizer: false,
    },
    workflow: [
      overview,
      structure,
      entries,
      ranking,
      matches,
      reports,
    ],
  },
  {
    id: "individual_rotation",
    name: "Individual Rotation",
    description:
      "Individual ranking competition based on rotating doubles pairings.",
    version: "0.1.0-foundation",
    defaultSection: "overview",
    capabilities: {
      ...commonCapabilities,
      supportsRanking: true,
      supportsOptimizer: true,
    },
    workflow: [
      overview,
      planner,
      entries,
      play,
      fairness,
      ranking,
      reports,
    ],
  },
]
