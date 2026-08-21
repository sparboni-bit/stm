import { StageOverview } from "../../../competition-stages/components/StageOverview"
import { StageSectionPlaceholder } from "../../../competition-stages/components/StageSectionPlaceholder"
import { StageMatchesSection, StageOrderOfPlaySection } from "../../../matches/components"
import type { StageEngineRenderContext } from "../../core/types"

import { EliminationBracketSection } from "./components/EliminationBracketSection"
import { EliminationStructureSection } from "./components/EliminationStructureSection"
import { EliminationReportsSection } from "./components/EliminationReportsSection"

export function renderEliminationEngineSection({
  section,
}: StageEngineRenderContext) {
  switch (section.id) {
    case "overview":
      return <StageOverview />

    case "structure":
      return <EliminationStructureSection />

    case "bracket":
      return <EliminationBracketSection />

    case "matches":
      return <StageMatchesSection />

    case "order-of-play":
      return <StageOrderOfPlaySection />

    case "reports":
      return <EliminationReportsSection />

    case "entries":
      return (
        <StageSectionPlaceholder
          title={section.label}
          description={section.description}
        />
      )

    default:
      return (
        <StageSectionPlaceholder
          title="Unknown section"
          description={`The Elimination Engine does not expose the section “${section.id}”.`}
        />
      )
  }
}
