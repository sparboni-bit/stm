import type { StageGenerationEntry } from "../../../core"

import type {
  RoundRobinGroup,
  RoundRobinMatch,
  RoundRobinRound,
  RoundRobinSchedule,
  RoundRobinScheduleEntry,
} from "../domain/RoundRobinSchedule"

export type RoundRobinGeneratorInput = {
  entries: readonly StageGenerationEntry[]
  groupCount: number
}

type RotationEntry =
  | RoundRobinScheduleEntry
  | null

function readGroupKey(
  entry: StageGenerationEntry,
): string | null {
  const value = entry.metadata?.groupKey
  return typeof value === "string" ? value : null
}

function createGroupKeys(groupCount: number) {
  return Array.from(
    { length: groupCount },
    (_, index) => String.fromCharCode(65 + index),
  )
}

function buildRounds(
  groupKey: string,
  entries: RoundRobinScheduleEntry[],
): RoundRobinRound[] {
  if (entries.length < 2) {
    return []
  }

  const rotating: RotationEntry[] = [...entries]

  if (rotating.length % 2 === 1) {
    rotating.push(null)
  }

  const participantCount = rotating.length
  const roundCount = participantCount - 1
  const matchesPerRound = participantCount / 2
  const rounds: RoundRobinRound[] = []

  for (
    let roundIndex = 0;
    roundIndex < roundCount;
    roundIndex += 1
  ) {
    const matches: RoundRobinMatch[] = []
    let matchOrder = 1

    for (
      let pairIndex = 0;
      pairIndex < matchesPerRound;
      pairIndex += 1
    ) {
      const left = rotating[pairIndex]
      const right =
        rotating[participantCount - 1 - pairIndex]

      if (!left || !right) {
        continue
      }

      matches.push({
        id:
          `${groupKey}-r${roundIndex + 1}` +
          `-m${matchOrder}`,
        groupKey,
        roundNumber: roundIndex + 1,
        matchOrder,
        sideAEntryId: left.entryId,
        sideBEntryId: right.entryId,
      })

      matchOrder += 1
    }

    rounds.push({
      roundNumber: roundIndex + 1,
      matches,
    })

    const fixed = rotating[0]
    const rest = rotating.slice(1)
    const last = rest.pop()

    if (last !== undefined) {
      rest.unshift(last)
    }

    rotating.splice(
      0,
      rotating.length,
      fixed,
      ...rest,
    )
  }

  return rounds
}

export function generateRoundRobinSchedule(
  input: RoundRobinGeneratorInput,
): RoundRobinSchedule {
  if (
    !Number.isInteger(input.groupCount) ||
    input.groupCount < 1 ||
    input.groupCount > 4
  ) {
    throw new Error(
      "Round Robin group count must be between 1 and 4.",
    )
  }

  const keys = createGroupKeys(input.groupCount)
  const entriesByGroup = new Map(
    keys.map((key) => [
      key,
      [] as RoundRobinScheduleEntry[],
    ]),
  )

  for (const entry of input.entries) {
    const groupKey = readGroupKey(entry)

    if (!groupKey || !entriesByGroup.has(groupKey)) {
      throw new Error(
        `Entry "${entry.displayName}" is not assigned to a valid Round Robin group.`,
      )
    }

    entriesByGroup.get(groupKey)!.push({
      entryId: entry.id,
      displayName: entry.displayName,
      seed: entry.seed ?? null,
    })
  }

  const groups: RoundRobinGroup[] =
    keys.map((key) => {
      const entries =
        entriesByGroup.get(key) ?? []

      if (entries.length < 2) {
        throw new Error(
          `Group ${key} must contain at least two entries.`,
        )
      }

      return {
        key,
        name: `Group ${key}`,
        entries,
        rounds: buildRounds(key, entries),
      }
    })

  const matchCount = groups.reduce(
    (total, group) =>
      total +
      group.rounds.reduce(
        (subtotal, round) =>
          subtotal + round.matches.length,
        0,
      ),
    0,
  )

  const roundCount = groups.reduce(
    (maximum, group) =>
      Math.max(maximum, group.rounds.length),
    0,
  )

  return {
    id:
      `round-robin-${Date.now()}`,
    groupCount: input.groupCount,
    roundCount,
    matchCount,
    groups,
  }
}
