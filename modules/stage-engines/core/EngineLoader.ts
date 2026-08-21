import type { CompetitionStage } from "../../competition-stages/types"
import { ensureEliminationEngineRegistered } from "../engines/elimination/register"
import { ensureFoundationEnginesRegistered } from "../engines/foundation/registerFoundationEngines"
import { ensureIndividualRotationEngineRegistered } from "../engines/individual-rotation/register"
import { ensureRoundRobinEngineRegistered } from "../engines/round-robin/register"
import { getRegisteredStageEngine } from "./EngineRegistry"
import type { StageEngine } from "./types"

export function loadStageEngine(
  stage: CompetitionStage,
): StageEngine {
  ensureFoundationEnginesRegistered()
  ensureEliminationEngineRegistered()
  ensureIndividualRotationEngineRegistered()
  ensureRoundRobinEngineRegistered()

  const engine = getRegisteredStageEngine(stage.stageType)

  if (!engine) {
    throw new Error(
      `No Stage Engine registered for stage type: ${stage.stageType}`,
    )
  }

  return engine
}
