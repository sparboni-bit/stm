import type { ReactNode } from "react"

import type {
  CompetitionStage,
  CompetitionStageType,
} from "../../competition-stages/types"

export type StageWorkflowMilestone =
  | "overview"
  | "configure"
  | "entries"
  | "generate"
  | "play"
  | "results"

export type StageWorkflowStatus =
  | "not_started"
  | "current"
  | "completed"
  | "locked"
  | "attention"

export type StageEngineSection = {
  id: string
  label: string
  description: string
  milestone: StageWorkflowMilestone
}

export type ResolvedStageWorkflowStep =
  StageEngineSection & {
    status: StageWorkflowStatus
    enabled: boolean
  }

export type StageEngineCapabilities = {
  supportsEntries: boolean
  supportsGeneration: boolean
  supportsMatches: boolean
  supportsRanking: boolean
  supportsReports: boolean
  supportsCourts: boolean
  supportsOptimizer: boolean
}

export type StageEngineManifest = {
  id: CompetitionStageType
  name: string
  description: string
  version: string
  capabilities: StageEngineCapabilities
  workflow: readonly StageEngineSection[]
  defaultSection: string
}

export type StageEngineRenderContext = {
  stage: CompetitionStage
  section: StageEngineSection
}

/**
 * Framework-neutral entry supplied to a Stage Engine
 * during generation.
 */
export type StageGenerationEntry = {
  id: string
  displayName: string
  entryType: "player" | "team"
  seed?: number | null
  metadata?: Record<string, unknown>
}

export type StageGenerationContext = {
  stage: CompetitionStage
  entries: readonly StageGenerationEntry[]
  options?: Record<string, unknown>
}

export type StageGenerationResult = {
  success: boolean
  message?: string

  /**
   * Engine-specific generated domain object.
   *
   * Elimination returns a BracketTree.
   * Other engines may return different structures.
   */
  output?: unknown
}

export type StageEngine = {
  manifest: StageEngineManifest

  renderSection: (
    context: StageEngineRenderContext,
  ) => ReactNode

  generate?: (
    context: StageGenerationContext,
  ) =>
    | StageGenerationResult
    | Promise<StageGenerationResult>
}