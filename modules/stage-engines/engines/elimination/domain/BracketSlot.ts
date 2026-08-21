/**
 * Bracket Domain
 * ------------------------------------------------------------------
 * A slot represents one side of a bracket match.
 *
 * A slot may contain:
 * - an Entry
 * - the Winner of another match
 * - the Loser of another match
 * - a BYE
 * - a TBD placeholder
 */

export type BracketSlotType =
  | "entry"
  | "winner"
  | "loser"
  | "bye"
  | "tbd";

export interface BracketSlot {

  /**
   * Slot type.
   */
  type: BracketSlotType;

  /**
   * Entry identifier.
   * Used only when type === "entry".
   */
  entryId?: string;

  /**
   * Source match identifier.
   * Used when type is "winner" or "loser".
   */
  sourceMatchId?: string;

  /**
   * Optional display label.
   */
  label?: string;

  /**
   * Additional engine-specific data.
   */
  metadata?: Record<string, unknown>;
}