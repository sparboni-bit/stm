"use client"

import { useMemo, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import {
  loadStageEngine,
  resolveStageWorkflow,
  type ResolvedStageWorkflowStep,
  type StageEngineSection,
} from "../../stage-engines/core"

import {
  generateCompetitionStage,
} from "../../stage-engines/core/actions"

import {
  configureCompetitionStageAction,
} from "../actions/configureCompetitionStage"

import type {
  CompetitionStage,
} from "../types"

import {
  StageContext,
  type StageContextActions,
} from "./StageContext"

type StageProviderProps = {
  stage: CompetitionStage
  requestedSection?: string
  children: ReactNode
}

function resolveStageSection(
  workflow: readonly ResolvedStageWorkflowStep[],
  defaultSectionId: string,
  requestedSection?: string,
): StageEngineSection | undefined {
  const requested = requestedSection
    ? workflow.find(
        (step) =>
          step.id === requestedSection &&
          step.enabled,
      )
    : undefined

  if (requested) {
    return requested
  }

  return (
    workflow.find(
      (step) =>
        step.id === defaultSectionId &&
        step.enabled,
    ) ??
    workflow.find(
      (step) => step.enabled,
    )
  )
}

export function StageProvider({
  stage,
  requestedSection,
  children,
}: StageProviderProps) {
  const router = useRouter()

  const engine = loadStageEngine(stage)
  const manifest = engine.manifest

  const navigation =
    resolveStageWorkflow(
      manifest,
      stage,
    )

  const currentSection =
    resolveStageSection(
      navigation,
      manifest.defaultSection,
      requestedSection,
    )

  if (!currentSection) {
    throw new Error(
      `Stage Engine has no enabled workflow steps: ${manifest.id}`,
    )
  }

  const actions =
    useMemo<StageContextActions>(() => {
      const basePath =
        `/competitions/${stage.competitionId}/stages/${stage.id}`

      return {
        getSectionHref(
          sectionId: string,
        ) {
          return sectionId ===
            manifest.defaultSection
            ? basePath
            : `${basePath}?section=${encodeURIComponent(
                sectionId,
              )}`
        },

        async configureStage() {
          await configureCompetitionStageAction(
            stage.id,
          )

          router.refresh()
        },

        async generateStage() {
          const result =
            await generateCompetitionStage(
              stage.id,
            )

          if (!result.success) {
            throw new Error(
              result.message,
            )
          }

          router.refresh()
        },

        refresh() {
          router.refresh()
        },
      }
    }, [
      manifest.defaultSection,
      router,
      stage.competitionId,
      stage.id,
    ])

  const value = useMemo(
    () => ({
      stage,
      engine,
      manifest,
      navigation,
      capabilities:
        manifest.capabilities,
      currentSection,
      actions,
    }),
    [
      actions,
      currentSection,
      engine,
      manifest,
      navigation,
      stage,
    ],
  )

  return (
    <StageContext.Provider
      value={value}
    >
      {children}
    </StageContext.Provider>
  )
}