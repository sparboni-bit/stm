"use client"

import type { CompetitionEntry } from "@/modules/competition-entries/types"
import type { CompetitionStageEntry } from "@/modules/competition-stage-entries/types"
import { StageEntriesManager } from "@/modules/competition-stage-entries/components/StageEntriesManager"
import { IndividualRotationRosterPanel } from "@/modules/competition-stage-entries/components/IndividualRotationRosterPanel"
import type { Roster } from "@/modules/rosters/types"

import {
  useCurrentSection,
  useEngine,
  useStage,
} from "../hooks"

import { StageOverview } from "./StageOverview"

type Props = {
  roster: CompetitionEntry[]
  stageEntries: CompetitionStageEntry[]
  savedRosters: Roster[]
}

export function StageSectionRenderer({
  roster,
  stageEntries,
  savedRosters,
}: Props) {
  const engine = useEngine()
  const stage = useStage()
  const section = useCurrentSection()

  const locked = ![
    "draft",
    "configured",
  ].includes(stage.status)

  if (section.id === "overview") {
    return (
      <StageOverview
        entryCount={stageEntries.length}
      />
    )
  }

  if (
    stage.stageType === "individual_rotation" &&
    section.id === "planner"
  ) {
    return engine.renderSection({
      stage,
      section,
    })
  }

  if (
    stage.stageType === "individual_rotation" &&
    section.id === "entries"
  ) {
    return (
      <IndividualRotationRosterPanel
        competitionId={stage.competitionId}
        stageId={stage.id}
        roster={roster}
        stageEntries={stageEntries}
        savedRosters={savedRosters}
        locked={locked}
      />
    )
  }

  if (section.id === "entries") {
    return (
      <StageEntriesManager
        competitionId={stage.competitionId}
        stageId={stage.id}
        roster={roster}
        stageEntries={stageEntries}
        savedRosters={savedRosters}
        locked={locked}
      />
    )
  }

  return engine.renderSection({
    stage,
    section,
  })
}

