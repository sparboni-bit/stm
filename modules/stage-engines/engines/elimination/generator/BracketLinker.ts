import type {
  BracketMatch,
  BracketRound,
  BracketSlot,
} from "../domain";

/**
 * Connects each bracket match to the following round.
 *
 * Example:
 *
 * Match 1 winner -> Semi Final 1 slot A
 * Match 2 winner -> Semi Final 1 slot B
 *
 * This class does not assign entries and does not handle BYEs.
 */
export class BracketLinker {
  link(
    rounds: BracketRound[],
    matches: BracketMatch[],
  ): void {
    if (rounds.length === 0) {
      throw new Error("Bracket requires at least one round.");
    }

    for (
      let roundIndex = 0;
      roundIndex < rounds.length - 1;
      roundIndex++
    ) {
      const currentRound = rounds[roundIndex];
      const nextRound = rounds[roundIndex + 1];

      this.linkRound(currentRound, nextRound);
    }

    this.validateFlatMatchList(rounds, matches);
  }

  private linkRound(
    currentRound: BracketRound,
    nextRound: BracketRound,
  ): void {
    const expectedCurrentMatches =
      nextRound.matches.length * 2;

    if (
      currentRound.matches.length !==
      expectedCurrentMatches
    ) {
      throw new Error(
        `Cannot link round "${currentRound.name}" to "${nextRound.name}".`,
      );
    }

    currentRound.matches.forEach(
      (sourceMatch, sourceIndex) => {
        const targetMatchIndex = Math.floor(
          sourceIndex / 2,
        );

        const targetMatch =
          nextRound.matches[targetMatchIndex];

        const targetSlot =
          sourceIndex % 2 === 0 ? "A" : "B";

        sourceMatch.nextMatchId = targetMatch.id;
        sourceMatch.nextSlot = targetSlot;

        const winnerSlot =
          this.createWinnerSlot(sourceMatch.id);

        if (targetSlot === "A") {
          targetMatch.slotA = winnerSlot;
        } else {
          targetMatch.slotB = winnerSlot;
        }
      },
    );
  }

  private createWinnerSlot(
    sourceMatchId: string,
  ): BracketSlot {
    return {
      type: "winner",
      sourceMatchId,
    };
  }

  private validateFlatMatchList(
    rounds: BracketRound[],
    matches: BracketMatch[],
  ): void {
    const roundMatchIds = rounds.flatMap(
      (round) =>
        round.matches.map((match) => match.id),
    );

    const flatMatchIds = matches.map(
      (match) => match.id,
    );

    if (
      roundMatchIds.length !== flatMatchIds.length ||
      roundMatchIds.some(
        (matchId, index) =>
          matchId !== flatMatchIds[index],
      )
    ) {
      throw new Error(
        "Bracket rounds and flat match list are not aligned.",
      );
    }
  }
}