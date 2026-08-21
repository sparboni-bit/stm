import { buildGuidedCandidateRounds } from "./GuidedRoundBuilder"
import { scoreFairnessSchedule } from "./FairnessScorer"
import type {
  FairnessPlayer,
  FairnessRound,
  FairnessSchedule,
  FairnessWeights,
} from "./types"
import { DEFAULT_FAIRNESS_WEIGHTS } from "./types"

export type ScheduleOptimizerOptions = {
  courtCount: number
  roundCount: number
  beamWidth?: number
  localCandidateWidth?: number
  guidedCandidateWidth?: number
  activeSetWidth?: number
  partialBeamWidth?: number
  existingRounds?: readonly FairnessRound[]
  weights?: FairnessWeights

  // Kept for API compatibility with B5 callers.
  candidateLimitPerStep?: number
}

export type ScheduleOptimizerResult = {
  schedule: FairnessSchedule
  rawPenalty: number
  exploredStates: number
  fullyScoredStates: number
  locallySelectedStates: number
}

type Beam = {
  rounds: FairnessRound[]
  penalty: number
  key: string
}

export function optimizeFairnessSchedule(
  players: readonly FairnessPlayer[],
  options: ScheduleOptimizerOptions,
): ScheduleOptimizerResult {
  const {
    courtCount,
    roundCount,
    beamWidth = 40,
    localCandidateWidth = 80,
    guidedCandidateWidth = 240,
    activeSetWidth = 24,
    partialBeamWidth = 120,
    existingRounds = [],
    weights = DEFAULT_FAIRNESS_WEIGHTS,
  } = options

  const initial = [...existingRounds].sort(
    (a, b) => a.roundNumber - b.roundNumber,
  )

  let beam: Beam[] = [{
    rounds: initial,
    penalty: scoreFairnessSchedule(
      players,
      { rounds: initial },
      weights,
    ).total,
    key: scheduleKey(initial),
  }]

  let exploredStates = 0
  let fullyScoredStates = 0
  let locallySelectedStates = 0

  for (
    let offset = 0;
    offset < roundCount;
    offset += 1
  ) {
    const roundNumber =
      (initial.at(-1)?.roundNumber ?? 0) +
      offset +
      1

    const global: Beam[] = []

    for (const state of beam) {
      const candidates =
        buildGuidedCandidateRounds(
          players,
          {
            roundNumber,
            courtCount,
            history: state.rounds,
            activeSetWidth,
            partialBeamWidth,
            completeRoundWidth:
              guidedCandidateWidth,
          },
        )

      const local: Beam[] = []

      for (const candidate of candidates) {
        exploredStates += 1
        const rounds = [
          ...state.rounds,
          candidate,
        ]

        const penalty =
          scoreFairnessSchedule(
            players,
            { rounds },
            weights,
          ).total

        fullyScoredStates += 1

        insertBounded(
          local,
          {
            rounds,
            penalty,
            key: scheduleKey(rounds),
          },
          localCandidateWidth,
        )
      }

      locallySelectedStates += local.length

      for (const value of local) {
        insertBounded(
          global,
          value,
          beamWidth * 3,
        )
      }
    }

    beam = dedupe(global)
      .sort(compareBeam)
      .slice(0, beamWidth)

    if (!beam.length) {
      throw new Error(
        `Beam exhausted at round ${roundNumber}`,
      )
    }
  }

  const best = beam[0]

  return {
    schedule: { rounds: best.rounds },
    rawPenalty: best.penalty,
    exploredStates,
    fullyScoredStates,
    locallySelectedStates,
  }
}

function compareBeam(
  a: Beam,
  b: Beam,
): number {
  return (
    a.penalty - b.penalty ||
    a.key.localeCompare(b.key)
  )
}

function insertBounded(
  list: Beam[],
  value: Beam,
  max: number,
): void {
  let low = 0
  let high = list.length

  while (low < high) {
    const mid = (low + high) >> 1
    if (
      compareBeam(value, list[mid]) < 0
    ) {
      high = mid
    } else {
      low = mid + 1
    }
  }

  if (low >= max) return
  list.splice(low, 0, value)
  if (list.length > max) list.pop()
}

function dedupe(
  values: readonly Beam[],
): Beam[] {
  const map = new Map<string, Beam>()
  for (const value of values) {
    const previous = map.get(value.key)
    if (
      !previous ||
      value.penalty < previous.penalty
    ) {
      map.set(value.key, value)
    }
  }
  return [...map.values()]
}

function scheduleKey(
  rounds: readonly FairnessRound[],
): string {
  return rounds
    .map((round) => {
      const matches = round.matches
        .map((match) =>
          [
            [...match.teamA]
              .sort()
              .join("+"),
            [...match.teamB]
              .sort()
              .join("+"),
          ]
            .sort()
            .join("v"),
        )
        .sort()
        .join("|")

      return (
        matches +
        "::R:" +
        [...round.restingPlayerIds]
          .sort()
          .join(",")
      )
    })
    .join("||")
}
