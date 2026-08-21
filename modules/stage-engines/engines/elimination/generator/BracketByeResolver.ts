import type {
  BracketMatch,
  BracketSlot,
  BracketTree,
} from "../domain"

/**
 * Resolves first-round BYEs after the draw has populated the bracket.
 *
 * Important distinction:
 * - BYE = no participant exists in this first-round slot;
 * - TBD/winner = participant will be resolved by another match.
 *
 * The resolver only creates BYEs in Round 1.
 * It never recursively treats later-round winner placeholders as BYEs.
 */
export class BracketByeResolver {
  resolve(tree: BracketTree): BracketTree {
    const firstRound = tree.rounds[0]

    if (!firstRound) {
      throw new Error(
        "Bracket does not contain a first round.",
      )
    }

    const matchesById = new Map(
      tree.matches.map((match) => [
        match.id,
        match,
      ]),
    )

    for (const match of firstRound.matches) {
      const aIsEntry =
        match.slotA.type === "entry"
      const bIsEntry =
        match.slotB.type === "entry"

      if (aIsEntry && bIsEntry) {
        match.status = "ready"
        continue
      }

      if (!aIsEntry && !bIsEntry) {
        throw new Error(
          `Invalid first-round draw: match "${match.id}" has no participant. ` +
            "BYE-vs-BYE branches are not allowed.",
        )
      }

      const winnerSlot = aIsEntry
        ? match.slotA
        : match.slotB

      const byeSide: "A" | "B" =
        aIsEntry ? "B" : "A"

      if (byeSide === "A") {
        match.slotA = {
          type: "bye",
          label: "BYE",
        }
      } else {
        match.slotB = {
          type: "bye",
          label: "BYE",
        }
      }

      if (
        winnerSlot.type !== "entry" ||
        !winnerSlot.entryId
      ) {
        throw new Error(
          `Unable to resolve BYE winner for match "${match.id}".`,
        )
      }

      match.status = "completed"
      match.winnerEntryId =
        winnerSlot.entryId

      match.metadata = {
        ...(match.metadata ?? {}),
        autoCompletedByBye: true,
      }

      this.propagateByeWinner(
        match,
        winnerSlot,
        matchesById,
      )
    }

    // A later-round match becomes ready only when both incoming slots have
    // already been resolved to concrete entries.
    for (const match of tree.matches) {
      if (
        match.status === "pending" &&
        match.slotA.type === "entry" &&
        match.slotB.type === "entry"
      ) {
        match.status = "ready"
      }
    }

    return tree
  }

  private propagateByeWinner(
    sourceMatch: BracketMatch,
    winnerSlot: BracketSlot,
    matchesById: Map<string, BracketMatch>,
  ): void {
    if (
      !sourceMatch.nextMatchId ||
      !sourceMatch.nextSlot
    ) {
      return
    }

    const nextMatch =
      matchesById.get(sourceMatch.nextMatchId)

    if (!nextMatch) {
      throw new Error(
        `BYE match "${sourceMatch.id}" references unknown next match "${sourceMatch.nextMatchId}".`,
      )
    }

    const propagatedSlot: BracketSlot = {
      type: "entry",
      entryId: winnerSlot.entryId,
      sourceMatchId: sourceMatch.id,
      label: winnerSlot.label,
      metadata: winnerSlot.metadata,
    }

    if (sourceMatch.nextSlot === "A") {
      nextMatch.slotA = propagatedSlot
    } else {
      nextMatch.slotB = propagatedSlot
    }
  }
}
