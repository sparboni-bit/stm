import Link from "next/link"
import {
  notFound,
  redirect,
} from "next/navigation"

import {
  RegisteredShell,
} from "@/components/layout/RegisteredShell"

import {
  getCurrentWorkspace,
} from "@/lib/workspace/getCurrentWorkspace"

import {
  listCompetitionEntries,
} from "@/modules/competition-entries/repositories/competition-entry.repository"

import {
  listCompetitionStageEntries,
} from "@/modules/competition-stage-entries/repositories/competition-stage-entry.repository"

import {
  getCompetitionStageAction,
} from "@/modules/competition-stages/actions/getCompetitionStage"

import {
  StageManager,
} from "@/modules/competition-stages/components/StageManager"

import {
  getCompetitionAction,
} from "@/modules/competitions/actions/getCompetition"

import {
  listRosters,
} from "@/modules/rosters/repositories/roster.repository"

type StagePageProps = {
  params: Promise<{
    id: string
    stageId: string
  }>

  searchParams: Promise<{
    section?: string | string[]
  }>
}


type SidebarStageItem = {
  label: string
  section: string
}

function getStageSidebarItems(
  stageType: string,
): SidebarStageItem[] {
  switch (stageType) {
    case "individual_rotation":
      return [
        { label: "Select Players", section: "entries" },
        { label: "Stage Setup", section: "planner" },
        { label: "Rotation", section: "fairness" },
        { label: "Matches", section: "play" },
        { label: "Standings", section: "ranking" },
      ]

    case "elimination":
      return [
        { label: "Setup", section: "structure" },
        { label: "Players", section: "entries" },
        { label: "Bracket", section: "bracket" },
        { label: "Matches", section: "matches" },
      ]

    case "round_robin":
      return [
        { label: "Setup", section: "structure" },
        { label: "Players", section: "entries" },
        { label: "Groups", section: "groups" },
        { label: "Matches", section: "matches" },
        { label: "Standings", section: "ranking" },
      ]

    default:
      return []
  }
}

function getDefaultStageSection(
  stageType: string,
) {
  switch (stageType) {
    case "individual_rotation":
      return "planner"
    case "elimination":
    case "round_robin":
      return "structure"
    default:
      return ""
  }
}

export default async function StagePage({
  params,
  searchParams,
}: StagePageProps) {
  const currentWorkspace =
    await getCurrentWorkspace()

  if (!currentWorkspace) {
    redirect(
      "/login?error=no_active_workspace",
    )
  }

  const {
    id: competitionId,
    stageId,
  } = await params

  const { section } =
    await searchParams

  const [
    competition,
    stage,
  ] = await Promise.all([
    getCompetitionAction(
      competitionId,
    ),

    getCompetitionStageAction(
      stageId,
    ),
  ])

  if (
    !competition ||
    !stage ||
    stage.competitionId !== competitionId
  ) {
    notFound()
  }

  const requestedSection =
    Array.isArray(section)
      ? section[0]
      : section

  const activeStageSection =
    requestedSection ??
    getDefaultStageSection(
      stage.stageType,
    )

  const stageSidebarItems =
    getStageSidebarItems(
      stage.stageType,
    )

  const [
    roster,
    stageEntries,
    savedRosters,
  ] = await Promise.all([
    listCompetitionEntries(
      competitionId,
    ),

    listCompetitionStageEntries(
      stageId,
    ),

    listRosters(
      currentWorkspace.workspace.id,
    ),
  ])

  return (
    <RegisteredShell
      currentWorkspace={
        currentWorkspace
      }
      activeSection="events"
      context={{
        title: competition.title,

        items: [
          {
            label: "Stages",
            href:
              `/competitions/${competitionId}` +
              "?section=stages",
            active: false,
          },
          ...stageSidebarItems.map(
            (item) => ({
              label: item.label,
              href:
                `/competitions/${competitionId}` +
                `/stages/${stageId}` +
                `?section=${item.section}`,
              active:
                item.section ===
                activeStageSection,
            }),
          ),
        ],
      }}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-4 md:hidden">
          <Link
            href={
              `/competitions/${competitionId}` +
              "?section=stages"
            }
            className="inline-flex min-h-10 items-center rounded-full border border-slate-950 bg-white px-4 text-sm font-bold text-slate-950"
          >
            ← Event
          </Link>
        </div>

        <StageManager
          stage={stage}
          requestedSection={
            requestedSection
          }
          roster={roster}
          stageEntries={
            stageEntries
          }
          savedRosters={
            savedRosters
          }
        />
      </div>
    </RegisteredShell>
  )
}