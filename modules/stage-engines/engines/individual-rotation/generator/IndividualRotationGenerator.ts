import type {
  StageGenerationContext,
  StageGenerationResult,
} from "../../../core/types"

import type {
  FairnessPlayer,
  FairnessSchedule,
} from "../fairness"

import type {
  IndividualRotationTemplateRecord,
} from "../templates/types"

import type {
  IndividualRotationSchedule,
} from "../domain/IndividualRotationSchedule"

function readInteger(
  settings: Record<string, unknown>,
  key: string,
): number | null {
  const value = settings[key]

  return typeof value === "number" &&
    Number.isInteger(value)
    ? value
    : null
}

function shuffled<T>(items: readonly T[]): T[] {
  const result = [...items]

  /*
   * Fisher-Yates.
   *
   * This randomizes only the mapping between real players and
   * template player slots. The precomputed schedule itself remains
   * unchanged, so all template fairness characteristics are preserved.
   */
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex =
      Math.floor(
        Math.random() * (index + 1),
      )

    const current = result[index]
    result[index] = result[swapIndex]
    result[swapIndex] = current
  }

  return result
}


function templatePlayerIds(
  template: IndividualRotationTemplateRecord,
): string[] {
  return Array.from(
    { length: template.playerCount },
    (_, index) =>
      `P${String(index + 1).padStart(2, "0")}`,
  )
}

function partnerConflictCounts(
  template: IndividualRotationTemplateRecord,
): Map<string, number> {
  const conflicts = new Map<string, number>()

  const keyFor = (
    left: string,
    right: string,
  ) =>
    [left, right].sort().join("|")

  for (const round of template.schedule.rounds) {
    for (const match of round.matches) {
      for (const team of [
        match.teamA,
        match.teamB,
      ]) {
        const key = keyFor(
          team[0],
          team[1],
        )

        conflicts.set(
          key,
          (conflicts.get(key) ?? 0) + 1,
        )
      }
    }
  }

  return conflicts
}

function combinations<T>(
  items: readonly T[],
  size: number,
): T[][] {
  const result: T[][] = []
  const current: T[] = []

  function visit(
    startIndex: number,
  ) {
    if (current.length === size) {
      result.push([...current])
      return
    }

    const remainingNeeded =
      size - current.length

    for (
      let index = startIndex;
      index <=
      items.length - remainingNeeded;
      index += 1
    ) {
      current.push(items[index])
      visit(index + 1)
      current.pop()
    }
  }

  visit(0)
  return result
}

function keepApartTemplateSlots(
  template: IndividualRotationTemplateRecord,
  keepApartCount: number,
): string[] {
  if (keepApartCount === 0) {
    return []
  }

  const ids =
    templatePlayerIds(template)

  const conflicts =
    partnerConflictCounts(template)

  const keyFor = (
    left: string,
    right: string,
  ) =>
    [left, right].sort().join("|")

  const candidates =
    combinations(
      ids,
      keepApartCount,
    )

  let minimumConflicts =
    Number.POSITIVE_INFINITY

  const best: string[][] = []

  for (const candidate of candidates) {
    let conflictCount = 0

    for (
      let leftIndex = 0;
      leftIndex < candidate.length;
      leftIndex += 1
    ) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < candidate.length;
        rightIndex += 1
      ) {
        conflictCount +=
          conflicts.get(
            keyFor(
              candidate[leftIndex],
              candidate[rightIndex],
            ),
          ) ?? 0
      }
    }

    if (
      conflictCount <
      minimumConflicts
    ) {
      minimumConflicts =
        conflictCount
      best.length = 0
      best.push(candidate)
      continue
    }

    if (
      conflictCount ===
      minimumConflicts
    ) {
      best.push(candidate)
    }
  }

  /*
   * If the template permits a zero-conflict Keep Apart placement,
   * every returned slot set guarantees that those real players are
   * never partners. If zero conflicts are mathematically impossible
   * for this exact schedule, choose randomly among the placements
   * with the fewest unavoidable conflicts.
   */
  const selected =
    best[
      Math.floor(
        Math.random() * best.length,
      )
    ]

  return selected ?? []
}

