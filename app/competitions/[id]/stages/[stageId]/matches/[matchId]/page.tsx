import { notFound, redirect } from "next/navigation"
import { AppShell } from "@/components/layout/AppShell"
import { getCurrentWorkspace } from "@/lib/workspace/getCurrentWorkspace"
import { getWorkspaceMemberships } from "@/lib/workspace/getWorkspaceMemberships"
import { getMatchAction } from "@/modules/matches/actions/getMatchAction"
import { MatchManager } from "@/modules/matches/components/MatchManager"

type MatchPageProps = {
  params: Promise<{ id: string; stageId: string; matchId: string }>
}

export default async function MatchPage({ params }: MatchPageProps) {
  const currentWorkspace = await getCurrentWorkspace()
  if (!currentWorkspace) redirect("/login?error=no_active_workspace")
  const memberships = await getWorkspaceMemberships()
  const { id: competitionId, stageId, matchId } = await params
  const match = await getMatchAction(matchId)

  if (!match || match.competitionId !== competitionId || match.stageId !== stageId) {
    notFound()
  }

  return (
    <AppShell currentWorkspace={currentWorkspace} memberships={memberships}>
      <MatchManager match={match} />
    </AppShell>
  )
}
