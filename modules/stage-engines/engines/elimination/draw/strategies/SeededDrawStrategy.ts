import { SeedPlacementGenerator } from "../../../../libs/bracket"

import type {
  BracketEntry,
  BracketTree,
} from "../../domain"

import type { DrawAssignment } from "../DrawAssignment"
import type { DrawStrategy } from "../DrawStrategy"

type FirstRoundSlot = {
  position: number
  matchId: string
  matchIndex: number
  slot: "A" | "B"
}

type MatchOccupancy = {
  matchId: string
  matchIndex: number
  occupied: Set<"A" | "B">
  seedNumbers: number[]
}

/**
 * Seeded first-round draw with BYE-safe distribution.
 *
 * Seed positions remain controlled by SeedPlacementGenerator.
 *
 * Unseeded entries are then distributed in two phases:
 * 1. fill matches that do not yet contain any participant;
 * 2. fill second slots only after every R1 match has one participant.
 *
 * When second slots are required, matches without a seed are filled first.
 * Seeded matches are filled from the lowest-priority seed upward, preserving
 * BYEs for the highest seeds whenever the bracket arithmetic permits it.
 */
export class SeededDrawStrategy implements DrawStrategy {
  generateAssignments(
    tree: BracketTree,
    entries: BracketEntry[],
  ): DrawAssignment[] {
    this.validate(tree, entries)

    const availableSlots =
      this.getFirstRoundSlots(tree)

    const seededEntries = entries
      .filter(
        (
          entry,
        ): entry is BracketEntry & { seed: number } =>
          entry.seed !== undefined,
      )
      .sort((a, b) => a.seed - b.seed)

    const unseededEntries = this.shuffle(
      entries.filter(
        (entry) => entry.seed === undefined,
      ),
    )

    const seedPlacements =
      new SeedPlacementGenerator().generate(tree.size)

    const placementBySeed = new Map(
      seedPlacements.map((placement) => [
        placement.seed,
        placement.bracketPosition,
      ]),
    )

    const assignments: DrawAssignment[] = []
    const occupancy = this.createOccupancy(tree)

    for (const entry of seededEntries) {
      const bracketPosition =
        placementBySeed.get(entry.seed)

      if (!bracketPosition) {
        throw new Error(
          `No bracket position found for seed ${entry.seed}.`,
        )
      }

      const target =
        availableSlots[bracketPosition - 1]

      if (!target) {
        throw new Error(
          `Seed ${entry.seed} references an unavailable bracket position.`,
        )
      }

      const matchState = occupancy[target.matchIndex]

      if (matchState.occupied.has(target.slot)) {
        throw new Error(
          `Seed ${entry.seed} references an occupied bracket position.`,
        )
      }

      matchState.occupied.add(target.slot)
      matchState.seedNumbers.push(entry.seed)

      assignments.push({
        entryId: entry.id,
        matchId: target.matchId,
        slot: target.slot,
      })
    }

    let cursor = 0

    // Phase 1: every first-round match must contain at least one entry.
    for (const matchState of occupancy) {
      if (cursor >= unseededEntries.length) break
      if (matchState.occupied.size > 0) continue

      const entry = unseededEntries[cursor++]
      const slot = this.firstFreeSlot(matchState)

      matchState.occupied.add(slot)

      assignments.push({
        entryId: entry.id,
        matchId: matchState.matchId,
        slot,
      })
    }

    // Phase 2: create real R1 matches.
    // Unseeded matches are used first. Seeded matches are ordered so that
    // lower-priority seeds lose BYE protection before top seeds.
    const secondSlotTargets = occupancy
      .filter((state) => state.occupied.size === 1)
      .sort((a, b) => {
        const aSeed = this.bestSeedInMatch(a)
        const bSeed = this.bestSeedInMatch(b)

        if (aSeed === null && bSeed !== null) return -1
        if (aSeed !== null && bSeed === null) return 1

        if (aSeed !== null && bSeed !== null) {
          return bSeed - aSeed
        }

        return a.matchIndex - b.matchIndex
      })

    for (const matchState of secondSlotTargets) {
      if (cursor >= unseededEntries.length) break

      const entry = unseededEntries[cursor++]
      const slot = this.firstFreeSlot(matchState)

      matchState.occupied.add(slot)

      assignments.push({
        entryId: entry.id,
        matchId: matchState.matchId,
        slot,
      })
    }

    if (cursor !== unseededEntries.length) {
      throw new Error(
        "Not enough remaining bracket slots for unseeded entries.",
      )
    }

    return assignments
  }

