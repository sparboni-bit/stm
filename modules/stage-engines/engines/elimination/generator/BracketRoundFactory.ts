import type { BracketRound } from "../domain";

/**
 * Creates the rounds for a single elimination bracket.
 *
 * Examples:
 *
 * Size 2
 *  - Final
 *
 * Size 4
 *  - Semi Finals
 *  - Final
 *
 * Size 8
 *  - Quarter Finals
 *  - Semi Finals
 *  - Final
 *
 * Size 16
 *  - Round of 16
 *  - Quarter Finals
 *  - Semi Finals
 *  - Final
 */
export class BracketRoundFactory {

  create(size: number): BracketRound[] {

    if (size < 2) {
      throw new Error("Invalid bracket size.");
    }

    const roundCount = Math.log2(size);

    const rounds: BracketRound[] = [];

    for (let order = 1; order <= roundCount; order++) {

      rounds.push({
        id: crypto.randomUUID(),

        order,

        name: this.getRoundName(roundCount, order),

        matches: [],

        metadata: {},
      });

    }

    return rounds;

  }

  private getRoundName(
    totalRounds: number,
    currentRound: number,
  ): string {

    const remaining = totalRounds - currentRound;

    switch (remaining) {

      case 0:
        return "Final";

      case 1:
        return "Semi Finals";

      case 2:
        return "Quarter Finals";

      case 3:
        return "Round of 16";

      case 4:
        return "Round of 32";

      case 5:
        return "Round of 64";

      default:
        return `Round ${currentRound}`;

    }

  }

}