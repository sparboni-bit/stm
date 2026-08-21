"use client"

import type { CompetitionEntry } from "@/modules/competition-entries/types"
import type { CompetitionStageEntry } from "@/modules/competition-stage-entries/types"
import { StageEntriesManager } from "@/modules/competition-stage-entries/components/StageEntriesManager"

import {
  useCurrentSection,
  useEngine,
  useStage,
} from "../hooks"

import { StageOverview } from "./StageOverview"

type Props = {
  roster: CompetitionEntry[]
  stageEntries: CompetitionStageEntry[]
}

export function StageSectionRenderer({
  roster,
  stageEntries,
}: Props) {
  const engine = useEngine()
  const stage = useStage()
  const section = useCurrentSection()

  if (section.id === "overview") {
    return (
      <StageOverview
        entryCount={stageEntries.length}
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
        locked={
          !["draft", "configured"].includes(
            stage.status,
          )
        }
      />
    )
  }

  return engine.renderSection({
    stage,
    section,
  })
}
