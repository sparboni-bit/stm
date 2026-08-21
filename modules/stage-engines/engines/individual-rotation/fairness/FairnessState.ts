import type {
  FairnessMatch,
  FairnessPlayer,
  FairnessRound,
} from "./types"

type MutablePlayerState = {
  played: number
  rested: number
  lastRestRound: number | null
  consecutiveSitouts: number
  partners: Map<string, number>
  opponents: Map<string, number>
}

function increment(
  map: Map<string, number>,
  key: string,
) {
  map.set(key, (map.get(key) ?? 0) + 1)
}

export class FairnessState {
  private readonly playersById = new Map<
    string,
    FairnessPlayer
  >()

  private readonly stats = new Map<
    string,
    MutablePlayerState
  >()

  constructor(players: readonly FairnessPlayer[]) {
    for (const player of players) {
      this.playersById.set(player.id, player)
      this.stats.set(player.id, {
        played: 0,
        rested: 0,
        lastRestRound: null,
        consecutiveSitouts: 0,
        partners: new Map(),
        opponents: new Map(),
      })
    }
  }

  getPlayer(playerId: string): FairnessPlayer {
    const player = this.playersById.get(playerId)

    if (!player) {
      throw new Error(
        `Unknown fairness player: ${playerId}`,
      )
    }

    return player
  }

  getPlayerIds(): string[] {
    return [...this.playersById.keys()]
  }

  getPlayed(playerId: string): number {
    return this.getStats(playerId).played
  }

  getRested(playerId: string): number {
    return this.getStats(playerId).rested
  }

  getConsecutiveSitouts(playerId: string): number {
    return this.getStats(playerId).consecutiveSitouts
  }

  getPartnerCount(
    playerAId: string,
    playerBId: string,
  ): number {
    return (
      this.getStats(playerAId).partners.get(playerBId) ??
      0
    )
  }

  getOpponentCount(
    playerAId: string,
    playerBId: string,
  ): number {
    return (
      this.getStats(playerAId).opponents.get(playerBId) ??
      0
    )
  }

  applySchedule(
    rounds: readonly FairnessRound[],
  ): void {
    for (const round of [...rounds].sort(
      (a, b) => a.roundNumber - b.roundNumber,
    )) {
      this.applyRound(round)
    }
  }

  applyRound(round: FairnessRound): void {
    const active = new Set<string>()

    for (const match of round.matches) {
      this.applyMatch(match)

      for (const playerId of [
        ...match.teamA,
        ...match.teamB,
      ]) {
        active.add(playerId)
      }
    }

    const explicitResting = new Set(
      round.restingPlayerIds,
    )

    for (const playerId of this.getPlayerIds()) {
      if (
        !active.has(playerId) &&
        explicitResting.has(playerId)
      ) {
        const stat = this.getStats(playerId)
        stat.rested += 1

        if (
          stat.lastRestRound ===
          round.roundNumber - 1
        ) {
          stat.consecutiveSitouts += 1
        }

        stat.lastRestRound = round.roundNumber
      }
    }
  }

  getSnapshot() {
    return this.getPlayerIds().map((playerId) => {
      const player = this.getPlayer(playerId)
      const stat = this.getStats(playerId)

      return {
        playerId,
        displayName: player.displayName,
        seed: player.seed ?? null,
        played: stat.played,
        rested: stat.rested,
        consecutiveSitouts:
          stat.consecutiveSitouts,
        uniquePartners: stat.partners.size,
        uniqueOpponents: stat.opponents.size,
        repeatedPartnerRelations:
          repeatedRelationPenaltyUnits(
            stat.partners,
          ),
        repeatedOpponentRelations:
          repeatedRelationPenaltyUnits(
            stat.opponents,
          ),
      }
    })
  }

  getPartnerMaps(): readonly Map<string, number>[] {
    return this.getPlayerIds().map(
      (id) => this.getStats(id).partners,
    )
  }

  getOpponentMaps(): readonly Map<string, number>[] {
    return this.getPlayerIds().map(
      (id) => this.getStats(id).opponents,
    )
  }

  private applyMatch(match: FairnessMatch): void {
    const [a1, a2] = match.teamA
    const [b1, b2] = match.teamB

    for (const playerId of [a1, a2, b1, b2]) {
      this.getStats(playerId).played += 1
    }

    increment(this.getStats(a1).partners, a2)
    increment(this.getStats(a2).partners, a1)
    increment(this.getStats(b1).partners, b2)
    increment(this.getStats(b2).partners, b1)

    for (const [left, right] of [
      [a1, b1],
      [a1, b2],
      [a2, b1],
      [a2, b2],
    ] as const) {
      increment(this.getStats(left).opponents, right)
      increment(this.getStats(right).opponents, left)
    }
  }

  private getStats(
    playerId: string,
  ): MutablePlayerState {
    const stat = this.stats.get(playerId)

    if (!stat) {
      throw new Error(
        `Missing fairness stats: ${playerId}`,
      )
    }

    return stat
  }
}

export function progressiveRepeatPenalty(
  count: number,
): number {
  if (count <= 1) return 0
  const repeats = count - 1
  return repeats * repeats
}

export function repeatedRelationPenaltyUnits(
  map: Map<string, number>,
): number {
  let total = 0

  for (const count of map.values()) {
    total += progressiveRepeatPenalty(count)
  }

  return total
}
