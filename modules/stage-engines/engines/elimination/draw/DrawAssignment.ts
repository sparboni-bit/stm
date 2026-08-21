/**
 * A single draw assignment produced by a draw strategy.
 *
 * It tells the Draw Engine where an entry must be placed.
 *
 * The strategy never modifies the BracketTree directly.
 */
export interface DrawAssignment {

  /**
   * Competition entry.
   */
  entryId: string;

  /**
   * Target match.
   */
  matchId: string;

  /**
   * Target slot.
   */
  slot: "A" | "B";

}