import { StageOverview } from "../../../competition-stages/components/StageOverview"
import { StageMatchesSection } from "../../../matches/components/StageMatchesSection"
import { StageSectionPlaceholder } from "../../../competition-stages/components/StageSectionPlaceholder"
import type { StageEngineRenderContext } from "../../core/types"

import { RoundRobinStructureSection } from "./components/RoundRobinStructureSection"
import { RoundRobinGroupsSection } from "./components/RoundRobinGroupsSection"
import { RoundRobinStandingsSection } from "./components/RoundRobinStandingsSection"
import { RoundRobinReportsSection } from "./components/RoundRobinReportsSection"

export function renderRoundRobinEngineSection({
  section,
}: StageEngineRenderContext) {
  switch (section.id) {
    case "overview":
      return <StageOverview />

    case "structure":
      return <RoundRobinStructureSection />

    case "entries":
      return (
        <StageSectionPlaceholder
          title="Entries"
          description="Stage Entries are managed by the shared Stage Entries layer."
        />
      )

    case "groups":
      return <RoundRobinGroupsSection />

    case "matches":
      return <StageMatchesSection />

    case "ranking":
      return <RoundRobinStandingsSection />

    case "reports":
      return <RoundRobinReportsSection />

    default:
      return (
        <StageSectionPlaceholder
          title="Unknown section"
          description={`The Round Robin Engine does not expose the section “${section.id}”.`}
        />
      )
  }
}
