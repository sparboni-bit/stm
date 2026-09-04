"use client"

import Link from "next/link"

import {
  useCurrentSection,
  useNavigation,
  useStage,
  useStageActions,
} from "../hooks"

const statusLabel = {
  not_started: "Not started",
  current: "Current step",
  completed: "Completed",
  locked: "Locked",
  attention: "Attention required",
} as const

const sectionLabels: Record<string, string> = {
  structure: "Setup",
  entries: "Players",
  groups: "Groups",
  bracket: "Bracket",
  matches: "Matches",
  play: "Matches",
  ranking: "Standings",
  planner: "Setup",
  fairness: "Rotation",
  reports: "Reports",
  "order-of-play": "Order",
}

const mobilePrimaryByStageType: Record<string, string[]> = {
  elimination: [
    "overview",
    "entries",
    "bracket",
    "matches",
  ],
  round_robin: [
    "overview",
    "entries",
    "groups",
    "matches",
  ],
  individual_rotation: [
    "planner",
    "entries",
    "fairness",
    "play",
    "ranking",
  ],
}

function sectionLabel(
  id: string,
  fallback: string,
) {
  return sectionLabels[id] ?? fallback
}

export function StageNavigation() {
  const stage = useStage()
  const workflow = useNavigation()
  const activeSection = useCurrentSection()
  const { getSectionHref } = useStageActions()

  const preferredIds =
    mobilePrimaryByStageType[
      stage.stageType
    ] ?? [
      "overview",
      "entries",
      "matches",
      "ranking",
    ]

  const primaryMobile = preferredIds
    .map((id) =>
      workflow.find(
        (step) => step.id === id,
      )
    )
    .filter(
      (
        step,
      ): step is NonNullable<
        typeof step
      > => Boolean(step),
    )

  const primaryIds = new Set(
    primaryMobile.map(
      (step) => step.id,
    ),
  )

  const moreMobile =
    workflow.filter(
      (step) =>
        !primaryIds.has(step.id),
    )

  return (
    <>
      <nav
        aria-label="Stage navigation"
        className="sticky top-16 z-20 border-x border-b border-slate-200 bg-white p-2 sm:hidden"
      >
        <div className="grid grid-cols-4 gap-1">
          {primaryMobile.map(
            (step) => {
              const active =
                step.id ===
                activeSection.id

              const className = [
                "flex min-h-11 min-w-0 items-center justify-center border px-1 text-center text-[10px] font-semibold leading-tight transition",
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : step.enabled
                    ? "border-slate-200 bg-white text-slate-700"
                    : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400",
              ].join(" ")

              return step.enabled ? (
                <Link
                  key={step.id}
                  href={getSectionHref(
                    step.id,
                  )}
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  className={
                    className
                  }
                  title={`${sectionLabel(
                    step.id,
                    step.label,
                  )} · ${
                    statusLabel[
                      step.status
                    ]
                  }`}
                >
                  {sectionLabel(
                    step.id,
                    step.label,
                  )}
                </Link>
              ) : (
                <div
                  key={step.id}
                  aria-disabled="true"
                  className={
                    className
                  }
                  title={`${sectionLabel(
                    step.id,
                    step.label,
                  )} · ${
                    statusLabel[
                      step.status
                    ]
                  }`}
                >
                  {sectionLabel(
                    step.id,
                    step.label,
                  )}
                </div>
              )
            },
          )}
        </div>

        {moreMobile.length > 0 ? (
          <div
            className="mt-1 grid grid-cols-4 gap-1"
            aria-label="Additional stage sections"
          >
            {moreMobile.map(
              (step) => {
                const active =
                  step.id ===
                  activeSection.id

                const className = [
                  "flex min-h-10 min-w-0 items-center justify-center border px-1 text-center text-[10px] font-semibold leading-tight transition",
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : step.enabled
                      ? "border-slate-200 bg-slate-50 text-slate-700"
                      : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400",
                ].join(" ")

                return step.enabled ? (
                  <Link
                    key={step.id}
                    href={getSectionHref(
                      step.id,
                    )}
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    className={
                      className
                    }
                    title={`${sectionLabel(
                      step.id,
                      step.label,
                    )} · ${
                      statusLabel[
                        step.status
                      ]
                    }`}
                  >
                    <span className="min-w-0 break-words">
                      {sectionLabel(
                        step.id,
                        step.label,
                      )}
                    </span>
                  </Link>
                ) : (
                  <div
                    key={step.id}
                    aria-disabled="true"
                    className={
                      className
                    }
                    title={`${sectionLabel(
                      step.id,
                      step.label,
                    )} · ${
                      statusLabel[
                        step.status
                      ]
                    }`}
                  >
                    <span className="min-w-0 break-words">
                      {sectionLabel(
                        step.id,
                        step.label,
                      )}
                    </span>
                  </div>
                )
              },
            )}
          </div>
        ) : null}
      </nav>

      {/* Desktop navigation is provided by the Stage sidebar.
          Keep this component mobile-only to avoid duplicate navigation. */}
    </>
  )
}
