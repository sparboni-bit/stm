import type { BracketMatch } from "./BracketMatch";

/**
 * Represents a single round inside a bracket.
 *
 * Examples:
 * - Round of 32
 * - Round of 16
 * - Quarter Finals
 * - Semi Finals
 * - Final
 */
export interface BracketRound {

  /**
   * Unique round identifier.
   */
  id: string;

  /**
   * Sequential order.
   * Starts from 1.
   */
  order: number;

  /**
   * Human readable name.
   */
  name: string;

  /**
   * Matches belonging to this round.
   */
  matches: BracketMatch[];

  /**
   * Optional metadata.
   */
  metadata?: Record<string, unknown>;
}