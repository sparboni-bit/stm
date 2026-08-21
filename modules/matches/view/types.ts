import type { MatchSide, MatchSlot, MatchStatus } from "../types"

export type MatchParticipantMemberView = {
  entryId: string
  displayName: string
  seed: number | null
}

export type MatchParticipantView = {
  entryId: string | null
  displayName: string
  seed: number | null
  slotType: MatchSlot["type"]
  sourceMatchId: string | null
  members?: MatchParticipantMemberView[]
}

export type MatchDetailView = {
  id: string
  competitionId: string
  stageId: string
  matchNumber: number
  visibleMatchNumber: number | null
  roundNumber: number
  matchOrder: number
  matchType: string | null
  groupKey: string | null
  status: MatchStatus
  courtId: string | null
  courtLabel: string | null
  sideA: MatchParticipantView
  sideB: MatchParticipantView
  score: Record<string, unknown>
  winnerSide: MatchSide | null
  loserSide: MatchSide | null
  isBye: boolean
  finishType: string
  retiredSide: MatchSide | null
  nextMatchId: string | null
  nextMatchSlot: MatchSide | null
  scheduledAt: string | null
  startedAt: string | null
  completedAt: string | null
  metadata: Record<string, unknown>
}
