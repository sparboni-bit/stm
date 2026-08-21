import {
  BracketDrawEngine,
  RandomDrawStrategy,
  type DrawStrategy,
} from "../draw"

import type {
  BracketEntry,
  BracketTree,
} from "../domain"

import { BracketByeResolver } from "./BracketByeResolver"
import { BracketLinker } from "./BracketLinker"
import { BracketMatchFactory } from "./BracketMatchFactory"
import { BracketRoundFactory } from "./BracketRoundFactory"

/**
 * Generates a bracket domain model from a list of entries.
 *
 * The builder creates the bracket structure and delegates
 * entry placement to the supplied draw strategy.
 */
export class BracketBuilder {
  build(
    entries: BracketEntry[],
    drawStrategy: DrawStrategy =
      new RandomDrawStrategy(),
  ): BracketTree {
    this.validateEntries(entries)

    const size = this.computeBracketSize(
      entries.length,
    )

    const rounds =
      new BracketRoundFactory().create(size)

    const matches =
      new BracketMatchFactory().create(
        size,
        rounds,
      )

    new BracketLinker().link(
      rounds,
      matches,
    )

    const tree: BracketTree = {
      id: crypto.randomUUID(),
      engineType: "single-elimination",
      size,
      entries,
      rounds,
      matches,
      metadata: {},
    }

    new BracketDrawEngine().apply(
      tree,
      entries,
      drawStrategy,
    )

    new BracketByeResolver().resolve(tree)

    return tree
  }

  private validateEntries(
    entries: BracketEntry[],
  ): void {
    if (entries.length < 2) {
      throw new Error(
        "A bracket requires at least two entries.",
      )
    }

    const entryIds = new Set(
      entries.map((entry) => entry.id),
    )

    if (entryIds.size !== entries.length) {
      throw new Error(
        "Bracket entries must have unique identifiers.",
      )
    }
  }

  private computeBracketSize(
    entryCount: number,
  ): number {
    let size = 2

    while (size < entryCount) {
      size *= 2
    }

    return size
  }
}