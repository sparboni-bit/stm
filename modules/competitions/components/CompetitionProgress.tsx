import {
  Check,
  Circle,
} from "lucide-react"

import { Card } from "@/components/ui/card/Card"

import type {
  CompetitionStatus,
} from "@/core/constants"

import {
  CompetitionWorkflowSteps,
  getCurrentWorkflowStep,
  type CompetitionWorkflowStep,
} from "@/core/workflow"

type CompetitionProgressProps = {
  status: CompetitionStatus
}

const stepLabels: Record<
  CompetitionWorkflowStep,
  string
> = {
  configuration: "Configuration",
  entries: "Entries",
  structure: "Structure",
  generate: "Generate",
  play: "Play",
  reports: "Reports",
}

export function CompetitionProgress({
  status,
}: CompetitionProgressProps) {
  const currentStep =
    getCurrentWorkflowStep(status)

  const currentIndex =
    CompetitionWorkflowSteps.indexOf(
      currentStep
    )

  return (
    <Card padding="lg">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Workflow
        </p>

        <h2 className="mt-1 text-xl font-semibold text-slate-900">
          Competition Progress
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Follow the competition workflow from configuration to reports.
        </p>
      </div>

      <div className="-mx-1 mt-5 overflow-x-auto px-1 pb-1 lg:overflow-visible lg:px-0">
        <ol className="flex min-w-max gap-2 lg:grid lg:min-w-0 lg:grid-cols-6 lg:gap-3">
        {CompetitionWorkflowSteps.map(
          (step, index) => {
            const isCompleted =
              index < currentIndex

            const isCurrent =
              index === currentIndex

            const isFuture =
              index > currentIndex

            return (
              <li
                key={step}
                className={[
                  "relative min-w-32 border p-3 lg:min-w-0 lg:rounded-xl lg:p-4",
                  isCompleted
                    ? "border-emerald-200 bg-emerald-50"
                    : "",
                  isCurrent
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "",
                  isFuture
                    ? "border-slate-200 bg-white"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                      isCompleted
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "",
                      isCurrent
                        ? "border-white bg-white text-slate-900"
                        : "",
                      isFuture
                        ? "border-slate-300 bg-white text-slate-400"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {isCompleted ? (
                      <Check
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    ) : (
                      <Circle
                        className={[
                          "h-3 w-3",
                          isCurrent
                            ? "fill-current"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        aria-hidden="true"
                      />
                    )}
                  </span>

                  <div className="min-w-0">
                    <p
                      className={[
                        "text-xs font-semibold uppercase tracking-wide",
                        isCompleted
                          ? "text-emerald-700"
                          : "",
                        isCurrent
                          ? "text-slate-300"
                          : "",
                        isFuture
                          ? "text-slate-400"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      Step {index + 1}
                    </p>

                    <p
                      className={[
                        "mt-0.5 text-sm font-semibold",
                        isCompleted
                          ? "text-emerald-900"
                          : "",
                        isCurrent
                          ? "text-white"
                          : "",
                        isFuture
                          ? "text-slate-700"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {stepLabels[step]}
                    </p>
                  </div>
                </div>
              </li>
            )
          }
        )}
        </ol>
      </div>
    </Card>
  )
}