import { INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION } from "./types"
import { listIndividualRotationTemplates } from "./TemplateRepository"

export async function resolveIndividualRotationTemplateFamily(input: {
  playerCount: number
  usableCourtCount: number
  seedCount: number
  engineVersion?: string
}) {
  // A single seed cannot form a seeded partnership, therefore
  // 0 and 1 seeded players are equivalent for template selection.
  const canonicalSeedCount = input.seedCount >= 2 ? 2 : 0

  return listIndividualRotationTemplates({
    playerCount: input.playerCount,
    usableCourtCount: input.usableCourtCount,
    seedCount: canonicalSeedCount,
    engineVersion:
      input.engineVersion ?? INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION,
  })
}