export type FairnessPlayer = {
  id: string
  displayName: string
  seed?: number | null
  strength?: number | null
}

export type FairnessMatch = {
  id?: string
  roundNumber: number
  courtNumber?: number
  teamA: readonly [string, string]
  teamB: readonly [string, string]
}

export type FairnessRound = {
  roundNumber: number
  matches: readonly FairnessMatch[]
  restingPlayerIds: readonly string[]
}

export type FairnessSchedule = {
  rounds: readonly FairnessRound[]
}

export type FairnessWeights = {
  participationSpread: number
  sitoutSpread: number
  consecutiveSitout: number
  partnerRepeat: number
  opponentRepeat: number
  seededPartnership: number
  teamStrengthImbalance: number
}

export const DEFAULT_FAIRNESS_WEIGHTS: FairnessWeights = {
  participationSpread: 10_000,
  sitoutSpread: 8_000,
  consecutiveSitout: 2_500,
  partnerRepeat: 1_000,
  opponentRepeat: 200,
  seededPartnership: 1_500,
  teamStrengthImbalance: 25,
}

export type PlayerFairnessSnapshot = {
  playerId: string
  displayName: string
  seed: number | null
  played: number
  rested: number
  consecutiveSitouts: number
  uniquePartners: number
  uniqueOpponents: number
  repeatedPartnerRelations: number
  repeatedOpponentRelations: number
}

export type FairnessMetrics = {
  totalRounds: number
  totalMatches: number

  minMatchesPerPlayer: number
  maxMatchesPerPlayer: number
  participationSpread: number

  minSitoutsPerPlayer: number
  maxSitoutsPerPlayer: number
  sitoutSpread: number
  consecutiveSitouts: number

  repeatedPartnerRelations: number
  repeatedOpponentRelations: number
  maxPartnerCount: number
  maxOpponentCount: number

  seededPartnerships: number
  totalTeamStrengthImbalance: number

  playerStats: readonly PlayerFairnessSnapshot[]
}

export type FairnessPenaltyBreakdown = {
  participation: number
  sitouts: number
  consecutiveSitouts: number
  partners: number
  opponents: number
  seeds: number
  strengthBalance: number
  total: number
}

export type FairnessAnalysis = {
  metrics: FairnessMetrics
  penalties: FairnessPenaltyBreakdown
  score: number
  grade: "excellent" | "good" | "acceptable" | "poor"
}
