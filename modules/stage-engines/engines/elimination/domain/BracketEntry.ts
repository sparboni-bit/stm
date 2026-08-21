/**
 * Bracket Domain
 * ------------------------------------------------------------------
 * Represents a participant inside a bracket.
 *
 * The bracket engine does not know whether the entry is:
 * - a player
 * - a doubles team
 * - a club
 * - a nation
 * - anything else
 *
 * It only works with an abstract entry identifier.
 */

export type BracketEntryType =
  | "player"
  | "team"
  | "pair"
  | "club"
  | "custom";

export interface BracketEntry {

  /**
   * Unique identifier of the entry.
   */
  id: string;

  /**
   * Display name.
   */
  name: string;

  /**
   * Entry category.
   */
  type: BracketEntryType;

  /**
   * Optional seeding position.
   */
  seed?: number;

  /**
   * Optional ranking used by generators.
   */
  ranking?: number;

  /**
   * Additional engine-specific information.
   */
  metadata?: Record<string, unknown>;
}