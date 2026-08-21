import { createClient } from "@/lib/supabase/server"

import type {
  Workspace,
  WorkspaceMember,
  WorkspaceMembership,
} from "./types"

type MembershipRow = WorkspaceMember & {
  organizations: Workspace | Workspace[] | null
}

function normalizeWorkspace(
  organizations: Workspace | Workspace[] | null
): Workspace | null {
  if (!organizations) {
    return null
  }

  if (Array.isArray(organizations)) {
    return organizations[0] ?? null
  }

  return organizations
}

export async function getWorkspaceMemberships(): Promise<
  WorkspaceMembership[]
> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { error: ensureError } = await supabase.rpc(
    "ensure_personal_workspace"
  )

  if (ensureError) {
    console.error(
      "Unable to ensure personal workspace:",
      ensureError
    )
  }

  const { data, error } = await supabase
    .from("members")
    .select(
      `
      *,
      organizations (*)
      `
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", {
      ascending: true,
    })

  if (error || !data) {
    console.error(
      "Unable to load workspace memberships:",
      error
    )

    return []
  }

  return (data as MembershipRow[])
    .map((row) => {
      const workspace = normalizeWorkspace(
        row.organizations
      )

      if (!workspace) {
        return null
      }

      const {
        organizations: _organizations,
        ...member
      } = row

      return {
        member,
        workspace,
      }
    })
    .filter(
      (
        membership
      ): membership is WorkspaceMembership =>
        membership !== null
    )
}