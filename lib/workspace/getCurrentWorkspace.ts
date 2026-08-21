import { cookies } from "next/headers"

import {
  CURRENT_WORKSPACE_COOKIE,
} from "./constants"

import {
  getWorkspaceMemberships,
} from "./getWorkspaceMemberships"

import type {
  CurrentWorkspace,
  WorkspaceMembership,
} from "./types"

function findPersonalWorkspace(
  memberships: WorkspaceMembership[]
): WorkspaceMembership | null {
  return (
    memberships.find(
      (membership) =>
        membership.workspace.organization_type ===
        "personal"
    ) ?? null
  )
}

export async function getCurrentWorkspace(): Promise<
  CurrentWorkspace | null
> {
  const memberships =
    await getWorkspaceMemberships()

  if (memberships.length === 0) {
    return null
  }

  const cookieStore = await cookies()

  const selectedWorkspaceId =
    cookieStore.get(
      CURRENT_WORKSPACE_COOKIE
    )?.value ?? null

  if (selectedWorkspaceId) {
    const selectedMembership =
      memberships.find(
        (membership) =>
          membership.workspace.id ===
          selectedWorkspaceId
      )

    if (selectedMembership) {
      return selectedMembership
    }
  }

  return (
    findPersonalWorkspace(memberships) ??
    memberships[0] ??
    null
  )
}