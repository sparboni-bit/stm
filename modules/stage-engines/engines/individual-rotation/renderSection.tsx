import { StageOverview } from "../../../competition-stages/components/StageOverview"
import { IndividualRotationRankingSection } from "../../../matches/components/IndividualRotationStandings"
import { StageSectionPlaceholder } from "../../../competition-stages/components/StageSectionPlaceholder"
import type { StageEngineRenderContext } from "../../core/types"

import { IndividualRotationPlannerSection } from "./components/IndividualRotationPlannerSection"
import { IndividualRotationRotationSection } from "./components/IndividualRotationRotationSection"
import { IndividualRotationPlaySection } from "./components/IndividualRotationPlaySection"
import { IndividualRotationReportsSection } from "./components/IndividualRotationReportsSection"

export function renderIndividualRotationEngineSection({ section }: StageEngineRenderContext) {
  switch (section.id) {
    case "overview": return <StageOverview />
    case "planner": return <IndividualRotationPlannerSection />
    case "entries": return <StageSectionPlaceholder title="Entries" description="Stage Entries are managed by the shared Stage Entries layer." />
    case "play": return <IndividualRotationPlaySection />
    case "fairness": return <IndividualRotationRotationSection />
    case "ranking": return <IndividualRotationRankingSection />
    case "reports": return <IndividualRotationReportsSection />
    default: return <StageSectionPlaceholder title="Unknown section" description={`The Individual Rotation Engine does not expose the section “${section.id}”.`} />
  }
}
