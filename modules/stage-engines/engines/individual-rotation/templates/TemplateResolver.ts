import { INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION } from "./types"
import { listIndividualRotationTemplates } from "./TemplateRepository"

export async function resolveIndividualRotationTemplateFamily(input: {
  playerCount: number
  usableCourtCount: number
  seedCount: number
  engineVersion?: string
}) {
  if (
    input.seedCount !== 0 &&
    input.seedCount !== 2 &&
    input.seedCount !== 4
  ) {
    throw new Error(
      "Individual Rotation templates support 0, 2 or 4 seeded players.",
    )
  }

  return listIndividualRotationTemplates({
    playerCount: input.playerCount,
    usableCourtCount: input.usableCourtCount,
    seedCount: input.seedCount,
    engineVersion:
      input.engineVersion ??
      INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION,
  })
}