"use client"

import Link from "next/link"

import {
  useCurrentSection,
  useNavigation,
  useStage,
  useStageActions,
} from "../hooks"

const statusSymbol = {
  not_started: "○",
  current: "▶",
  completed: "✓",
  locked: "🔒",
  attention: "!",
} as const

const statusLabel = {
  not_started: "Not started",
  current: "Current step",
  completed: "Completed",
  locked: "Locked",
  attention: "Attention required",
} as const

const sectionLabels: Record<string, string> = {
  overview: "Home",
  structure: "Setup",
  entries: "Roster",
  groups: "Groups",
  bracket: "Bracket",
  matches: "Matches",
  play: "Matches",
  ranking: "Standings",
  planner: "Planner",
  fairness: "Fairness",
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
    "overview",
    "entries",
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
        aria-label="Phase navigation"
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
            aria-label="Additional phase sections"
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

      <nav
        aria-label="Phase navigation"
        className="hidden border-x border-b border-slate-200 bg-white p-3 sm:block"
      >
        <ol className="grid grid-flow-col auto-cols-fr gap-1">
          {workflow.map(
            (step) => {
              const active =
                step.id ===
                activeSection.id

              const content = (
                <>
                  {(step.status ===
                    "completed" ||
                    step.status ===
                      "locked" ||
                    step.status ===
                      "attention") && (
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-xs font-bold"
                    >
                      {
                        statusSymbol[
                          step.status
                        ]
                      }
                    </span>
                  )}

                  <span className="min-w-0 truncate text-sm font-semibold">
                    {sectionLabel(
                      step.id,
                      step.label,
                    )}
                  </span>
                </>
              )

              const className = [
                "relative flex min-h-11 items-center justify-center gap-2 border px-3 py-2 transition",
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : step.enabled
                    ? "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-950"
                    : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400",
              ].join(" ")

              return (
                <li key={step.id}>
                  {step.enabled ? (
                    <Link
                      href={getSectionHref(
                        step.id,
                      )}
                      aria-current={
                        active
                          ? "step"
                          : undefined
                      }
                      title={
                        step.description
                      }
                      className={
                        className
                      }
                    >
                      {content}
                    </Link>
                  ) : (
                    <div
                      aria-disabled="true"
                      title={
                        step.description
                      }
                      className={
                        className
                      }
                    >
                      {content}
                    </div>
                  )}
                </li>
              )
            },
          )}
        </ol>
      </nav>
    </>
  )
}
