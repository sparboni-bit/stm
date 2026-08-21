import type { SeedPlacement } from "./SeedPlacement"

/**
 * Generates balanced seed placements for a
 * single-elimination bracket.
 *
 * The bracket size must be a power of two.
 *
 * Examples:
 *
 * 2:
 * [1, 2]
 *
 * 4:
 * [1, 4, 3, 2]
 *
 * 8:
 * [1, 8, 5, 4, 3, 6, 7, 2]
 *
 * 16:
 * [
 *   1, 16,
 *   9, 8,
 *   5, 12,
 *   13, 4,
 *   3, 14,
 *   11, 6,
 *   7, 10,
 *   15, 2,
 * ]
 */
export class SeedPlacementGenerator {
  generate(size: number): SeedPlacement[] {
    this.validateSize(size)

    const matchCount = size / 2
    const bitCount = Math.log2(matchCount)

    const orderedSeeds: number[] = []

    for (
      let matchIndex = 0;
      matchIndex < matchCount;
      matchIndex++
    ) {
      const reversedIndex = this.reverseBits(
        matchIndex,
        bitCount,
      )

      const firstSeed = reversedIndex * 2 + 1
      const secondSeed = size + 1 - firstSeed

      orderedSeeds.push(firstSeed, secondSeed)
    }

    return orderedSeeds.map(
      (seed, positionIndex) => ({
        seed,
        bracketPosition: positionIndex + 1,
      }),
    )
  }

  /**
   * Returns only the ordered seed numbers.
   *
   * This is useful for tests and algorithms that do not
   * need the explicit SeedPlacement representation.
   */
  generateSeedOrder(size: number): number[] {
    return this.generate(size).map(
      (placement) => placement.seed,
    )
  }

  private validateSize(size: number): void {
    if (!Number.isInteger(size)) {
      throw new Error(
        "Bracket size must be an integer.",
      )
    }

    if (size < 2) {
      throw new Error(
        "Bracket size must be at least 2.",
      )
    }

    if (!this.isPowerOfTwo(size)) {
      throw new Error(
        "Bracket size must be a power of two.",
      )
    }
  }

  private isPowerOfTwo(value: number): boolean {
    return (
      value > 0 &&
      (value & (value - 1)) === 0
    )
  }

  private reverseBits(
    value: number,
    bitCount: number,
  ): number {
    let source = value
    let result = 0

    for (
      let bitIndex = 0;
      bitIndex < bitCount;
      bitIndex++
    ) {
      result = (result << 1) | (source & 1)
      source >>= 1
    }

    return result
  }
}