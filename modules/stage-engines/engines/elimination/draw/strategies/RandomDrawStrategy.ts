import type {
  BracketEntry,
  BracketTree,
} from "../../domain"

import type { DrawAssignment } from "../DrawAssignment"
import type { DrawStrategy } from "../DrawStrategy"

/**
 * Random first-round draw with explicit BYE-safe distribution.
 *
 * Rule:
 * - every first-round match receives one entry before any
 *   match receives a second entry;
 * - therefore an incomplete bracket never creates BYE-vs-BYE;
 * - remaining empty slots are resolved later by BracketByeResolver.
 *
 * Example: 17 entries / bracket 32
 * - 16 first-round matches receive one entry each
 * - the 17th entry creates the only real R32 match
 * - the other 15 matches become entry-vs-BYE
 */
export class RandomDrawStrategy implements DrawStrategy {
  generateAssignments(
    tree: BracketTree,
    entries: BracketEntry[],
  ): DrawAssignment[] {
    this.validate(tree, entries)

    const shuffledEntries = this.shuffle(entries)
    const firstRound = tree.rounds[0]

    if (!firstRound) {
      throw new Error(
        "Bracket does not contain a first round.",
      )
    }

    const assignments: DrawAssignment[] = []
    const firstPassCount = Math.min(
      shuffledEntries.length,
      firstRound.matches.length,
    )

    // Pass 1: spread one entry across every R1 match.
    for (let index = 0; index < firstPassCount; index++) {
      assignments.push({
        entryId: shuffledEntries[index].id,
        matchId: firstRound.matches[index].id,
        slot: "A",
      })
    }

    // Pass 2: only now create real entry-v-entry R1 matches.
    const remainingEntries =
      shuffledEntries.slice(firstPassCount)

    remainingEntries.forEach((entry, index) => {
      const target = firstRound.matches[index]

      if (!target) {
        throw new Error(
          "Not enough bracket slots for all entries.",
        )
      }

      assignments.push({
        entryId: entry.id,
        matchId: target.id,
        slot: "B",
      })
    })

    return assignments
  }

  private validate(
    tree: BracketTree,
    entries: BracketEntry[],
  ): void {
    if (entries.length < 2) {
      throw new Error(
        "A draw requires at least two entries.",
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
