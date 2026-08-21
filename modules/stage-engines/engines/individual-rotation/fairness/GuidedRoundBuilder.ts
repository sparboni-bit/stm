import { FairnessState } from "./FairnessState"
import type { FairnessMatch, FairnessPlayer, FairnessRound } from "./types"

export type GuidedRoundBuilderOptions = {
  roundNumber: number
  courtCount: number
  history?: readonly FairnessRound[]
  activeSetWidth?: number
  partialBeamWidth?: number
  completeRoundWidth?: number
}

type ActiveSet = {
  activeIds: string[]
  restingIds: string[]
  score: number
  key: string
}

type Partial = {
  remaining: string[]
  matches: FairnessMatch[]
  score: number
  key: string
}

type Complete = {
  round: FairnessRound
  score: number
  key: string
}

export function buildGuidedCandidateRounds(
  players: readonly FairnessPlayer[],
  options: GuidedRoundBuilderOptions,
): FairnessRound[] {
  const {
    roundNumber,
    courtCount,
    history = [],
    activeSetWidth = 24,
    partialBeamWidth = 120,
    completeRoundWidth = 240,
  } = options

  const courts = Math.min(
    courtCount,
    Math.floor(players.length / 4),
  )
  if (courts < 1) return []

  const activeCount = courts * 4
  const ids = players.map((p) => p.id)
  const state = new FairnessState(players)
  state.applySchedule(history)
  const byId = new Map(players.map((p) => [p.id, p]))

  const activeSets: ActiveSet[] = []

  for (const activeIds of combinations(ids, activeCount)) {
    const active = new Set(activeIds)
    const restingIds = ids.filter((id) => !active.has(id))
    const score = participationHeuristic(
      ids,
      active,
      restingIds,
      state,
    )

    insertBounded(
      activeSets,
      {
        activeIds,
        restingIds,
        score,
        key:
          [...activeIds].sort().join(",") +
          "::R:" +
          [...restingIds].sort().join(","),
      },
      activeSetWidth,
      compareScored,
    )
  }

  const complete: Complete[] = []

  for (const activeSet of activeSets) {
    let beam: Partial[] = [{
      remaining: [...activeSet.activeIds],
      matches: [],
      score: activeSet.score,
      key: "",
    }]

    while (
      beam.length > 0 &&
      beam[0].remaining.length > 0
    ) {
      const next: Partial[] = []

      for (const partial of beam) {
        const first = chooseMostConstrained(
          partial.remaining,
          state,
          byId,
        )

        const others = partial.remaining.filter(
          (id) => id !== first,
        )

        for (const trio of combinations(others, 3)) {
          const group = [first, ...trio]

          for (const split of teamSplits(group)) {
            const match: FairnessMatch = {
              roundNumber,
              teamA: split.teamA,
              teamB: split.teamB,
            }

            const used = new Set(group)
            const remaining =
              partial.remaining.filter(
                (id) => !used.has(id),
              )

            const matchScore = matchHeuristic(
              match,
              state,
              byId,
            )

            const matches = [
              ...partial.matches,
              match,
            ]

            insertBounded(
              next,
              {
                remaining,
                matches,
                score:
                  partial.score + matchScore,
                key: partialKey(
                  matches,
                  remaining,
                ),
              },
              partialBeamWidth,
              compareScored,
            )
          }
        }
      }

      beam = dedupePartials(next)
        .sort(compareScored)
        .slice(0, partialBeamWidth)
    }

    for (const partial of beam) {
      if (partial.remaining.length !== 0) {
        continue
      }

      const round: FairnessRound = {
        roundNumber,
        matches: partial.matches.map(
          (match, index) => ({
            ...match,
            courtNumber: index + 1,
          }),
        ),
        restingPlayerIds:
          activeSet.restingIds,
      }

      insertBounded(
        complete,
        {
          round,
          score: partial.score,
          key: roundKey(round),
        },
        completeRoundWidth,
        compareScored,
      )
    }
  }

  return dedupeComplete(complete)
    .sort(compareScored)
    .slice(0, completeRoundWidth)
    .map((x) => x.round)
}

function participationHeuristic(
  allIds: readonly string[],
  active: ReadonlySet<string>,
  resting: readonly string[],
  state: FairnessState,
): number {
  const projectedPlayed = allIds.map(
    (id) =>
      state.getPlayed(id) +
      (active.has(id) ? 1 : 0),
  )

  const projectedRested = allIds.map(
    (id) =>
      state.getRested(id) +
      (active.has(id) ? 0 : 1),
  )

  let consecutive = 0
  for (const id of resting) {
    if (state.getConsecutiveSitouts(id) > 0) {
      consecutive += 1
    }
  }

  return (
    spread(projectedPlayed) * 1_000_000 +
    spread(projectedRested) * 500_000 +
    consecutive * 250_000 +
    projectedPlayed.reduce(
      (sum, value) => sum + value * value,
      0,
    ) * 10
  )
}

