"use server"
import { redirect } from "next/navigation"
import { getCurrentWorkspace } from "@/lib/workspace/getCurrentWorkspace"
import { duplicateRoster } from "../repositories/roster.repository"

export async function duplicateRosterAction(rosterId: string, name: string) {
  const normalizedName = name.trim()
  if (!normalizedName) throw new Error("Roster name is required")

  const currentWorkspace = await getCurrentWorkspace()
  if (!currentWorkspace) redirect("/login?error=no_active_workspace")

  const { member, workspace } = currentWorkspace
  const copy = await duplicateRoster(rosterId, workspace.id, member.id, normalizedName)
  redirect(`/rosters/${copy.id}`)
}
