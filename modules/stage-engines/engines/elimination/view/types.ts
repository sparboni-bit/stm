export type BracketViewParticipant = {
  entryId: string | null
  displayName: string
  seed: number | null
  slotType: "entry" | "winner" | "loser" | "bye" | "tbd"
  sourceMatchId: string | null
}

export type BracketViewScore = {
  valueA: string | null
  valueB: string | null
  sets: Array<{ a: number | null; b: number | null }>
}

export type BracketViewMatch = {
  id: string
  matchNumber: number
  visibleMatchNumber: number | null
  roundNumber: number
  order: number
  status:
  | "pending"
  | "ready"
  | "on_court"
  | "completed"
  | "cancelled"
  sideA: BracketViewParticipant
  sideB: BracketViewParticipant
  score: BracketViewScore
  winnerSide: "A" | "B" | null
  finishType: string
  retiredSide: "A" | "B" | null
  courtLabel: string | null
  isBye: boolean
  nextMatchId: string | null
  nextMatchSlot: "A" | "B" | null
}

export type BracketViewRound = {
  number: number
  name: string
  matches: BracketViewMatch[]
}

export type BracketViewModel = {
  stageId: string
  competitionId: string
  stageName: string
  stageStatus: string
  bracketId: string | null
  bracketSize: number | null
  engineType: string
  rounds: BracketViewRound[]
  matchCount: number
}