function chooseMostConstrained(
  ids: readonly string[],
  state: FairnessState,
  byId: ReadonlyMap<string, FairnessPlayer>,
): string {
  return [...ids].sort((a, b) => {
    const aSeed = seeded(byId.get(a)) ? 1 : 0
    const bSeed = seeded(byId.get(b)) ? 1 : 0
    if (aSeed !== bSeed) return bSeed - aSeed

    const played =
      state.getPlayed(b) - state.getPlayed(a)
    if (played !== 0) return played

    return a.localeCompare(b)
  })[0]
}

function matchHeuristic(
  match: FairnessMatch,
  state: FairnessState,
  byId: ReadonlyMap<string, FairnessPlayer>,
): number {
  const [a1, a2] = match.teamA
  const [b1, b2] = match.teamB

  let penalty = 0

  penalty += repeatCost(
    state.getPartnerCount(a1, a2),
  ) * 100_000
  penalty += repeatCost(
    state.getPartnerCount(b1, b2),
  ) * 100_000

  if (
    seeded(byId.get(a1)) &&
    seeded(byId.get(a2))
  ) penalty += 150_000

  if (
    seeded(byId.get(b1)) &&
    seeded(byId.get(b2))
  ) penalty += 150_000

  for (const [left, right] of [
    [a1, b1],
    [a1, b2],
    [a2, b1],
    [a2, b2],
  ] as const) {
    penalty += repeatCost(
      state.getOpponentCount(left, right),
    ) * 10_000
  }

  return penalty
}

function repeatCost(n: number): number {
  return n <= 0 ? 0 : n * n
}

function seeded(
  player: FairnessPlayer | undefined,
): boolean {
  return !!player?.seed && player.seed > 0
}

function spread(
  values: readonly number[],
): number {
  if (!values.length) return 0
  return Math.max(...values) - Math.min(...values)
}

function* combinations(
  values: readonly string[],
  size: number,
  start = 0,
  prefix: string[] = [],
): Generator<string[]> {
  if (prefix.length === size) {
    yield [...prefix]
    return
  }

  const remaining = size - prefix.length

  for (
    let i = start;
    i <= values.length - remaining;
    i += 1
  ) {
    prefix.push(values[i])
    yield* combinations(
      values,
      size,
      i + 1,
      prefix,
    )
    prefix.pop()
  }
}

function teamSplits(g: readonly string[]) {
  const [a, b, c, d] = g
  return [
    {
      teamA: [a, b] as const,
      teamB: [c, d] as const,
    },
    {
      teamA: [a, c] as const,
      teamB: [b, d] as const,
    },
    {
      teamA: [a, d] as const,
      teamB: [b, c] as const,
    },
  ]
}

function canonicalMatch(
  match: FairnessMatch,
): string {
  return [
    [...match.teamA].sort().join("+"),
    [...match.teamB].sort().join("+"),
  ].sort().join("v")
}

function roundKey(round: FairnessRound): string {
  return (
    round.matches
      .map(canonicalMatch)
      .sort()
      .join("|") +
    "::R:" +
    [...round.restingPlayerIds]
      .sort()
      .join(",")
  )
}

function partialKey(
  matches: readonly FairnessMatch[],
  remaining: readonly string[],
): string {
  return (
    matches
      .map(canonicalMatch)
      .sort()
      .join("|") +
    "::LEFT:" +
    [...remaining].sort().join(",")
  )
}

function compareScored<
  T extends { score: number; key: string },
>(a: T, b: T): number {
  return (
    a.score - b.score ||
    a.key.localeCompare(b.key)
  )
}

function insertBounded<T>(
  list: T[],
  value: T,
  max: number,
  compare: (a: T, b: T) => number,
): void {
  let low = 0
  let high = list.length

  while (low < high) {
    const mid = (low + high) >> 1
    if (compare(value, list[mid]) < 0) {
      high = mid
    } else {
      low = mid + 1
    }
  }

  if (low >= max) return

  list.splice(low, 0, value)
  if (list.length > max) list.pop()
}

function dedupePartials(
  values: readonly Partial[],
): Partial[] {
  const map = new Map<string, Partial>()
  for (const value of values) {
    const previous = map.get(value.key)
    if (
      !previous ||
      value.score < previous.score
    ) {
      map.set(value.key, value)
    }
  }
  return [...map.values()]
}

function dedupeComplete(
  values: readonly Complete[],
): Complete[] {
  const map = new Map<string, Complete>()
  for (const value of values) {
    const previous = map.get(value.key)
    if (
      !previous ||
      value.score < previous.score
    ) {
      map.set(value.key, value)
    }
  }
  return [...map.values()]
}
