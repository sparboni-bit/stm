export const StructureType = {
  SingleElimination: "single_elimination",
  RoundRobin: "round_robin",
  RoundRobinBracket: "round_robin_bracket",
  RoundRobinBracketConsolation:
    "round_robin_bracket_consolation",
  IndividualRoundRobin:
    "individual_round_robin",
} as const

export type StructureType =
  (typeof StructureType)[keyof typeof StructureType]