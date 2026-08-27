"use server"
import { redirect } from "next/navigation"
import { getCurrentWorkspace } from "@/lib/workspace/getCurrentWorkspace"
import { createRoster } from "../repositories/roster.repository"

export async function createRosterAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim()
  const rawDescription = String(formData.get("description") || "").trim()
  if (!name) redirect("/rosters/new?error=missing_fields")

  const currentWorkspace = await getCurrentWorkspace()
  if (!currentWorkspace) redirect("/login?error=no_active_workspace")

  const { member, workspace } = currentWorkspace
  const roster = await createRoster({
    organizationId: workspace.id,
    createdBy: member.id,
    name,
    description: rawDescription || null,
  })
  redirect(`/rosters/${roster.id}`)
}
