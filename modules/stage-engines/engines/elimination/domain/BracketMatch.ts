import type { BracketSlot } from "./BracketSlot";

/**
 * Current state of a bracket match.
 */
export type BracketMatchStatus =
  | "pending"
  | "ready"
  | "on_court"
  | "completed"
  | "cancelled";

/**
 * A single match inside the bracket.
 *
 * The match never stores players directly.
 * It only references two slots.
 */
export interface BracketMatch {

  /**
   * Unique match identifier.
   */
  id: string;

  /**
   * Parent round identifier.
   */
  roundId: string;

  /**
   * Position inside the round.
   * (1,2,3...)
   */
  position: number;

  /**
   * Left slot.
   */
  slotA: BracketSlot;

  /**
   * Right slot.
   */
  slotB: BracketSlot;

  /**
   * Next match reached by the winner.
   */
  nextMatchId?: string;

  /**
   * Which slot of the next match receives the winner.
   */
  nextSlot?: "A" | "B";

  /**
   * Current status.
   */
  status: BracketMatchStatus;

  /**
   * Winner entry.
   *
   * Filled only when completed.
   */
  winnerEntryId?: string;

  /**
   * Optional court assignment.
   */
  courtId?: string;

  /**
   * Optional scheduling.
   */
  scheduledAt?: Date;

  /**
   * Engine specific metadata.
   */
  metadata?: Record<string, unknown>;
}