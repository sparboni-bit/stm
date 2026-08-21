import type {
  BracketMatch,
  BracketRound,
} from "../domain";

/**
 * Creates the match structure for every round
 * of a single elimination bracket.
 *
 * This factory does NOT:
 * - assign entries
 * - manage seeds
 * - manage byes
 * - link winners
 *
 * It only creates the required matches.
 */
export class BracketMatchFactory {

  create(
    size: number,
    rounds: BracketRound[],
  ): BracketMatch[] {

    if (size < 2) {
      throw new Error("Invalid bracket size.");
    }

    if (rounds.length === 0) {
      throw new Error(
        "Cannot create matches without rounds."
      );
    }

    const matches: BracketMatch[] = [];

    rounds.forEach((round, roundIndex) => {

      const matchesInRound =
        size / Math.pow(2, roundIndex + 1);

      for (
        let position = 1;
        position <= matchesInRound;
        position++
      ) {

        const match: BracketMatch = {
          id: crypto.randomUUID(),

          roundId: round.id,

          position,

          slotA: {
            type: "tbd",
          },

          slotB: {
            type: "tbd",
          },

          status: "pending",

          metadata: {},
        };

        matches.push(match);
        round.matches.push(match);
      }

    });

    return matches;
  }

}