export async function generateIndividualRotationSchedule(
  context: StageGenerationContext,
): Promise<StageGenerationResult> {
  const { stage, entries } = context

  if (entries.length < 4) {
    return {
      success: false,
      message:
        "Individual Rotation requires at least 4 active Stage Entries.",
    }
  }

  if (entries.length > 20) {
    return {
      success: false,
      message:
        "Individual Rotation supports up to 20 players per Stage.",
    }
  }

  if (
    entries.some(
      (entry) => entry.entryType !== "player",
    )
  ) {
    return {
      success: false,
      message:
        "Individual Rotation supports player entries only.",
    }
  }

  const courtCount =
    readInteger(stage.settings, "courtCount")

  const requestedRounds =
    readInteger(
      stage.settings,
      "requestedRounds",
    )

  if (!courtCount || courtCount < 1) {
    return {
      success: false,
      message:
        "Configure at least one court in the Planner before generation.",
    }
  }

  if (
    !requestedRounds ||
    requestedRounds < 1
  ) {
    return {
      success: false,
      message:
        "Choose and save the requested number of rounds in the Planner before generation.",
    }
  }

  const usableCourts = Math.min(
    courtCount,
    Math.floor(entries.length / 4),
  )

  if (usableCourts < 1) {
    return {
      success: false,
      message:
        "The current entries and court configuration cannot produce a playable round.",
    }
  }

  const players: FairnessPlayer[] =
    entries.map((entry) => ({
      id: entry.id,
      displayName: entry.displayName,
      seed:
        typeof entry.seed === "number"
          ? entry.seed
          : null,
    }))

  const seedCount =
    players.filter(
      (player) =>
        typeof player.seed === "number" &&
        player.seed > 0,
    ).length

  if (
    seedCount !== 0 &&
    seedCount !== 2 &&
    seedCount !== 3 &&
    seedCount !== 4
  ) {
    return {
      success: false,
      message:
        "Individual Rotation Keep Apart supports 0, 2, 3 or 4 players.",
    }
  }

  const template =
    context.options?.individualRotationTemplate as
      | IndividualRotationTemplateRecord
      | undefined

  if (!template) {
    return {
      success: false,
      message:
        `No precomputed Individual Rotation template was supplied for ${players.length} players, ${usableCourts} usable court(s), ${seedCount} Keep Apart player(s), and ${requestedRounds} round(s).`,
    }
  }

  if (
    template.playerCount !== players.length ||
    template.usableCourtCount !== usableCourts ||
    template.seedCount !== seedCount ||
    template.roundCount !== requestedRounds
  ) {
    return {
      success: false,
      message:
        "The supplied Individual Rotation template does not match the current Stage configuration.",
    }
  }

  /*
   * Template positions are abstract (P01, P02, ...).
   *
   * The previous randomization assumed the first N template positions
   * were always the protected Keep Apart positions. That assumption is
   * not strong enough: a precomputed schedule can still contain a
   * partnership between two of those positions.
   *
   * Instead, derive the real protected positions from the schedule
   * itself. We search all possible slot sets of size 2/3/4 and choose
   * randomly among those with the minimum number of partnerships
   * between protected slots.
   *
   * In normal cases the minimum is zero, which makes Keep Apart a hard
   * guarantee while preserving the exact precomputed schedule.
   */
  const keepApartPlayers =
    shuffled(
      players.filter(
        (player) =>
          typeof player.seed === "number" &&
          player.seed > 0,
      ),
    )

  const regularPlayers =
    shuffled(
      players.filter(
        (player) =>
          typeof player.seed !== "number" ||
          player.seed <= 0,
      ),
    )

  const protectedTemplateIds =
    keepApartTemplateSlots(
      template,
      keepApartPlayers.length,
    )

  const protectedTemplateIdSet =
    new Set(
      protectedTemplateIds,
    )

  const ordinaryTemplateIds =
    shuffled(
      templatePlayerIds(
        template,
      ).filter(
        (templateId) =>
          !protectedTemplateIdSet.has(
            templateId,
          ),
      ),
    )

  const playerIdByTemplateId =
    new Map<string, string>()

  shuffled(
    protectedTemplateIds,
  ).forEach(
    (templateId, index) => {
      const player =
        keepApartPlayers[index]

      if (!player) {
        throw new Error(
          "Unable to map a Keep Apart player to the Individual Rotation template.",
        )
      }

      playerIdByTemplateId.set(
        templateId,
        player.id,
      )
    },
  )

  ordinaryTemplateIds.forEach(
    (templateId, index) => {
      const player =
        regularPlayers[index]

      if (!player) {
        throw new Error(
          "Unable to map an Individual Rotation player to the template.",
        )
      }

      playerIdByTemplateId.set(
        templateId,
        player.id,
      )
    },
  )

  const remapPlayerId =
    (templatePlayerId: string): string => {
      const mapped =
        playerIdByTemplateId.get(
          templatePlayerId,
        )

      if (!mapped) {
        throw new Error(
          `Template player ${templatePlayerId} cannot be mapped to a Stage Entry.`,
        )
      }

      return mapped
    }

  let schedule: FairnessSchedule

  try {
    schedule = {
      rounds: template.schedule.rounds.map(
        (round) => ({
          ...round,
          matches: round.matches.map(
            (match) => ({
              ...match,
              teamA: [
                remapPlayerId(match.teamA[0]),
                remapPlayerId(match.teamA[1]),
              ] as const,
              teamB: [
                remapPlayerId(match.teamB[0]),
                remapPlayerId(match.teamB[1]),
              ] as const,
            }),
          ),
          restingPlayerIds:
            round.restingPlayerIds.map(
              remapPlayerId,
            ),
        }),
      ),
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "The selected Individual Rotation template could not be mapped to the current Stage Entries.",
    }
  }

  const matchCount =
    schedule.rounds.reduce(
      (sum, round) =>
        sum + round.matches.length,
      0,
    )

  const output: IndividualRotationSchedule = {
    id: crypto.randomUUID(),
    roundCount:
      schedule.rounds.length,
    matchCount,
    fairnessRawPenalty:
      template.rawPenalty,
    schedule,
  }

  return {
    success: true,
    message:
      "Individual Rotation schedule generated.",
    output,
  }
}
