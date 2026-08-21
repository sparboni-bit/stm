/**
 * Describes the bracket position assigned to a seed.
 *
 * Both values are one-based:
 *
 * seed: 1 means the first seed.
 * bracketPosition: 1 means the first available bracket slot.
 */
export type SeedPlacement = {
  seed: number
  bracketPosition: number
}