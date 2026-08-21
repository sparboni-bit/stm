import type {
  BracketEntry,
  BracketTree,
} from "../domain";

import type { DrawAssignment } from "./DrawAssignment";

/**
 * Contract implemented by every draw strategy.
 */
export interface DrawStrategy {

  /**
   * Computes how entries should be placed
   * inside the first round of the bracket.
   */
  generateAssignments(
    tree: BracketTree,
    entries: BracketEntry[],
  ): DrawAssignment[];

}