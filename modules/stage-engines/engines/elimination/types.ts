export type EliminationBracketSize =
  | 2
  | 4
  | 8
  | 16
  | 32
  | 64

export type EliminationSeedingMode = "none" | "manual"

export type EliminationEngineSettings = {
  bracketSize: EliminationBracketSize | null
  seedingMode: EliminationSeedingMode
  thirdPlaceMatch: boolean
}
