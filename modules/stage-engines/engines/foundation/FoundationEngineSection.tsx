import { StageOverview } from "../../../competition-stages/components/StageOverview"
import { StageSectionPlaceholder } from "../../../competition-stages/components/StageSectionPlaceholder"
import type { StageEngineRenderContext } from "../../core/types"

export function renderFoundationEngineSection({
  section,
}: StageEngineRenderContext) {
  if (section.id === "overview") {
    return <StageOverview />
  }

  return (
    <StageSectionPlaceholder
      title={section.label}
      description={section.description}
    />
  )
}
