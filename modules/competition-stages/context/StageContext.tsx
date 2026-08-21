"use client"

import { createContext } from "react"

import type {
  ResolvedStageWorkflowStep,
  StageEngine,
  StageEngineCapabilities,
  StageEngineManifest,
  StageEngineSection,
} from "../../stage-engines/core"
import type { CompetitionStage } from "../types"

export type StageContextActions = {
  getSectionHref: (
    sectionId: string,
  ) => string

  configureStage: () => Promise<void>

  generateStage: () => Promise<void>

  refresh: () => void
}

export type StageContextValue = {
  stage: CompetitionStage
  engine: StageEngine
  manifest: StageEngineManifest
  navigation: readonly ResolvedStageWorkflowStep[]
  capabilities: StageEngineCapabilities
  currentSection: StageEngineSection
  actions: StageContextActions
}

export const StageContext = createContext<StageContextValue | null>(null)
