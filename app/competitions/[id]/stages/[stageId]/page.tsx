import Link from "next/link"
import {
  notFound,
  redirect,
} from "next/navigation"

import {
  AppShell,
} from "@/components/layout/AppShell"

import {
  getCurrentWorkspace,
} from "@/lib/workspace/getCurrentWorkspace"

import {
  getWorkspaceMemberships,
} from "@/lib/workspace/getWorkspaceMemberships"

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

type StagePageProps = {
  params: Promise<{
    id: string
    stageId: string
  }>
  searchParams: Promise<{
    section?: string | string[]
  }>
}

export default async function StagePage({
  params,
  searchParams,
}: StagePageProps) {
  const currentWorkspace =
    await getCurrentWorkspace()

  if (!currentWorkspace) {
    redirect(
      "/login?error=no_active_workspace"
    )
  }

  const memberships =
    await getWorkspaceMemberships()

  const {
    id: competitionId,
    stageId,
  } = await params

  const { section } =
    await searchParams

  const stage =
    await getCompetitionStageAction(stageId)

  if (
    !stage ||
    stage.competitionId !== competitionId
  ) {
    notFound()
  }

  const [roster, stageEntries] =
    await Promise.all([
      listCompetitionEntries(
        competitionId
      ),
      listCompetitionStageEntries(
        stageId
      ),
    ])

  return (
    <AppShell
      currentWorkspace={currentWorkspace}
      memberships={memberships}
    >
      <Link
        href={`/competitions/${competitionId}`}
        className="mb-4 inline-flex text-sm font-semibold text-slate-500 transition hover:text-slate-900"
      >
        ← Tournament
      </Link>

      <StageManager
        stage={stage}
        requestedSection={
          Array.isArray(section)
            ? section[0]
            : section
        }
        roster={roster}
        stageEntries={stageEntries}
      />
    </AppShell>
  )
}