  private getFirstRoundSlots(
    tree: BracketTree,
  ): FirstRoundSlot[] {
    const firstRound = tree.rounds[0]

    if (!firstRound) {
      throw new Error(
        "Bracket does not contain a first round.",
      )
    }

    return firstRound.matches.flatMap(
      (match, matchIndex) => [
        {
          position: matchIndex * 2 + 1,
          matchId: match.id,
          matchIndex,
          slot: "A" as const,
        },
        {
          position: matchIndex * 2 + 2,
          matchId: match.id,
          matchIndex,
          slot: "B" as const,
        },
      ],
    )
  }

  private createOccupancy(
    tree: BracketTree,
  ): MatchOccupancy[] {
    const firstRound = tree.rounds[0]

    if (!firstRound) {
      throw new Error(
        "Bracket does not contain a first round.",
      )
    }

    return firstRound.matches.map(
      (match, matchIndex) => ({
        matchId: match.id,
        matchIndex,
        occupied: new Set<"A" | "B">(),
        seedNumbers: [],
      }),
    )
  }

  private firstFreeSlot(
    state: MatchOccupancy,
  ): "A" | "B" {
    return state.occupied.has("A") ? "B" : "A"
  }

  private bestSeedInMatch(
    state: MatchOccupancy,
  ): number | null {
    if (state.seedNumbers.length === 0) {
      return null
    }

    return Math.min(...state.seedNumbers)
  }

  private validate(
    tree: BracketTree,
    entries: BracketEntry[],
  ): void {
    if (entries.length < 2) {
      throw new Error(
        "A seeded draw requires at least two entries.",
      )
    }

    if (entries.length > tree.size) {
      throw new Error(
        "Entry count exceeds bracket capacity.",
      )
    }

    const treeEntryIds = new Set(
      tree.entries.map((entry) => entry.id),
    )

    const unknownEntry = entries.find(
      (entry) => !treeEntryIds.has(entry.id),
    )

    if (unknownEntry) {
      throw new Error(
        `Entry "${unknownEntry.id}" does not belong to this bracket.`,
      )
    }

    const seededEntries = entries.filter(
      (entry) => entry.seed !== undefined,
    )

    const usedSeeds = new Set<number>()

    for (const entry of seededEntries) {
      const seed = entry.seed

      if (
        seed === undefined ||
        !Number.isInteger(seed) ||
        seed < 1
      ) {
        throw new Error(
          `Entry "${entry.id}" has an invalid seed.`,
        )
      }

      if (seed > tree.size) {
        throw new Error(
          `Seed ${seed} exceeds bracket size ${tree.size}.`,
        )
      }

      if (usedSeeds.has(seed)) {
        throw new Error(
          `Seed ${seed} is assigned more than once.`,
        )
      }

      usedSeeds.add(seed)
    }
  }

  private shuffle(
    entries: BracketEntry[],
  ): BracketEntry[] {
    const shuffled = [...entries]

    for (
      let index = shuffled.length - 1;
      index > 0;
      index--
    ) {
      const randomIndex = Math.floor(
        Math.random() * (index + 1),
      )

      const current = shuffled[index]
      shuffled[index] = shuffled[randomIndex]
      shuffled[randomIndex] = current
    }

    return shuffled
  }
}
