"use client"

import type { CompetitionEntry } from "@/modules/competition-entries/types"
import type { CompetitionStageEntry } from "@/modules/competition-stage-entries/types"
import { StageProvider } from "../context"
import type { CompetitionStage } from "../types"
import { StageHeader } from "./StageHeader"
import { StageNavigation } from "./StageNavigation"
import { StageSectionRenderer } from "./StageSectionRenderer"

type StageManagerProps = {
  stage: CompetitionStage
  requestedSection?: string
  roster: CompetitionEntry[]
  stageEntries: CompetitionStageEntry[]
}

export function StageManager({
  stage,
  requestedSection,
  roster,
  stageEntries,
}: StageManagerProps) {
  return (
    <StageProvider stage={stage} requestedSection={requestedSection}>
      <div className="mx-auto w-full max-w-7xl py-4 sm:px-6 sm:py-8">
        <StageHeader />
        <StageNavigation />
        <main className="min-w-0 border-x border-b border-slate-200 bg-white p-3 shadow-sm sm:p-6">
          <StageSectionRenderer roster={roster} stageEntries={stageEntries} />
        </main>
      </div>
    </StageProvider>
  )
}
