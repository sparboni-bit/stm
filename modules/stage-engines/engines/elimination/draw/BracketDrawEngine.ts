import type {
  BracketEntry,
  BracketMatch,
  BracketTree,
} from "../domain"

import type { DrawStrategy } from "./DrawStrategy"

/**
 * Applies a draw strategy to a bracket tree.
 *
 * The strategy only computes assignments.
 * This engine is responsible for applying them to the bracket.
 */
export class BracketDrawEngine {
  apply(
    tree: BracketTree,
    entries: BracketEntry[],
    strategy: DrawStrategy,
  ): BracketTree {
    const assignments = strategy.generateAssignments(
      tree,
      entries,
    )

    const matchesById = new Map(
      tree.matches.map((match) => [match.id, match]),
    )

    for (const assignment of assignments) {
      const match = matchesById.get(assignment.matchId)

      if (!match) {
        throw new Error(
          `Draw assignment references unknown match "${assignment.matchId}".`,
        )
      }

      this.assignEntry(
        match,
        assignment.slot,
        assignment.entryId,
      )
    }

    return tree
  }

  private assignEntry(
    match: BracketMatch,
    slot: "A" | "B",
    entryId: string,
  ): void {
    const assignedSlot = {
      type: "entry" as const,
      entryId,
    }

    if (slot === "A") {
      match.slotA = assignedSlot
      return
    }

    match.slotB = assignedSlot
  }
}