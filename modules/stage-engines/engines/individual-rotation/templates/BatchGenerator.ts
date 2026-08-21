export type IndividualRotationTemplateFamily = {
  playerCount: number
  usableCourtCount: number
  seedCount: number
}

export const INDIVIDUAL_ROTATION_TEMPLATE_MAX_ROUNDS = 12

/**
 * Canonical seed configurations for Individual Rotation templates.
 *
 * 0 seeds:
 *   no seeded-pair constraint.
 *
 * 1 seed:
 *   equivalent to 0 seeds because a single seeded player cannot form
 *   a seeded partnership. Therefore no separate template family is needed.
 *
 * 2 seeds:
 *   seeded-pair constraints become meaningful.
 */
const CANONICAL_SEED_COUNTS = [0, 2] as const

export function listValidTemplateFamilies(input?: {
  minPlayers?: number
  maxPlayers?: number
}): IndividualRotationTemplateFamily[] {
  const minPlayers = input?.minPlayers ?? 4
  const maxPlayers = input?.maxPlayers ?? 16

  if (
    !Number.isInteger(minPlayers) ||
    !Number.isInteger(maxPlayers) ||
    minPlayers < 4 ||
    maxPlayers > 16 ||
    minPlayers > maxPlayers
  ) {
    throw new Error(
      "Template player range must be between 4 and 16.",
    )
  }

  const families: IndividualRotationTemplateFamily[] = []

  for (
    let playerCount = minPlayers;
    playerCount <= maxPlayers;
    playerCount += 1
  ) {
    const maxCourts = Math.min(
      4,
      Math.floor(playerCount / 4),
    )

    for (
      let usableCourtCount = 1;
      usableCourtCount <= maxCourts;
      usableCourtCount += 1
    ) {
      for (const seedCount of CANONICAL_SEED_COUNTS) {
        families.push({
          playerCount,
          usableCourtCount,
          seedCount,
        })
      }
    }
  }

  return families
}