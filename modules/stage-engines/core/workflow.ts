import type { CompetitionStage } from "../../competition-stages/types"
import type {
  ResolvedStageWorkflowStep,
  StageEngineManifest,
  StageWorkflowMilestone,
} from "./types"

const milestoneOrder: Record<StageWorkflowMilestone, number> = {
  overview: 0,
  configure: 1,
  entries: 2,
  generate: 3,
  play: 4,
  results: 5,
}

function getCurrentMilestone(stage: CompetitionStage): StageWorkflowMilestone {
  switch (stage.status) {
    case "draft":
      return "configure"
    case "configured":
      return "entries"
    case "generated":
    case "running":
      return "play"
    case "completed":
      return "results"
  }
}

export function resolveStageWorkflow(
  manifest: StageEngineManifest,
  stage: CompetitionStage,
): readonly ResolvedStageWorkflowStep[] {
  const currentMilestone = getCurrentMilestone(stage)
  const currentOrder = milestoneOrder[currentMilestone]

  return manifest.workflow.map((step) => {
    const stepOrder = milestoneOrder[step.milestone]

    if (step.milestone === "overview") {
      return {
        ...step,
        status: "completed",
        enabled: true,
      }
    }

    // Individual Rotation is entries-first.
    // Entries are available before Planner configuration.
    if (
      manifest.id === "individual_rotation" &&
      stage.status === "draft" &&
      step.id === "entries"
    ) {
      return {
        ...step,
        status: "current",
        enabled: true,
      }
    }

    if (stepOrder < currentOrder) {
      return {
        ...step,
        status: "completed",
        enabled: true,
      }
    }

    if (stepOrder === currentOrder) {
      return {
        ...step,
        status: "current",
        enabled: true,
      }
    }

    if (
      stage.status === "configured" &&
      step.milestone === "generate"
    ) {
      return {
        ...step,
        status: "not_started",
        enabled: true,
      }
    }

    return {
      ...step,
      status: "locked",
      enabled: false,
    }
  })
}
